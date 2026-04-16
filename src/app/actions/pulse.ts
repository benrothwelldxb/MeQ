"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getPulseStatus() {
  const session = await getStudentSession();
  if (!session.studentId) return { needsPulse: false };

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    include: { school: true },
  });

  if (!student || !student.school.pulseEnabled) return { needsPulse: false };

  const weekOf = getMonday(new Date());
  const existing = await prisma.pulseCheck.findUnique({
    where: { studentId_weekOf: { studentId: session.studentId, weekOf } },
  });

  return { needsPulse: !existing || !existing.completedAt };
}

export async function savePulseAnswer(domain: string, value: number) {
  const session = await getStudentSession();
  if (!session.studentId) return;

  const weekOf = getMonday(new Date());

  const existing = await prisma.pulseCheck.findUnique({
    where: { studentId_weekOf: { studentId: session.studentId, weekOf } },
  });

  const answers = existing ? JSON.parse(existing.answers) as Record<string, number> : {};
  answers[domain] = value;

  await prisma.pulseCheck.upsert({
    where: { studentId_weekOf: { studentId: session.studentId, weekOf } },
    update: { answers: JSON.stringify(answers) },
    create: {
      studentId: session.studentId,
      weekOf,
      answers: JSON.stringify(answers),
    },
  });
}

export async function submitPulse(freeText?: string) {
  const session = await getStudentSession();
  if (!session.studentId) return;

  const weekOf = getMonday(new Date());

  const pulseCheck = await prisma.pulseCheck.update({
    where: { studentId_weekOf: { studentId: session.studentId, weekOf } },
    data: { completedAt: new Date(), freeText: freeText || null },
  });

  // Check for safeguarding concerns and email DSL
  const answers = JSON.parse(pulseCheck.answers) as Record<string, number>;
  const lowScores = Object.entries(answers)
    .filter(([, score]) => score <= 2)
    .map(([domain, score]) => ({ domain, score }));

  if (lowScores.length > 0) {
    const student = await prisma.student.findUnique({
      where: { id: session.studentId },
      include: { school: true },
    });

    if (student) {
      const { sendPulseSafeguardingAlert, parseEmailList } = await import("@/lib/email");
      const { moderateText } = await import("@/lib/surveys");

      const customKeywords = await prisma.schoolSafeguardingKeyword.findMany({
        where: { schoolId: student.schoolId },
        select: { keyword: true },
      });
      const freeTextFlag = freeText
        ? moderateText(freeText, customKeywords.map((k) => k.keyword))
        : { flagged: false };
      const shouldAlert = lowScores.length >= 2 || freeTextFlag.flagged;

      if (shouldAlert) {
        // Record the alert regardless of email delivery so admins can action
        // it in the dashboard even if the email fails to send.
        await prisma.safeguardingAlert.create({
          data: {
            schoolId: student.schoolId,
            type: "pulse",
            studentId: student.id,
            pulseCheckId: pulseCheck.id,
            flagReason: `Low pulse scores: ${lowScores.map((s) => `${s.domain}(${s.score})`).join(", ")}${freeTextFlag.flagged ? ` · free text: ${freeTextFlag.reason}` : ""}`,
            flaggedText: freeText || null,
          },
        });

        const dslRecipients = parseEmailList(student.school.dslEmail);
        // In-app notification to DSL-matched admins at this school
        if (dslRecipients.length > 0) {
          const { createNotificationsForMany } = await import("@/lib/notifications");
          const dslAdmins = await prisma.admin.findMany({
            where: {
              schoolId: student.schoolId,
              email: { in: dslRecipients.map((e) => e.toLowerCase()) },
            },
            select: { id: true },
          });
          if (dslAdmins.length > 0) {
            await createNotificationsForMany({
              userType: "admin",
              userIds: dslAdmins.map((a) => a.id),
              schoolId: student.schoolId,
              category: "safeguarding",
              title: `Safeguarding alert: ${student.firstName} ${student.lastName}`,
              body: `Pulse check-in flagged — ${lowScores.length} low score${lowScores.length === 1 ? "" : "s"}.`,
              href: "/admin/safeguarding",
            });
          }
        }
        if (dslRecipients.length > 0) {
          try {
            await sendPulseSafeguardingAlert({
              dslEmail: dslRecipients,
              schoolName: student.school.name,
              studentName: `${student.firstName} ${student.lastName}`,
              yearGroup: student.yearGroup,
              className: student.className,
              flaggedDomains: lowScores,
              freeText: freeText || null,
            });
          } catch (err) {
            console.error("[safeguarding-alert] Failed to send pulse alert:", err);
          }
        }
      }
    }
  }

  redirect("/pulse/done");
}
