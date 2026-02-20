"use client";

import { useState } from "react";
import type { Chapter, ChapterMembership } from "@/services/types";
import { ChapterModal } from "./ChapterModal";

/* ── Helpers ── */
function StatusBadge({ membership }: { membership?: ChapterMembership }) {
    if (!membership) {
        return (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                Not joined
            </span>
        );
    }
    const colors: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-700",
        pending: "bg-amber-100 text-amber-700",
        removed: "bg-red-100 text-red-600",
    };
    const labels: Record<string, string> = {
        active: "Active",
        pending: "Pending",
        removed: "Removed",
    };
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[membership.status] ?? "bg-gray-100 text-gray-500"}`}
        >
            {labels[membership.status] ?? membership.status}
        </span>
    );
}

/* ── Gradient backgrounds per card index ── */
const CARD_GRADIENTS = [
    "from-orange-400 to-amber-300",
    "from-emerald-400 to-teal-300",
    "from-sky-400 to-cyan-300",
    "from-violet-400 to-purple-300",
    "from-rose-400 to-pink-300",
    "from-indigo-400 to-blue-300",
    "from-lime-400 to-green-300",
    "from-fuchsia-400 to-pink-300",
];

/* ── Main Component ── */
export function ChapterCardGrid({
    chapters,
    membershipMap,
    joinAction,
    leaveAction,
    chapterHeadNames,
    opportunityCounts,
}: {
    chapters: Chapter[];
    membershipMap: Map<string, ChapterMembership>;
    joinAction: (formData: FormData) => void | Promise<void>;
    leaveAction: (formData: FormData) => void | Promise<void>;
    chapterHeadNames?: Map<string, string>;
    opportunityCounts?: Map<string, number>;
}) {
    const [search, setSearch] = useState("");
    const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

    const filtered = chapters.filter((ch) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            ch.name.toLowerCase().includes(q) ||
            (ch.location?.toLowerCase().includes(q) ?? false)
        );
    });

    return (
        <>
            {/* ── Search ── */}
            <div className="mb-6">
                <div className="relative">
                    <svg
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search chapters by name or location…"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-gray-400 transition focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                </div>
            </div>

            {/* ── Subtitle ── */}
            <p className="mb-4 text-xs text-muted">
                {filtered.length} published chapter{filtered.length !== 1 ? "s" : ""}
            </p>

            {/* ── Grid ── */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center">
                    <p className="text-sm text-muted">
                        {search
                            ? "No chapters match your search."
                            : "No chapters are published yet. Please check back soon."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((ch, idx) => {
                        const membership = membershipMap.get(ch.id);
                        const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                        const opCount = opportunityCounts?.get(ch.id) ?? 0;

                        return (
                            <div
                                key={ch.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedChapter(ch)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedChapter(ch); } }}
                                className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md text-left overflow-hidden cursor-pointer"
                            >
                                {/* Gradient header */}
                                <div className={`h-24 w-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                                    <svg className="h-10 w-10 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    {/* Status badge */}
                                    <div className="mb-2">
                                        <StatusBadge membership={membership} />
                                    </div>

                                    {/* Chapter name */}
                                    <h3 className="font-manrope text-base font-semibold text-ink group-hover:text-orange-600 transition line-clamp-2">
                                        {ch.name}
                                    </h3>

                                    {/* Location */}
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {ch.location || "Location TBA"}
                                    </div>

                                    {/* Opportunity count */}
                                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                                        <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        {opCount} opportunit{opCount !== 1 ? "ies" : "y"}
                                    </div>

                                    {/* Action button */}
                                    <div className="mt-auto pt-4" onClick={(e) => e.stopPropagation()}>
                                        {!membership ? (
                                            <form action={joinAction}>
                                                <input type="hidden" name="chapterId" value={ch.id} />
                                                <button
                                                    type="submit"
                                                    className="w-full rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600"
                                                >
                                                    Join Chapter
                                                </button>
                                            </form>
                                        ) : membership.status === "removed" ? (
                                            <form action={joinAction}>
                                                <input type="hidden" name="chapterId" value={ch.id} />
                                                <button
                                                    type="submit"
                                                    className="w-full rounded-xl border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
                                                >
                                                    Rejoin Chapter
                                                </button>
                                            </form>
                                        ) : (
                                            <form action={leaveAction}>
                                                <input type="hidden" name="chapterId" value={ch.id} />
                                                <button
                                                    type="submit"
                                                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                                                >
                                                    Leave Chapter
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Modal ── */}
            {selectedChapter && (
                <ChapterModal
                    chapter={selectedChapter}
                    membership={membershipMap.get(selectedChapter.id)}
                    chapterHeadName={chapterHeadNames?.get(selectedChapter.chapterHeadUserId ?? "") ?? undefined}
                    joinAction={joinAction}
                    leaveAction={leaveAction}
                    onClose={() => setSelectedChapter(null)}
                />
            )}
        </>
    );
}
