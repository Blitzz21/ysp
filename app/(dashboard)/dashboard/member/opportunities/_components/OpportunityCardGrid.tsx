"use client";

import { useState } from "react";
import type { VolunteerOpportunity } from "@/services/types";
import { OpportunityModal } from "./OpportunityModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

/* ── Helpers ── */
function formatEventDate(value: string): string {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getSdgColor(tag: string): string {
    const idx = parseInt(tag.replace(/\D/g, ""), 10) || 0;
    const colors = [
        "bg-rose-100 text-rose-700",
        "bg-amber-100 text-amber-700",
        "bg-emerald-100 text-emerald-700",
        "bg-sky-100 text-sky-700",
        "bg-violet-100 text-violet-700",
        "bg-pink-100 text-pink-700",
        "bg-teal-100 text-teal-700",
        "bg-indigo-100 text-indigo-700",
    ];
    return colors[idx % colors.length];
}

const SDG_GRADIENTS = [
    "from-rose-500 to-pink-400",
    "from-amber-500 to-yellow-400",
    "from-emerald-500 to-teal-400",
    "from-sky-500 to-cyan-400",
    "from-violet-500 to-purple-400",
    "from-pink-500 to-fuchsia-400",
    "from-teal-500 to-green-400",
    "from-indigo-500 to-blue-400",
    "from-orange-500 to-amber-400",
    "from-lime-500 to-emerald-400",
];

function getSdgGradient(sdgs: string[]): string {
    if (!sdgs || sdgs.length === 0) return "from-gray-400 to-gray-300";
    const idx = parseInt(sdgs[0].replace(/\D/g, ""), 10) || 0;
    return SDG_GRADIENTS[idx % SDG_GRADIENTS.length];
}

function CapacityBar({ current, total }: { current: number; total: number }) {
    const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    const isFull = total > 0 && current >= total;

    return (
        <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-muted">
                <span>
                    {current}/{total} volunteers
                </span>
                {isFull && (
                    <span className="font-semibold text-red-500">Full</span>
                )}
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                    role="progressbar"
                    aria-valuenow={current}
                    aria-valuemin={0}
                    aria-valuemax={total}
                    aria-label={`${current} of ${total} volunteer spots filled`}
                    className={`h-full rounded-full transition-all ${isFull ? "bg-red-400" : "bg-orange-400"}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ── Types ── */
type PendingJoin = {
    opportunityId: string;
    opportunityTitle: string;
};

/* ── Main Component ── */
export function OpportunityCardGrid({
    opportunities,
    chapterNameById,
    joinAction,
}: {
    opportunities: VolunteerOpportunity[];
    chapterNameById: Map<string, string>;
    joinAction: (formData: FormData) => Promise<void>;
}) {
    const [search, setSearch] = useState("");
    const [selectedOp, setSelectedOp] = useState<VolunteerOpportunity | null>(null);
    const [pendingJoin, setPendingJoin] = useState<PendingJoin | null>(null);

    const filtered = opportunities.filter((op) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            op.title.toLowerCase().includes(q) ||
            op.description?.toLowerCase().includes(q) ||
            (chapterNameById.get(op.chapterId) ?? "").toLowerCase().includes(q) ||
            op.sdgs?.some((s) => s.toLowerCase().includes(q))
        );
    });

    const handleConfirmJoin = async () => {
        if (!pendingJoin) return;
        const fd = new FormData();
        fd.set("opportunityId", pendingJoin.opportunityId);
        await joinAction(fd);
        setPendingJoin(null);
    };

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
                        placeholder="Search opportunities by title, chapter, or SDG…"
                        aria-label="Search opportunities"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-gray-400 transition focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100"
                    />
                </div>
            </div>

            {/* ── Grid ── */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-10 text-center">
                    <p className="text-sm text-muted">
                        {search ? "No opportunities match your search." : "No opportunities available right now."}
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((op) => {
                        const chapterName = chapterNameById.get(op.chapterId) ?? "—";
                        const isFull = op.capacity > 0 && op.currentVolunteers >= op.capacity;
                        const canJoin = !isFull || op.waitlistEnabled;

                        return (
                            <div
                                key={op.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedOp(op)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedOp(op); } }}
                                className="group relative flex flex-col rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:border-orange-200 hover:shadow-md overflow-hidden cursor-pointer"
                            >
                                {/* Image / Gradient header */}
                                <div className={`relative h-28 w-full bg-gradient-to-br ${getSdgGradient(op.sdgs)} flex items-center justify-center`}>
                                    <svg className="h-10 w-10 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                                        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                                    </svg>
                                </div>

                                <div className="flex flex-1 flex-col p-5">
                                    {/* Status badge */}
                                    <div className="mb-3 flex items-center gap-2">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isFull
                                                ? "bg-red-100 text-red-700"
                                                : "bg-green-100 text-green-700"
                                                }`}
                                        >
                                            {isFull ? (op.waitlistEnabled ? "Waitlist" : "Full") : "Open"}
                                        </span>
                                        <span className="text-xs text-muted">{formatEventDate(op.eventDate)}</span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="font-manrope text-base font-semibold text-ink group-hover:text-orange-600 transition line-clamp-2">
                                        {op.title}
                                    </h3>

                                    {/* Chapter */}
                                    <p className="mt-1 text-xs text-muted">{chapterName}</p>

                                    {/* Description preview */}
                                    {op.description && (
                                        <p className="mt-2 text-xs text-muted line-clamp-2">{op.description}</p>
                                    )}

                                    {/* SDG tags */}
                                    {op.sdgs && op.sdgs.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {op.sdgs.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getSdgColor(tag)}`}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {op.sdgs.length > 3 && (
                                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                                                    +{op.sdgs.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Capacity bar */}
                                    <div className="mt-auto pt-3">
                                        <CapacityBar current={op.currentVolunteers} total={op.capacity} />
                                    </div>

                                    {/* Join Now button (visible on all viewports) */}
                                    {canJoin && (
                                        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                type="button"
                                                onClick={() => setPendingJoin({ opportunityId: op.id, opportunityTitle: op.title })}
                                                className="w-full rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600"
                                            >
                                                {isFull ? "Join Waitlist" : "Join Now"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Opportunity Detail Modal ── */}
            {selectedOp && (
                <OpportunityModal
                    opportunity={selectedOp}
                    chapterName={chapterNameById.get(selectedOp.chapterId) ?? "—"}
                    joinAction={joinAction}
                    onClose={() => setSelectedOp(null)}
                />
            )}

            {/* ── Confirm Modal ── */}
            {pendingJoin && (
                <ConfirmModal
                    title="Join Opportunity"
                    message={`Are you sure you want to join "${pendingJoin.opportunityTitle}"?`}
                    confirmLabel="Join Now"
                    onConfirm={handleConfirmJoin}
                    onCancel={() => setPendingJoin(null)}
                />
            )}
        </>
    );
}
