"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

export type DashboardNavIcon =
  | "member"
  | "chapter"
  | "settings"
  | "opportunities"
  | "admin"
  | "overview";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardNavIcon;
  exact?: boolean;
};

type DashboardShellProps = {
  productLabel: string;
  title: string;
  navItems: DashboardNavItem[];
  signOutAction: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
};

function iconClassName(active: boolean): string {
  return active ? "text-orange-600" : "text-muted";
}

function isActivePath(pathname: string, item: DashboardNavItem): boolean {
  if (item.exact) {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarToggleIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 20 20">
      <rect
        x={2.5}
        y={2.5}
        width={7}
        height={15}
        rx={1.8}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <rect
        x={10.5}
        y={2.5}
        width={7}
        height={15}
        rx={1.8}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d={collapsed ? "M7.2 9.8 9 11.6 7.2 13.4" : "M12.8 9.8 11 11.6 12.8 13.4"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function NavIcon({ icon }: { icon: DashboardNavIcon }) {
  switch (icon) {
    case "member":
      return (
        <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <circle cx="12" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M4.5 20c.8-3.2 3.8-5.5 7.5-5.5 3.8 0 6.8 2.3 7.5 5.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "chapter":
      return (
        <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M12 21s7-4.35 7-10a7 7 0 0 0-14 0c0 5.65 7 10 7 10Z" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="11" r="2.5" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "settings":
      return (
        <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path
            d="m9.5 3 .8 2.2 2.3.5 1.6-1.6 2.2 1.3-.7 2.2 1.7 1.7 2.2-.7 1.2 2.2-1.6 1.6.5 2.3 2.2.8v2.5l-2.2.8-.5 2.3 1.6 1.6-1.2 2.2-2.2-.7-1.7 1.7.7 2.2-2.2 1.3-1.6-1.6-2.3.5-.8 2.2H7l-.8-2.2-2.3-.5-1.6 1.6-2.2-1.3.7-2.2-1.7-1.7-2.2.7-1.2-2.2 1.6-1.6-.5-2.3-2.2-.8v-2.5l2.2-.8.5-2.3-1.6-1.6 1.2-2.2 2.2.7 1.7-1.7-.7-2.2 2.2-1.3 1.6 1.6 2.3-.5.8-2.2h2.5Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "opportunities":
      return (
        <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "admin":
      return (
        <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    default:
      return (
        <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
  }
}

export function DashboardShell({
  productLabel,
  title,
  navItems,
  signOutAction,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2";

  return (
    <div className="h-screen overflow-hidden bg-[#f7f5f0] text-ink">
      <div className="flex h-full">
        <div
          className={`fixed inset-0 z-30 bg-black/30 transition md:hidden ${
            mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        <aside
          id="dashboard-sidebar"
          className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-gray-200 bg-white/95 backdrop-blur transition-all duration-300 ease-out md:translate-x-0 ${
            collapsed ? "w-20" : "w-72"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <Link className="flex min-w-0 items-center gap-3 overflow-hidden" href="/">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center">
                <Image
                  src="/ysp-logo.png"
                  alt="Youth Service Philippines logo"
                  className="h-10 w-10 object-contain"
                  width={40}
                  height={40}
                  priority
                />
              </span>
              <span
                className={`min-w-0 overflow-hidden transition-all duration-300 ease-out ${
                  collapsed
                    ? "max-w-0 translate-x-[-8px] opacity-0"
                    : "max-w-[180px] translate-x-0 opacity-100"
                }`}
              >
                <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.32em] text-orange-600">
                  {productLabel}
                </span>
                <span className="block truncate font-manrope text-lg font-semibold text-navy">
                  {title}
                </span>
              </span>
            </Link>
            <button
              className={`inline-flex rounded-full border border-gray-200 p-2 text-muted transition hover:border-orange-300 hover:text-orange-600 md:hidden ${focusRing}`}
              onClick={() => setMobileOpen(false)}
              type="button"
              aria-label="Close sidebar"
            >
              <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 space-y-2 p-3">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "border-orange-200 bg-orange-50 text-orange-700"
                      : "border-transparent text-ink hover:border-orange-200 hover:bg-orange-50/60"
                  } ${collapsed ? "justify-center gap-0" : "gap-3"} ${focusRing}`}
                >
                  <span className={`shrink-0 ${iconClassName(active)}`}>
                    <NavIcon icon={item.icon} />
                  </span>
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
                      collapsed
                        ? "max-w-0 translate-x-[-8px] opacity-0"
                        : "max-w-[150px] translate-x-0 opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2 border-t border-gray-100 p-3">
            <button
              className={`flex w-full items-center rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-muted transition hover:border-orange-300 hover:text-orange-600 ${
                collapsed ? "justify-center" : "gap-2"
              } ${focusRing}`}
              onClick={() => setCollapsed((prev) => !prev)}
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <SidebarToggleIcon collapsed={collapsed} />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
                  collapsed
                    ? "max-w-0 translate-x-[-8px] opacity-0"
                    : "max-w-[130px] translate-x-0 opacity-100"
                }`}
              >
                Collapse sidebar
              </span>
            </button>
            <form action={signOutAction}>
              <button
                className={`flex w-full items-center rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2.5 font-semibold text-orange-700 transition hover:border-orange-300 ${
                  collapsed ? "justify-center text-xs" : "gap-2 text-sm"
                } ${focusRing}`}
                type="submit"
              >
                <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-orange-200">
                  <Image
                    src="/ysp-logo.png"
                    alt=""
                    width={16}
                    height={16}
                    className="h-4 w-4 object-contain"
                  />
                </span>
                {!collapsed ? "Logout" : null}
              </button>
            </form>
          </div>
        </aside>

        <div
          className={`relative min-w-0 flex-1 transition-[margin] duration-300 ease-out ${
            collapsed ? "md:ml-20" : "md:ml-72"
          }`}
        >
          <button
            className={`fixed left-4 top-4 z-20 inline-flex rounded-full border border-gray-200 bg-white p-2 text-muted shadow-soft transition hover:border-orange-300 hover:text-orange-600 md:hidden ${focusRing}`}
            onClick={() => setMobileOpen(true)}
            type="button"
            aria-label="Open sidebar"
            aria-controls="dashboard-sidebar"
            aria-expanded={mobileOpen}
          >
            <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </button>

          <div className="h-screen overflow-y-auto">
            <main
              key={pathname}
              className="admin-route-enter mx-auto w-[94%] max-w-[1200px] pb-16 pt-8 md:pt-10"
            >
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
