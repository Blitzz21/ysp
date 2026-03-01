"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { CreateOpportunityModal } from "./CreateOpportunityModal";

interface OpportunitiesClientWrapperProps {
    children: React.ReactNode;
    createAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
}

export function OpportunitiesClientWrapper({
    children,
    createAction,
}: OpportunitiesClientWrapperProps) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div className="mb-6 flex items-center justify-end">
                <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New Opportunity
                </button>
            </div>

            {children}

            {showModal && (
                <CreateOpportunityModal
                    onClose={() => setShowModal(false)}
                    createAction={createAction}
                />
            )}
        </>
    );
}

/**
 * Client wrapper for forms that submit server actions and show toast feedback.
 * Wraps a <form> and intercepts submission to show toast.
 */
export function ToastForm({
    action,
    successMessage,
    children,
    className,
}: {
    action: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
    successMessage?: string;
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
