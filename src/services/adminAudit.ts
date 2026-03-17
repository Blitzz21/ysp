import "server-only";

import { createRow, listRows, buildOrderDesc } from "./appwriteClient";

export type AdminAuditAction =
  // Admin
  | "program.create"
  | "program.update"
  | "program.delete"
  | "chapter.create"
  | "chapter.update"
  | "chapter.delete"
  | "opportunity.create"
  | "opportunity.update"
  | "opportunity.delete"
  | "settings.update"
  | "stats.update"
  // Chapter Head
  | "role.create"
  | "role.update"
  | "officer.assign"
  | "officer.remove"
  | "member.approve"
  | "member.decline"
  | "member.remove"
  | "chapter.transfer"
  | "chapter.contact.update"
  // Member self-service
  | "chapter.join"
  | "chapter.leave"
  | "opportunity.join"
  | "profile.update"
  | "avatar.update"
  | "account.email.update"
  | "account.password.update";

export type AdminAuditTargetType =
  | "program"
  | "chapter"
  | "opportunity"
  | "member"
  | "settings"
  | "stats"
  | "role"
  | "profile"
  | "account";

type AdminAuditInput = {
  actorId: string;
  actorRole: string;
  action: AdminAuditAction;
  targetType: AdminAuditTargetType;
  targetId?: string;
  targetLabel?: string;
  metadata?: string;
};

export type AdminAuditEntry = {
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: string;
  createdAt: string;
};

export async function writeAdminAudit(input: AdminAuditInput): Promise<void> {
  const payload: Record<string, unknown> = {
    actorId: input.actorId,
    actorRole: input.actorRole ?? "unknown",
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? "",
    targetLabel: (input.targetLabel ?? "").slice(0, 200),
    metadata: (input.metadata ?? "").slice(0, 500),
    createdAt: new Date().toISOString(),
  };

  console.info("[admin-audit]", JSON.stringify(payload));

  const tableId = process.env.APPWRITE_ACTIVITY_LOG_TABLE_ID;
  if (!tableId) return;

  try {
    await createRow(tableId, payload);
  } catch {
    // Never block mutations when audit persistence fails.
  }
}

export async function listAdminAuditLog(options: {
  limit?: number;
  offset?: number;
}): Promise<AdminAuditEntry[]> {
  const tableId = process.env.APPWRITE_ACTIVITY_LOG_TABLE_ID;
  if (!tableId) return [];

  try {
    const rows = await listRows<AdminAuditEntry>(
      tableId,
      [buildOrderDesc("createdAt")],
      { limit: options.limit ?? 50, offset: options.offset ?? 0 }
    );
    return rows.map((row) => ({
      actorId: row.actorId,
      actorRole: row.actorRole,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      targetLabel: row.targetLabel,
      metadata: row.metadata,
      createdAt: row.createdAt ?? row.$createdAt,
    }));
  } catch {
    return [];
  }
}
