import { NextResponse } from "next/server";

import { getSession } from "@/services/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required", code: "unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    emailVerified: session.emailVerified === true,
  });
}
