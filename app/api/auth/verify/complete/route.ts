import { NextResponse } from "next/server";

import { normalizeEndpoint } from "../../_lib/appwriteAuth";
import { writeAuthAudit } from "../../_lib/audit";
import { extractClientIp, takeRateLimit } from "../../_lib/rateLimit";

type VerifyErrorCode =
  | "validation"
  | "unauthorized"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "unexpected";

type VerifyError = {
  code: VerifyErrorCode;
  message: string;
};

function mapVerifyCompleteError(status: number, fallbackMessage?: string): VerifyError {
  if (status === 400) {
    return { code: "validation", message: "Invalid verification link." };
  }
  if (status === 401) {
    return {
      code: "unauthorized",
      message: "Verification could not be completed. Please request a new link.",
    };
  }
  if (status === 404) {
    return { code: "not_found", message: "Verification link is invalid or expired." };
  }
  if (status === 409) {
    return { code: "conflict", message: "Email is already verified." };
  }
  if (status === 429) {
    return {
      code: "rate_limited",
      message: "Too many verification attempts. Please wait and try again.",
    };
  }
  return {
    code: "unexpected",
    message: fallbackMessage ?? "Verification failed. Please try again.",
  };
}

type CompletePayload = {
  userId?: string;
  secret?: string;
};

export async function POST(request: Request) {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    return NextResponse.json({ error: "Appwrite is not configured", code: "unexpected" }, { status: 500 });
  }

  const ip = extractClientIp(request);
  const ipLimit = takeRateLimit({ key: `verify_complete:ip:${ip}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.allowed) {
    await writeAuthAudit({
      event: "verify_complete",
      status: "failure",
      ip,
      reason: "rate_limit_ip",
    });
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait and try again.", code: "rate_limited" },
      {
        status: 429,
        headers: ipLimit.retryAfterSeconds
          ? { "Retry-After": String(ipLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const body = (await request.json().catch(() => ({}))) as CompletePayload;
  const userId = body.userId?.trim();
  const secret = body.secret?.trim();
  if (!userId || !secret) {
    await writeAuthAudit({
      event: "verify_complete",
      status: "failure",
      ip,
      reason: "invalid_payload",
    });
    return NextResponse.json({ error: "Invalid verification link", code: "validation" }, { status: 400 });
  }

  const response = await fetch(`${normalizeEndpoint(endpoint)}/account/verification`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ userId, secret }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const normalized = mapVerifyCompleteError(response.status, payload?.message);
    await writeAuthAudit({
      event: "verify_complete",
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
    event: "verify_complete",
    status: "success",
    ip,
    userId,
  });
  return NextResponse.json({ ok: true });
}
