import { NextResponse } from "next/server";

import { buildSessionHeaders, normalizeEndpoint, resolveCanonicalOrigin } from "../../_lib/appwriteAuth";
import { writeAuthAudit } from "../../_lib/audit";
import { extractClientIp, takeRateLimit } from "../../_lib/rateLimit";
import { fromHttpStatus } from "@/services/errorContract";

export async function POST(request: Request) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    return NextResponse.json({ error: "Appwrite is not configured", code: "unexpected" }, { status: 500 });
  }

  const ip = extractClientIp(request);
  const ipLimit = takeRateLimit({ key: `verify_start:ip:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.allowed) {
    await writeAuthAudit({
      event: "verify_start",
      status: "failure",
      ip,
      reason: "rate_limit_ip",
    });
    return NextResponse.json(
      { error: "Too many verification requests. Please wait and try again.", code: "rate_limited" },
      {
        status: 429,
        headers: ipLimit.retryAfterSeconds
          ? { "Retry-After": String(ipLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const headers = await buildSessionHeaders(projectId);
  if (!headers) {
    await writeAuthAudit({
      event: "verify_start",
      status: "failure",
      ip,
      reason: "unauthorized",
    });
    return NextResponse.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  }

  const verificationUrl = `${resolveCanonicalOrigin(request)}/verify-email`;
  const response = await fetch(`${normalizeEndpoint(endpoint)}/account/verification`, {
    method: "POST",
    headers,
    body: JSON.stringify({ url: verificationUrl }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const normalized = fromHttpStatus(response.status, payload?.message);
    await writeAuthAudit({
      event: "verify_start",
      status: "failure",
      ip,
      reason: normalized.code,
    });
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: response.status }
    );
  }

  await writeAuthAudit({
    event: "verify_start",
    status: "success",
    ip,
  });
  return NextResponse.json({ ok: true });
}
