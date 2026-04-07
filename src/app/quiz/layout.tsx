export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-meq-cloud flex flex-col">
      {children}
    </div>
  );
}
