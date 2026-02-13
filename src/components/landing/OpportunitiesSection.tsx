import Link from "next/link";

import { listPublicChapters } from "@/services/chapters";
import { listPublicOpportunities } from "@/services/opportunities";

const MANILA_TIMEZONE = "Asia/Manila";

function formatEventDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: MANILA_TIMEZONE,
  }).format(date);
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

export async function OpportunitiesSection() {
  let hasLoadError = false;
  let opportunities: Awaited<ReturnType<typeof listPublicOpportunities>> = [];
  let chapterNameById = new Map<string, string>();

  try {
    const [publicOpportunities, publicChapters] = await Promise.all([
      listPublicOpportunities(),
      listPublicChapters(),
    ]);
    opportunities = publicOpportunities.slice(0, 3);
    chapterNameById = new Map(publicChapters.map((chapter) => [chapter.id, chapter.name]));
  } catch {
    // Keep page render-safe when Appwrite env is not available in CI/dev.
    hasLoadError = true;
  }

  return (
    <section className="py-20" id="opportunities">
      <div className="mx-auto w-[92%] max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-manrope text-3xl font-bold md:text-4xl">
              Volunteer opportunities live right now.
            </h2>
            <p className="mt-3 text-muted">
              Chapter heads create opportunities, admins approve, and the public
              joins. Verified and ready to mobilize.
            </p>
          </div>
          <Link
            className="rounded-full border border-orange-500 px-5 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-500 hover:text-white"
            href="/volunteer-opportunities"
          >
            See all opportunities
          </Link>
        </div>

        {hasLoadError ? (
          <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
            Opportunities preview is unavailable right now.
          </div>
        ) : null}

        {!hasLoadError && opportunities.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
            No published opportunities yet. Check back soon.
          </div>
        ) : null}

        {!hasLoadError && opportunities.length > 0 ? (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opportunity, index) => (
              <article
                key={opportunity.id}
                className="reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
              >
                <div
                  className={`h-32 rounded-2xl ${
                    index % 3 === 1
                      ? "bg-[linear-gradient(135deg,#F7F8FA_0%,#FFCF3D_90%)]"
                      : "bg-[linear-gradient(135deg,#FFE9C7_0%,#FF7A1A_90%)]"
                  }`}
                ></div>
                <div className="mt-4 flex items-center justify-between text-xs font-semibold text-muted">
                  <span>{chapterNameById.get(opportunity.chapterId) ?? "YSP Chapter"}</span>
                  <span className="rounded-full bg-orange-500/10 px-3 py-1 text-orange-600">
                    Live
                  </span>
                </div>
                <h3 className="mt-3 font-manrope text-lg font-semibold">
                  {opportunity.title}
                </h3>
                <p className="mt-2 text-sm text-muted">
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
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
