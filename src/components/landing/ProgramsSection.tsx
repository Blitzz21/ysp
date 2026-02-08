export function ProgramsSection() {
  return (
      <section className="py-20" id="programs">
        <div className="mx-auto w-[92%] max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="font-manrope text-3xl font-bold md:text-4xl">
                Programs built to scale youth action.
              </h2>
              <p className="mt-3 text-muted">
                Admin-led programs aligned with the SDGs, designed for chapter
                adoption and measurable community impact.
              </p>
            </div>
            <a
              className="rounded-full border border-orange-500 px-5 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-500 hover:text-white"
              href="#programs"
              >Browse all programs</a
            >
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <article className="reveal group rounded-3xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-2 hover:shadow-glow">
              <div className="h-36 rounded-2xl bg-[linear-gradient(135deg,#F7F8FA_0%,#FFCF3D_100%)]"></div>
              <h3 className="mt-4 font-manrope text-lg font-semibold">
                Coastal Cleanup Command
              </h3>
              <p className="mt-2 text-sm text-muted">
                Rapid-response shoreline cleanups with youth teams and partner
                LGUs.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                <span className="rounded-full bg-[#0A97D9] px-2 py-1">Life Below Water</span>
                <span className="rounded-full bg-[#3F7E44] px-2 py-1">Climate Action</span>
              </div>
            </article>
            <article className="reveal group rounded-3xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-2 hover:shadow-glow">
              <div className="h-36 rounded-2xl bg-[linear-gradient(135deg,#FFF6DA_0%,#FF7A1A_100%)]"></div>
              <h3 className="mt-4 font-manrope text-lg font-semibold">
                Community Learning Sprints
              </h3>
              <p className="mt-2 text-sm text-muted">
                Short-format learning sessions for students in underserved
                barangays.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                <span className="rounded-full bg-[#C5192D] px-2 py-1">Quality Education</span>
                <span className="rounded-full bg-[#DD1367] px-2 py-1">Reduced Inequalities</span>
              </div>
            </article>
            <article className="reveal group rounded-3xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-2 hover:shadow-glow">
              <div className="h-36 rounded-2xl bg-[linear-gradient(135deg,#F7F8FA_0%,#FFCF3D_70%)]"></div>
              <h3 className="mt-4 font-manrope text-lg font-semibold">
                Youth Livelihood Labs
              </h3>
              <p className="mt-2 text-sm text-muted">
                Skill-building tracks that turn ideas into community-run micro
                projects.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                <span className="rounded-full bg-[#A21942] px-2 py-1">Decent Work</span>
                <span className="rounded-full bg-[#FD6925] px-2 py-1">Innovation</span>
              </div>
            </article>
            <article className="reveal group rounded-3xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-2 hover:shadow-glow">
              <div className="h-36 rounded-2xl bg-[linear-gradient(135deg,#F7F8FA_0%,#FF7A1A_100%)]"></div>
              <h3 className="mt-4 font-manrope text-lg font-semibold">
                Safe Cities Activation
              </h3>
              <p className="mt-2 text-sm text-muted">
                Youth-led safety audits and community response initiatives in
                urban zones.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                <span className="rounded-full bg-[#FD9D24] px-2 py-1">Sustainable Cities</span>
                <span className="rounded-full bg-[#00689D] px-2 py-1">Peace & Justice</span>
              </div>
            </article>
          </div>
        </div>
      </section>

  );
}

