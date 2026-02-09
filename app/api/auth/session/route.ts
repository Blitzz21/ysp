import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "ysp_session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const jwt = typeof body?.jwt === "string" ? body.jwt : "";
  if (!jwt) {
    return NextResponse.json({ error: "Missing jwt" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
