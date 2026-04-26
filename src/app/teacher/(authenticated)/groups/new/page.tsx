import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import SmartGroupForm from "@/components/smart-groups/SmartGroupForm";

export default async function NewTeacherGroupPage() {
  const session = await getTeacherSession();

  const [students, teachers] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: session.schoolId },
      select: {
        id: true, firstName: true, lastName: true, yearGroup: true, className: true,
        sen: true, magt: true, eal: true,
      },
      orderBy: [{ yearGroup: "asc" }, { lastName: "asc" }],
    }),
    prisma.teacher.findMany({
      where: { schoolId: session.schoolId, NOT: { id: session.teacherId } },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }],
    }),
  ]);

  return (
    <SmartGroupForm
      mode="create"
      backHref="/teacher/groups"
      canEdit={true}
      allStudents={students}
      allTeachers={teachers.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }))}
    />
  );
}
