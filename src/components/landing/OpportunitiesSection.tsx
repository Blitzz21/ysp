export function OpportunitiesSection() {
  return (
      <section className="py-20" id="opportunities">
        <div className="mx-auto w-[92%] max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="font-manrope text-3xl font-bold md:text-4xl">
                Volunteer opportunities live right now.
              </h2>
              <p className="mt-3 text-muted">
                Chapter heads create opportunities, admins approve, and the
                public joins. Verified and ready to mobilize.
              </p>
            </div>
            <a
              className="rounded-full border border-orange-500 px-5 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-500 hover:text-white"
              href="#opportunities"
              >See all opportunities</a
            >
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <article className="reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#FFE9C7_0%,#FF7A1A_90%)]"></div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-muted">
                <span>Manila Chapter</span>
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-orange-600"
                  >On-site</span
                >
              </div>
              <h3 className="mt-3 font-manrope text-lg font-semibold">
                Manila River Sweep
              </h3>
              <p className="mt-2 text-sm text-muted">
                March 18, 2025 Â· 7:00 AM - 12:00 PM Â· Pasig River
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                <span className="rounded-full bg-[#26BDE2] px-2 py-1">Clean Water</span>
                <span className="rounded-full bg-[#3F7E44] px-2 py-1">Climate Action</span>
              </div>
            </article>
            <article className="reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#F7F8FA_0%,#FFCF3D_90%)]"></div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-muted">
                <span>Cebu Chapter</span>
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-orange-600"
                  >Virtual</span
                >
              </div>
              <h3 className="mt-3 font-manrope text-lg font-semibold">
                Mentor a Learner Night
              </h3>
              <p className="mt-2 text-sm text-muted">
                March 21, 2025 Â· 6:00 PM - 8:00 PM Â· Online
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                <span className="rounded-full bg-[#C5192D] px-2 py-1">Quality Education</span>
                <span className="rounded-full bg-[#DD1367] px-2 py-1">Reduced Inequalities</span>
              </div>
            </article>
            <article className="reveal rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <div className="h-32 rounded-2xl bg-[linear-gradient(135deg,#F7F8FA_0%,#FF7A1A_90%)]"></div>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-muted">
                <span>Davao Chapter</span>
                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-orange-600"
                  >On-site</span
                >
              </div>
              <h3 className="mt-3 font-manrope text-lg font-semibold">
                Barangay Health Kits
              </h3>
              <p className="mt-2 text-sm text-muted">
                March 29, 2025 Â· 8:00 AM - 2:00 PM Â· Davao City
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-white">
                <span className="rounded-full bg-[#4C9F38] px-2 py-1">Good Health</span>
                <span className="rounded-full bg-[#FD9D24] px-2 py-1">Sustainable Cities</span>
              </div>
            </article>
          </div>
        </div>
      </section>

  );
}

