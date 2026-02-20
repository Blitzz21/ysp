"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { SETTINGS_TABS, resolveTab } from "@/lib/settingsTabs";
export type { SettingsTab } from "@/lib/settingsTabs";

function TabIcon({ icon, className }: { icon: string; className?: string }) {
    const cls = `h-4 w-4 shrink-0 ${className ?? ""}`;
    switch (icon) {
        case "user":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            );
        case "mail":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
            );
        case "lock":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            );
        case "bell":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
            );
        case "settings":
            return (
                <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            );
        default:
            return null;
    }
}

export default function SettingsNav({ children }: { children: ReactNode }) {
    const searchParams = useSearchParams();
    const active = resolveTab(searchParams.get("tab"));

    return (
        <div className="flex flex-col gap-8 md:flex-row">
            {/* ── Left sidebar nav ── */}
            <nav className="shrink-0 md:w-52">
                <ul className="flex gap-1 overflow-x-auto md:flex-col md:gap-0">
                    {SETTINGS_TABS.map(({ key, label, icon }) => {
                        const isActive = active === key;
                        return (
                            <li key={key}>
                                <Link
                                    href={`/settings?tab=${key}`}
                                    scroll={false}
                                    className={`
                    flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition
                    md:rounded-none md:rounded-r-lg md:border-l-2 md:px-4
                    ${isActive
                                            ? "border-orange-500 bg-orange-50 text-orange-700 md:border-l-orange-500"
                                            : "border-transparent text-muted hover:bg-gray-50 hover:text-ink md:border-l-transparent"
                                        }
                  `}
                                >
                                    <TabIcon icon={icon} />
                                    {label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* ── Right content area ── */}
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}
