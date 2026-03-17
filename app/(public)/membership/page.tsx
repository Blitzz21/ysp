import Link from "next/link";

import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

function toGoogleEmbedUrl(url?: string): string | null {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const isGoogleForms =
      parsed.hostname.includes("docs.google.com") &&
      parsed.pathname.includes("/forms/");

    if (!isGoogleForms) return null;

    if (parsed.pathname.endsWith("/viewform")) {
      parsed.searchParams.set("embedded", "true");
      return parsed.toString();
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export default async function MembershipPage() {
  let hasLoadError = false;
  let settings: Awaited<ReturnType<typeof getSiteSettings>> = {};

  try {
    settings = await getSiteSettings();
  } catch {
    hasLoadError = true;
  }

  const membershipFormUrl = settings.membershipFormUrl;
  const createChapterFormUrl = settings.createChapterFormUrl;
  const embedUrl = toGoogleEmbedUrl(membershipFormUrl);
  const hasAnyForm = Boolean(membershipFormUrl || createChapterFormUrl);

  return (
    <main className="pb-20">
        <section className="relative overflow-hidden pb-14 pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4da_0%,#ffffff_45%,#fdf6ef_100%)]"></div>
          <div className="mx-auto w-[92%] max-w-6xl">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600 shadow-soft">
              Membership
            </div>
            <h1 className="reveal mt-6 font-manrope text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.08]">
              Join the YSP network
            </h1>
            <p className="reveal mt-4 max-w-2xl text-muted">
              Register as a member or start a chapter in your city using the
              official form links managed by the admin team.
            </p>
          </div>
        </section>

        <section className="mx-auto grid w-[92%] max-w-6xl gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="reveal rounded-3xl border border-gray-200 bg-white p-4 shadow-soft md:p-6">
            {hasLoadError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                Membership settings are temporarily unavailable. Please try
                again in a few minutes.
              </div>
            ) : null}

            {!hasLoadError && !hasAnyForm ? (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted">
                Membership form is not configured yet. Please check back later
                or contact the YSP team.
              </div>
            ) : null}

            {!hasLoadError && hasAnyForm && embedUrl ? (
              <iframe
                title="YSP membership form"
                src={embedUrl}
                className="h-[880px] w-full rounded-2xl border border-gray-200"
                loading="lazy"
              />
            ) : null}

            {!hasLoadError && hasAnyForm && !embedUrl && membershipFormUrl ? (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center">
                <p className="text-sm text-muted">
                  The form link is available but cannot be embedded on this
                  page.
                </p>
                <a
                  className="mt-5 inline-flex rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow"
                  href={membershipFormUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open membership form
                </a>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <article className="reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h2 className="font-manrope text-xl font-semibold">Start a chapter</h2>
              <p className="mt-3 text-sm text-muted">
                Bring YSP programs to your community with guided onboarding.
              </p>
              {createChapterFormUrl ? (
                <a
                  className="mt-5 inline-flex rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white"
                  href={createChapterFormUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open chapter form
                </a>
              ) : (
                <p className="mt-5 text-sm text-muted">
                  Chapter form is not configured yet.
                </p>
              )}
            </article>
            <article className="reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h2 className="font-manrope text-xl font-semibold">Need help?</h2>
              <p className="mt-3 text-sm text-muted">
                If forms are unavailable, use the Contact page and the team will
                guide your onboarding.
              </p>
              <Link
                className="mt-5 inline-flex rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                href="/contact"
              >
                Go to contact page
              </Link>
            </article>
          </aside>
        </section>
    </main>
  );
}
