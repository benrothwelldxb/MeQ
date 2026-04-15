import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, getTeacherSession, getSuperAdminSession } from "@/lib/session";

/**
 * POST /api/session/refresh?type=admin|teacher|super
 *
 * Re-saves the iron-session cookie, refreshing its TTL.
 * Used by the SessionExpiryWarning component to keep the user
 * signed in when they're still actively using the app.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const type = url.searchParams.get("type");

  if (type === "admin") {
    const session = await getAdminSession();
    if (!session.adminId) return NextResponse.json({ ok: false }, { status: 401 });
    await session.save();
    return NextResponse.json({ ok: true });
  }
  if (type === "teacher") {
    const session = await getTeacherSession();
    if (!session.teacherId) return NextResponse.json({ ok: false }, { status: 401 });
    await session.save();
    return NextResponse.json({ ok: true });
  }
  if (type === "super") {
    const session = await getSuperAdminSession();
    if (!session.superAdminId) return NextResponse.json({ ok: false }, { status: 401 });
    await session.save();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Invalid type" }, { status: 400 });
}
