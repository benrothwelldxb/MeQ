import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import SmartGroupForm from "@/components/smart-groups/SmartGroupForm";

export default async function NewAdminGroupPage() {
  const session = await getAdminSession();

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
      where: { schoolId: session.schoolId },
      select: { id: true, firstName: true, lastName: true },
      orderBy: [{ lastName: "asc" }],
    }),
  ]);

  return (
    <SmartGroupForm
      mode="create"
      backHref="/admin/settings/groups"
      canEdit={true}
      allStudents={students}
      allTeachers={teachers.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }))}
    />
  );
}
