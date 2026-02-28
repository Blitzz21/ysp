import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  normalizeEndpoint,
  parseSessionExpiry,
  resolveRequestOrigin,
  resolveSessionToken,
  buildTokenHeaders,
} from "../../_lib/appwriteAuth";

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

  // ── Populate user profile from Google account data ──
  await populateUserProfile(baseEndpoint, projectId, resolvedToken.token);

  return NextResponse.redirect(new URL(nextPath, origin));
}

async function populateUserProfile(
  baseEndpoint: string,
  projectId: string,
  token: string
): Promise<void> {
  try {
    const accountHeaders = buildTokenHeaders(projectId, token, "application/json");
    const accountRes = await fetch(`${baseEndpoint}/account`, {
      method: "GET",
      headers: accountHeaders,
      cache: "no-store",
    });

    if (!accountRes.ok) return;

    const account = await accountRes.json();
    const name: string = account.name ?? "";
    const email: string = account.email ?? "";
    const nameParts = name.split(" ");
    const firstName = nameParts[0] ?? "";
    const lastName = nameParts.slice(1).join(" ") ?? "";

    const apiKey = process.env.APPWRITE_API_KEY;
    const dbId = process.env.APPWRITE_DATABASE_ID;
    if (!apiKey || !dbId || !account.$id) return;

    const tableId = "user_profiles";
    const adminHeaders = {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      "Content-Type": "application/json",
    };

    const query = JSON.stringify({ method: "equal", attribute: "userId", values: [account.$id] });
    const listRes = await fetch(
      `${baseEndpoint}/tablesdb/${dbId}/tables/${tableId}/rows?queries[]=${encodeURIComponent(query)}`,
      { headers: adminHeaders, cache: "no-store" }
    );
    const listData = await listRes.json().catch(() => ({ total: 0, rows: [] }));
    const existing = listData.rows?.[0];

    if (!existing) {
      await createNewProfile(baseEndpoint, dbId, tableId, adminHeaders, account.$id, { name, firstName, lastName, email });
    } else {
      await updateExistingProfile(baseEndpoint, dbId, tableId, adminHeaders, existing, { name, firstName, lastName, email });
    }
  } catch (profileError) {
    console.error("[oauth/callback] Profile population failed:", profileError);
  }
}

async function createNewProfile(
  baseEndpoint: string,
  dbId: string,
  tableId: string,
  adminHeaders: Record<string, string>,
  accountId: string,
  profile: { name: string; firstName: string; lastName: string; email: string }
): Promise<void> {
  const rowId = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 32)
    ?? `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  await fetch(
    `${baseEndpoint}/tablesdb/${dbId}/tables/${tableId}/rows`,
    {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        rowId,
        row_id: rowId,
        data: {
          userId: accountId,
          role: "member",
          ...profile,
        },
        permissions: [
          `read("user:${accountId}")`,
          `update("user:${accountId}")`,
        ],
      }),
      cache: "no-store",
    }
  );
}

async function updateExistingProfile(
  baseEndpoint: string,
  dbId: string,
  tableId: string,
  adminHeaders: Record<string, string>,
  existing: Record<string, string>,
  profile: { name: string; firstName: string; lastName: string; email: string }
): Promise<void> {
  const updates: Record<string, string> = {};
  if (!existing.name && profile.name) updates.name = profile.name;
  if (!existing.firstName && profile.firstName) updates.firstName = profile.firstName;
  if (!existing.lastName && profile.lastName) updates.lastName = profile.lastName;
  if (!existing.email && profile.email) updates.email = profile.email;

  if (Object.keys(updates).length > 0) {
    await fetch(
      `${baseEndpoint}/tablesdb/${dbId}/tables/${tableId}/rows/${existing.$id}`,
      {
        method: "PATCH",
        headers: adminHeaders,
        body: JSON.stringify({ data: updates }),
        cache: "no-store",
      }
    );
  }
}
