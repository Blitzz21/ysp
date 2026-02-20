"use client";

import { useEffect, useRef, useId } from "react";

type ConfirmModalProps = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "primary" | "danger";
    onConfirm: () => void;
    onCancel: () => void;
};

export function ConfirmModal({
    title,
    message,
    confirmLabel = "Proceed",
    cancelLabel = "Cancel",
    variant = "primary",
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const uid = useId();
    const titleId = `confirm-title-${uid}`;
    const messageId = `confirm-message-${uid}`;

    /* ── Focus management & keyboard handling ── */
    useEffect(() => {
        // Focus the cancel button on mount for safer default
        cancelRef.current?.focus();

        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onCancel();
            }

            // Trap focus within the modal
            if (e.key === "Tab") {
                const dialog = overlayRef.current?.querySelector("[data-confirm-dialog]") as HTMLElement | null;
                if (!dialog) return;
                const focusable = dialog.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusable.length) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKey, true);
        return () => document.removeEventListener("keydown", handleKey, true);
    }, [onCancel]);

    const confirmColors =
        variant === "danger"
            ? "bg-red-500 hover:bg-red-600 shadow-sm"
            : "bg-orange-500 hover:bg-orange-600 shadow-glow";

    return (
        <div
            ref={overlayRef}
            onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={messageId}
                data-confirm-dialog
                className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200"
            >
                {/* Icon */}
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100" aria-hidden="true">
                    <svg
                        className="h-6 w-6 text-orange-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    </svg>
                </div>

                <h3 id={titleId} className="text-center font-manrope text-lg font-bold text-ink">
                    {title}
                </h3>
                <p id={messageId} className="mt-2 text-center text-sm text-muted">
                    {message}
                </p>

                <div className="mt-6 flex items-center gap-3">
                    <button
                        ref={cancelRef}
                        type="button"
                        onClick={onCancel}
                        className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-gray-300 hover:bg-gray-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${confirmColors}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
