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

  return (
    <StudentOverviewPage
      studentId={id}
      backHref="/teacher"
      backLabel="Back to My Classes"
    />
  );
}
