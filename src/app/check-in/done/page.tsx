import Image from "next/image";
import Link from "next/link";
import { getStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { type Tier } from "@/lib/constants";

export default async function CheckInDonePage() {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  const isJunior = (session.tier as Tier) === "junior";

  return (
    <main className="min-h-screen bg-meq-cloud flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image src="/meq-logo.png" alt="MeQ" width={40} height={40} className="rounded-lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-8">
          <div className="text-6xl mb-3">✅</div>
          <h1 className={`font-bold text-meq-slate mb-2 ${isJunior ? "text-2xl" : "text-xl"}`}>
            {isJunior ? "Well done for asking!" : "Request sent"}
          </h1>
          <p className={`text-gray-600 ${isJunior ? "text-base" : "text-sm"}`}>
            {isJunior
              ? "Your teacher will come and find you. You can close this page."
              : "Your teacher will follow up with you soon. You can close this page."}
          </p>
        </div>

        <Link
          href="/"
          className="inline-block mt-6 text-sm text-meq-sky hover:underline"
        >
          Sign out
        </Link>
      </div>
    </main>
  );
}
