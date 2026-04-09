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

export async function submitPulse() {
  const session = await getStudentSession();
  if (!session.studentId) return;

  const weekOf = getMonday(new Date());

  await prisma.pulseCheck.update({
    where: { studentId_weekOf: { studentId: session.studentId, weekOf } },
    data: { completedAt: new Date() },
  });

  redirect("/pulse/done");
}
