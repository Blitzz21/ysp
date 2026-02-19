"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

import { SETTINGS_TABS, resolveTab } from "@/lib/settingsTabs";
export type { SettingsTab } from "@/lib/settingsTabs";

export default function SettingsNav({ children }: { children: ReactNode }) {
    const searchParams = useSearchParams();
    const active = resolveTab(searchParams.get("tab"));

    return (
        <div className="flex flex-col gap-8 md:flex-row">
            {/* ── Left sidebar nav ── */}
            <nav className="shrink-0 md:w-44">
                <ul className="flex gap-1 overflow-x-auto md:flex-col md:gap-0">
                    {SETTINGS_TABS.map(({ key, label }) => {
                        const isActive = active === key;
                        return (
                            <li key={key}>
                                <Link
                                    href={`/settings?tab=${key}`}
                                    scroll={false}
                                    className={`
                    block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition
                    md:rounded-none md:rounded-r-lg md:border-l-2 md:px-4
                    ${isActive
                                            ? "border-orange-500 bg-orange-50 text-orange-700 md:border-l-orange-500"
                                            : "border-transparent text-muted hover:bg-gray-50 hover:text-ink md:border-l-transparent"
                                        }
                  `}
                                >
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
