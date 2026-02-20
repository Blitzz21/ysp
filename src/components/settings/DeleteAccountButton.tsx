"use client";

import { useState } from "react";

export function DeleteAccountButton() {
    const [showModal, setShowModal] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const canDelete = confirmText.toLowerCase() === "delete my account";

    async function handleDelete() {
        if (!canDelete) return;
        setConfirming(true);
        try {
            const res = await fetch("/api/auth/delete-account", {
                method: "DELETE",
            });
            if (res.ok) {
                window.location.href = "/login";
            } else {
                const data = await res.json().catch(() => null);
                alert(data?.message ?? "Unable to delete account. Please try again later.");
                setConfirming(false);
            }
        } catch {
            alert("Something went wrong. Please try again.");
            setConfirming(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="11" x2="10" y2="17" />
                    <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                Delete Account
            </button>

            {/* ── Delete Confirmation Modal ── */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                    onClick={() => !confirming && setShowModal(false)}
                >
                    <div
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Warning header */}
                        <div className="bg-red-500 px-6 py-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                                <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                    <line x1="12" y1="9" x2="12" y2="13" />
                                    <line x1="12" y1="17" x2="12.01" y2="17" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">Delete Account</h3>
                                <p className="text-sm text-red-100">This action is irreversible</p>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Warning content */}
                            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
                                <p className="text-sm font-semibold text-red-700 mb-2">
                                    ⚠️ Warning: You are about to permanently delete your account.
                                </p>
                                <ul className="space-y-1.5 text-xs text-red-600">
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 shrink-0">•</span>
                                        Your account and all associated data will be <strong>permanently deleted</strong>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 shrink-0">•</span>
                                        All your chapter memberships and opportunity sign-ups will be removed
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 shrink-0">•</span>
                                        Your profile information, including any uploaded avatars, will be erased
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="mt-0.5 shrink-0">•</span>
                                        <strong>This action cannot be undone</strong> and your data cannot be recovered
                                    </li>
                                </ul>
                            </div>

                            {/* Confirmation input */}
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-ink">
                                    To confirm, type <span className="font-bold text-red-600">&quot;delete my account&quot;</span> below:
                                </label>
                                <input
                                    type="text"
                                    value={confirmText}
                                    onChange={(e) => setConfirmText(e.target.value)}
                                    placeholder="delete my account"
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-400 transition focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                    autoComplete="off"
                                    disabled={confirming}
                                />
                            </div>

                            {/* Buttons */}
                            <div className="mt-5 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={!canDelete || confirming}
                                    className={`flex-1 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition ${canDelete && !confirming
                                            ? "bg-red-600 hover:bg-red-700"
                                            : "bg-red-300 cursor-not-allowed"
                                        }`}
                                >
                                    {confirming ? "Deleting..." : "Permanently Delete Account"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    disabled={confirming}
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
