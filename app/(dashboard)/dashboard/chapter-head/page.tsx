export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { getSession } from "@/services/auth";
import { getMyChapter } from "@/services/chapters";
import { listChapterMembers, listPendingMembers } from "@/services/memberships";
import { listMyChapterOpportunities } from "@/services/opportunities";
import { getProfileByUserId } from "@/services/profiles";
import type { ChapterMembership, UserProfile, VolunteerOpportunity } from "@/services/types";

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

/* ── Member row (enriched) ── */
type EnrichedMember = ChapterMembership & { profile?: UserProfile | null };

async function enrichMembers(members: ChapterMembership[]): Promise<EnrichedMember[]> {
  return Promise.all(
    members.map(async (m) => {
      let profile: UserProfile | null = null;
      try {
        profile = await getProfileByUserId(m.userId);
      } catch {
        /* profile may not exist */
      }
      return { ...m, profile };
    })
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    removed: "bg-red-50 text-red-600",
  };
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

/* ── Opportunity status badge ── */
function PublishBadge({ published }: { published: boolean }) {
  return (
    <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
      {published ? "Published" : "Draft"}
    </span>
  );
}

/* ── Section header ── */
function SectionHeader({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-manrope text-base font-bold text-ink">{title}</h2>
      <Link
        href={href}
        className="text-xs font-medium text-gray-400 transition hover:text-ink"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}

/* ── Main page ── */
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
  const totalCapacity = opportunities.reduce(
    (sum, opp) => sum + (opp.capacity ?? 0),
    0
  );
  const fillRate = totalCapacity > 0 ? Math.round((totalVolunteers / totalCapacity) * 100) : 0;
  const publishedCount = opportunities.filter((o) => o.published).length;

  /* Enrich last 5 members with profiles */
  const recentMembers = await enrichMembers(
    [...members]
      .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
      .slice(0, 5)
  );

  /* Last 5 opportunities */
  const recentOpps: VolunteerOpportunity[] = [...opportunities]
    .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        label="Chapter head"
        title="Overview"
        subtitle={chapter.name}
      />

      {/* ── Analytics Overview ── */}
      <div>
        <h2 className="mb-4 font-manrope text-lg font-bold text-ink">
          Analytics Overview
        </h2>
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
            helper={`${publishedCount} published`}
            icon={
              <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
                <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
                <path d="M3 10h18" stroke="currentColor" strokeWidth="1.7" />
                <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            }
          />
          <StatCard
            label="Volunteer fill rate"
            value={`${fillRate}%`}
            accent="sky"
            trend={`${fillRate}%`}
            helper={`${totalVolunteers} / ${totalCapacity || "∞"}`}
            icon={
              <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.7" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            }
          />
        </div>
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
                  d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            }
          />
        </div>
      </div>

      {/* ── Recent data rows ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Members */}
        <div className="space-y-3">
          <SectionHeader
            title="Recent Members"
            href="/dashboard/chapter-head/members"
          />
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {recentMembers.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                No members yet.
              </p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="py-2.5 pl-5 pr-3 text-xs font-semibold text-muted">Name</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-muted">Role</th>
                    <th className="px-3 py-2.5 text-xs font-semibold text-muted">Status</th>
                    <th className="py-2.5 pl-3 pr-5 text-xs font-semibold text-muted text-right">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMembers.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 last:border-0 transition hover:bg-gray-50/40">
                      <td className="py-3 pl-5 pr-3">
                        <p className="font-medium text-ink truncate max-w-[160px]">
                          {m.profile?.name ?? m.profile?.email ?? m.userId.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted capitalize">{m.role}</td>
                      <td className="px-3 py-3"><StatusBadge status={m.status} /></td>
                      <td className="py-3 pl-3 pr-5 text-xs text-muted text-right whitespace-nowrap">
                        {new Date(m.joinedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Opportunities */}
        <div className="space-y-3">
          <SectionHeader
            title="Recent Opportunities"
            href="/dashboard/chapter-head/opportunities"
          />
          <div className="space-y-2">
            {recentOpps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-5 py-8 text-center text-sm text-muted">
                No opportunities yet.
              </div>
            ) : (
              recentOpps.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink text-sm">{opp.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {new Date(opp.eventDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {opp.currentVolunteers}/{opp.capacity || "∞"} volunteers
                    </p>
                  </div>
                  <PublishBadge published={opp.published} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
