import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/services/auth";
import { listPublicChapters } from "@/services/chapters";
import { toPublicDomainError } from "@/services/errorContract";
import { listMyMemberships } from "@/services/memberships";
import { listPublishedOpportunities } from "@/services/opportunities";
import { getMyProfile } from "@/services/profiles";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import type { Chapter, ChapterMembership } from "@/services/types";

export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/member");

  const isAdmin = session.role === "admin";
  const isChapterHead = session.role === "chapter_head";

  let loadError: string | null = null;
  const profile = await getMyProfile();
  let memberships: ChapterMembership[] = [];
  let chapters: Chapter[] = [];
  let opportunitiesCount = 0;

  try {
    const [membershipRows, chapterRows, oppRows] = await Promise.all([
      listMyMemberships(),
      listPublicChapters(),
      listPublishedOpportunities(),
    ]);
    memberships = membershipRows;
    chapters = chapterRows;
    opportunitiesCount = oppRows.length;
  } catch (error) {
    loadError = toPublicDomainError(error, "Unable to load dashboard data.").message;
  }

  const activeMemberships = memberships.filter(
    (m) => m.status === "active" || m.status === "pending",
  );
  const chapterNameById = new Map(chapters.map((c) => [c.id, c.name]));

  // Resolve the member's chapter: prefer assignedChapterId, fall back to first active membership
  const resolvedChapterId =
    profile.assignedChapterId ??
    activeMemberships.find((m) => m.status === "active")?.chapterId;
  const _resolvedChapterName = resolvedChapterId
    ? chapterNameById.get(resolvedChapterId) ?? "Assigned"
    : "None";

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        label="Member dashboard"
        title={`Welcome${profile.name ? `, ${profile.name}` : ""}`}
        subtitle="Manage your chapter connections and explore volunteer opportunities."
        actions={
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
              {profile.role ?? "member"}
            </span>
            <Link
              href="/settings"
              className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
            >
              Update profile
            </Link>
          </div>
        }
      />



      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Memberships"
          value={activeMemberships.length}
          accent="orange"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
              <circle cx="12" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
              <path d="M4.5 20c.8-3.2 3.8-5.5 7.5-5.5 3.8 0 6.8 2.3 7.5 5.5" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
        <StatCard
          label="Chapters"
          value={chapters.length}
          helper="Published chapters"
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
          helper="Volunteer opportunities"
          accent="sky"
          icon={
            <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
              <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.7" />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          }
        />
        <StatCard
          label="Assigned Chapter"
          value={
            profile.assignedChapterId
              ? chapterNameById.get(profile.assignedChapterId) ?? "Assigned"
              : "None"
          }
          accent="amber"
        />
      </div>

      {/* Quick-access cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent chapters summary — hidden for chapter heads */}
        {!isChapterHead && <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-manrope text-lg font-semibold text-ink">
                Your Memberships
              </h2>
              <p className="mt-1 text-xs text-muted">
                Recent chapter memberships and their status
              </p>
            </div>
            <Link
              href="/dashboard/member/chapters"
              className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-2.5">
            {memberships.length === 0 ? (
              <p className="text-sm text-muted">
                You have not joined any chapter yet.{" "}
                <Link
                  href="/dashboard/member/chapters"
                  className="font-semibold text-orange-600 hover:underline"
                >
                  Browse chapters →
                </Link>
              </p>
            ) : (
              memberships.slice(0, 4).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2"
                >
                  <span className="text-sm font-medium text-ink">
                    {chapterNameById.get(m.chapterId) ?? m.chapterId}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${m.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : m.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                      }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>}

        {/* Quick links */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="font-manrope text-lg font-semibold text-ink">
              Opportunities
            </h3>
            <p className="mt-1 text-xs text-muted">
              {opportunitiesCount} volunteer opportunities available
            </p>
            <Link
              href="/dashboard/member/opportunities"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
            >
              Explore opportunities
            </Link>
          </div>

          {isAdmin && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-manrope text-lg font-semibold text-ink">
                Switch dashboards
              </h3>
              <p className="mt-1 text-xs text-muted">
                Jump to the dashboards you can access.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/admin"
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                >
                  Admin console
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
