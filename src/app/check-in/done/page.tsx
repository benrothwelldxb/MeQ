import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getStudentSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { type Tier } from "@/lib/constants";

export default async function CheckInDonePage() {
  const session = await getStudentSession();
  if (!session.studentId) redirect("/");

  const isJunior = (session.tier as Tier) === "junior";

  // Look up the student's most recent check-in so a returning visitor can see
  // whether their last request has been resolved. Reassures kids who might
  // wonder if anyone heard them.
  const latest = await prisma.checkInRequest.findFirst({
    where: { studentId: session.studentId },
    orderBy: { createdAt: "desc" },
    include: {
      targetTeacher: { select: { firstName: true, lastName: true } },
    },
  });

  const isResolved = latest?.status === "resolved";
  const teacherName = latest?.targetTeacher
    ? `${latest.targetTeacher.firstName} ${latest.targetTeacher.lastName}`
    : null;

  return (
    <main className="min-h-screen bg-meq-cloud flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Image src="/meq-logo.png" alt="MeQ" width={40} height={40} className="rounded-lg" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-meq-mist p-8">
          <div className="text-6xl mb-3" aria-hidden="true">{isResolved ? "💬" : "✅"}</div>
          <h1 className={`font-bold text-meq-slate mb-2 ${isJunior ? "text-2xl" : "text-xl"}`}>
            {isResolved
              ? (isJunior ? "Your grown-up has spoken to you!" : "Your check-in was actioned")
              : (isJunior ? "Well done for asking!" : "Request sent")}
          </h1>
          <p className={`text-gray-600 ${isJunior ? "text-base" : "text-sm"}`}>
            {isResolved
              ? (isJunior
                  ? `${teacherName ?? "A grown-up"} ticked off your message. If you need to talk again, you can ask any time.`
                  : `${teacherName ?? "Your teacher"} marked your last request as actioned. You can ask again any time.`)
              : (isJunior
                  ? "Your teacher will come and find you. You can close this page."
                  : "Your teacher will follow up with you soon. You can close this page.")}
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
