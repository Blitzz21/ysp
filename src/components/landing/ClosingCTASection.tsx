export function ClosingCTASection() {
  return (
    <section className="pb-20">
      <div className="mx-auto w-[92%] max-w-6xl">
        <div className="reveal rounded-[40px] bg-orange-500 px-6 py-12 text-center text-white shadow-glow md:px-12 md:py-16">
          <h2 className="font-manrope text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.05]">
            The Philippines needs
            <br />
            your leadership.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/90 md:text-lg">
            Join 1,500+ active youth in making the Philippines a better place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-orange-600 shadow-soft transition hover:-translate-y-0.5"
              href="#membership"
            >
              Register Today
            </a>
            <a
              className="rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:underline"
              href="#chapters"
            >
              Find Chapter
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
