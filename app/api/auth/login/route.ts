import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { fromHttpStatus } from "@/services/errorContract";

const SESSION_COOKIE = "ysp_session";

type LoginPayload = { email?: string; password?: string };

type AppwriteSession = {
  $id?: string;
  secret?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginPayload;
  const email = body.email?.trim();
  const password = body.password;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required", code: "validation" }, { status: 400 });
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    return NextResponse.json({ error: "Appwrite is not configured", code: "unexpected" }, { status: 500 });
  }

  const response = await fetch(`${endpoint.replace(/\/$/, "")}/account/sessions/email`, {
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
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: response.status }
    );
  }

  const session = (await response.json()) as AppwriteSession;
  const token = session.secret ?? session.$id;
  if (!token) {
    return NextResponse.json({ error: "Session token missing", code: "unexpected" }, { status: 500 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}