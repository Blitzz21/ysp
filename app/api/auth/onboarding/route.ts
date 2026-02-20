import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
    buildTokenHeaders,
    normalizeEndpoint,
} from "../_lib/appwriteAuth";
import { createRow, listRows, updateRow, buildEqualQuery, userReadPermissions } from "@/services/appwriteClient";

const SESSION_COOKIE = "ysp_session";

type OnboardingPayload = {
    name?: string;
    firstName?: string;
    lastName?: string;
    age?: number;
    birthdate?: string;
    chapterId?: string;
    phone?: string;
    facebookUrl?: string;
    registeredVoter?: boolean;
    householdSize?: number;
    householdVoters?: number;
    sector?: string;
    sectorOther?: string;
    newsletterSubscribed?: boolean;
    privacyConsent?: boolean;
};

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionToken) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
    if (!endpoint || !projectId) {
        return NextResponse.json({ error: "Appwrite not configured" }, { status: 500 });
    }

    const baseEndpoint = normalizeEndpoint(endpoint);

    // Get current user's account
    const accountRes = await fetch(`${baseEndpoint}/account`, {
        headers: buildTokenHeaders(projectId, sessionToken),
    });
    if (!accountRes.ok) {
        return NextResponse.json({ error: "Failed to get account" }, { status: 401 });
    }
    const account = (await accountRes.json()) as { $id: string; name?: string; email?: string };

    const body = (await request.json().catch(() => ({}))) as OnboardingPayload;

    if (!body.name || !body.age || !body.phone || !body.sector || !body.privacyConsent || !body.chapterId) {
        return NextResponse.json(
            { error: "Name, age, phone, sector, chapter, and privacy consent are required", code: "validation" },
            { status: 400 }
        );
    }

    // Check if profile exists
    const existingProfiles = await listRows("user_profiles", [
        buildEqualQuery("userId", account.$id),
    ]);

    const profileData = {
        name: body.name,
        firstName: body.firstName,
        lastName: body.lastName,
        age: body.age,
        birthdate: body.birthdate,
        phone: body.phone,
        facebookUrl: body.facebookUrl,
        registeredVoter: body.registeredVoter ?? false,
        householdSize: body.householdSize,
        householdVoters: body.householdVoters,
        sector: body.sector,
        sectorOther: body.sectorOther,
        newsletterSubscribed: body.newsletterSubscribed ?? false,
        privacyConsent: body.privacyConsent,
    };

    try {
        if (existingProfiles.length > 0) {
            await updateRow("user_profiles", existingProfiles[0].$id, profileData);
        } else {
            await createRow(
                "user_profiles",
                { userId: account.$id, role: "member", email: account.email, ...profileData },
                userReadPermissions(account.$id)
            );
        }
    } catch {
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Create chapter membership if not already exists
    if (body.chapterId) {
        try {
            const existingMemberships = await listRows("chapter_memberships", [
                buildEqualQuery("userId", account.$id),
                buildEqualQuery("chapterId", body.chapterId),
            ]);

            if (existingMemberships.length === 0) {
                await createRow(
                    "chapter_memberships",
                    {
                        userId: account.$id,
                        chapterId: body.chapterId,
                        role: "member",
                        status: "pending",
                        joinedAt: new Date().toISOString(),
                    },
                    userReadPermissions(account.$id)
                );
            }
        } catch {
            // Don't block onboarding if chapter join fails
        }
    }

    return NextResponse.json({ ok: true });
}
