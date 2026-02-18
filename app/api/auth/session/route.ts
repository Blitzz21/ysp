import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "ysp_session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token =
    typeof body?.token === "string"
      ? body.token
      : typeof body?.jwt === "string"
        ? body.jwt
        : "";
  const expire = typeof body?.expire === "string" ? body.expire : undefined;

  if (!token) {
    return NextResponse.json({ error: "Missing token", code: "validation" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const expiresAt =
    expire && !Number.isNaN(new Date(expire).getTime()) ? new Date(expire) : undefined;

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
