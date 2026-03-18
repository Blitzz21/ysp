import Link from "next/link";

import { listAdminAuditLog, type AdminAuditEntry } from "@/services/adminAudit";
import { adminListChapters } from "@/services/chapters";
import { adminListOpportunities } from "@/services/opportunities";
import { adminListPrograms } from "@/services/programs";
import { getSiteStats } from "@/services/stats";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import type { Program, Chapter, VolunteerOpportunity } from "@/services/types";

const MANILA_TIMEZONE = "Asia/Manila";

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeZone: MANILA_TIMEZONE,
  }).format(date);
}

export default async function AdminHomePage() {
  let programsCount = 0;
  let chaptersCount = 0;
  let opportunitiesCount = 0;
  let draftsCount = 0;
  let programs: Program[] = [];
  let chapters: Chapter[] = [];
  let opportunities: VolunteerOpportunity[] = [];
  let stats = {
    projectsCount: 0,
    chaptersCount: 0,
    membersCount: 0,
    livesImpactedCount: 0,
  };
  let recentActivity: AdminAuditEntry[] = [];
  let hasDataIssue = false;

  try {
    const [programsData, chaptersData, opportunitiesData, siteStats, auditEntries] = await Promise.all([
      adminListPrograms({ includeDrafts: true }),
      adminListChapters(),
      adminListOpportunities({ includeDrafts: true }),
      getSiteStats(),
      listAdminAuditLog({ limit: 15 }),
    ]);
    programs = programsData;
    chapters = chaptersData;
    opportunities = opportunitiesData;
    programsCount = programs.length;
    chaptersCount = chapters.length;
    opportunitiesCount = opportunities.length;
    draftsCount =
      programs.filter((item) => !item.published).length +
      opportunities.filter((item) => !item.published).length;
    stats = siteStats;
    recentActivity = auditEntries;
  } catch {
    hasDataIssue = true;
  }

  const recentPrograms = programs.slice(0, 5);
  const recentChapters = chapters.slice(0, 5);
  const recentOpportunities = opportunities.slice(0, 5);

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

      {!hasDataIssue ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Programs List */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-manrope text-sm font-semibold text-ink">Programs</h3>
              <Link href="/admin/programs" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                View all
              </Link>
            </div>
            {recentPrograms.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No programs yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {recentPrograms.map((program) => (
                  <li key={program.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{program.title}</p>
                      <p className="truncate text-xs text-muted">{program.description}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        program.published
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {program.published ? "Published" : "Draft"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Chapters List */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-manrope text-sm font-semibold text-ink">Chapters</h3>
              <Link href="/admin/chapters" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                View all
              </Link>
            </div>
            {recentChapters.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No chapters yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {recentChapters.map((chapter) => (
                  <li key={chapter.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{chapter.name}</p>
                      <p className="truncate text-xs text-muted">{chapter.location ?? "Philippines"}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        chapter.published
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {chapter.published ? "Active" : "Draft"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Opportunities List */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h3 className="font-manrope text-sm font-semibold text-ink">Opportunities</h3>
              <Link href="/admin/opportunities" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                View all
              </Link>
            </div>
            {recentOpportunities.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No opportunities yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-gray-100">
                {recentOpportunities.map((opp) => (
                  <li key={opp.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{opp.title}</p>
                      <p className="truncate text-xs text-muted">{formatEventDate(opp.eventDate)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        opp.published
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {opp.published ? "Published" : "Draft"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {/* Recent Activity */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h3 className="font-manrope text-sm font-semibold text-ink">Recent Activity</h3>
          <Link href="/admin/logs" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
            View all
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="mt-4 text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-gray-100">
            {recentActivity.map((entry, i) => (
              <li key={`${entry.createdAt}-${i}`} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    <span className="font-medium">{entry.action.replace(".", " → ")}</span>
                    {entry.targetLabel ? ` — ${entry.targetLabel}` : ""}
                  </p>
                  <p className="text-xs text-muted">
                    {entry.actorRole} · {entry.actorId.slice(0, 8)}...
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted">
                  {formatEventDate(entry.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
