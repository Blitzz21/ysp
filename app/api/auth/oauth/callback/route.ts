import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { normalizeEndpoint, parseSessionExpiry, resolveRequestOrigin, resolveSessionToken } from "../../_lib/appwriteAuth";

const SESSION_COOKIE = "ysp_session";
const VALID_FLOWS = new Set(["login", "signup"]);

function sanitizeNextPath(value: string | null): string {
  if (!value) {
    return "/dashboard";
  }
  return value.startsWith("/") ? value : "/dashboard";
}

function fallbackAuthPath(flow: string | null): string {
  return flow === "signup" ? "/signup" : "/login";
}

function buildErrorRedirect(
  origin: string,
  flow: string | null,
  nextPath: string,
  reason: string
): URL {
  const redirectUrl = new URL(fallbackAuthPath(flow), origin);
  redirectUrl.searchParams.set("error", "oauth");
  redirectUrl.searchParams.set("reason", reason);
  if (nextPath !== "/dashboard") {
    redirectUrl.searchParams.set("next", nextPath);
  }
  return redirectUrl;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = resolveRequestOrigin(request);
  const flow = requestUrl.searchParams.get("flow");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));

  if (flow !== null && !VALID_FLOWS.has(flow)) {
    console.error("[oauth/callback] Invalid flow param:", flow);
    return NextResponse.redirect(
      buildErrorRedirect(origin, flow, nextPath, "invalid_flow")
    );
  }

  const userId = requestUrl.searchParams.get("userId")?.trim();
  const secret = requestUrl.searchParams.get("secret")?.trim();
  if (!userId || !secret) {
    console.error("[oauth/callback] Missing userId or secret params");
    return NextResponse.redirect(
      buildErrorRedirect(origin, flow, nextPath, "missing_params")
    );
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    console.error("[oauth/callback] Appwrite env vars not configured");
    return NextResponse.redirect(
      buildErrorRedirect(origin, flow, nextPath, "misconfigured")
    );
  }

  const baseEndpoint = normalizeEndpoint(endpoint);
  const sessionResponse = await fetch(`${baseEndpoint}/account/sessions/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    },
    body: JSON.stringify({ userId, secret }),
    cache: "no-store",
  });

  if (!sessionResponse.ok) {
    const body = await sessionResponse.text().catch(() => "(unreadable)");
    console.error(
      `[oauth/callback] Token exchange failed — status ${sessionResponse.status}:`,
      body
    );
    return NextResponse.redirect(
      buildErrorRedirect(origin, flow, nextPath, "token_exchange")
    );
  }

  const resolvedToken = await resolveSessionToken(sessionResponse, baseEndpoint, projectId);
  if (!resolvedToken) {
    console.error("[oauth/callback] resolveSessionToken returned null — no usable token in response");
    return NextResponse.redirect(
      buildErrorRedirect(origin, flow, nextPath, "no_token")
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, resolvedToken.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: parseSessionExpiry(resolvedToken.expire),
  });

  return NextResponse.redirect(new URL(nextPath, origin));
}

