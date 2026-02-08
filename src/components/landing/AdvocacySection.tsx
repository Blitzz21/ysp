export function AdvocacySection() {
  return (
      <section className="py-20" id="advocacy">
          <div className="mx-auto w-[92%] max-w-6xl">
            <div className="grid gap-10 lg:grid-cols-[0.35fr_0.65fr] lg:items-center">
              <div className="reveal">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600">
                  YSP Advocacy Pillars
                </p>
                <h2 className="mt-4 font-manrope text-3xl font-bold text-navy md:text-4xl">
                  YSP Advocacy Pillars
                </h2>
              </div>
              <div className="advocacy-tiles-bento">
                <div className="advocacy-tiles-grid grid gap-6 grid-cols-2">
                <div className="reveal flex flex-col items-center rounded-3xl border border-orange-500/20 bg-white p-5 text-center shadow-soft">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="currentColor" aria-hidden="true">
                      <path d="M13 26l8 8h4l7-7 4 1 4-4-8-9-6 2-5-5H17l-6 6 6 8zM6 18l8 10 5-4-6-8-7 2zM30 16l6 6 5-5-7-7-4 3z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Citizenship &amp; Governance
                  </p>
                </div>
                <div className="reveal flex flex-col items-center rounded-3xl border border-orange-500/20 bg-white p-5 text-center shadow-soft">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="currentColor" aria-hidden="true">
                      <path d="M24 6c7 0 14 6 14 14 0 8-7 14-14 14S10 28 10 20c0-8 7-14 14-14zm9 6c-4 2-8 7-8 12 0 5 4 9 8 10-2 4-6 8-9 8-6 0-12-6-12-12 0-7 9-14 21-18z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Ecological Sustainability
                  </p>
                </div>
                <div className="reveal flex flex-col items-center rounded-3xl border border-orange-500/20 bg-white p-5 text-center shadow-soft">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="currentColor" aria-hidden="true">
                      <path d="M6 18l18-10 18 10-18 10-18-10zm5 8l13 7 13-7v6l-13 7-13-7v-6z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Learning &amp; Development
                  </p>
                </div>
                <div className="reveal flex flex-col items-center rounded-3xl border border-orange-500/20 bg-white p-5 text-center shadow-soft">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600">
                    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="currentColor" aria-hidden="true">
                      <path d="M10 28c4 0 8-4 10-8 2 3 5 5 8 5 5 0 10-6 10-10 0-2-2-4-4-4-4 0-7 4-9 7-2-3-5-5-8-5-5 0-10 6-10 10 0 2 2 5 3 5zM8 34c0 4 4 8 8 8h16c4 0 8-4 8-8v-4H8v4z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                    Humanitarian Service
                  </p>
                </div>
                </div>
              </div>
            </div>

          <div className="mt-12 border-t border-gray-200 pt-12 text-center">
            <h3 className="font-manrope text-2xl font-bold text-orange-600 md:text-3xl">
              Key Programs &amp; Initiatives
            </h3>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="reveal relative overflow-hidden rounded-3xl border border-orange-500/30 bg-[linear-gradient(135deg,#FF7A1A_0%,#F24A00_55%,#F7A04A_100%)] p-7 text-white shadow-glow">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"></div>
              <h4 className="font-manrope text-2xl font-bold">Project Indigo</h4>
              <p className="mt-3 text-sm text-white/90">
                Mini libraries for peace education and health awareness in
                Indigenous People (IP) communities in the Philippines.
              </p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Implementation areas
              </p>
              <p className="mt-2 text-sm text-white/90">
                Talaingod, Davao del Norte, and Zamboanga.
              </p>
            </article>
            <article className="reveal relative overflow-hidden rounded-3xl border border-orange-500/30 bg-[linear-gradient(135deg,#FFB457_0%,#FF7A1A_55%,#F24A00_100%)] p-7 text-white shadow-glow">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-white/10"></div>
              <h4 className="font-manrope text-2xl font-bold">Tabang Ta Bai</h4>
              <p className="mt-3 text-sm text-white/90">
                The Tabang Ta Bai Donation Drive, initiated by CoXister
                Philippines and Youth Service Philippines, partners with national
                organizations including the Philippine Air Force.
              </p>
              <p className="mt-4 text-sm text-white/90">
                It provides immediate relief and health-related benefits to over a
                thousand people in calamity-affected areas.
              </p>
            </article>
          </div>
        </div>
      </section>

  );
}

