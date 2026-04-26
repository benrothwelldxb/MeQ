"use server";

import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { parseNumberRecord } from "@/lib/json";
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

  const answers = existing ? parseNumberRecord(existing.answers) : {};
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

  // Safeguarding triage. Two independent triggers:
  //   1. Two or more pulse domains scored 1-2 (sustained low mood).
  //   2. Free-text matched a moderation keyword (suicidal ideation, abuse,
  //      severe distress, school-custom keywords).
  // Either fires an alert. Free-text moderation MUST run even when all the
  // pulse scores are positive — a child can answer pulses positively and
  // still disclose serious harm in the comment box.
  const answers = parseNumberRecord(pulseCheck.answers);
  const lowScores = Object.entries(answers)
    .filter(([, score]) => score <= 2)
    .map(([domain, score]) => ({ domain, score }));

  const student = await prisma.student.findUnique({
    where: { id: session.studentId },
    include: { school: true },
  });

  if (student) {
    const { sendPulseSafeguardingAlert, parseEmailList } = await import("@/lib/email");
    const { moderateText } = await import("@/lib/surveys");

    const trimmedFreeText = freeText?.trim() ?? "";
    const customKeywords = trimmedFreeText
      ? await prisma.schoolSafeguardingKeyword.findMany({
          where: { schoolId: student.schoolId },
          select: { keyword: true },
        })
      : [];
    const freeTextFlag = trimmedFreeText
      ? moderateText(trimmedFreeText, customKeywords.map((k) => k.keyword))
      : { flagged: false as const };

    const shouldAlert = lowScores.length >= 2 || freeTextFlag.flagged;

    if (shouldAlert) {
      // Compose a flag reason that reflects whichever trigger(s) fired,
      // including the case where the only signal is free text on otherwise
      // positive scores.
      const reasonParts: string[] = [];
      if (lowScores.length > 0) {
        reasonParts.push(
          `Low pulse scores: ${lowScores.map((s) => `${s.domain}(${s.score})`).join(", ")}`
        );
      }
      if (freeTextFlag.flagged) {
        reasonParts.push(`Free text matched: ${freeTextFlag.reason}`);
      }
      const flagReason = reasonParts.join(" · ") || "Safeguarding concern";

      // Record the alert regardless of email delivery so admins can action
      // it in the dashboard even if the email fails to send.
      await prisma.safeguardingAlert.create({
        data: {
          schoolId: student.schoolId,
          type: "pulse",
          studentId: student.id,
          pulseCheckId: pulseCheck.id,
          flagReason,
          flaggedText: trimmedFreeText || null,
        },
      });

      const dslRecipients = parseEmailList(student.school.dslEmail);
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
            body: freeTextFlag.flagged
              ? `Pulse free-text flagged${lowScores.length > 0 ? ` and ${lowScores.length} low score${lowScores.length === 1 ? "" : "s"}` : ""}.`
              : `Pulse check-in flagged — ${lowScores.length} low score${lowScores.length === 1 ? "" : "s"}.`,
            href: "/admin/safeguarding",
          });
        }

        try {
          await sendPulseSafeguardingAlert({
            dslEmail: dslRecipients,
            schoolName: student.school.name,
            studentName: `${student.firstName} ${student.lastName}`,
            yearGroup: student.yearGroup,
            className: student.className,
            flaggedDomains: lowScores,
            freeText: trimmedFreeText || null,
          });
        } catch (err) {
          console.error("[safeguarding-alert] Failed to send pulse alert:", err);
        }
      }
    }
  }

  redirect("/pulse/done");
}
