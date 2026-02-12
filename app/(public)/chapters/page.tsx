import Link from "next/link";
import { listChapters } from "@/services/chapters";

export const dynamic = "force-dynamic";

export default async function ChaptersPage() {
  const chapters = await listChapters();
  return (
    <main className="pb-20">
        <section className="relative overflow-hidden pb-14 pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4da_0%,#ffffff_45%,#fdf6ef_100%)]"></div>
          <div className="grid-pattern pointer-events-none absolute inset-0 opacity-40"></div>
          <div className="mx-auto w-[92%] max-w-6xl">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600 shadow-soft">
              Chapters
            </div>
            <h1 className="reveal mt-6 font-manrope text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.08]">
              Chapters across the Philippines
            </h1>
            <p className="reveal mt-4 max-w-2xl text-muted">
              Find a local chapter to volunteer with, or explore opportunities
              to launch one in your city.
            </p>
          </div>
        </section>

        <section className="mx-auto w-[92%] max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-manrope text-2xl font-semibold">
                Active chapter network
              </h2>
              <p className="mt-2 text-sm text-muted">
                Connect with chapter leads to join service initiatives.
              </p>
            </div>
            <div className="flex w-full max-w-sm items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-muted shadow-soft">
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Search
              </span>
              <input
                className="w-full bg-transparent text-sm text-ink outline-none"
                placeholder="Search by city or focus"
                aria-label="Search chapters"
              />
            </div>
          </div>

          {chapters.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
              No chapters are published yet. Check back soon.
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {chapters.map((chapter) => (
                <article
                  key={chapter.id}
                  className="reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-muted">
                    <span>{chapter.location ?? "Philippines"}</span>
                    <span className="rounded-full bg-orange-500/10 px-3 py-1 text-orange-600">
                      {chapter.published ? "Active" : "Draft"}
                    </span>
                  </div>
                  <h3 className="mt-4 font-manrope text-xl font-semibold">
                    {chapter.name}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    {chapter.contactEmail || chapter.contactPhone
                      ? `Contact: ${chapter.contactEmail ?? chapter.contactPhone}`
                      : "Chapter profile is live. Reach out to join local activities."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                      href="/membership"
                    >
                      Join chapter
                    </Link>
                    <Link
                      className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
                      href="/membership"
                    >
                      Start a chapter
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
    </main>
  );
}
