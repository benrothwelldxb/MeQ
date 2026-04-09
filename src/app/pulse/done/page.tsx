import { redirect } from "next/navigation";
import { getStudentSession } from "@/lib/session";
import Image from "next/image";
import Link from "next/link";

export default async function PulseDonePage() {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  return (
    <main className="min-h-screen bg-meq-cloud flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image src="/meq-logo.png" alt="MeQ" width={32} height={32} className="rounded-lg" />
          <span className="font-bold text-meq-slate text-lg">Pulse</span>
        </div>
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-meq-slate mb-2">Thanks!</h1>
        <p className="text-gray-500 mb-6">Your check-in is saved. See you next week!</p>
        <Link
          href="/quiz"
          className="inline-block px-6 py-3 rounded-xl text-sm font-bold text-white bg-meq-sky hover:bg-meq-sky/90 transition-all"
        >
          Continue
        </Link>
      </div>
    </main>
  );
}
