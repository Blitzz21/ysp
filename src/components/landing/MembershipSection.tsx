export function MembershipSection() {
  return (
      <section className="py-20" id="membership">
        <div className="mx-auto w-[92%] max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div
              className="reveal relative overflow-hidden rounded-[32px] border border-orange-500/30 bg-[linear-gradient(135deg,rgba(255,122,26,0.18),rgba(255,207,61,0.3))] p-8 shadow-soft"
            >
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-orange-500/20"></div>
              <h3 className="font-manrope text-2xl font-semibold">
                Start a chapter in your city.
              </h3>
              <p className="mt-3 text-muted">
                Launch with mentorship, program playbooks, and national visibility.
                Build youth-led teams that move fast and deliver measurable impact.
              </p>
              <ul className="mt-5 grid gap-3 text-sm text-muted">
                <li>Guided onboarding and launch checklists</li>
                <li>Ready-to-run programs and templates</li>
                <li>Featured placements on the public site</li>
              </ul>
              <a
                className="mt-6 inline-flex rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-600"
                href="#membership"
                >Start a Chapter</a
              >
            </div>
            <div className="reveal join-card p-8 text-white shadow-soft">
              <div className="join-card__content">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-400">
                  Membership
                </p>
                <h3 className="mt-4 font-manrope text-2xl font-semibold text-white">
                  Join as a Member
                </h3>
                <p className="mt-3 text-sm text-white/70">
                  Plug into national missions, earn service hours, and join a
                  verified network of youth volunteers.
                </p>
                <a
                  className="mt-6 inline-flex rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-600"
                  href="#membership"
                  >Join the Network</a
                >
              </div>
              <div className="join-lines" aria-hidden="true">
                <span className="join-line join-line--outline">Join us!</span>
                <span className="join-line join-line--outline">Join us!</span>
                <span className="join-line join-line--outline">Join us!</span>
                <span className="join-line join-line--hero">Join us!</span>
                <span className="join-line join-line--outline">Join us!</span>
                <span className="join-line join-line--outline">Join us!</span>
                <span className="join-line join-line--outline">Join us!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

  );
}

