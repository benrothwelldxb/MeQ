import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { loadSmartGroupViewData } from "@/lib/smart-groups";
import SmartGroupForm from "@/components/smart-groups/SmartGroupForm";

export default async function EditAdminGroupPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAdminSession();
  const data = await loadSmartGroupViewData(params.id, session.schoolId);
  if (!data) notFound();

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
      mode="edit"
      backHref="/admin/settings/groups"
      canEdit={true}
      group={{
        id: data.group.id,
        name: data.group.name,
        description: data.group.description,
        purpose: data.group.purpose,
        memberStudentIds: data.group.memberStudentIds,
        sharedTeacherIds: data.group.sharedTeacherIds,
      }}
      allStudents={students}
      allTeachers={teachers.map((t) => ({ id: t.id, name: `${t.firstName} ${t.lastName}` }))}
    />
  );
}
