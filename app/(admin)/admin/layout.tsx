import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSession, signOut } from "@/services/auth";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/programs", label: "Programs" },
  { href: "/admin/chapters", label: "Chapters" },
  { href: "/admin/opportunities", label: "Opportunities" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?next=/admin");
  }

  async function signOutAction() {
    "use server";
    await signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-ink">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex w-[92%] max-w-6xl flex-wrap items-center justify-between gap-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600">
              Admin Console
            </p>
            <h1 className="font-manrope text-xl font-semibold">YSP Admin</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex flex-wrap gap-2 text-xs font-semibold">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-full border border-gray-200 bg-white px-3 py-2 text-ink transition hover:border-orange-300 hover:text-orange-600"
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <form action={signOutAction}>
              <button
                className="rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 transition hover:border-orange-300"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-[92%] max-w-6xl pb-16 pt-10">
        {children}
      </main>
    </div>
  );
}
