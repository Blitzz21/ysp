import { createHash } from "crypto";

import { createRow } from "@/services/appwriteClient";

export type AuthAuditEvent =
  | "login"
  | "signup"
  | "verify_start"
  | "verify_complete"
  | "recovery_start"
  | "recovery_complete";

type AuthAuditStatus = "success" | "failure" | "accepted";

type AuthAuditInput = {
  event: AuthAuditEvent;
  status: AuthAuditStatus;
  ip?: string;
  email?: string;
  userId?: string;
  reason?: string;
};

function hashValue(value?: string): string | undefined {
  if (!value) return undefined;
  return createHash("sha256").update(value).digest("hex");
}

function trimReason(reason?: string): string | undefined {
  if (!reason) return undefined;
  return reason.slice(0, 180);
}

export async function writeAuthAudit(input: AuthAuditInput): Promise<void> {
  const payload = {
    event: input.event,
    status: input.status,
    ipHash: hashValue(input.ip),
    emailHash: hashValue(input.email?.toLowerCase()),
    userId: input.userId,
    reason: trimReason(input.reason),
    createdAt: new Date().toISOString(),
  };

  // Keep a local audit trail even without Appwrite table configuration.
  console.info("[auth-audit]", JSON.stringify(payload));

  const tableId = process.env.APPWRITE_AUTH_AUDIT_TABLE_ID;
  if (!tableId) return;

  try {
    await createRow(tableId, payload);
  } catch {
    // Do not block auth flows when audit persistence fails.
  }
}
