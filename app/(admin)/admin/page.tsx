import Link from "next/link";

import { adminListChapters } from "@/services/chapters";
import { adminListOpportunities } from "@/services/opportunities";
import { adminListPrograms } from "@/services/programs";
import { getSiteStats } from "@/services/stats";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";

export default async function AdminHomePage() {
  let programsCount = 0;
  let chaptersCount = 0;
  let opportunitiesCount = 0;
  let draftsCount = 0;
  let stats = {
    projectsCount: 0,
    chaptersCount: 0,
    membersCount: 0,
    livesImpactedCount: 0,
  };
  let hasDataIssue = false;

  try {
    const [programs, chapters, opportunities, siteStats] = await Promise.all([
      adminListPrograms({ includeDrafts: true }),
      adminListChapters(),
      adminListOpportunities({ includeDrafts: true }),
      getSiteStats(),
    ]);
    programsCount = programs.length;
    chaptersCount = chapters.length;
    opportunitiesCount = opportunities.length;
    draftsCount =
      programs.filter((item) => !item.published).length +
      opportunities.filter((item) => !item.published).length;
    stats = siteStats;
  } catch {
    hasDataIssue = true;
  }

  return (
    <section className="space-y-8">
      <PageHeader
        label="Admin"
        title="Overview"
        subtitle="Track operational counts and jump directly to management workflows."
      />

      {hasDataIssue ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Dashboard metrics are temporarily unavailable. Please confirm admin access and
          service connectivity.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Programs"
          value={programsCount}
          helper={`${stats.projectsCount} public counter value`}
          accent="orange"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M5 4h14a1 1 0 0 1 1 1v14l-4-2-4 2-4-2-4 2V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
        <StatCard
          label="Chapters"
          value={chaptersCount}
          helper={`${stats.chaptersCount} public counter value`}
          accent="emerald"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M12 21s7-4.35 7-10a7 7 0 0 0-14 0c0 5.65 7 10 7 10Z" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
        <StatCard
          label="Opportunities"
          value={opportunitiesCount}
          helper={`${draftsCount} total drafts pending review`}
          accent="sky"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
        <StatCard
          label="Members"
          value={stats.membersCount}
          helper="Configured in public site stats"
          accent="amber"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
              <circle cx="12" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M4.5 20c.8-3.2 3.8-5.5 7.5-5.5 3.8 0 6.8 2.3 7.5 5.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/programs"
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Manage programs
        </Link>
        <Link
          href="/admin/chapters"
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Manage chapters
        </Link>
        <Link
          href="/admin/opportunities"
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
        >
          Manage opportunities
        </Link>
      </div>
    </section>
  );
}
