import { getAdminSession } from "@/lib/session";
import { getSchoolSmartGroups } from "@/app/actions/smart-groups";
import SmartGroupList from "@/components/smart-groups/SmartGroupList";

export default async function AdminGroupsPage() {
  const session = await getAdminSession();
  const groups = await getSchoolSmartGroups(session.schoolId);

  return (
    <SmartGroupList
      heading="Smart groups"
      subheading="Cross-class cohorts — nurture groups, social skills sets, MAGT or EAL monitoring."
      baseHref="/admin/settings/groups"
      canCreate={true}
      groups={groups.map((g) => ({
        id: g.id,
        name: g.name,
        purpose: g.purpose,
        description: g.description,
        updatedAt: g.updatedAt,
        memberCount: g._count.members,
        creatorLabel:
          g.createdByType === "teacher" && g.createdByTeacher
            ? `${g.createdByTeacher.firstName} ${g.createdByTeacher.lastName}`
            : null,
      }))}
    />
  );
}
