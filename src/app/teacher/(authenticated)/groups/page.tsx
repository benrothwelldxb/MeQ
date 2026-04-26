import { prisma } from "@/lib/db";
import { getTeacherSession } from "@/lib/session";
import { getTeacherSmartGroups } from "@/app/actions/smart-groups";
import SmartGroupList from "@/components/smart-groups/SmartGroupList";

export default async function TeacherGroupsPage() {
  const session = await getTeacherSession();
  const groups = await getTeacherSmartGroups(session.teacherId, session.schoolId);

  // Resolve creator labels for groups created by other teachers (besides me).
  const otherTeacherIds = Array.from(new Set(
    groups
      .filter((g) => g.createdByType === "teacher" && g.createdByTeacherId !== session.teacherId)
      .map((g) => g.createdByTeacherId)
      .filter((id): id is string => !!id)
  ));
  const otherTeachers = otherTeacherIds.length > 0
    ? await prisma.teacher.findMany({
        where: { id: { in: otherTeacherIds } },
        select: { id: true, firstName: true, lastName: true },
      })
    : [];
  const teacherNames = new Map(otherTeachers.map((t) => [t.id, `${t.firstName} ${t.lastName}`]));

  return (
    <SmartGroupList
      heading="My groups"
      subheading="Cohorts you've created or that other teachers have shared with you."
      baseHref="/teacher/groups"
      canCreate={true}
      groups={groups.map((g) => ({
        id: g.id,
        name: g.name,
        purpose: g.purpose,
        description: g.description,
        updatedAt: g.updatedAt,
        memberCount: g._count.members,
        creatorLabel:
          g.createdByType === "admin"
            ? "an admin"
            : g.createdByTeacherId === session.teacherId
            ? "you"
            : teacherNames.get(g.createdByTeacherId ?? "") ?? "another teacher",
      }))}
    />
  );
}
