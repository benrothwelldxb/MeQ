import { prisma } from "./db";

type AuditParams = {
  schoolId?: string | null;
  actorType: "admin" | "teacher" | "super" | "system";
  actorId?: string | null;
  actorLabel?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  meta?: unknown;
};

/** Record a cross-cutting audit event. Failures are swallowed — we never want
 * to block a real action because the audit log write failed. */
export async function recordAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        schoolId: params.schoolId ?? null,
        actorType: params.actorType,
        actorId: params.actorId ?? null,
        actorLabel: params.actorLabel ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        meta: params.meta !== undefined ? JSON.stringify(params.meta) : null,
      },
    });
  } catch (err) {
    console.error("[audit] Failed to record audit entry:", err);
  }
}
