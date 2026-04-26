import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getStudentSession } from "@/lib/session";
import { getCheckInTargets } from "@/app/actions/check-in";
import { type Tier } from "@/lib/constants";
import CheckInForm from "./CheckInForm";

export default async function CheckInPage() {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  const targets = await getCheckInTargets();
  if ("error" in targets) redirect("/");

  const isJunior = (session.tier as Tier) === "junior";

  return (
    <main className="min-h-screen bg-meq-cloud flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Image src="/meq-logo.png" alt="MeQ" width={32} height={32} className="rounded-lg" />
            <span className="font-bold text-meq-slate text-lg">MeQ</span>
          </div>
        </div>

        <CheckInForm
          teachers={targets.teachers}
          defaultTeacherId={targets.defaultTeacherId}
          isJunior={isJunior}
          studentName={session.firstName}
          variant="page"
        />

        <p className="text-center text-xs text-gray-400 mt-4">
          {isJunior
            ? "If something doesn't feel right, it's always okay to talk to a grown-up."
            : "If you need to speak with someone urgently, tell any adult at school."}
        </p>

        <div className="text-center mt-6">
          <Link
            href="/my-wellbeing"
            className="text-sm text-meq-sky hover:underline"
          >
            {isJunior ? "See my progress instead" : "Go to my wellbeing"}
          </Link>
        </div>
      </div>
    </main>
  );
}
