export function ContactSection() {
  return (
    <section className="py-20" id="contact">
      <div className="mx-auto w-[92%] max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="reveal">
            <h2 className="font-manrope text-3xl font-bold md:text-4xl">
              Reach the YSP team.
            </h2>
            <p className="mt-3 text-muted">
              Ready to mobilize? Connect directly with the team and get plugged
              into a chapter or program.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="reveal rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold text-muted">Email</p>
              <a
                className="mt-2 block text-sm font-semibold text-orange-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                href="mailto:phyouthservice@gmail.com"
              >
                phyouthservice@gmail.com
              </a>
            </div>
            <div className="reveal rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold text-muted">Facebook</p>
              <a
                className="mt-2 block text-sm font-semibold text-orange-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                href="https://www.facebook.com/YOUTHSERVICEPHILIPPINES"
                target="_blank"
                rel="noreferrer"
              >
                /YOUTHSERVICEPHILIPPINES
              </a>
            </div>
            <div className="reveal rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold text-muted">Mobile</p>
              <a
                className="mt-2 block text-sm font-semibold text-orange-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                href="tel:+639177798413"
              >
                0917 779 8413
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}