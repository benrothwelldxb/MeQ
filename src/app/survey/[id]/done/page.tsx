import Link from "next/link";

export default function SurveyDonePage() {
  return (
    <main className="min-h-screen bg-meq-cloud flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-meq-slate mb-2">Thank you!</h1>
        <p className="text-gray-500 mb-6">Your responses have been saved. Well done!</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
