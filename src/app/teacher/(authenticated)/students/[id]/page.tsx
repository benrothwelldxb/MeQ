import { getTeacherSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import StudentOverviewPage from "@/components/student-overview/StudentOverviewPage";

export default async function TeacherStudentOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getTeacherSession();
  if (!session.teacherId) redirect("/teacher/login");

  const { id } = await params;

  // Only allow access to students in classes the teacher teaches
  const student = await prisma.student.findUnique({
    where: { id },
    select: {
      schoolId: true,
      classGroupId: true,
      classGroupRef: {
        select: {
          teachers: { select: { id: true } },
        },
      },
    },
  });

  if (!student || student.schoolId !== session.schoolId) {
    redirect("/teacher");
  }

  const teacherHasAccess = student.classGroupRef?.teachers.some(
    (t) => t.id === session.teacherId
  );
  if (!teacherHasAccess) {
    redirect("/teacher");
  }

  // Build the prev/next list — all students across this teacher's classes,
  // ordered by class then by lastName. Lets the teacher review every student
  // they're responsible for in one continuous flow.
  const teacher = await prisma.teacher.findUnique({
    where: { id: session.teacherId },
    select: {
      classes: {
        select: {
          id: true,
          name: true,
          students: {
            select: { id: true, lastName: true, firstName: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  const ordered = (teacher?.classes ?? []).flatMap((c) => c.students);
  const idx = ordered.findIndex((s) => s.id === id);
  const prevId = idx > 0 ? ordered[idx - 1].id : null;
  const nextId = idx >= 0 && idx < ordered.length - 1 ? ordered[idx + 1].id : null;

  return (
    <StudentOverviewPage
      studentId={id}
      backHref="/teacher"
      backLabel="Back to My Classes"
      prevHref={prevId ? `/teacher/students/${prevId}` : null}
      nextHref={nextId ? `/teacher/students/${nextId}` : null}
    />
  );
}
