import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
    getSessionToken,
    normalizeEndpoint,
    buildTokenHeaders,
} from "../_lib/appwriteAuth";

const SESSION_COOKIE = "ysp_session";

export async function DELETE() {
    const endpoint = normalizeEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "");
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";

    const token = await getSessionToken();
    if (!token) {
        return NextResponse.json(
            { message: "Not authenticated." },
            { status: 401 }
        );
    }

    try {
        // Delete the Appwrite account (this deletes sessions, user data, etc.)
        const res = await fetch(`${endpoint}/account`, {
            method: "DELETE",
            headers: buildTokenHeaders(projectId, token, "application/json"),
            cache: "no-store",
        });

        if (!res.ok) {
            const body = await res.json().catch(() => null);
            const message =
                body?.message ?? "Unable to delete account. Please try again.";
            return NextResponse.json({ message }, { status: res.status });
        }
    } catch {
        return NextResponse.json(
            { message: "An unexpected error occurred." },
            { status: 500 }
        );
    }

    // Clear the session cookie
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);

    return NextResponse.json({ ok: true });
}
