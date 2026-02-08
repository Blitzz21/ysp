export function HeroSection() {
  return (
      <section className="relative overflow-hidden pb-24 pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#fff4da_0%,#ffffff_55%,#fdf6ef_100%)]"></div>
        <div className="grid-pattern pointer-events-none absolute inset-0 opacity-60"></div>
        <div className="pointer-events-none absolute -left-16 top-16 h-40 w-40 rounded-[40px] bg-orange-500/20 blur-xl" data-parallax data-speed="0.2"></div>
        <div className="pointer-events-none absolute right-20 top-28 h-24 w-24 rounded-full bg-yellow/50 blur-lg" data-parallax data-speed="0.16"></div>
        <div className="pointer-events-none absolute bottom-10 left-1/4 h-20 w-20 rounded-full bg-teal/25 blur-lg" data-parallax data-speed="0.12"></div>

        <div className="mx-auto w-[92%] max-w-6xl text-center">
          <div className="reveal inline-flex items-center gap-2 rounded-full border border-orange-100 bg-white px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-orange-600 shadow-soft">
            Youth Service Platform
          </div>
          <h1 className="reveal mt-6 font-manrope text-[clamp(2.8rem,6vw,4.8rem)] leading-[1.03] text-ink">
            Fueling{" "}
            <span className="text-orange-600">youth-led service</span>, one
            chapter at a time.
          </h1>
          <p className="reveal mx-auto mt-5 max-w-2xl text-lg text-muted">
            Discover programs, connect with chapters, and mobilize volunteers
            for lasting change across the Philippines.
          </p>
          <div className="reveal mt-8 flex flex-wrap justify-center gap-3">
            <a
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-600"
              href="#programs"
            >
              View programs
            </a>
            <a
              className="rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
              href="#opportunities"
            >
              Volunteer opportunities
            </a>
          </div>
          <div className="mx-auto mt-12 grid w-full max-w-6xl gap-5 text-left md:grid-cols-2 lg:grid-cols-4">
            <div className="stat-card reveal rounded-3xl bg-white p-6 shadow-soft">
              <p className="text-sm text-muted">Projects completed</p>
              <p
                className="count-up font-manrope text-4xl font-bold text-navy"
                data-count="200"
                data-suffix="+"
              >
                0
              </p>
              <p className="mt-3 text-sm text-muted">
                Youth-led initiatives delivered by local chapters.
              </p>
            </div>
            <div className="stat-card reveal rounded-3xl bg-white p-6 shadow-soft">
              <p className="text-sm text-muted">Active chapters</p>
              <p
                className="count-up font-manrope text-4xl font-bold text-navy"
                data-count="40"
                data-suffix="+"
              >
                0
              </p>
              <p className="mt-3 text-sm text-muted">
                Growing coverage across Luzon, Visayas, and Mindanao.
              </p>
            </div>
            <div className="stat-card reveal rounded-3xl bg-white p-6 shadow-soft">
              <p className="text-sm text-muted">Youth members</p>
              <p
                className="count-up font-manrope text-4xl font-bold text-navy"
                data-count="1500"
                data-suffix="+"
              >
                0
              </p>
              <p className="mt-3 text-sm text-muted">
                A verified network of service-ready volunteers.
              </p>
            </div>
            <div className="stat-card reveal rounded-3xl bg-white p-6 shadow-soft">
              <p className="text-sm text-muted">Lives impacted</p>
              <p
                className="count-up font-manrope text-4xl font-bold text-navy"
                data-count="100"
                data-suffix="K+"
              >
                0
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

