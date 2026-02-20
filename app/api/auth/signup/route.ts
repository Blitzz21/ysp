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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignupPayload;
  const email = body.email?.trim();
  const password = body.password;
  const confirmPassword = body.confirmPassword;
  const name = body.name?.trim() || [body.firstName, body.lastName].filter(Boolean).join(" ").trim();
  const firstName = body.firstName?.trim();
  const lastName = body.lastName?.trim();
  const ip = extractClientIp(request);

  const ipLimit = takeRateLimit({ key: `signup:ip:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!ipLimit.allowed) {
    await writeAuthAudit({
      event: "signup",
      status: "failure",
      ip,
      email,
      reason: "rate_limit_ip",
    });
    return NextResponse.json(
      { error: "Too many signup attempts. Please wait and try again.", code: "rate_limited" },
      {
        status: 429,
        headers: ipLimit.retryAfterSeconds
          ? { "Retry-After": String(ipLimit.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  if (email) {
    const emailLimit = takeRateLimit({
      key: `signup:email:${email.toLowerCase()}`,
      limit: 4,
      windowMs: 10 * 60 * 1000,
    });
    if (!emailLimit.allowed) {
      await writeAuthAudit({
        event: "signup",
        status: "failure",
        ip,
        email,
        reason: "rate_limit_email",
      });
      return NextResponse.json(
        { error: "Too many signup attempts. Please wait and try again.", code: "rate_limited" },
        {
          status: 429,
          headers: emailLimit.retryAfterSeconds
            ? { "Retry-After": String(emailLimit.retryAfterSeconds) }
            : undefined,
        }
      );
    }
  }

  if (!email || !password || !confirmPassword || !name) {
    await writeAuthAudit({
      event: "signup",
      status: "failure",
      ip,
      email,
      reason: "missing_fields",
    });
    return NextResponse.json(
      { error: "Name, email, password, and confirm password are required", code: "validation" },
      { status: 400 }
    );
  }
  if (password !== confirmPassword) {
    await writeAuthAudit({
      event: "signup",
      status: "failure",
      ip,
      email,
      reason: "password_mismatch",
    });
    return NextResponse.json({ error: "Passwords do not match", code: "validation" }, { status: 400 });
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    await writeAuthAudit({
      event: "signup",
      status: "failure",
      ip,
      email,
      reason: "appwrite_not_configured",
    });
    return NextResponse.json({ error: "Appwrite is not configured", code: "unexpected" }, { status: 500 });
  }

  const baseEndpoint = normalizeEndpoint(endpoint);
  const createResponse = await fetch(`${baseEndpoint}/account`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({
      userId: "unique()",
      email,
      password,
      name,
    }),
  });

  if (!createResponse.ok) {
    const payload = await createResponse.json().catch(() => null);
    const normalized = fromHttpStatus(createResponse.status, payload?.message);
    await writeAuthAudit({
      event: "signup",
      status: "failure",
      ip,
      email,
      reason: normalized.code,
    });
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: createResponse.status }
    );
  }

  const sessionResponse = await fetch(`${baseEndpoint}/account/sessions/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!sessionResponse.ok) {
    const payload = await sessionResponse.json().catch(() => null);
    const normalized = fromHttpStatus(sessionResponse.status, payload?.message);
    await writeAuthAudit({
      event: "signup",
      status: "failure",
      ip,
      email,
      reason: `session_${normalized.code}`,
    });
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: sessionResponse.status }
    );
  }

  const resolvedToken = await resolveSessionToken(sessionResponse, baseEndpoint, projectId);
  if (!resolvedToken) {
    await writeAuthAudit({
      event: "signup",
      status: "failure",
      ip,
      email,
      reason: "missing_session_token",
    });
    return NextResponse.json({ error: "Session token missing", code: "unexpected" }, { status: 500 });
  }

  const verificationUrl = `${resolveCanonicalOrigin(request)}/verify-email`;
  const verificationResponse = await fetch(`${baseEndpoint}/account/verification`, {
    method: "POST",
    headers: buildTokenHeaders(projectId, resolvedToken.token, "application/json"),
    body: JSON.stringify({
      url: verificationUrl,
    }),
  });

  const createdAccount = (await createResponse.json().catch(() => null)) as AppwriteAccount | null;
  const accountId = createdAccount?.$id ?? null;
  if (accountId) {
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

    // Create pending chapter membership if a chapter was selected
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
