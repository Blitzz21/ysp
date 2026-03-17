"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Chapter, ChapterMembership } from "@/services/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/Toast";
import type { ChapterAction } from "./ChapterCardGrid";

type ChapterModalProps = {
    chapter: Chapter;
    membership?: ChapterMembership;
    chapterHeadName?: string;
    joinAction: ChapterAction;
    leaveAction: ChapterAction;
    onClose: () => void;
};

type PendingAction = "join" | "rejoin" | "leave" | null;

function getConfirmTitle(action: PendingAction): string {
    if (action === "leave") return "Leave Chapter";
    if (action === "rejoin") return "Rejoin Chapter";
    return "Join Chapter";
}

function getConfirmMessage(action: PendingAction, chapterName: string): string {
    if (action === "leave") return `Are you sure you want to leave ${chapterName}? You can rejoin later.`;
    if (action === "rejoin") return `Are you sure you want to rejoin ${chapterName}?`;
    return `Are you sure you want to join ${chapterName}?`;
}

function getStatusColor(status: string): string {
    if (status === "active") return "text-emerald-600";
    if (status === "pending") return "text-amber-600";
    return "text-red-500";
}

export function ChapterModal({
    chapter,
    membership,
    chapterHeadName,
    joinAction,
    leaveAction,
    onClose,
}: ChapterModalProps) {
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    // Focus close button on mount
    useEffect(() => {
        closeButtonRef.current?.focus();
    }, []);

    // Escape to close — only when confirm modal is NOT open
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !pendingAction) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [onClose, pendingAction]);

    const { toast } = useToast();

    const handleConfirm = async () => {
        if (!pendingAction) return;
        const fd = new FormData();
        fd.set("chapterId", chapter.id);
        const result = pendingAction === "leave"
            ? await leaveAction(fd)
            : await joinAction(fd);
        toast(result.message, result.ok ? "success" : "error");
        setPendingAction(null);
    };

    return createPortal(
        <>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                onClick={onClose}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="chapter-modal-title"
                    className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header gradient */}
                    <div className="h-20 w-full bg-gradient-to-br from-orange-400 to-amber-300" />

                    {/* Close button */}
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 transition hover:bg-white hover:text-ink"
                        aria-label="Close chapter details"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>

                    <div className="p-6">
                        {/* Chapter name */}
                        <h2 id="chapter-modal-title" className="font-manrope text-xl font-bold text-ink">
                            {chapter.name}
                        </h2>

                        {/* Location */}
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            {chapter.location || "Location TBA"}
                        </div>

                        {/* Details section */}
                        <div className="mt-5 space-y-3">
                            {/* Chapter Head */}
                            {chapterHeadName && (
                                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <div>
                                        <p className="text-xs font-medium text-muted">Chapter Head</p>
                                        <p className="text-sm font-semibold text-ink">{chapterHeadName}</p>
                                    </div>
                                </div>
                            )}

                            {/* Contact Email */}
                            {chapter.contactEmail && (
                                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                    <div>
                                        <p className="text-xs font-medium text-muted">Email</p>
                                        <a href={`mailto:${chapter.contactEmail}`} className="text-sm font-semibold text-orange-600 hover:underline">
                                            {chapter.contactEmail}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Contact Phone */}
                            {chapter.contactPhone && (
                                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                                    </svg>
                                    <div>
                                        <p className="text-xs font-medium text-muted">Phone</p>
                                        <a href={`tel:${chapter.contactPhone}`} className="text-sm font-semibold text-ink hover:underline">
                                            {chapter.contactPhone}
                                        </a>
                                    </div>
                                </div>
                            )}

                            {/* Facebook */}
                            {chapter.facebookUrl && (
                                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-3">
                                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                    <div>
                                        <p className="text-xs font-medium text-muted">Facebook</p>
                                        <a
                                            href={chapter.facebookUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-semibold text-orange-600 hover:underline"
                                        >
                                            Visit Page
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Membership status */}
                        {membership && (
                            <div className="mt-4 text-xs text-muted">
                                Status:{" "}
                                <span className={`font-semibold ${getStatusColor(membership.status)}`}>
                                    {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                                </span>
                                {" · "}
                                Joined {new Date(membership.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="mt-5 flex items-center gap-3">
                            {!membership ? (
                                <button
                                    type="button"
                                    onClick={() => setPendingAction("join")}
                                    className="flex-1 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
                                >
                                    Join Chapter
                                </button>
                            ) : membership.status === "removed" ? (
                                <button
                                    type="button"
                                    onClick={() => setPendingAction("rejoin")}
                                    className="flex-1 rounded-xl border border-orange-200 bg-white px-5 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                                >
                                    Rejoin Chapter
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setPendingAction("leave")}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-red-300 hover:text-red-600"
                                >
                                    Leave Chapter
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Confirm Modal ── */}
            {pendingAction && (
                <ConfirmModal
                    title={getConfirmTitle(pendingAction)}
                    message={getConfirmMessage(pendingAction, chapter.name)}
                    confirmLabel={getConfirmTitle(pendingAction)}
                    variant={pendingAction === "leave" ? "danger" : "primary"}
                    onConfirm={handleConfirm}
                    onCancel={() => setPendingAction(null)}
                />
            )}
        </>,
        document.body
    );
}
