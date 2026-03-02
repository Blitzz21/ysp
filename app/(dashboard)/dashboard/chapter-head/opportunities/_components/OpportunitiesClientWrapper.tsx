"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { CreateOpportunityModal } from "./CreateOpportunityModal";
import { EditOpportunityModal } from "./EditOpportunityModal";
import type { VolunteerOpportunity } from "@/services/types";

/* ── Appwrite storage URL helper ── */
function getOpportunityImageUrl(fileId: string): string {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
    return `${endpoint}/storage/buckets/696dac0d0000f9557fbd/files/${fileId}/preview?project=${projectId}&width=400&output=webp`;
}

/* ── Opportunity Card (client, interactive) ── */
function OpportunityCardClient({
    opportunity,
    onEdit,
    onDelete,
}: {
    opportunity: VolunteerOpportunity;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const imageUrl = opportunity.imageFileId
        ? getOpportunityImageUrl(opportunity.imageFileId)
        : null;

    return (
        <div className="group flex flex-col sm:flex-row items-stretch gap-0 rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md overflow-hidden">
            {/* Image thumbnail */}
            {imageUrl ? (
                <div className="sm:w-36 md:w-44 shrink-0 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element -- dynamic Appwrite storage URL */}
                    <img
                        src={imageUrl}
                        alt={opportunity.title}
                        className="h-32 sm:h-full w-full object-cover"
                    />
                </div>
            ) : (
                <div className="hidden sm:flex sm:w-36 md:w-44 shrink-0 items-center justify-center bg-gray-50">
                    <svg className="h-8 w-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                </div>
            )}

            {/* Content */}
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="truncate font-manrope text-sm font-semibold text-ink">
                            {opportunity.title}
                        </h3>
                        <span
                            className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium ${opportunity.published
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                                }`}
                        >
                            {opportunity.published ? "Published" : "Draft"}
                        </span>
                    </div>
                    <p className="mt-1 text-xs text-muted">
                        {new Date(opportunity.eventDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}
                        {opportunity.currentVolunteers}/{opportunity.capacity || "∞"} volunteers
                    </p>
                    {opportunity.description && (
                        <p className="mt-1 truncate text-xs text-muted max-w-md">
                            {opportunity.description}
                        </p>
                    )}
                </div>

                {/* Action icons */}
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={onEdit}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-ink"
                        aria-label="Edit opportunity"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete opportunity"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main wrapper ── */
interface OpportunitiesClientWrapperProps {
    children?: React.ReactNode;
    opportunities: VolunteerOpportunity[];
    createAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
    updateAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
    deleteAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
}

export function OpportunitiesClientWrapper({
    opportunities,
    createAction,
    updateAction,
    deleteAction,
}: OpportunitiesClientWrapperProps) {
    const { toast } = useToast();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editOpp, setEditOpp] = useState<VolunteerOpportunity | null>(null);

    async function handleQuickDelete(opp: VolunteerOpportunity) {
        if (!confirm(`Delete "${opp.title}"? This action cannot be undone.`)) return;
        const formData = new FormData();
        formData.set("id", opp.id);
        try {
            const result = await deleteAction(formData);
            toast(result.message, result.ok ? "success" : "error");
        } catch {
            toast("An unexpected error occurred.", "error");
        }
    }

    return (
        <>
            <div className="mb-6 flex items-center justify-end">
                <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600"
                >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                    New Opportunity
                </button>
            </div>

            {opportunities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted">
                    No opportunities yet. Click &quot;New Opportunity&quot; above to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {opportunities.map((opp) => (
                        <OpportunityCardClient
                            key={opp.id}
                            opportunity={opp}
                            onEdit={() => setEditOpp(opp)}
                            onDelete={() => handleQuickDelete(opp)}
                        />
                    ))}
                </div>
            )}

            {showCreateModal && (
                <CreateOpportunityModal
                    onClose={() => setShowCreateModal(false)}
                    createAction={createAction}
                />
            )}

            {editOpp && (
                <EditOpportunityModal
                    opportunity={editOpp}
                    existingImageUrl={
                        editOpp.imageFileId
                            ? getOpportunityImageUrl(editOpp.imageFileId)
                            : null
                    }
                    onClose={() => setEditOpp(null)}
                    updateAction={updateAction}
                    deleteAction={deleteAction}
                />
            )}
        </>
    );
}

/**
 * Client wrapper for forms that submit server actions and show toast feedback.
 */
export function ToastForm({
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
