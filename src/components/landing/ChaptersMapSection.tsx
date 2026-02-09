import Image from "next/image";

export function ChaptersMapSection() {
  return (
    <section
      className="chapters-section relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-16"
      id="chapters"
    >
      <div className="pointer-events-none absolute right-10 top-16 h-20 w-20 rounded-[28px] bg-yellow/40 blur-xl"></div>
      <div className="pointer-events-none absolute bottom-20 left-12 h-24 w-24 rounded-full bg-orange-500/20 blur-2xl"></div>

      <div className="chapters-curve bg-[#E76F0010] absolute left-1/2 top-1/2 z-[0] h-[120%] w-[100%] -translate-x-1/2 -translate-y-1/3 rounded-t-[50%] md:h-[110%] md:w-[150%]"></div>
      <div className="grid-pattern pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[120%] w-[100%] -translate-x-1/2 -translate-y-1/3 rounded-t-[50%] opacity-20 md:h-[110%] md:w-[150%]"></div>

      <div className="relative z-[2] mx-auto w-full max-w-7xl">
        <div className="flex flex-col items-center justify-center gap-12 p-8">
          <div className="absolute inset-0 z-30 mt-8 flex items-center justify-center opacity-70 md:mt-64">
            <div className="ph-map relative w-[80%] sm:w-[70%] lg:w-[60%]">
              <div className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-orange-500/10 blur-2xl"></div>
              <Image
                src="/map_ph.svg"
                alt="Map of the Philippines"
                className="w-full blur-[1px] drop-shadow-[0_18px_30px_rgba(241,101,41,0.2)]"
                width={1200}
                height={900}
              />
            </div>
          </div>

          <div className="relative max-w-2xl text-center">
            <div className="pointer-events-none absolute -inset-x-10 -inset-y-6 -z-10 rounded-[48px] bg-white/70 blur-2xl"></div>
            <h2 className="mt-5 mb-4 font-manrope text-4xl leading-tight font-extrabold text-[#b8692d] md:text-5xl lg:text-6xl">
              Chapters across
              <br />
              the Philippines
            </h2>
            <div className="mx-auto mb-5 h-1 w-24 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400"></div>
            <p className="mx-auto max-w-lg text-lg leading-relaxed text-[#8b6f47]">
              A growing network of youth-led teams delivering programs in their communities.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-[#b8692d]">
              <span className="rounded-full border border-[#b8692d] bg-white/80 px-3 py-1 shadow-soft">40+ chapters</span>
              <span className="rounded-full border border-[#b8692d] bg-white/80 px-3 py-1 shadow-soft">17 regions</span>
              <span className="rounded-full border border-[#b8692d] bg-white/80 px-3 py-1 shadow-soft">1.5K+ members</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
