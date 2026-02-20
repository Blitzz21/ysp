import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "ysp_session";

export async function GET() {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);

    // Redirect to login page after clearing session
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
