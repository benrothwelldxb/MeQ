import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForEmail } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAdminSession, getTeacherSession, getSuperAdminSession } from "@/lib/session";

// Google OAuth callback handler. Google redirects here after the user
// picks an account. We exchange the code for an email, look up the user,
// create an iron-session, and redirect into the app.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const baseUrl = process.env.AUTH_URL || url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";

  // state format: "type:randomhex"
  const type = state.split(":")[0] as string;
  if (type !== "admin" && type !== "teacher" && type !== "super") {
    return NextResponse.redirect(`${baseUrl}/admin/login?error=InvalidType`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/${type}/login?error=NoGoogleSession`);
  }

  const email = await exchangeCodeForEmail(code);
  if (!email) {
    return NextResponse.redirect(`${baseUrl}/${type}/login?error=NoGoogleSession`);
  }

  if (type === "admin") {
    const admin = await prisma.admin.findFirst({
      where: { email },
      orderBy: { createdAt: "asc" },
    });
    if (!admin) {
      return NextResponse.redirect(
        `${baseUrl}/admin/login?error=NoAccount&email=${encodeURIComponent(email)}`
      );
    }
    const session = await getAdminSession();
    session.adminId = admin.id;
    session.schoolId = admin.schoolId;
    session.email = admin.email;
    await session.save();
    return NextResponse.redirect(`${baseUrl}/admin`);
  }

  if (type === "super") {
    const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
    if (!superAdmin) {
      return NextResponse.redirect(
        `${baseUrl}/super/login?error=NoAccount&email=${encodeURIComponent(email)}`
      );
    }
    const session = await getSuperAdminSession();
    session.superAdminId = superAdmin.id;
    session.email = superAdmin.email;
    await session.save();
    return NextResponse.redirect(`${baseUrl}/super`);
  }

  // teacher
  const teacher = await prisma.teacher.findUnique({ where: { email } });
  if (!teacher) {
    return NextResponse.redirect(
      `${baseUrl}/teacher/login?error=NoAccount&email=${encodeURIComponent(email)}`
    );
  }
  const session = await getTeacherSession();
  session.teacherId = teacher.id;
  session.schoolId = teacher.schoolId;
  session.email = teacher.email;
  session.firstName = teacher.firstName;
  await session.save();
  return NextResponse.redirect(`${baseUrl}/teacher`);
}
