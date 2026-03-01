"use client";

import { useState } from "react";
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="relative w-full max-w-md rounded-3xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="h-12 w-full rounded-t-3xl bg-gradient-to-br from-orange-400 to-amber-300" />
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 transition hover:bg-white hover:text-ink"
                    aria-label="Close"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
                <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
                    <h2 className="font-manrope text-lg font-bold text-ink">New Officer Role</h2>
                    <label className="text-xs font-semibold text-ink">
                        Role label <span className="text-orange-500">*</span>
                        <input
                            name="label"
                            className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                            placeholder="e.g. Operations Lead"
                            required
                        />
                    </label>
                    <div className="text-xs font-semibold text-ink">
                        Permissions
                        <PermissionSelect name="permissions" />
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:opacity-60"
                        >
                            {submitting ? "Creating…" : "Create role"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold text-muted transition hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
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

            {/* Floating add-role button */}
            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={() => setShowRoleModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                    Add Officer Role
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
