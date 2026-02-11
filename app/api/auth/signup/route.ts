import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { fromHttpStatus } from "@/services/errorContract";

const SESSION_COOKIE = "ysp_session";

type SignupPayload = { email?: string; password?: string; name?: string };

type AppwriteSession = {
  $id?: string;
  secret?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as SignupPayload;
  const email = body.email?.trim();
  const password = body.password;
  const name = body.name?.trim();
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Name, email, and password required", code: "validation" }, { status: 400 });
  }

  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    return NextResponse.json({ error: "Appwrite is not configured", code: "unexpected" }, { status: 500 });
  }

  const base = endpoint.replace(/\/$/, "");
  const createResponse = await fetch(`${base}/account`, {
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
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: createResponse.status }
    );
  }

  const sessionResponse = await fetch(`${base}/account/sessions/email`, {
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
    return NextResponse.json(
      { error: normalized.message, code: normalized.code },
      { status: sessionResponse.status }
    );
  }

  const session = (await sessionResponse.json()) as AppwriteSession;
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