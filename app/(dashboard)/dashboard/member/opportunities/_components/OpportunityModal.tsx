"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { VolunteerOpportunity } from "@/services/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

import { getFileViewUrl } from "@/lib/imageUrl";

/* ── Helpers ── */

function formatEventDate(value: string): string {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
    });
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

export function OpportunityModal({
    opportunity,
    chapterName,
    joinAction,
    isJoined = false,
    onClose,
}: {
    opportunity: VolunteerOpportunity;
    chapterName: string;
    joinAction: (formData: FormData) => Promise<void>;
    isJoined?: boolean;
    onClose: () => void;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [joinState, setJoinState] = useState<"idle" | "loading" | "joined" | "waitlisted" | "error">(isJoined ? "joined" : "idle");
    const [statusMessage, setStatusMessage] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);

    const isFull = opportunity.capacity > 0 && opportunity.currentVolunteers >= opportunity.capacity;
    const canJoin = !isFull || opportunity.waitlistEnabled;

    // Close on Escape — only when confirm modal is NOT open
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape" && !showConfirm) onClose();
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose, showConfirm]);

    // Close on overlay click
    function handleOverlayClick(e: React.MouseEvent) {
        if (e.target === overlayRef.current) onClose();
    }

    async function handleJoin() {
        setShowConfirm(false);
        setJoinState("loading");
        setStatusMessage("");
        try {
            const fd = new FormData();
            fd.set("opportunityId", opportunity.id);
            await joinAction(fd);
            setJoinState("joined");
            setStatusMessage("You've successfully joined this opportunity!");
        } catch (err) {
            setJoinState("error");
            setStatusMessage(
                err instanceof Error ? err.message : "Unable to join. Please try again."
            );
        }
    }

    const pct =
        opportunity.capacity > 0
            ? Math.min((opportunity.currentVolunteers / opportunity.capacity) * 100, 100)
            : 0;

    return createPortal(
        <>
            <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="opportunity-modal-title"
                    className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200 md:p-8"
                >
                    {/* Close button */}
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-ink"
                        aria-label="Close"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </svg>
                    </button>

                    {/* Images */}
                    {opportunity.imageFileIds && opportunity.imageFileIds.length > 0 && (
                        <div className="mb-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8">
                            {opportunity.imageFileIds.length === 1 ? (
                                // eslint-disable-next-line @next/next/no-img-element -- Appwrite storage URL
                                <img
                                    src={getFileViewUrl(opportunity.imageFileIds[0])}
                                    alt={opportunity.title}
                                    className="h-48 w-full object-cover"
                                />
                            ) : (
                                <div className="flex gap-1 overflow-x-auto">
                                    {opportunity.imageFileIds.map((fileId, i) => (
                                        // eslint-disable-next-line @next/next/no-img-element -- Appwrite storage URL
                                        <img
                                            key={fileId}
                                            src={getFileViewUrl(fileId)}
                                            alt={`${opportunity.title} ${i + 1}`}
                                            className="h-48 w-auto shrink-0 object-cover first:rounded-tl-3xl last:rounded-tr-3xl"
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status badge */}
                    <div className="mb-4 flex items-center gap-2">
                        <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isFull
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                                }`}
                        >
                            {isFull ? (opportunity.waitlistEnabled ? "Waitlist Open" : "Full") : "Open for Signups"}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 id="opportunity-modal-title" className="font-manrope text-xl font-bold text-ink pr-8">
                        {opportunity.title}
                    </h2>

                    {/* Meta */}
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
                        <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            {formatEventDate(opportunity.eventDate)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            {chapterName}
                        </span>
                    </div>

                    {/* Description */}
                    {opportunity.description && (
                        <div className="mt-5">
                            <h3 className="text-sm font-semibold text-ink">About this opportunity</h3>
                            <p className="mt-2 text-sm text-muted leading-relaxed whitespace-pre-line">
                                {opportunity.description}
                            </p>
                        </div>
                    )}

                    {/* SDGs */}
                    {opportunity.sdgs && opportunity.sdgs.length > 0 && (
                        <div className="mt-5">
                            <h3 className="text-sm font-semibold text-ink">SDG Alignment</h3>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {opportunity.sdgs.map((tag) => (
                                    <span
                                        key={tag}
                                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getSdgColor(tag)}`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact info */}
                    {(opportunity.signupContactName || opportunity.signupContactEmail || opportunity.signupContactPhone) && (
                        <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50/70 p-4">
                            <h3 className="text-sm font-semibold text-ink">Contact Information</h3>
                            <div className="mt-2 space-y-1 text-sm text-muted">
                                {opportunity.signupContactName && (
                                    <p>{opportunity.signupContactName}</p>
                                )}
                                {opportunity.signupContactEmail && (
                                    <p>{opportunity.signupContactEmail}</p>
                                )}
                                {opportunity.signupContactPhone && (
                                    <p>{opportunity.signupContactPhone}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Capacity bar */}
                    <div className="mt-5">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-ink">Volunteer Capacity</span>
                            <span className="text-muted">
                                {opportunity.currentVolunteers}/{opportunity.capacity}
                            </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                                role="progressbar"
                                aria-valuenow={opportunity.currentVolunteers}
                                aria-valuemin={0}
                                aria-valuemax={opportunity.capacity}
                                aria-label={`${opportunity.currentVolunteers} of ${opportunity.capacity} volunteer spots filled`}
                                className={`h-full rounded-full transition-all ${isFull ? "bg-red-400" : "bg-orange-400"}`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Status message */}
                    {statusMessage && (
                        <div
                            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${joinState === "error"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-green-200 bg-green-50 text-green-700"
                                }`}
                        >
                            {statusMessage}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-gray-300 hover:bg-gray-50"
                        >
                            Close
                        </button>
                        {joinState === "joined" || isJoined ? (
                            <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-5 py-2.5 text-sm font-semibold text-emerald-700">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                Already Joined
                            </div>
                        ) : canJoin ? (
                            <button
                                type="button"
                                onClick={() => setShowConfirm(true)}
                                disabled={joinState === "loading"}
                                className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:opacity-60"
                            >
                                {joinState === "loading"
                                    ? "Joining…"
                                    : isFull
                                        ? "Join Waitlist"
                                        : "Join Opportunity"}
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* ── Confirm Modal ── */}
            {showConfirm && (
                <ConfirmModal
                    title={isFull ? "Join Waitlist" : "Join Opportunity"}
                    message={
                        isFull
                            ? `This opportunity is full. Would you like to join the waitlist for "${opportunity.title}"?`
                            : `Are you sure you want to join "${opportunity.title}"?`
                    }
                    confirmLabel={isFull ? "Join Waitlist" : "Join Now"}
                    onConfirm={handleJoin}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
        </>,
        document.body
    );
}
