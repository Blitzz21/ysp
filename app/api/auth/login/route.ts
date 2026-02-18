import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildTokenHeaders,
  normalizeEndpoint,
  parseSessionExpiry,
  resolveSessionToken,
} from "../_lib/appwriteAuth";
import { writeAuthAudit } from "../_lib/audit";
import { extractClientIp, takeRateLimit } from "../_lib/rateLimit";
import { fromHttpStatus } from "@/services/errorContract";

const SESSION_COOKIE = "ysp_session";

type LoginPayload = { email?: string; password?: string; remember?: boolean };

type AppwriteAccount = {
  emailVerification?: boolean;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = body.email?.trim();
  const password = body.password;
  const remember = body.remember === true;
  const ip = extractClientIp(request);
  if (!email || !password) {
    await writeAuthAudit({
      event: "login",
      status: "failure",
      ip,
      email,
      reason: "missing_credentials",
    });
    return NextResponse.json({ error: "Email and password required", code: "validation" }, { status: 400 });
  }

  const ipLimit = takeRateLimit({ key: `login:ip:${ip}`, limit: 15, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.allowed) {
    await writeAuthAudit({
      event: "login",
      status: "failure",
      ip,
      email,
      reason: "rate_limit_ip",
    });
    return NextResponse.json(
      { error: "Too many login attempts. Please wait and try again.", code: "rate_limited" },
      {
        status: 429,
        headers: ipLimit.retryAfterSeconds
          ? { "Retry-After": String(ipLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }
  const emailLimit = takeRateLimit({
    key: `login:email:${email.toLowerCase()}`,
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!emailLimit.allowed) {
    await writeAuthAudit({
      event: "login",
      status: "failure",
      ip,
      email,
      reason: "rate_limit_email",
    });
    return NextResponse.json(
      { error: "Too many login attempts. Please wait and try again.", code: "rate_limited" },
      {
        status: 429,
        headers: emailLimit.retryAfterSeconds
          ? { "Retry-After": String(emailLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    await writeAuthAudit({
      event: "login",
      status: "failure",
      ip,
      email,
      reason: "appwrite_not_configured",
    });
    return NextResponse.json({ error: "Appwrite is not configured", code: "unexpected" }, { status: 500 });
  }
  const baseEndpoint = normalizeEndpoint(endpoint);

  const response = await fetch(`${baseEndpoint}/account/sessions/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const normalized = fromHttpStatus(response.status, payload?.message);
    await writeAuthAudit({
      event: "login",
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

  const resolvedToken = await resolveSessionToken(response, baseEndpoint, projectId);
  if (!resolvedToken) {
    await writeAuthAudit({
      event: "login",
      status: "failure",
      ip,
      email,
      reason: "missing_session_token",
    });
    return NextResponse.json({ error: "Session token missing", code: "unexpected" }, { status: 500 });
  }

  const accountResponse = await fetch(`${baseEndpoint}/account`, {
    headers: buildTokenHeaders(projectId, resolvedToken.token),
  });
  const account = (await accountResponse.json().catch(() => null)) as AppwriteAccount | null;
  const emailVerified = account?.emailVerification === true;

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, resolvedToken.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: remember ? parseSessionExpiry(resolvedToken.expire) : undefined,
  });

  await writeAuthAudit({
    event: "login",
    status: "success",
    ip,
    email,
    reason: emailVerified ? "verified" : "unverified",
  });
  return NextResponse.json({ ok: true, emailVerified });
}
