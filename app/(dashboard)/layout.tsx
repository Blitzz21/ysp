import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession, signOut } from "@/services/auth";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard");
  }

  async function signOutAction() {
    "use server";
    await signOut();
    redirect("/login");
  }

  const roleLabel =
    session.role === "admin"
      ? "Admin"
      : session.role === "chapter_head"
        ? "Chapter Head"
        : session.role === "officer"
          ? "Officer"
          : "Member";
  const isAdmin = session.role === "admin";
  const isChapterHead = session.role === "chapter_head";

  return (
    <div className="min-h-screen bg-[#fdf6ef]">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-[92%] max-w-6xl items-center justify-between gap-4 py-3">
          <Link className="flex items-center gap-3" href="/" aria-label="YSP home">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-soft ring-1 ring-orange-100">
              <Image
                src="/ysp-logo.png"
                alt="Youth Service Philippines logo"
                width={40}
                height={40}
              />
            </span>
            <div className="leading-tight">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
                Dashboard
              </p>
              <p className="font-manrope text-lg font-semibold text-navy">YSP {roleLabel}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-3 md:flex">
            <Link
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
              href="/dashboard/member"
            >
              Member dashboard
            </Link>
            <Link
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
              href="/settings"
            >
              Settings
            </Link>
            {(isChapterHead || isAdmin) && (
              <Link
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                href="/chapter"
              >
                Chapter dashboard
              </Link>
            )}
            {isAdmin && (
              <Link
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                href="/admin"
              >
                Admin console
              </Link>
            )}
            <Link
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
              href="/volunteer-opportunities"
            >
              Opportunities
            </Link>
          </nav>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 transition hover:border-orange-300 hover:text-orange-700"
            >
              Logout
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-[92%] max-w-6xl py-10">{children}</main>
    </div>
  );
}
