import Link from "next/link";
import Image from "next/image";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-[92%] max-w-6xl flex-wrap items-center justify-between gap-3 py-3">
        <Link className="flex items-center gap-3" href="/" aria-label="YSP home">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-orange-100">
            <Image
              src="/YSP LOGO.png"
              alt="Youth Service Philippines logo"
              className="h-16 w-16 object-contain"
              width={64}
              height={64}
            />
          </span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white/90 px-4 py-2 text-xs font-semibold text-muted shadow-soft md:flex">
          <Link className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="/">
            Home
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="/programs">
            Programs
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="/volunteer-opportunities">
            Opportunities
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="/membership">
            Membership
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="/chapters">
            Chapters
          </Link>
          <Link className="rounded-full px-3 py-1.5 transition hover:text-orange-600" href="/contact">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2 text-xs font-semibold sm:text-sm">
          <Link
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-muted transition hover:border-orange-300 hover:text-orange-600"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="rounded-full bg-orange-500 px-4 py-2 text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-600"
            href="/signup"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
