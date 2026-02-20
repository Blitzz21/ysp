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
  try {
    const accountHeaders = buildTokenHeaders(projectId, resolvedToken.token, "application/json");
    const accountRes = await fetch(`${baseEndpoint}/account`, {
      method: "GET",
      headers: accountHeaders,
      cache: "no-store",
    });

    console.log("[oauth/callback] Account fetch status:", accountRes.status);

    if (accountRes.ok) {
      const account = await accountRes.json();
      const name = account.name ?? "";
      const email = account.email ?? "";
      const nameParts = name.split(" ");
      const firstName = nameParts[0] ?? "";
      const lastName = nameParts.slice(1).join(" ") ?? "";

      console.log("[oauth/callback] Google account data:", { id: account.$id, name, email });

      // Use the admin API key to upsert user_profiles via Appwrite Tables API
      const apiKey = process.env.APPWRITE_API_KEY;
      const dbId = process.env.APPWRITE_DATABASE_ID;
      if (apiKey && dbId && account.$id) {
        const tableId = "user_profiles";
        const adminHeaders = {
          "X-Appwrite-Project": projectId,
          "X-Appwrite-Key": apiKey,
          "Content-Type": "application/json",
        };

        // Check if profile already exists using the Tables API query format
        const query = JSON.stringify({ method: "equal", attribute: "userId", values: [account.$id] });
        const listRes = await fetch(
          `${baseEndpoint}/tablesdb/${dbId}/tables/${tableId}/rows?queries[]=${encodeURIComponent(query)}`,
          { headers: adminHeaders, cache: "no-store" }
        );

        console.log("[oauth/callback] Profile list status:", listRes.status);
        const listData = await listRes.json().catch(() => ({ total: 0, rows: [] }));
        console.log("[oauth/callback] Profile list total:", listData.total, "rows:", listData.rows?.length ?? 0);

        const existing = listData.rows?.[0];
        if (!existing) {
          // Create new profile via Tables API
          console.log("[oauth/callback] Creating NEW profile for user:", account.$id);
          const rowId = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 32)
            ?? `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
          const createRes = await fetch(
            `${baseEndpoint}/tablesdb/${dbId}/tables/${tableId}/rows`,
            {
              method: "POST",
              headers: adminHeaders,
              body: JSON.stringify({
                rowId,
                row_id: rowId,
                data: {
                  userId: account.$id,
                  role: "member",
                  name,
                  firstName,
                  lastName,
                  email,
                },
                permissions: [
                  `read("user:${account.$id}")`,
                  `update("user:${account.$id}")`,
                ],
              }),
              cache: "no-store",
            }
          );
          const createBody = await createRes.text().catch(() => "(unreadable)");
          console.log("[oauth/callback] Create profile result:", createRes.status, createBody);
        } else {
          // Update existing profile with latest Google info (only if fields are empty)
          console.log("[oauth/callback] Found existing profile:", existing.$id, "current data:", {
            name: existing.name, firstName: existing.firstName,
            lastName: existing.lastName, email: existing.email,
          });
          const updates: Record<string, string> = {};
          if (!existing.name && name) updates.name = name;
          if (!existing.firstName && firstName) updates.firstName = firstName;
          if (!existing.lastName && lastName) updates.lastName = lastName;
          if (!existing.email && email) updates.email = email;

          console.log("[oauth/callback] Updates to apply:", updates);

          if (Object.keys(updates).length > 0) {
            const patchRes = await fetch(
              `${baseEndpoint}/tablesdb/${dbId}/tables/${tableId}/rows/${existing.$id}`,
              {
                method: "PATCH",
                headers: adminHeaders,
                body: JSON.stringify({ data: updates }),
                cache: "no-store",
              }
            );
            const patchBody = await patchRes.text().catch(() => "(unreadable)");
            console.log("[oauth/callback] Patch profile result:", patchRes.status, patchBody);
          } else {
            console.log("[oauth/callback] No updates needed — all fields already populated");
          }
        }
      } else {
        console.log("[oauth/callback] Skipping profile upsert — missing env:", { apiKey: !!apiKey, dbId: !!dbId, accountId: account.$id });
      }
    } else {
      console.log("[oauth/callback] Account fetch failed:", accountRes.status, await accountRes.text().catch(() => ""));
    }
  } catch (profileError) {
    // Don't block the OAuth flow if profile population fails
    console.error("[oauth/callback] Profile population failed:", profileError);
  }

  return NextResponse.redirect(new URL(nextPath, origin));
}

