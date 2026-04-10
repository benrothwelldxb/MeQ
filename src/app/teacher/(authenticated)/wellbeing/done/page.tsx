import Link from "next/link";

export default function StaffAssessmentDonePage() {
  return (
    <div className="max-w-md mx-auto text-center py-12">
      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank you</h1>
      <p className="text-gray-500 mb-6">
        Your responses have been saved. Only you can see your individual results — leadership sees aggregated data only.
      </p>
      <Link
        href="/teacher/wellbeing"
        className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
      >
        View Your Results
      </Link>
    </div>
  );
}
