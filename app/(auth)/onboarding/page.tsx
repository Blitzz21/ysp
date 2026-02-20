import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { listPublicChapters } from "@/services/chapters";

import OnboardingClient from "./OnboardingClient";

const SESSION_COOKIE = "ysp_session";

function normalizeEndpoint(url: string): string {
    return url.replace(/\/+$/, "").replace(/\/v1$/, "") + "/v1";
}

export default async function OnboardingPage() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
        redirect("/login");
    }

    // Fetch user account data for pre-fill
    let prefillName = "";
    let prefillEmail = "";

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    if (endpoint && projectId) {
        const baseEndpoint = normalizeEndpoint(endpoint);
        try {
            const res = await fetch(`${baseEndpoint}/account`, {
                headers: {
                    "X-Appwrite-Project": projectId,
                    Cookie: `a_session_${projectId}=${sessionToken}`,
                },
            });
            if (res.ok) {
                const account = await res.json();
                prefillName = account.name ?? "";
                prefillEmail = account.email ?? "";
            }
        } catch {
            // Proceed without prefill
        }
    }

    let chapters: { id: string; name: string }[] = [];
    try {
        const all = await listPublicChapters();
        chapters = all.map((c) => ({ id: c.id, name: c.name }));
    } catch {
        // Proceed with empty chapters
    }

    return (
        <Suspense fallback={<div className="auth-frame" />}>
            <OnboardingClient
                chapters={chapters}
                prefillName={prefillName}
                prefillEmail={prefillEmail}
            />
        </Suspense>
    );
}
