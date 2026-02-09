import Link from "next/link";

const PROGRAMS = [
  {
    slug: "youth-action-labs",
    title: "Youth Action Labs",
    summary: "Rapid sprints that help local chapters solve real community problems.",
    tags: ["Civic Innovation", "Leadership"],
    gradient: "bg-[linear-gradient(135deg,#FFE1C2_0%,#FF7A1A_100%)]",
  },
  {
    slug: "green-streets",
    title: "Green Streets",
    summary: "Neighborhood cleanups and climate-focused volunteer drives.",
    tags: ["Environment", "Community"],
    gradient: "bg-[linear-gradient(135deg,#F0FBFF_0%,#1FA2A5_100%)]",
  },
  {
    slug: "skills-forward",
    title: "Skills Forward",
    summary: "Mentorship and skills coaching for students entering the workforce.",
    tags: ["Education", "Mentorship"],
    gradient: "bg-[linear-gradient(135deg,#FFF6DA_0%,#FFCF3D_100%)]",
  },
  {
    slug: "health-kits",
    title: "Health Kits",
    summary: "Mobilize volunteers to pack and distribute community health kits.",
    tags: ["Health", "Relief"],
    gradient: "bg-[linear-gradient(135deg,#FFE0C8_0%,#F24A00_100%)]",
  },
];

const CATEGORIES = [
  "All",
  "Education",
  "Environment",
  "Health",
  "Leadership",
  "Relief",
];

export default function ProgramsPage() {
  return (
    <main className="pb-20">
        <section className="relative overflow-hidden pb-16 pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4da_0%,#ffffff_45%,#fdf6ef_100%)]"></div>
          <div className="grid-pattern pointer-events-none absolute inset-0 opacity-40"></div>
          <div className="mx-auto w-[92%] max-w-6xl">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600 shadow-soft">
              Programs
            </div>
            <h1 className="reveal mt-6 font-manrope text-[clamp(2.6rem,5vw,4rem)] leading-[1.08]">
              Programs built to scale youth action.
            </h1>
            <p className="reveal mt-4 max-w-2xl text-muted">
              Discover the initiatives powering the Youth Service Platform. Each
              program includes tools, training, and measurable outcomes that
              local chapters can deliver.
            </p>
          </div>
        </section>

        <section className="mx-auto w-[92%] max-w-6xl" id="programs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-manrope text-2xl font-semibold">
                Featured programs
              </h2>
              <p className="mt-2 text-sm text-muted">
                Start with a proven playbook, then customize for your city.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
              {CATEGORIES.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 shadow-soft"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          {PROGRAMS.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
              No programs published yet. Check back soon.
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {PROGRAMS.map((program) => (
                <article
                  key={program.slug}
                  className="reveal group rounded-3xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-2 hover:shadow-glow"
                >
                  <div className={`h-32 rounded-2xl ${program.gradient}`}></div>
                  <h3 className="mt-4 font-manrope text-lg font-semibold">
                    {program.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{program.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                    {program.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-orange-500/90 px-2 py-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    className="mt-5 inline-flex rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                    href={`/programs/${program.slug}`}
                  >
                    View details
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
    </main>
  );
}
