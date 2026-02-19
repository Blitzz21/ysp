import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getSession } from "@/services/auth";
import { listPublicChapters } from "@/services/chapters";
import { joinChapter, leaveChapter, listMyMemberships } from "@/services/memberships";
import { toPublicDomainError } from "@/services/errorContract";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ChaptersTable } from "./_components/ChaptersTable";
import type { Chapter, ChapterMembership } from "@/services/types";

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/*  Server actions                                                    */
/* ------------------------------------------------------------------ */

function buildRedirect(status: "success" | "error", message: string): never {
    const encoded = encodeURIComponent(message);
    redirect(`/dashboard/member/chapters?status=${status}&message=${encoded}`);
}

async function joinChapterAction(formData: FormData): Promise<void> {
    "use server";
    const chapterId = String(formData.get("chapterId") ?? "").trim();
    if (!chapterId) buildRedirect("error", "Please select a chapter first.");
    try {
        await joinChapter(chapterId);
    } catch (error) {
        const message = toPublicDomainError(error, "Unable to join chapter.").message;
        buildRedirect("error", message);
    }
    revalidatePath("/dashboard/member/chapters");
    buildRedirect("success", "Chapter join request submitted.");
}

async function leaveChapterAction(formData: FormData): Promise<void> {
    "use server";
    const chapterId = String(formData.get("chapterId") ?? "").trim();
    if (!chapterId) buildRedirect("error", "Please select a chapter first.");
    try {
        await leaveChapter(chapterId);
    } catch (error) {
        const message = toPublicDomainError(error, "Unable to update membership.").message;
        buildRedirect("error", message);
    }
    revalidatePath("/dashboard/member/chapters");
    buildRedirect("success", "Membership updated.");
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

type SearchParams = Record<string, string | string[] | undefined>;

export default async function MemberChaptersPage(props: {
    searchParams?: Promise<SearchParams>;
}) {
    const searchParams = (await props.searchParams) ?? {};
    const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;
    const message = Array.isArray(searchParams.message) ? searchParams.message[0] : searchParams.message;

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

    return (
        <div className="space-y-6">
            <PageHeader
                label="Member dashboard"
                title="Chapters"
                subtitle="Browse published chapters, join communities, and track your membership status."
            />

            {message && (
                <div
                    className={`rounded-2xl border px-4 py-3 text-sm ${status === "error"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : "border-green-200 bg-green-50 text-green-700"
                        }`}
                >
                    {message}
                </div>
            )}

            {loadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    {loadError}
                </div>
            ) : (
                <ChaptersTable
                    chapters={chapters}
                    membershipMap={membershipMap}
                    joinAction={joinChapterAction}
                    leaveAction={leaveChapterAction}
                />
            )}
        </div>
    );
}
