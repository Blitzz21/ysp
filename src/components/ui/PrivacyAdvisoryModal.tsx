"use client";

import { useEffect, useRef, useCallback } from "react";

interface PrivacyAdvisoryModalProps {
    open: boolean;
    onClose: () => void;
}

export function PrivacyAdvisoryModal({ open, onClose }: PrivacyAdvisoryModalProps) {
    const dialogRef = useRef<HTMLDialogElement | null>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        if (open && !dialog.open) {
            dialog.showModal();
        } else if (!open && dialog.open) {
            dialog.close();
        }
    }, [open]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        },
        [onClose]
    );

    const handleBackdropClick = useCallback(
        (e: React.MouseEvent<HTMLDialogElement>) => {
            if (e.target === dialogRef.current) {
                onClose();
            }
        },
        [onClose]
    );

    if (!open) return null;

    return (
        <dialog
            ref={dialogRef}
            className="m-auto rounded-[20px] bg-white p-0 shadow-2xl w-[90vw] max-w-[600px] backdrop:bg-[#0c1230]/45 backdrop:backdrop-blur-[4px] animate-[authFadeIn_0.25s_ease_both]"
            onKeyDown={handleKeyDown}
            onClick={handleBackdropClick}
            aria-labelledby="privacy-modal-title"
        >
            <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                    <h2 id="privacy-modal-title" className="font-manrope text-xl font-bold text-ink">
                        Privacy Advisory and Data Consent
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-shrink-0 grid place-items-center w-9 h-9 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors"
                        aria-label="Close privacy advisory"
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>

                <div className="privacy-modal__body">
                    <p className="text-sm font-semibold text-muted">Privacy Advisory and Data Consent</p>

                    <p className="mt-4 text-sm text-ink leading-relaxed">
                        By submitting this YSP Membership Form, you voluntarily provide personal information
                        and consent to its collection, use, processing, and storage by Youth Service
                        Philippines (YSP). Your information will be used solely for legitimate organizational
                        purposes, including but not limited to:
                    </p>

                    <ul className="mt-4 list-disc pl-6 text-sm text-ink leading-relaxed space-y-1">
                        <li>Membership registration and verification</li>
                        <li>Coordination of youth programs, projects, and activities</li>
                        <li>Engagement, communication, and updates related to YSP initiatives</li>
                        <li>Monitoring, evaluation, and reporting of youth engagement and impact</li>
                    </ul>

                    <p className="mt-4 text-sm text-ink leading-relaxed">
                        YSP may also use aggregated or anonymized data for research, program
                        improvement, advocacy, partnerships, and reporting, provided that such use does not
                        identify you personally.
                    </p>

                    <p className="mt-4 text-sm text-ink leading-relaxed">
                        Your data will not be sold or shared with unauthorized third parties and will be handled
                        in accordance with applicable data privacy laws. Reasonable safeguards are in place
                        to protect your information from unauthorized access, misuse, or disclosure.
                    </p>

                    <p className="mt-4 text-sm text-ink leading-relaxed font-medium">
                        By proceeding, you affirm that the information provided is accurate and that you agree
                        to this Privacy Advisory and Data Consent.
                    </p>
                </div>
            </div>
        </dialog>
    );
}
