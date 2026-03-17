import Image from "next/image";
import type { SiteStats } from "@/services/types";

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCompactCount(value: number): string {
  if (value < 1000) {
    return formatCount(value);
  }
  const compact = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
  return compact.toUpperCase();
}

const heroImages = [
  "/images/stream/014d3923-5e06-47d0-8a9a-efebe045c6e0.jfif",
  "/images/stream/30e47b51-d75a-4005-ae46-4f37bacb72d5.jfif",
  "/images/stream/43038641-a50e-4d46-95cd-12d0e185bb40.jfif",
  "/images/stream/489fcb6f-d2e6-43dd-be4b-b76a540595f4.jfif",
];

export function HeroSection({ stats }: { stats: SiteStats }) {
  return (
    <section className="relative overflow-hidden pb-24 pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4da_0%,#ffffff_55%,#fdf6ef_100%)]"></div>
      <div
        className="pointer-events-none absolute -left-16 top-16 h-40 w-40 rounded-[40px] bg-orange-500/20 blur-xl"
        data-parallax
        data-speed="0.2"
      ></div>
      <div
        className="pointer-events-none absolute right-20 top-28 h-24 w-24 rounded-full bg-yellow/50 blur-lg"
        data-parallax
        data-speed="0.16"
      ></div>
      <div
        className="pointer-events-none absolute bottom-10 left-1/4 h-20 w-20 rounded-full bg-teal/25 blur-lg"
        data-parallax
        data-speed="0.12"
      ></div>

      <div className="mx-auto w-[92%] max-w-6xl">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-start lg:gap-16">
          {/* Left: Text Content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600 shadow-soft">
              Youth Service Platform
            </div>
            <h1 className="reveal mt-6 font-manrope text-[clamp(2.4rem,5.5vw,4.2rem)] leading-[1.06] text-ink">
              Real youth.{" "}
              <span className="text-orange-600">Real communities.</span>
              <br />
              Real change across the Philippines.
            </h1>
            <p className="reveal mt-5 max-w-lg text-lg leading-relaxed text-muted lg:mx-0">
              We&apos;re a network of student-run chapters organizing service
              projects in communities that need it most — from Luzon to
              Mindanao.
            </p>
            <div className="reveal mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-600"
                href="#programs"
              >
                Explore programs
              </a>
              <a
                className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                href="#opportunities"
              >
                Join as a volunteer
              </a>
            </div>
          </div>

          {/* Right: Photo Mosaic */}
          <div className="reveal relative hidden w-full max-w-md flex-shrink-0 lg:block">
            <div className="hero-mosaic relative h-[420px] w-full">
              <div className="absolute left-0 top-0 h-[200px] w-[200px] rotate-[-3deg] overflow-hidden rounded-2xl shadow-lg transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <Image
                  src={heroImages[0]}
                  alt="Volunteers in action"
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              </div>
              <div className="absolute right-2 top-4 h-[180px] w-[180px] rotate-[4deg] overflow-hidden rounded-2xl shadow-lg transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <Image
                  src={heroImages[1]}
                  alt="Community outreach"
                  fill
                  className="object-cover"
                  sizes="180px"
                />
              </div>
              <div className="absolute bottom-4 left-6 h-[190px] w-[190px] rotate-[2deg] overflow-hidden rounded-2xl shadow-lg transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <Image
                  src={heroImages[2]}
                  alt="Youth service project"
                  fill
                  className="object-cover"
                  sizes="190px"
                />
              </div>
              <div className="absolute bottom-0 right-0 h-[170px] w-[170px] rotate-[-5deg] overflow-hidden rounded-2xl shadow-lg transition-transform duration-500 hover:rotate-0 hover:scale-105">
                <Image
                  src={heroImages[3]}
                  alt="Chapter meeting"
                  fill
                  className="object-cover"
                  sizes="170px"
                />
              </div>
            </div>
          </div>

          {/* Mobile: Compact photo strip */}
          <div className="reveal flex gap-3 overflow-hidden lg:hidden">
            {heroImages.map((src, i) => (
              <div
                key={i}
                className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl shadow-md"
                style={{ transform: `rotate(${i % 2 === 0 ? -2 : 3}deg)` }}
              >
                <Image
                  src={src}
                  alt="YSP volunteers"
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mx-auto mt-14 grid w-full max-w-6xl gap-5 text-left md:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card reveal rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm text-muted">Projects completed</p>
            <p className="font-manrope text-4xl font-bold text-navy">
              {formatCount(stats.projectsCount)}+
            </p>
            <p className="mt-3 text-sm text-muted">
              Youth-led initiatives delivered by local chapters.
            </p>
          </div>
          <div className="stat-card reveal rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm text-muted">Active chapters</p>
            <p className="font-manrope text-4xl font-bold text-navy">
              {formatCount(stats.chaptersCount)}+
            </p>
            <p className="mt-3 text-sm text-muted">
              Growing coverage across Luzon, Visayas, and Mindanao.
            </p>
          </div>
          <div className="stat-card reveal rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm text-muted">Youth members</p>
            <p className="font-manrope text-4xl font-bold text-navy">
              {formatCount(stats.membersCount)}+
            </p>
            <p className="mt-3 text-sm text-muted">
              A verified network of service-ready volunteers.
            </p>
          </div>
          <div className="stat-card reveal rounded-3xl bg-white p-6 shadow-soft">
            <p className="text-sm text-muted">Lives impacted</p>
            <p className="font-manrope text-4xl font-bold text-navy">
              {formatCompactCount(stats.livesImpactedCount)}+
            </p>
            <p className="mt-3 text-sm text-muted">
              Impacted more than one hundred thousand lives.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
