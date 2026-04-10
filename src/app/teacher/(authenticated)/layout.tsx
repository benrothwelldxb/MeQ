import { redirect } from "next/navigation";
import { getTeacherSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";

export default async function AuthenticatedTeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getTeacherSession();
  if (!session.teacherId) {
    redirect("/teacher/login");
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.teacherId },
    include: { school: { select: { staffWellbeingEnabled: true } } },
  });

  if (!teacher) {
    redirect("/teacher/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TeacherSidebar
        teacherName={`${teacher.firstName} ${teacher.lastName}`}
        staffWellbeingEnabled={teacher.school.staffWellbeingEnabled}
      />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
