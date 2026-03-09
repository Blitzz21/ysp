"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

export type DashboardNavIcon =
  | "member"
  | "chapter"
  | "settings"
  | "opportunities"
  | "admin"
  | "overview"
  | "programs"
  | "manage";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: DashboardNavIcon;
  exact?: boolean;
  children?: DashboardNavItem[];
};

type DashboardShellProps = {
  productLabel: string;
  title: string;
  navItems: DashboardNavItem[];
  signOutAction: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
};

function iconClassName(active: boolean): string {
  return active ? "text-ink" : "text-gray-400";
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
    case "programs":
      return (
        <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M5 4h14a1 1 0 0 1 1 1v14l-4-2-4 2-4-2-4 2V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" />
        </svg>
      );
    case "manage":
      return (
        <svg fill="none" viewBox="0 0 24 24" className="h-5 w-5">
          <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="8" cy="6" r="1.5" fill="currentColor" />
          <circle cx="14" cy="12" r="1.5" fill="currentColor" />
          <circle cx="10" cy="18" r="1.5" fill="currentColor" />
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

function DropdownNavItem({
  item,
  pathname,
  collapsed,
  focusRing,
  onMobileClose,
}: {
  item: DashboardNavItem;
  pathname: string;
  collapsed: boolean;
  focusRing: string;
  onMobileClose: () => void;
}) {
  const childActive = item.children?.some((child) => isActivePath(pathname, child)) ?? false;
  const [open, setOpen] = useState(childActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium transition ${childActive
          ? "bg-gray-100 text-ink"
          : "text-gray-600 hover:bg-gray-50 hover:text-ink"
          } ${collapsed ? "justify-center gap-0" : "gap-3"} ${focusRing}`}
      >
        <span className={`shrink-0 ${iconClassName(childActive)}`}>
          <NavIcon icon={item.icon} />
        </span>
        <span
          className={`flex-1 overflow-hidden whitespace-nowrap text-left transition-all duration-300 ease-out ${collapsed
            ? "max-w-0 translate-x-[-8px] opacity-0"
            : "max-w-[150px] translate-x-0 opacity-100"
            }`}
        >
          {item.label}
        </span>
        {!collapsed && (
          <svg
            className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {open && !collapsed && item.children && (
        <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-3">
          {item.children.map((child) => {
            const active = isActivePath(pathname, child);
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onMobileClose}
                className={`flex items-center rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${active
                  ? "bg-gray-100 text-ink"
                  : "text-gray-500 hover:bg-gray-50 hover:text-ink"
                  } ${focusRing}`}
              >
                <span className={`mr-2.5 shrink-0 ${iconClassName(active)}`}>
                  <NavIcon icon={child.icon} />
                </span>
                <span className={active ? "font-semibold" : ""}>{child.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DashboardShell({
  productLabel,
  title,
  navItems,
  signOutAction,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2";

  return (
    <div className="h-screen overflow-hidden bg-[#f8f8f6] text-ink">
      <div className="flex h-full">
        <div
          className={`fixed inset-0 z-30 bg-black/30 transition md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        <aside
          id="dashboard-sidebar"
          className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden border-r border-gray-200/80 bg-white transition-all duration-300 ease-out md:translate-x-0 ${collapsed ? "w-[72px]" : "w-64"
            } ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <div className="flex items-center justify-between border-b border-gray-100/80 px-4 py-3">
            <button
              type="button"
              onClick={() => router.refresh()}
              className="flex min-w-0 items-center gap-2.5 overflow-hidden"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                <Image
                  src="/ysp-logo.png"
                  alt="Youth Service Philippines logo"
                  className="h-8 w-8 object-contain"
                  width={32}
                  height={32}
                  priority
                />
              </span>
              <span
                className={`min-w-0 overflow-hidden transition-all duration-300 ease-out ${collapsed
                  ? "max-w-0 translate-x-[-8px] opacity-0"
                  : "max-w-[180px] translate-x-0 opacity-100"
                  }`}
              >
                <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400">
                  {productLabel}
                </span>
                <span className="block truncate font-manrope text-sm font-bold text-ink">
                  {title}
                </span>
              </span>
            </button>
            <button
              className={`inline-flex rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-ink md:hidden ${focusRing}`}
              onClick={() => setMobileOpen(false)}
              type="button"
              aria-label="Close sidebar"
            >
              <svg fill="none" viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="1.7" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
            {navItems.map((item) => {
              if (item.children) {
                return (
                  <DropdownNavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    focusRing={focusRing}
                    onMobileClose={() => setMobileOpen(false)}
                  />
                );
              }
              const active = isActivePath(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition ${active
                    ? "bg-gray-100 text-ink"
                    : "text-gray-600 hover:bg-gray-50 hover:text-ink"
                    } ${collapsed ? "justify-center gap-0" : "gap-3"} ${focusRing}`}
                >
                  <span className={`shrink-0 ${iconClassName(active)}`}>
                    <NavIcon icon={item.icon} />
                  </span>
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${collapsed
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

          <div className="space-y-1.5 border-t border-gray-100/80 px-3 py-3">
            <button
              className={`flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-50 hover:text-ink ${collapsed ? "justify-center" : "gap-2"
                } ${focusRing}`}
              onClick={() => setCollapsed((prev) => !prev)}
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <SidebarToggleIcon collapsed={collapsed} />
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${collapsed
                  ? "max-w-0 translate-x-[-8px] opacity-0"
                  : "max-w-[130px] translate-x-0 opacity-100"
                  }`}
              >
                Collapse
              </span>
            </button>
            <form action={signOutAction}>
              <button
                className={`flex w-full items-center rounded-xl px-3 py-2 font-medium text-gray-500 transition hover:bg-red-50 hover:text-red-600 ${collapsed ? "justify-center text-xs" : "gap-2 text-sm"
                  } ${focusRing}`}
                type="submit"
              >
                <svg
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {!collapsed ? "Log out" : null}
              </button>
            </form>
          </div>
        </aside>

        <div
          className={`relative min-w-0 flex-1 transition-[margin] duration-300 ease-out ${collapsed ? "md:ml-[72px]" : "md:ml-64"
            }`}
        >
          <button
            className={`fixed left-4 top-4 z-20 inline-flex rounded-lg border border-gray-200 bg-white p-2 text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-ink md:hidden ${focusRing}`}
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
