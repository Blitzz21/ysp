export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { getSession } from "@/services/auth";
import { getMyChapter } from "@/services/chapters";
import { listChapterMembers, listPendingMembers } from "@/services/memberships";
import { listMyChapterOpportunities } from "@/services/opportunities";

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

  const linkClass =
    "inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-orange-300 hover:text-orange-600";

  return (
    <div className="space-y-8">
      <PageHeader
        label="Chapter head"
        title="Overview"
        subtitle={chapter.name}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Members"
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
          label="Pending Requests"
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
          label="Total Volunteers"
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

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="font-manrope text-lg font-semibold text-ink">Manage Opportunities</h2>
          <p className="mt-2 text-sm text-muted">
            Create, edit, and manage volunteer opportunities for your chapter.
          </p>
          <Link href="/dashboard/chapter-head/opportunities" className={`${linkClass} mt-4`}>
            Go to Opportunities
          </Link>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="font-manrope text-lg font-semibold text-ink">Manage Members</h2>
          <p className="mt-2 text-sm text-muted">
            Approve requests, assign officers, and manage your chapter members.
          </p>
          <Link href="/dashboard/chapter-head/members" className={`${linkClass} mt-4`}>
            Go to Members
          </Link>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="font-manrope text-lg font-semibold text-ink">Chapter Settings</h2>
          <p className="mt-2 text-sm text-muted">
            Update contact details and manage chapter ownership.
          </p>
          <Link href="/dashboard/chapter-head/settings" className={`${linkClass} mt-4`}>
            Go to Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
