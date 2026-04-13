import { NextRequest, NextResponse } from "next/server";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminSession, getTeacherSession } from "@/lib/session";

// Bridge route: runs AFTER a successful NextAuth Google OAuth flow.
// Reads the NextAuth JWT, looks up the user by email in our own tables,
// creates the appropriate iron-session, then clears the NextAuth JWT
// and redirects into the app.
//
// Called like: /api/auth/complete?type=admin  or  /api/auth/complete?type=teacher
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const origin = url.origin;

  if (type !== "admin" && type !== "teacher") {
    return NextResponse.redirect(`${origin}/admin/login?error=InvalidType`);
  }

  const session = await auth();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return NextResponse.redirect(`${origin}/${type}/login?error=NoGoogleSession`);
  }

  if (type === "admin") {
    // Pick the first school this admin belongs to (multi-campus: they can switch later)
    const admin = await prisma.admin.findFirst({
      where: { email },
      orderBy: { createdAt: "asc" },
    });

    if (!admin) {
      await signOut({ redirect: false });
      return NextResponse.redirect(
        `${origin}/admin/login?error=NoAccount&email=${encodeURIComponent(email)}`
      );
    }

    const ironSession = await getAdminSession();
    ironSession.adminId = admin.id;
    ironSession.schoolId = admin.schoolId;
    ironSession.email = admin.email;
    await ironSession.save();

    await signOut({ redirect: false });
    return NextResponse.redirect(`${origin}/admin`);
  }

  // teacher
  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (!teacher) {
    await signOut({ redirect: false });
    return NextResponse.redirect(
      `${origin}/teacher/login?error=NoAccount&email=${encodeURIComponent(email)}`
    );
  }

  const ironSession = await getTeacherSession();
  ironSession.teacherId = teacher.id;
  ironSession.schoolId = teacher.schoolId;
  ironSession.email = teacher.email;
  ironSession.firstName = teacher.firstName;
  await ironSession.save();

  await signOut({ redirect: false });
  return NextResponse.redirect(`${origin}/teacher`);
}
