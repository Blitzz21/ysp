import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSession } from "@/services/auth";
import { listPublicChapters } from "@/services/chapters";
import { joinChapter, leaveChapter, listMyMemberships } from "@/services/memberships";
import { listPublishedOpportunities } from "@/services/opportunities";
import { getProfileByUserId } from "@/services/profiles";
import { toPublicDomainError } from "@/services/errorContract";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ChapterCardGrid } from "./_components/ChapterCardGrid";
import type { Chapter, ChapterMembership } from "@/services/types";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Server actions                                                    */
/* ------------------------------------------------------------------ */

async function joinChapterAction(
    formData: FormData
): Promise<{ ok: boolean; message: string }> {
    "use server";
    const chapterId = String(formData.get("chapterId") ?? "").trim();
    if (!chapterId) return { ok: false, message: "Please select a chapter first." };
    try {
        await joinChapter(chapterId);
        revalidatePath("/dashboard/member/chapters");
        return { ok: true, message: "Chapter join request submitted." };
    } catch (error) {
        const message = toPublicDomainError(error, "Unable to join chapter.").message;
        return { ok: false, message };
    }
}

async function leaveChapterAction(
    formData: FormData
): Promise<{ ok: boolean; message: string }> {
    "use server";
    const chapterId = String(formData.get("chapterId") ?? "").trim();
    if (!chapterId) return { ok: false, message: "Please select a chapter first." };
    try {
        await leaveChapter(chapterId);
        revalidatePath("/dashboard/member/chapters");
        return { ok: true, message: "Membership updated." };
    } catch (error) {
        const message = toPublicDomainError(error, "Unable to update membership.").message;
        return { ok: false, message };
    }
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function MemberChaptersPage() {
    const session = await getSession();
    if (!session) redirect("/login?next=/dashboard/member/chapters");

    let chapters: Chapter[] = [];
    let memberships: ChapterMembership[] = [];
    let loadError: string | null = null;

    try {
        const [chapterRows, membershipRows] = await Promise.all([
            listPublicChapters(),
            listMyMemberships(),
        ]);
        chapters = chapterRows;
        memberships = membershipRows;
    } catch (error) {
        loadError = toPublicDomainError(error, "Unable to load chapters.").message;
    }

    const membershipMap = new Map(memberships.map((m) => [m.chapterId, m]));

    /* ── Fetch opportunity counts per chapter ── */
    const opportunityCounts = new Map<string, number>();
    try {
        const allOpportunities = await listPublishedOpportunities();
        for (const op of allOpportunities) {
            opportunityCounts.set(op.chapterId, (opportunityCounts.get(op.chapterId) ?? 0) + 1);
        }
    } catch {
        // Non-critical — just show 0 counts
    }

    /* ── Fetch chapter head names ── */
    const chapterHeadNames = new Map<string, string>();
    const headUserIds = [
        ...new Set(chapters.map((c) => c.chapterHeadUserId).filter(Boolean) as string[]),
    ];
    await Promise.all(
        headUserIds.map(async (userId) => {
            try {
                const profile = await getProfileByUserId(userId);
                if (profile?.name) {
                    chapterHeadNames.set(userId, profile.name);
                } else if (profile?.firstName) {
                    chapterHeadNames.set(
                        userId,
                        [profile.firstName, profile.lastName].filter(Boolean).join(" ")
                    );
                }
            } catch {
                // Skip — name won't show in modal
            }
        })
    );

    return (
        <div className="space-y-6">
            <PageHeader
                label="Member dashboard"
                title="Chapters"
                subtitle="Browse published chapters, join communities, and track your membership status."
            />

            {loadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    {loadError}
                </div>
            ) : (
                <ChapterCardGrid
                    chapters={chapters}
                    membershipMap={membershipMap}
                    joinAction={joinChapterAction}
                    leaveAction={leaveChapterAction}
                    chapterHeadNames={chapterHeadNames}
                    opportunityCounts={opportunityCounts}
                />
            )}
        </div>
    );
}
