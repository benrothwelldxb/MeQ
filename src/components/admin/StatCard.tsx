export default function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-extrabold text-gray-900">{value}</p>
      {sublabel && (
        <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
      )}
    </div>
  );
}
