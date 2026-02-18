import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { normalizeEndpoint, parseSessionExpiry, resolveSessionToken } from "../../_lib/appwriteAuth";

const SESSION_COOKIE = "ysp_session";

function sanitizeNextPath(value: string | null): string {
  if (!value) {
    return "/dashboard";
  }
  return value.startsWith("/") ? value : "/dashboard";
}

function fallbackAuthPath(flow: string | null): string {
  return flow === "signup" ? "/signup" : "/login";
}

function buildErrorRedirect(requestUrl: URL, flow: string | null, nextPath: string): URL {
  const redirectUrl = new URL(fallbackAuthPath(flow), requestUrl.origin);
  redirectUrl.searchParams.set("error", "oauth");
  if (nextPath !== "/dashboard") {
    redirectUrl.searchParams.set("next", nextPath);
  }
  return redirectUrl;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const flow = requestUrl.searchParams.get("flow");
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const errorRedirect = buildErrorRedirect(requestUrl, flow, nextPath);

  const userId = requestUrl.searchParams.get("userId")?.trim();
  const secret = requestUrl.searchParams.get("secret")?.trim();
  if (!userId || !secret) {
    return NextResponse.redirect(errorRedirect);
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    return NextResponse.redirect(errorRedirect);
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
    return NextResponse.redirect(errorRedirect);
  }

  const resolvedToken = await resolveSessionToken(sessionResponse, baseEndpoint, projectId);
  if (!resolvedToken) {
    return NextResponse.redirect(errorRedirect);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, resolvedToken.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: parseSessionExpiry(resolvedToken.expire),
  });

  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}

