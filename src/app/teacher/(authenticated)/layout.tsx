import { redirect } from "next/navigation";
import { getTeacherSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";
import SessionExpiryWarning from "@/components/SessionExpiryWarning";
import NotificationBell from "@/components/NotificationBell";

const TEACHER_TTL_SECONDS = 60 * 60 * 8;

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
      <main className="flex-1 p-8 relative">
        <div className="absolute top-4 right-4 z-20">
          <NotificationBell />
        </div>
        {children}
      </main>
      <SessionExpiryWarning ttlSeconds={TEACHER_TTL_SECONDS} refreshUrl="/api/session/refresh?type=teacher" />
    </div>
  );
}
