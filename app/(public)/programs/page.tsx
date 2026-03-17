import { listPublicPrograms } from "@/services/programs";
import { ProgramCard } from "@/components/ui/ProgramCard";
import type { Program } from "@/services/types";

export const dynamic = "force-dynamic";

export default async function ProgramsPage() {
  let hasLoadError = false;
  let programs: Program[] = [];

  try {
    programs = await listPublicPrograms();
  } catch {
    hasLoadError = true;
  }

  return (
    <main className="pb-20">
        <section className="relative overflow-hidden pb-16 pt-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4da_0%,#ffffff_45%,#fdf6ef_100%)]"></div>
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
          <div>
            <h2 className="font-manrope text-2xl font-semibold">
              Featured programs
            </h2>
            <p className="mt-2 text-sm text-muted">
              Start with a proven playbook, then customize for your city.
            </p>
          </div>

          {hasLoadError ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              Programs are temporarily unavailable. Please try again in a few
              minutes.
            </div>
          ) : null}

          {!hasLoadError && programs.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
              No programs published yet. Check back soon.
            </div>
          ) : null}

          {!hasLoadError && programs.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={{
                    id: program.id,
                    title: program.title,
                    description: program.description,
                    imageFileId: program.imageFileId,
                    createdAt: program.createdAt,
                  }}
                />
              ))}
            </div>
          ) : null}
        </section>
    </main>
  );
}
