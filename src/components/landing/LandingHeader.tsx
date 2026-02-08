export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-[92%] max-w-6xl flex-wrap items-center justify-between gap-3 py-3">
        <a className="flex items-center gap-3" href="/" aria-label="YSP home">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-orange-100">
            <img
              src="YSP LOGO.png"
              alt="Youth Service Philippines logo"
              className="h-16 w-16 object-contain"
            />
          </span>
        </a>

        <nav className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-xs font-semibold text-muted shadow-soft md:flex">
          <a className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="/">
            Home
          </a>
          <a className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="#programs">
            Programs
          </a>
          <a className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="#opportunities">
            Opportunities
          </a>
          <a className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="#membership">
            Membership
          </a>
          <a className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="#chapters">
            Chapters
          </a>
          <a className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="#contact">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
          <a
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-muted transition hover:border-orange-300 hover:text-orange-600"
            href="/login"
          >
            Login
          </a>
          <a
            className="rounded-full bg-orange-500 px-4 py-2 text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-600"
            href="/signup"
          >
            Sign up
          </a>
        </div>
      </div>
    </header>
  );
}
