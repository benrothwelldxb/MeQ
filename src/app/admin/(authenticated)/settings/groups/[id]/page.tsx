import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { loadSmartGroupViewData } from "@/lib/smart-groups";
import SmartGroupDetail from "@/components/smart-groups/SmartGroupDetail";

export default async function AdminGroupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getAdminSession();
  const data = await loadSmartGroupViewData(params.id, session.schoolId);
  if (!data) notFound();

  return (
    <SmartGroupDetail
      group={data.group}
      students={data.students}
      domains={data.domains}
      pulseSummary={data.pulseSummary}
      baseHref="/admin/settings/groups"
      studentLinkBase="/admin/students"
      canEdit={true}
    />
  );
}
