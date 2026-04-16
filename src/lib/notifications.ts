import { prisma } from "./db";

type CreateParams = {
  userType: "admin" | "teacher" | "super";
  userId: string;
  schoolId?: string | null;
  category: string;
  title: string;
  body?: string | null;
  href?: string | null;
};

/** Create a notification for a single user. Fire-and-forget — errors are logged. */
export async function createNotification(params: CreateParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userType: params.userType,
        userId: params.userId,
        schoolId: params.schoolId ?? null,
        category: params.category,
        title: params.title,
        body: params.body ?? null,
        href: params.href ?? null,
      },
    });
  } catch (err) {
    console.error("[notifications] Failed to create notification:", err);
  }
}

/** Create notifications for a list of user IDs of the same type. */
export async function createNotificationsForMany(
  params: Omit<CreateParams, "userId"> & { userIds: string[] }
): Promise<void> {
  if (params.userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: params.userIds.map((userId) => ({
        userType: params.userType,
        userId,
        schoolId: params.schoolId ?? null,
        category: params.category,
        title: params.title,
        body: params.body ?? null,
        href: params.href ?? null,
      })),
    });
  } catch (err) {
    console.error("[notifications] Failed to batch create notifications:", err);
  }
}
