import { NextResponse } from "next/server";

import { normalizeEndpoint, resolveCanonicalOrigin } from "../../_lib/appwriteAuth";
import { writeAuthAudit } from "../../_lib/audit";
import { extractClientIp, takeRateLimit } from "../../_lib/rateLimit";
import { fromHttpStatus } from "@/services/errorContract";

type RecoveryStartPayload = {
  email?: string;
};

export async function POST(request: Request) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    return NextResponse.json({ error: "Appwrite is not configured", code: "unexpected" }, { status: 500 });
  }

  const ip = extractClientIp(request);

  const body = (await request.json().catch(() => ({}))) as RecoveryStartPayload;
  const email = body.email?.trim();
  if (!email) {
    await writeAuthAudit({
      event: "recovery_start",
      status: "failure",
      ip,
      reason: "missing_email",
    });
    return NextResponse.json({ error: "Email is required", code: "validation" }, { status: 400 });
  }

  const ipLimit = takeRateLimit({ key: `recovery_start:ip:${ip}`, limit: 8, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.allowed) {
    await writeAuthAudit({
      event: "recovery_start",
      status: "failure",
      ip,
      email,
      reason: "rate_limit_ip",
    });
    return NextResponse.json(
      { error: "Too many recovery requests. Please wait and try again.", code: "rate_limited" },
      {
        status: 429,
        headers: ipLimit.retryAfterSeconds
          ? { "Retry-After": String(ipLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const emailLimit = takeRateLimit({
    key: `recovery_start:email:${email.toLowerCase()}`,
    limit: 4,
    windowMs: 10 * 60 * 1000,
  });
  if (!emailLimit.allowed) {
    await writeAuthAudit({
      event: "recovery_start",
      status: "failure",
      ip,
      email,
      reason: "rate_limit_email",
    });
    return NextResponse.json(
      { error: "Too many recovery requests. Please wait and try again.", code: "rate_limited" },
      {
        status: 429,
        headers: emailLimit.retryAfterSeconds
          ? { "Retry-After": String(emailLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const resetUrl = `${resolveCanonicalOrigin(request)}/reset-password`;
  const response = await fetch(`${normalizeEndpoint(endpoint)}/account/recovery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ email, url: resetUrl }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const normalized = fromHttpStatus(response.status, payload?.message);
    // Uniform response for non-existent accounts to avoid account enumeration.
    if (normalized.code === "not_found" || normalized.code === "unauthorized" || normalized.code === "forbidden") {
      await writeAuthAudit({
        event: "recovery_start",
        status: "accepted",
        ip,
        email,
        reason: "masked_unknown_account",
      });
      return NextResponse.json({ ok: true });
    }
    await writeAuthAudit({
      event: "recovery_start",
      status: "failure",
      ip,
      email,
      reason: normalized.code,
    });
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: response.status }
    );
  }

  await writeAuthAudit({
    event: "recovery_start",
    status: "success",
    ip,
    email,
  });
  return NextResponse.json({ ok: true });
}
