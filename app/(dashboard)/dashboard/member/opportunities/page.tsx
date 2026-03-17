import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { writeAdminAudit } from "@/services/adminAudit";
import { getSession } from "@/services/auth";
import {
    listPublishedOpportunities,
    joinOpportunity,
    getMyActiveSignups,
    getBatchSignupAvatars,
    type SignupAvatar,
} from "@/services/opportunities";
import { listPublicChapters } from "@/services/chapters";
import { toPublicDomainError } from "@/services/errorContract";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OpportunityCardGrid } from "./_components/OpportunityCardGrid";
import type { VolunteerOpportunity, Chapter } from "@/services/types";

export const dynamic = "force-dynamic";

/* ── Server Action: Join an opportunity ── */
async function joinOpportunityAction(formData: FormData): Promise<void> {
    "use server";
    const opportunityId = String(formData.get("opportunityId") ?? "").trim();
    if (!opportunityId) {
        throw new Error("Missing opportunity ID.");
    }
    try {
        const status = await joinOpportunity(opportunityId);
        if (status === "waitlisted") {
            // Optionally handle waitlist state — for now we just revalidate
        }
    } catch (error) {
        const message = toPublicDomainError(error, "Unable to join opportunity.").message;
        throw new Error(message);
    }
    revalidatePath("/dashboard/member/opportunities");
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "member", action: "opportunity.join", targetType: "opportunity", targetId: opportunityId });
}

export default async function MemberOpportunitiesPage() {
    const session = await getSession();
    if (!session) redirect("/login?next=/dashboard/member/opportunities");

    let opportunities: VolunteerOpportunity[] = [];
    let chapters: Chapter[] = [];
    let joinedIds = new Set<string>();
    let avatarMap = new Map<string, SignupAvatar[]>();
    let loadError: string | null = null;

    try {
        const [opRows, chapterRows, signups] = await Promise.all([
            listPublishedOpportunities(),
            listPublicChapters(),
            getMyActiveSignups(),
        ]);
        opportunities = opRows;
        chapters = chapterRows;
        joinedIds = new Set(signups.map((s) => s.opportunityId));

        // Fetch avatars for all opportunities (batch)
        if (opRows.length > 0) {
            avatarMap = await getBatchSignupAvatars(opRows.map((op) => op.id));
        }
    } catch (error) {
        loadError = toPublicDomainError(error, "Unable to load opportunities.").message;
    }

    const chapterNameById = new Map(chapters.map((c) => [c.id, c.name]));

    return (
        <div className="space-y-6">
            <PageHeader
                label="Member dashboard"
                title="Opportunities"
                subtitle="Explore volunteer opportunities and find ways to contribute to your community."
            />

            {loadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    {loadError}
                </div>
            ) : (
                <OpportunityCardGrid
                    opportunities={opportunities}
                    chapterNameById={chapterNameById}
                    joinAction={joinOpportunityAction}
                    joinedOpportunityIds={joinedIds}
                    signupAvatars={avatarMap}
                />
            )}
        </div>
    );
}
