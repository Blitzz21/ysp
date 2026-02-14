import { NextResponse } from "next/server";

import { normalizeEndpoint } from "../../_lib/appwriteAuth";
import { writeAuthAudit } from "../../_lib/audit";
import { extractClientIp, takeRateLimit } from "../../_lib/rateLimit";
import { fromHttpStatus } from "@/services/errorContract";

type RecoveryCompletePayload = {
  userId?: string;
  secret?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: Request) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    return NextResponse.json({ error: "Appwrite is not configured", code: "unexpected" }, { status: 500 });
  }

  const ip = extractClientIp(request);
  const ipLimit = takeRateLimit({ key: `recovery_complete:ip:${ip}`, limit: 12, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.allowed) {
    await writeAuthAudit({
      event: "recovery_complete",
      status: "failure",
      ip,
      reason: "rate_limit_ip",
    });
    return NextResponse.json(
      { error: "Too many reset attempts. Please wait and try again.", code: "rate_limited" },
      {
        status: 429,
        headers: ipLimit.retryAfterSeconds
          ? { "Retry-After": String(ipLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const body = (await request.json().catch(() => ({}))) as RecoveryCompletePayload;
  const userId = body.userId?.trim();
  const secret = body.secret?.trim();
  const password = body.password;
  const confirmPassword = body.confirmPassword;
  if (!userId || !secret || !password || !confirmPassword) {
    await writeAuthAudit({
      event: "recovery_complete",
      status: "failure",
      ip,
      userId,
      reason: "missing_fields",
    });
    return NextResponse.json({ error: "Recovery fields are required", code: "validation" }, { status: 400 });
  }
  if (password !== confirmPassword) {
    await writeAuthAudit({
      event: "recovery_complete",
      status: "failure",
      ip,
      userId,
      reason: "password_mismatch",
    });
    return NextResponse.json({ error: "Passwords do not match", code: "validation" }, { status: 400 });
  }

  const response = await fetch(`${normalizeEndpoint(endpoint)}/account/recovery`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ userId, secret, password, passwordAgain: confirmPassword }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const normalized = fromHttpStatus(response.status, payload?.message);
    await writeAuthAudit({
      event: "recovery_complete",
      status: "failure",
      ip,
      userId,
      reason: normalized.code,
    });
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: response.status }
    );
  }

  await writeAuthAudit({
    event: "recovery_complete",
    status: "success",
    ip,
    userId,
  });
  return NextResponse.json({ ok: true });
}
