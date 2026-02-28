import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  buildTokenHeaders,
  normalizeEndpoint,
  parseSessionExpiry,
  resolveCanonicalOrigin,
  resolveSessionToken,
} from "../_lib/appwriteAuth";
import { writeAuthAudit } from "../_lib/audit";
import { extractClientIp, takeRateLimit } from "../_lib/rateLimit";
import { createRow, userReadPermissions } from "@/services/appwriteClient";
import { fromHttpStatus } from "@/services/errorContract";

const SESSION_COOKIE = "ysp_session";

type SignupPayload = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  birthdate?: string;
  chapterId?: string;
  phone?: string;
  facebookUrl?: string;
  registeredVoter?: boolean;
  householdSize?: number;
  householdVoters?: number;
  sector?: string;
  sectorOther?: string;
  newsletterSubscribed?: boolean;
  privacyConsent?: boolean;
};

type AppwriteAccount = {
  $id?: string;
};

async function auditAndFail(
  ip: string,
  email: string | undefined,
  reason: string,
  error: string,
  code: string,
  status: number,
  headers?: Record<string, string>
): Promise<Response> {
  await writeAuthAudit({ event: "signup", status: "failure", ip, email, reason });
  return NextResponse.json({ error, code }, { status, headers });
}

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryHeaders?: Record<string, string> } {
  const result = takeRateLimit({ key, limit, windowMs });
  if (result.allowed) return { allowed: true };
  return {
    allowed: false,
    retryHeaders: result.retryAfterSeconds
      ? { "Retry-After": String(result.retryAfterSeconds) }
      : undefined,
  };
}

async function createSignupProfile(
  accountId: string,
  body: SignupPayload,
  name: string,
  firstName: string | undefined,
  lastName: string | undefined,
  email: string
): Promise<void> {
  try {
    await createRow(
      "user_profiles",
      {
        userId: accountId,
        role: "member",
        name,
        firstName,
        lastName,
        email,
        age: body.age,
        birthdate: body.birthdate,
        phone: body.phone,
        facebookUrl: body.facebookUrl,
        registeredVoter: body.registeredVoter ?? false,
        householdSize: body.householdSize,
        householdVoters: body.householdVoters,
        sector: body.sector,
        sectorOther: body.sectorOther,
        newsletterSubscribed: body.newsletterSubscribed ?? false,
        privacyConsent: body.privacyConsent ?? false,
      },
      userReadPermissions(accountId)
    );
  } catch {
    // Do not block signup if profile row creation fails.
  }

  if (body.chapterId) {
    try {
      await createRow(
        "chapter_memberships",
        {
          userId: accountId,
          chapterId: body.chapterId,
          role: "member",
          status: "pending",
          joinedAt: new Date().toISOString(),
        },
        userReadPermissions(accountId)
      );
    } catch {
      // Do not block signup if chapter join fails.
    }
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignupPayload;
  const email = body.email?.trim();
  const password = body.password;
  const confirmPassword = body.confirmPassword;
  const name = body.name?.trim() || [body.firstName, body.lastName].filter(Boolean).join(" ").trim();
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const ip = extractClientIp(request);

  const ipCheck = checkRateLimit(`signup:ip:${ip}`, 10, 10 * 60 * 1000);
  if (!ipCheck.allowed) {
    return auditAndFail(ip, email, "rate_limit_ip", "Too many signup attempts. Please wait and try again.", "rate_limited", 429, ipCheck.retryHeaders);
  }

  if (email) {
    const emailCheck = checkRateLimit(`signup:email:${email.toLowerCase()}`, 4, 10 * 60 * 1000);
    if (!emailCheck.allowed) {
      return auditAndFail(ip, email, "rate_limit_email", "Too many signup attempts. Please wait and try again.", "rate_limited", 429, emailCheck.retryHeaders);
    }
  }

  if (!email || !password || !confirmPassword || !name) {
    return auditAndFail(ip, email, "missing_fields", "Name, email, password, and confirm password are required", "validation", 400);
  }
  if (password !== confirmPassword) {
    return auditAndFail(ip, email, "password_mismatch", "Passwords do not match", "validation", 400);
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    return auditAndFail(ip, email, "appwrite_not_configured", "Appwrite is not configured", "unexpected", 500);
  }

  const baseEndpoint = normalizeEndpoint(endpoint);
  const createResponse = await fetch(`${baseEndpoint}/account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ userId: "unique()", email, password, name }),
  });

  if (!createResponse.ok) {
    const payload = await createResponse.json().catch(() => null);
    const normalized = fromHttpStatus(createResponse.status, payload?.message);
    return auditAndFail(ip, email, normalized.code, normalized.message, normalized.code, createResponse.status);
  }

  const sessionResponse = await fetch(`${baseEndpoint}/account/sessions/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Appwrite-Project": projectId },
    body: JSON.stringify({ email, password }),
  });

  if (!sessionResponse.ok) {
    const payload = await sessionResponse.json().catch(() => null);
    const normalized = fromHttpStatus(sessionResponse.status, payload?.message);
    return auditAndFail(ip, email, `session_${normalized.code}`, normalized.message, normalized.code, sessionResponse.status);
  }

  const resolvedToken = await resolveSessionToken(sessionResponse, baseEndpoint, projectId);
  if (!resolvedToken) {
    return auditAndFail(ip, email, "missing_session_token", "Session token missing", "unexpected", 500);
  }

  const verificationUrl = `${resolveCanonicalOrigin(request)}/verify-email`;
  const verificationResponse = await fetch(`${baseEndpoint}/account/verification`, {
    method: "POST",
    headers: buildTokenHeaders(projectId, resolvedToken.token, "application/json"),
    body: JSON.stringify({ url: verificationUrl }),
  });

  const createdAccount = (await createResponse.json().catch(() => null)) as AppwriteAccount | null;
  const accountId = createdAccount?.$id ?? null;
  if (accountId) {
    await createSignupProfile(accountId, body, name, firstName, lastName, email);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, resolvedToken.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: parseSessionExpiry(resolvedToken.expire),
  });

  await writeAuthAudit({
    event: "signup",
    status: "success",
    ip,
    email,
    userId: accountId ?? undefined,
    reason: verificationResponse.ok ? "verification_sent" : "verification_send_failed",
  });

  return NextResponse.json({
    ok: true,
    emailVerified: false,
    verificationSent: verificationResponse.ok,
  });
}
