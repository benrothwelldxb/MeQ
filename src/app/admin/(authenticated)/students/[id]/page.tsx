import { getAdminSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import StudentOverviewPage from "@/components/student-overview/StudentOverviewPage";

export default async function AdminStudentOverview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (!session.adminId) redirect("/admin/login");

  const { id } = await params;

  // Ensure the student belongs to the admin's school
  const student = await prisma.student.findUnique({
    where: { id },
    select: { schoolId: true },
  });
  if (!student || student.schoolId !== session.schoolId) {
    redirect("/admin/students");
  }

  return (
    <StudentOverviewPage
      studentId={id}
      backHref="/admin/students"
      backLabel="Back to Students"
    />
  );
}
