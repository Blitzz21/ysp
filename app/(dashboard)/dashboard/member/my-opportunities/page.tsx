export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { getSession } from "@/services/auth";
import { getMyJoinedOpportunities } from "@/services/opportunities";
import { listPublicChapters } from "@/services/chapters";
import { toPublicDomainError } from "@/services/errorContract";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MyOpportunitiesGrid, type JoinedOpportunityItem } from "./_components/MyOpportunitiesGrid";

export default async function MyOpportunitiesPage() {
    const session = await getSession();
    if (!session) redirect("/login?next=/dashboard/member/my-opportunities");

    let items: JoinedOpportunityItem[] = [];
    let loadError: string | null = null;

    try {
        const [joined, chapters] = await Promise.all([
            getMyJoinedOpportunities(),
            listPublicChapters(),
        ]);
        const chapterNameById = new Map(chapters.map((c) => [c.id, c.name]));

        items = joined.map((entry) => ({
            opportunity: entry.opportunity,
            signupStatus: entry.signupStatus,
            joinedAt: entry.joinedAt,
            chapterName: chapterNameById.get(entry.opportunity.chapterId) ?? "—",
        }));
    } catch (error) {
        loadError = toPublicDomainError(error, "Unable to load your opportunities.").message;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                label="Member dashboard"
                title="My Opportunities"
                subtitle="Opportunities you've joined or are waitlisted for."
            />

            {loadError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                    {loadError}
                </div>
            ) : (
                <MyOpportunitiesGrid items={items} />
            )}
        </div>
    );
}
