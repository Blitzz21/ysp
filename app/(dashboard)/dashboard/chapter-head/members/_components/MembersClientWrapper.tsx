"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import { PermissionSelect } from "@/components/dashboard/PermissionSelect";

interface CreateRoleModalProps {
    onClose: () => void;
    createAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
}

function CreateRoleModal({ onClose, createAction }: CreateRoleModalProps) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const result = await createAction(formData);
            if (result.ok) {
                toast(result.message, "success");
                onClose();
            } else {
                toast(result.message, "error");
            }
        } catch {
            toast("An unexpected error occurred.", "error");
        } finally {
            setSubmitting(false);
        }
    }

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-md rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <div>
                        <h2 className="font-manrope text-lg font-bold text-ink">
                            New officer role
                        </h2>
                        <p className="mt-0.5 text-xs text-muted">
                            Define a role and its permissions
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-ink"
                        aria-label="Close"
                    >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-5">
                    <label className="block text-sm font-medium text-ink">
                        Role label <span className="text-orange-500">*</span>
                        <input
                            name="label"
                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                            placeholder="e.g. Operations Lead"
                            required
                        />
                    </label>
                    <div className="text-sm font-medium text-ink">
                        Permissions
                        <div className="mt-1.5">
                            <PermissionSelect name="permissions" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-muted transition hover:bg-gray-50 hover:text-ink"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-ink px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
                        >
                            {submitting ? "Creating…" : "Create role"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

/* ── Members Client Wrapper ── */

interface MembersClientWrapperProps {
    children: React.ReactNode;
    createRoleAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
}

export function MembersClientWrapper({
    children,
    createRoleAction,
}: MembersClientWrapperProps) {
    const [showRoleModal, setShowRoleModal] = useState(false);

    return (
        <>
            {children}

            {/* Add-role button */}
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowRoleModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                    Add officer role
                </button>
            </div>

            {showRoleModal && (
                <CreateRoleModal
                    onClose={() => setShowRoleModal(false)}
                    createAction={createRoleAction}
                />
            )}
        </>
    );
}

/* ── Toast Form ── */

export function MemberToastForm({
    action,
    children,
    className,
}: {
    action: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
    children: React.ReactNode;
    className?: string;
}) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            const result = await action(formData);
            toast(result.message, result.ok ? "success" : "error");
        } catch {
            toast("An unexpected error occurred.", "error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className={className}>
            {children}
        </form>
    );
}
