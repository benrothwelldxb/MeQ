import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getSchoolSettings } from "@/lib/school";
import { notFound } from "next/navigation";
import BatchInputGrid from "./BatchInputGrid";

export default async function AssessClassPage({
  params,
}: {
  params: { classGroupId: string };
}) {
  const session = await getTeacherSession();
  const school = await getSchoolSettings();

  const classGroup = await prisma.classGroup.findUnique({
    where: { id: params.classGroupId },
    include: {
      yearGroup: true,
      students: { orderBy: { lastName: "asc" } },
      teachers: { where: { id: session.teacherId } },
    },
  });

  if (!classGroup || classGroup.teachers.length === 0) return notFound();

  const questions = await prisma.teacherQuestion.findMany({
    orderBy: { orderIndex: "asc" },
  });

  // Load existing teacher assessments for this class/term
  const existingAssessments = await prisma.teacherAssessment.findMany({
    where: {
      teacherId: session.teacherId,
      studentId: { in: classGroup.students.map((s) => s.id) },
      term: school.currentTerm,
      academicYear: school.academicYear,
    },
  });

  const savedAnswers: Record<string, Record<string, number>> = {};
  const completedIds = new Set<string>();
  for (const ta of existingAssessments) {
    savedAnswers[ta.studentId] = JSON.parse(ta.answers);
    if (ta.status === "completed") completedIds.add(ta.studentId);
  }

  const questionData = questions.map((q) => ({
    orderIndex: q.orderIndex,
    prompt: q.prompt,
    domain: q.domain,
    answerOptions: JSON.parse(q.answerOptions) as { label: string; value: number }[],
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Assess {classGroup.yearGroup.name} — {classGroup.name}
      </h1>
      <p className="text-gray-500 mb-6">
        Rate each student on the 10 observation questions. Your progress auto-saves.
      </p>

      <BatchInputGrid
        classGroupId={params.classGroupId}
        students={classGroup.students.map((s) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          completed: completedIds.has(s.id),
        }))}
        questions={questionData}
        savedAnswers={savedAnswers}
      />
    </div>
  );
}
