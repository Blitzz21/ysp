import Link from "next/link";

import { adminListChapters } from "@/services/chapters";
import { adminListOpportunities } from "@/services/opportunities";
import { adminListPrograms } from "@/services/programs";
import { getSiteStats } from "@/services/stats";

type DashboardCard = {
  label: string;
  value: number;
  helper: string;
};

function SummaryCard({ card }: { card: DashboardCard }) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">{card.label}</p>
      <p className="mt-2 font-manrope text-3xl font-bold text-navy">{card.value}</p>
      <p className="mt-1 text-xs text-muted">{card.helper}</p>
    </article>
  );
}

export default async function AdminHomePage() {
  let programsCount = 0;
  let chaptersCount = 0;
  let opportunitiesCount = 0;
  let draftsCount = 0;
  let stats = { projectsCount: 0, chaptersCount: 0, membersCount: 0 };
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

  const cards: DashboardCard[] = [
    {
      label: "Programs",
      value: programsCount,
      helper: `${stats.projectsCount} public counter value`,
    },
    {
      label: "Chapters",
      value: chaptersCount,
      helper: `${stats.chaptersCount} public counter value`,
    },
    {
      label: "Opportunities",
      value: opportunitiesCount,
      helper: `${draftsCount} total drafts pending review`,
    },
    {
      label: "Members",
      value: stats.membersCount,
      helper: "Configured in public site stats",
    },
  ];

  return (
    <section>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-600">Admin</p>
          <h1 className="mt-2 font-manrope text-4xl font-bold text-navy">Overview</h1>
          <p className="mt-2 max-w-2xl text-muted">
            Track operational counts and jump directly to management workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/programs"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
          >
            Manage programs
          </Link>
          <Link
            href="/admin/chapters"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
          >
            Manage chapters
          </Link>
          <Link
            href="/admin/opportunities"
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
          >
            Manage opportunities
          </Link>
        </div>
      </div>

      {hasDataIssue ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Dashboard metrics are temporarily unavailable. Please confirm admin access and
          service connectivity.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SummaryCard key={card.label} card={card} />
        ))}
      </div>
    </section>
  );
}
