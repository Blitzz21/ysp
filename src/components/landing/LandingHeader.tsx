"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/programs", label: "Programs" },
  { href: "/volunteer-opportunities", label: "Opportunities" },
  { href: "/membership", label: "Membership" },
  { href: "/chapters", label: "Chapters" },
  { href: "/contact", label: "Contact" },
];

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-[92%] max-w-6xl items-center justify-between gap-3 py-3">
        <Link className="flex items-center gap-3" href="/" aria-label="YSP home">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-orange-100">
            <Image
              src="/ysp-logo.png"
              alt="Youth Service Philippines logo"
              className="h-16 w-16 object-contain"
              width={64}
              height={64}
            />
          </span>
        </Link>

        <nav
          className="hidden items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-muted md:flex"
          aria-label="Primary"
        >
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              className="rounded-full px-3 py-1.5 transition hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 text-xs font-semibold sm:text-sm md:flex">
          <Link
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-muted transition hover:border-orange-300 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="rounded-full bg-orange-500 px-4 py-2 text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            href="/signup"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-muted transition hover:border-orange-300 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-primary-nav"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            {menuOpen ? (
              <path
                d="M6 6 18 18M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </button>
      </div>

      <div
        id="mobile-primary-nav"
        aria-label="Mobile primary"
        className={`md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`mx-auto w-[92%] max-w-6xl overflow-hidden transition-[max-height,opacity,transform] duration-300 ease-out ${
            menuOpen ? "max-h-[420px] pb-4 opacity-100 translate-y-0" : "max-h-0 pb-0 opacity-0 -translate-y-1"
          }`}
        >
          <div className="rounded-3xl border border-gray-200 bg-white p-3 shadow-soft">
            <nav className="grid grid-cols-2 gap-2" aria-label="Primary mobile links">
              {NAV_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold text-muted transition hover:bg-orange-50 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                className="rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-semibold text-muted transition hover:border-orange-300 hover:text-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                href="/login"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
              <Link
                className="rounded-xl bg-orange-500 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
                href="/signup"
                onClick={() => setMenuOpen(false)}
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
