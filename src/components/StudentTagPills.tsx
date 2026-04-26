// Consistent pill rendering for student flags. SEND = Special Educational Needs
// & Disabilities; MAGT = More Able, Gifted & Talented; EAL = English as an
// Additional Language. Colours chosen to be visually distinct at a glance.

interface TagPillsProps {
  sen?: boolean;
  magt?: boolean;
  eal?: boolean;
  size?: "xs" | "sm";
}

export default function StudentTagPills({ sen, magt, eal, size = "xs" }: TagPillsProps) {
  const sizeClasses = size === "sm" ? "text-xs px-2 py-0.5" : "text-[10px] px-1.5 py-0.5";
  return (
    <>
      {sen && (
        <span className={`font-medium rounded bg-amber-100 text-amber-700 ${sizeClasses}`} title="Special Educational Needs & Disabilities">
          SEND
        </span>
      )}
      {magt && (
        <span className={`font-medium rounded bg-indigo-100 text-indigo-700 ${sizeClasses}`} title="More Able, Gifted & Talented">
          MAGT
        </span>
      )}
      {eal && (
        <span className={`font-medium rounded bg-teal-100 text-teal-700 ${sizeClasses}`} title="English as an Additional Language">
          EAL
        </span>
      )}
    </>
  );
}
