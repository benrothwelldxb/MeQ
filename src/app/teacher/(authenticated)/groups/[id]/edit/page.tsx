import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { loadSmartGroupViewData } from "@/lib/smart-groups";
import SmartGroupForm from "@/components/smart-groups/SmartGroupForm";

export default async function EditTeacherGroupPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getTeacherSession();
  const data = await loadSmartGroupViewData(params.id, session.schoolId);
  if (!data) notFound();

  // Only the creator (teacher) — admins edit via /admin/settings/groups.
  const canEdit =
    data.group.createdByType === "teacher" &&
    data.group.createdByTeacherId === session.teacherId;
  if (!canEdit) notFound();

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
      mode="edit"
      backHref="/teacher/groups"
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
