import Link from "next/link";
import { revalidatePath } from "next/cache";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { getSession } from "@/services/auth";
import { listPublicChapters } from "@/services/chapters";
import { listPublicOpportunities, joinOpportunity } from "@/services/opportunities";
import { toPublicDomainError } from "@/services/errorContract";
import type { VolunteerOpportunity } from "@/services/types";
import { type SearchParams, readParam, createRedirectBuilder } from "@/lib/pageHelpers";

const MANILA_TIMEZONE = "Asia/Manila";

type StatusFilter = "all" | "upcoming" | "past";

function parseDateValue(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
}

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: MANILA_TIMEZONE,
  }).format(date);
}

function getStatusFilter(searchParams: SearchParams): StatusFilter {
  const value = readParam(searchParams, "status");
  if (value === "upcoming" || value === "past") {
    return value;
  }
  return "all";
}

function getSdgColor(tag: string): string {
  const normalized = tag.toLowerCase();
  if (normalized.includes("health")) return "bg-[#4C9F38]";
  if (normalized.includes("education")) return "bg-[#C5192D]";
  if (normalized.includes("water")) return "bg-[#26BDE2]";
  if (normalized.includes("climate")) return "bg-[#3F7E44]";
  if (normalized.includes("cities")) return "bg-[#FD9D24]";
  if (normalized.includes("inequal")) return "bg-[#DD1367]";
  return "bg-orange-500";
}

const buildRedirect = createRedirectBuilder("/volunteer-opportunities");

async function joinOpportunityAction(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    const result = await joinOpportunity(id);
    const message =
      result === "waitlisted"
        ? "You have been added to the waitlist."
        : "You are now signed up.";
    revalidatePath("/volunteer-opportunities");
    buildRedirect("success", message);
  } catch (error) {
    const message = toPublicDomainError(
      error,
      "Unable to join this opportunity."
    ).message;
    buildRedirect("error", message);
  }
}


export const dynamic = "force-dynamic";

export default async function VolunteerOpportunitiesPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};

  const chapterId = readParam(searchParams, "chapterId")?.trim() || undefined;
  const sdg = readParam(searchParams, "sdg")?.trim() || undefined;
  const fromDateRaw = readParam(searchParams, "fromDate");
  const toDateRaw = readParam(searchParams, "toDate");
  const status = getStatusFilter(searchParams);
  const statusMessage = readParam(searchParams, "status");
  const message = readParam(searchParams, "message");
  const session = await getSession();
  const isAuthenticated = Boolean(session);

  const fromDate = parseDateValue(fromDateRaw);
  const toDate = parseDateValue(toDateRaw);

  let hasLoadError = false;
  let opportunities: VolunteerOpportunity[] = [];
  let chapters: Awaited<ReturnType<typeof listPublicChapters>> = [];
  let sdgOptions: string[] = [];

  try {
    const [result, chapterList, allOpportunities] = await Promise.all([
      listPublicOpportunities({
        chapterId,
        sdg,
        fromDate,
        toDate,
        status,
      }),
      listPublicChapters(),
      listPublicOpportunities(),
    ]);
    opportunities = result;
    chapters = chapterList;
    sdgOptions = [...new Set(allOpportunities.flatMap((item) => item.sdgs))].sort();
  } catch {
    hasLoadError = true;
  }

  return (
    <main className="pb-20">
        <section className="relative overflow-hidden pb-14 pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4da_0%,#ffffff_45%,#fdf6ef_100%)]"></div>
          <div className="grid-pattern pointer-events-none absolute inset-0 opacity-40"></div>
          <div className="mx-auto w-[92%] max-w-6xl">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600 shadow-soft">
              Opportunities
            </div>
            <h1 className="reveal mt-6 font-manrope text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.08]">
              Volunteer opportunities you can join
            </h1>
            <p className="reveal mt-4 max-w-2xl text-muted">
              Browse active opportunities by chapter, SDG focus, and date range.
              Dates are shown in Philippine time ({MANILA_TIMEZONE}).
            </p>
          </div>
        </section>

        <section className="mx-auto w-[92%] max-w-6xl">
          <form
            className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft md:p-6"
            method="get"
          >
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <label className="text-sm font-semibold text-ink">
                Chapter
                <select
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink"
                  name="chapterId"
                  defaultValue={chapterId ?? ""}
                >
                  <option value="">All chapters</option>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-ink">
                SDG tag
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink"
                  name="sdg"
                  defaultValue={sdg ?? ""}
                  list="sdg-options"
                  placeholder="e.g. Quality Education"
                />
                <datalist id="sdg-options">
                  {sdgOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>

              <label className="text-sm font-semibold text-ink">
                From date
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink"
                  name="fromDate"
                  type="date"
                  defaultValue={fromDateRaw ?? ""}
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                To date
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink"
                  name="toDate"
                  type="date"
                  defaultValue={toDateRaw ?? ""}
                />
              </label>

              <label className="text-sm font-semibold text-ink">
                Status
                <select
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink"
                  name="status"
                  defaultValue={status}
                >
                  <option value="all">All</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </label>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600"
                type="submit"
              >
                Apply filters
              </button>
              <Link
                className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                href="/volunteer-opportunities"
              >
                Reset
              </Link>
            </div>
          </form>

          {hasLoadError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Opportunities are temporarily unavailable. Please try again in a
              few minutes.
            </div>
          ) : null}

          <StatusBanner status={statusMessage} message={message} className="mt-6" />

          {!hasLoadError && opportunities.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
              No opportunities match your current filters.
            </div>
          ) : null}

          {!hasLoadError && opportunities.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {opportunities.map((opportunity) => (
                <article
                  key={opportunity.id}
                  className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
                >
                  <div className="h-28 rounded-2xl bg-[linear-gradient(135deg,#FFE9C7_0%,#FF7A1A_90%)]"></div>
                  <h2 className="mt-4 font-manrope text-xl font-semibold">
                    {opportunity.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted">{opportunity.description}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-orange-600">
                    {formatEventDate(opportunity.eventDate)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                    {opportunity.sdgs.length > 0 ? (
                      opportunity.sdgs.map((tag) => (
                        <span
                          key={`${opportunity.id}-${tag}`}
                          className={`rounded-full px-2 py-1 ${getSdgColor(tag)}`}
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-gray-400 px-2 py-1">No SDG tags</span>
                    )}
                  </div>
                  {(() => {
                    const capacity = Math.max(0, opportunity.capacity);
                    const current = Math.max(0, opportunity.currentVolunteers);
                    const hasCapacity = capacity > 0;
                    const isFull = hasCapacity && current >= capacity;
                    const ratio = hasCapacity ? Math.min(current / capacity, 1) : 0;
                    return (
                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs font-semibold text-ink">
                          <span>
                            {hasCapacity
                              ? `${current} / ${capacity} volunteers`
                              : `${current} volunteers`}
                          </span>
                          <span className="text-muted">
                            {hasCapacity
                              ? isFull
                                ? opportunity.waitlistEnabled
                                  ? "Waitlist open"
                                  : "Full"
                                : `${capacity - current} spots left`
                              : "Open"}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full bg-orange-500 transition-all"
                            style={{ width: `${Math.round(ratio * 100)}%` }}
                          />
                        </div>
                        {isAuthenticated ? (
                          <form action={joinOpportunityAction} className="mt-4">
                            <input type="hidden" name="id" value={opportunity.id} />
                            <button
                              type="submit"
                              className="w-full rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
                              disabled={isFull && !opportunity.waitlistEnabled}
                            >
                              {isFull
                                ? opportunity.waitlistEnabled
                                  ? "Join waitlist"
                                  : "Full"
                                : "Join opportunity"}
                            </button>
                          </form>
                        ) : (
                          <div className="mt-4">
                            <Link
                              href="/login"
                              className="block w-full rounded-full border border-orange-200 bg-white px-4 py-2 text-center text-sm font-semibold text-orange-600 shadow-soft transition hover:border-orange-300 hover:text-orange-700"
                            >
                              Sign in to join
                            </Link>
                            <p className="mt-2 text-center text-xs text-muted">
                              Create an account to join opportunities.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </article>
              ))}
            </div>
          ) : null}
        </section>
    </main>
  );
}
