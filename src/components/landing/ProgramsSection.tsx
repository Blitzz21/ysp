import { listPublishedPrograms } from "@/services/programs";

export async function ProgramsSection() {
  let programs: Awaited<ReturnType<typeof listPublishedPrograms>> = [];
  try {
    programs = await listPublishedPrograms();
  } catch {
    // Graceful degradation: render section header without program cards.
  }

  return (
    <section className="py-20" id="programs" data-testid="programs-section">
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
            href="/programs"
          >
            Browse all programs
          </a>
        </div>

        {programs.length === 0 ? (
          <p className="mt-10 text-sm text-muted" data-testid="programs-empty">
            No programs published yet. Check back soon.
          </p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {programs.map((program) => (
              <article
                key={program.id}
                className="reveal group rounded-3xl border border-gray-200 bg-white p-5 shadow-soft transition hover:-translate-y-2 hover:shadow-glow"
                data-testid="program-card"
              >
                <div className="h-36 rounded-2xl bg-[linear-gradient(135deg,#FFE1C2_0%,#FF7A1A_100%)]" />
                <h3 className="mt-4 font-manrope text-lg font-semibold">
                  {program.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{program.description}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
