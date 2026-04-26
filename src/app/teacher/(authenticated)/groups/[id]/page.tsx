import { notFound } from "next/navigation";
import { getTeacherSession } from "@/lib/session";
import { loadSmartGroupViewData } from "@/lib/smart-groups";
import { canViewSmartGroup } from "@/app/actions/smart-groups";
import SmartGroupDetail from "@/components/smart-groups/SmartGroupDetail";

export default async function TeacherGroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getTeacherSession();
  if (!(await canViewSmartGroup(params.id))) notFound();

  const data = await loadSmartGroupViewData(params.id, session.schoolId);
  if (!data) notFound();

  // Edit gate: teacher only edits their own groups; shared teachers are
  // view-only. Admins can edit anything but they don't view via this route.
  const canEdit =
    data.group.createdByType === "teacher" &&
    data.group.createdByTeacherId === session.teacherId;

  return (
    <SmartGroupDetail
      group={data.group}
      students={data.students}
      domains={data.domains}
      pulseSummary={data.pulseSummary}
      baseHref="/teacher/groups"
      studentLinkBase="/teacher/students"
      canEdit={canEdit}
    />
  );
}
