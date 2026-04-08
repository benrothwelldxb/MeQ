import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { selectCampus } from "@/app/actions/admin-auth";
import Image from "next/image";

export default async function ChooseCampusPage() {
  const session = await getAdminSession();

  // Use pendingEmail (from login) or email (from switch campus)
  const email = session.pendingEmail || session.email;

  if (!email) {
    redirect("/admin/login");
  }

  const admins = await prisma.admin.findMany({
    where: { email },
    include: { school: true },
    orderBy: { school: { name: "asc" } },
  });

  const activeCampuses = admins.filter((a) => a.school.isActive);

  if (activeCampuses.length === 0) {
    redirect("/admin/login");
  }

  // If only one campus, go straight to dashboard
  if (activeCampuses.length === 1 && !session.pendingEmail) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Image src="/meq-logo.png" alt="MeQ" width={56} height={56} className="rounded-xl mb-3 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">Choose Campus</h1>
          <p className="text-sm text-gray-500 mt-1">
            Select which campus to manage
          </p>
        </div>

        <div className="space-y-3">
          {activeCampuses.map((admin) => (
            <form
              key={admin.id}
              action={async () => {
                "use server";
                await selectCampus(admin.schoolId);
              }}
            >
              <button
                type="submit"
                className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-left hover:border-meq-sky hover:shadow-md transition-all group"
              >
                <div className="font-semibold text-gray-900 group-hover:text-meq-sky transition-colors">
                  {admin.school.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {admin.school.slug}
                </div>
              </button>
            </form>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Signed in as {email}
        </p>
      </div>
    </main>
  );
}
