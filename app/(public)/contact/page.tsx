import { getSiteSettings } from "@/services/settings";

export const dynamic = "force-dynamic";

function normalizePhone(value?: string): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export default async function ContactPage() {
  let hasLoadError = false;
  let settings: Awaited<ReturnType<typeof getSiteSettings>> = {};

  try {
    settings = await getSiteSettings();
  } catch {
    hasLoadError = true;
  }

  const email = settings.email ?? null;
  const mobile = normalizePhone(settings.mobile);
  const facebookUrl = settings.facebookUrl ?? null;
  const membershipFormUrl = settings.membershipFormUrl ?? null;
  const createChapterFormUrl = settings.createChapterFormUrl ?? null;

  const hasAnyContactData = Boolean(
    email || mobile || facebookUrl || membershipFormUrl || createChapterFormUrl
  );

  return (
    <main className="pb-20">
        <section className="relative overflow-hidden pb-14 pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4da_0%,#ffffff_45%,#fdf6ef_100%)]"></div>
          <div className="grid-pattern pointer-events-none absolute inset-0 opacity-40"></div>
          <div className="mx-auto w-[92%] max-w-6xl">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600 shadow-soft">
              Contact
            </div>
            <h1 className="reveal mt-6 font-manrope text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.08]">
              Reach the YSP team
            </h1>
            <p className="reveal mt-4 max-w-2xl text-muted">
              Public contact channels and form links are managed from site
              settings. This page renders those values directly.
            </p>
          </div>
        </section>

        <section className="mx-auto w-[92%] max-w-6xl">
          {hasLoadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              We cannot load contact settings right now. Please try again later.
            </div>
          ) : null}

          {!hasLoadError && !hasAnyContactData ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
              Contact details are not configured yet.
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h2 className="font-manrope text-lg font-semibold">Email</h2>
              {email ? (
                <a
                  className="mt-3 block text-sm text-orange-600 underline"
                  href={`mailto:${email}`}
                >
                  {email}
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted">Not set</p>
              )}
            </article>

            <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h2 className="font-manrope text-lg font-semibold">Mobile</h2>
              {mobile ? (
                <a
                  className="mt-3 block text-sm text-orange-600 underline"
                  href={`tel:${mobile}`}
                >
                  {mobile}
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted">Not set</p>
              )}
            </article>

            <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h2 className="font-manrope text-lg font-semibold">Facebook</h2>
              {facebookUrl ? (
                <a
                  className="mt-3 block text-sm text-orange-600 underline"
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open page
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted">Not set</p>
              )}
            </article>

            <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h2 className="font-manrope text-lg font-semibold">Membership form</h2>
              {membershipFormUrl ? (
                <a
                  className="mt-3 block text-sm text-orange-600 underline"
                  href={membershipFormUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open form
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted">Not set</p>
              )}
            </article>

            <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h2 className="font-manrope text-lg font-semibold">Create chapter form</h2>
              {createChapterFormUrl ? (
                <a
                  className="mt-3 block text-sm text-orange-600 underline"
                  href={createChapterFormUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open form
                </a>
              ) : (
                <p className="mt-3 text-sm text-muted">Not set</p>
              )}
            </article>
          </div>
        </section>
    </main>
  );
}
