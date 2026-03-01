export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { getSession } from "@/services/auth";
import { getMyChapter } from "@/services/chapters";
import { listChapterMembers, listPendingMembers } from "@/services/memberships";
import { listMyChapterOpportunities } from "@/services/opportunities";

/* ── Quick-action card ── */
function ActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors group-hover:bg-orange-50 group-hover:text-orange-600">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-manrope text-sm font-semibold text-ink group-hover:text-orange-600 transition-colors">
          {title}
        </h3>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <svg
        className="mt-0.5 h-4 w-4 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-orange-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

export default async function ChapterHeadOverview() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/chapter-head");
  }

  const [chapter, members, pendingMembers, opportunities] = await Promise.all([
    getMyChapter(),
    listChapterMembers(),
    listPendingMembers(),
    listMyChapterOpportunities(),
  ]);

  const activeMembers = members.filter((m) => m.status === "active");
  const totalVolunteers = opportunities.reduce(
    (sum, opp) => sum + (opp.currentVolunteers ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <PageHeader
        label="Chapter head"
        title="Overview"
        subtitle={chapter.name}
      />

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active members"
          value={activeMembers.length}
          accent="orange"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
              <circle cx="12" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M4.5 20c.8-3.2 3.8-5.5 7.5-5.5 3.8 0 6.8 2.3 7.5 5.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
        <StatCard
          label="Pending requests"
          value={pendingMembers.length}
          accent="amber"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          }
        />
        <StatCard
          label="Opportunities"
          value={opportunities.length}
          accent="emerald"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
        <StatCard
          label="Total volunteers"
          value={totalVolunteers}
          accent="sky"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
          Quick actions
        </h2>
        <div className="grid gap-3 md:grid-cols-3">
          <ActionCard
            href="/dashboard/chapter-head/opportunities"
            title="Manage opportunities"
            description="Create, edit, and manage volunteer opportunities for your chapter."
            icon={
              <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            }
          />
          <ActionCard
            href="/dashboard/chapter-head/members"
            title="Manage members"
            description="Approve requests, assign officers, and manage chapter members."
            icon={
              <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
                <circle cx="12" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4.5 20c.8-3.2 3.8-5.5 7.5-5.5 3.8 0 6.8 2.3 7.5 5.5" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            }
          />
          <ActionCard
            href="/dashboard/chapter-head/settings"
            title="Chapter settings"
            description="Update contact details and manage chapter ownership."
            icon={
              <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
                <path
                  d="m9.5 3 .8 2.2 2.3.5 1.6-1.6 2.2 1.3-.7 2.2 1.7 1.7 2.2-.7 1.2 2.2-1.6 1.6.5 2.3 2.2.8v2.5l-2.2.8-.5 2.3 1.6 1.6-1.2 2.2-2.2-.7-1.7 1.7.7 2.2-2.2 1.3-1.6-1.6-2.3.5-.8 2.2H7l-.8-2.2-2.3-.5-1.6 1.6-2.2-1.3.7-2.2-1.7-1.7-2.2.7-1.2-2.2 1.6-1.6-.5-2.3-2.2-.8v-2.5l2.2-.8.5-2.3-1.6-1.6 1.2-2.2 2.2.7 1.7-1.7-.7-2.2 2.2-1.3 1.6 1.6 2.3-.5.8-2.2h2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
              </svg>
            }
          />
        </div>
      </div>
    </div>
  );
}
