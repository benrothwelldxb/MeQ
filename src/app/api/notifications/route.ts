import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession, getTeacherSession } from "@/lib/session";

async function getRecipient() {
  const admin = await getAdminSession().catch(() => null);
  if (admin?.adminId) {
    return { userType: "admin" as const, userId: admin.adminId };
  }
  const teacher = await getTeacherSession().catch(() => null);
  if (teacher?.teacherId) {
    return { userType: "teacher" as const, userId: teacher.teacherId };
  }
  return null;
}

/** GET /api/notifications — list the current user's 20 most recent notifications + unread count */
export async function GET() {
  const who = await getRecipient();
  if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userType: who.userType, userId: who.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notification.count({
      where: { userType: who.userType, userId: who.userId, readAt: null },
    }),
  ]);

  return NextResponse.json({ items, unreadCount });
}

/** POST /api/notifications — body { action: "mark_all_read" | "mark_read", id? } */
export async function POST(req: Request) {
  const who = await getRecipient();
  if (!who) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { action?: string; id?: string };

  if (body.action === "mark_all_read") {
    await prisma.notification.updateMany({
      where: { userType: who.userType, userId: who.userId, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "mark_read" && body.id) {
    // Only update if the notification belongs to this user
    await prisma.notification.updateMany({
      where: { id: body.id, userType: who.userType, userId: who.userId },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
