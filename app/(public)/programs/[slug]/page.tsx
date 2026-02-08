import Link from "next/link";

import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";

const PROGRAMS = {
  "youth-action-labs": {
    title: "Youth Action Labs",
    summary:
      "Rapid sprints that help local chapters solve real community problems.",
    impact: [
      "Sprint-based volunteer mobilization",
      "City-ready toolkits",
      "Peer mentorship support",
    ],
  },
  "green-streets": {
    title: "Green Streets",
    summary:
      "Neighborhood cleanups and climate-focused volunteer drives.",
    impact: [
      "Waste diversion and recycling",
      "Tree planting drives",
      "Community climate reporting",
    ],
  },
  "skills-forward": {
    title: "Skills Forward",
    summary:
      "Mentorship and skills coaching for students entering the workforce.",
    impact: [
      "Career readiness coaching",
      "Mentor matching",
      "Portfolio development",
    ],
  },
  "health-kits": {
    title: "Health Kits",
    summary:
      "Mobilize volunteers to pack and distribute community health kits.",
    impact: [
      "Local health partner coordination",
      "Distribution playbooks",
      "Volunteer impact tracking",
    ],
  },
} as const;

const RELATED = [
  "youth-action-labs",
  "green-streets",
  "skills-forward",
  "health-kits",
];

export default function ProgramDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const program = PROGRAMS[params.slug as keyof typeof PROGRAMS];

  if (!program) {
    return (
      <div className="text-ink">
        <LandingHeader />
        <main className="mx-auto w-[92%] max-w-4xl py-20 text-center">
          <h1 className="font-manrope text-3xl font-semibold">
            Program not found
          </h1>
          <p className="mt-3 text-muted">
            This program is not available yet. Explore the full list of
            programs.
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow"
            href="/programs"
          >
            Back to programs
          </Link>
        </main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="text-ink">
      <LandingHeader />

      <main className="mx-auto w-[92%] max-w-6xl py-16">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600 shadow-soft">
              Program Detail
            </div>
            <h1 className="mt-5 font-manrope text-[clamp(2.4rem,5vw,3.6rem)] leading-[1.08]">
              {program.title}
            </h1>
            <p className="mt-4 text-muted">{program.summary}</p>
            <div className="mt-6 grid gap-3 text-sm text-muted">
              <p>
                Each chapter receives launch materials, training content, and
                impact templates to run this program with confidence.
              </p>
              <p>
                Teams can adapt the format to local needs while keeping national
                reporting consistent.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow"
                href="/membership"
              >
                Start a chapter
              </Link>
              <Link
                className="rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-semibold text-ink"
                href="/programs"
              >
                Browse programs
              </Link>
            </div>
          </div>

          <div className="rounded-[32px] border border-orange-500/20 bg-[linear-gradient(135deg,rgba(255,122,26,0.15),rgba(255,207,61,0.25))] p-8 shadow-soft">
            <h2 className="font-manrope text-xl font-semibold">
              Delivery highlights
            </h2>
            <ul className="mt-4 grid gap-3 text-sm text-muted">
              {program.impact.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-white/80 p-4 text-xs text-muted">
              Estimated timeline: 6-8 weeks from kickoff to impact reporting.
            </div>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-manrope text-2xl font-semibold">
            Related programs
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {RELATED.filter((slug) => slug !== params.slug).map((slug) => (
              <Link
                key={slug}
                className="rounded-3xl border border-gray-200 bg-white p-5 text-sm text-ink shadow-soft transition hover:-translate-y-1 hover:text-orange-600"
                href={`/programs/${slug}`}
              >
                {PROGRAMS[slug as keyof typeof PROGRAMS].title}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
