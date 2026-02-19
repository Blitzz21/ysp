import { redirect } from "next/navigation";

import { getSession } from "@/services/auth";
import { listPublishedOpportunities } from "@/services/opportunities";
import { listPublicChapters } from "@/services/chapters";
import { toPublicDomainError } from "@/services/errorContract";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { OpportunitiesTable } from "./_components/OpportunitiesTable";
import type { VolunteerOpportunity, Chapter } from "@/services/types";

export const dynamic = "force-dynamic";

export default async function MemberOpportunitiesPage() {
    const session = await getSession();
    if (!session) redirect("/login?next=/dashboard/member/opportunities");

    let opportunities: VolunteerOpportunity[] = [];
    let chapters: Chapter[] = [];
    let loadError: string | null = null;

    try {
        const [opRows, chapterRows] = await Promise.all([
            listPublishedOpportunities(),
            listPublicChapters(),
        ]);
        opportunities = opRows;
        chapters = chapterRows;
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
                <OpportunitiesTable
                    opportunities={opportunities}
                    chapterNameById={chapterNameById}
                />
            )}
        </div>
    );
}
