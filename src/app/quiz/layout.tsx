import AccessibilityToggles from "@/components/AccessibilityToggles";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-meq-cloud flex flex-col relative">
      <div className="fixed top-4 right-4 z-30 print:hidden">
        <AccessibilityToggles />
      </div>
      {children}
    </div>
  );
}
