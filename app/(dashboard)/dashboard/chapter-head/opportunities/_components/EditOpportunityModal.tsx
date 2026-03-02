"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import { SdgMultiSelect } from "@/components/ui/SdgMultiSelect";
import type { VolunteerOpportunity } from "@/services/types";

interface EditOpportunityModalProps {
    opportunity: VolunteerOpportunity;
    existingImageUrl?: string | null;
    onClose: () => void;
    updateAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
    deleteAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STEPS = [
    { key: "details", label: "Details", desc: "Title, date, and description" },
    { key: "media", label: "Media", desc: "Upload or change image" },
    { key: "settings", label: "Settings", desc: "Status, contacts, capacity" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

function toDateTimeLocalValue(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const yyyy = parsed.getFullYear();
    const mm = `${parsed.getMonth() + 1}`.padStart(2, "0");
    const dd = `${parsed.getDate()}`.padStart(2, "0");
    const hh = `${parsed.getHours()}`.padStart(2, "0");
    const min = `${parsed.getMinutes()}`.padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function EditOpportunityModal({
    opportunity,
    existingImageUrl,
    onClose,
    updateAction,
    deleteAction,
}: EditOpportunityModalProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<StepKey>("details");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(existingImageUrl ?? null);
    const [dragOver, setDragOver] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const stepIndex = STEPS.findIndex((s) => s.key === step);

    /* ── Image handling ── */
    const handleFile = useCallback(
        (file: File) => {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                toast("Only JPG, PNG, and WebP images are supported.", "error");
                return;
            }
            if (file.size > MAX_FILE_SIZE) {
                toast("Image must be under 5 MB.", "error");
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        },
        [toast]
    );

    function onDrop(e: DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }

    function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }

    function removeImage() {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    /* ── Validation ── */
    function validateStep(which: StepKey): boolean {
        const form = formRef.current;
        if (!form) return false;
        if (which === "details") {
            const title = (form.elements.namedItem("title") as HTMLInputElement)?.value?.trim();
            const eventDate = (form.elements.namedItem("eventDate") as HTMLInputElement)?.value;
            const desc = (form.elements.namedItem("description") as HTMLTextAreaElement)?.value?.trim();
            if (!title || !eventDate || !desc) {
                toast("Please fill in all required fields before continuing.", "error");
                return false;
            }
        }
        return true;
    }

    /* ── Navigation ── */
    function goNext() {
        if (!validateStep(step)) return;
        const idx = STEPS.findIndex((s) => s.key === step);
        if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
    }

    function goPrev() {
        const idx = STEPS.findIndex((s) => s.key === step);
        if (idx > 0) setStep(STEPS[idx - 1].key);
    }

    function goToStep(target: StepKey) {
        const targetIdx = STEPS.findIndex((s) => s.key === target);
        if (targetIdx <= stepIndex) { setStep(target); return; }
        for (let i = stepIndex; i < targetIdx; i++) {
            if (!validateStep(STEPS[i].key)) return;
        }
        setStep(target);
    }

    /* ── Submit ── */
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        formData.set("id", opportunity.id);
        if (imageFile) formData.set("imageFile", imageFile);
        try {
            const result = await updateAction(formData);
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

    /* ── Delete ── */
    async function handleDelete() {
        if (submitting) return;
        setSubmitting(true);
        const formData = new FormData();
        formData.set("id", opportunity.id);
        try {
            const result = await deleteAction(formData);
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

    const isLast = stepIndex === STEPS.length - 1;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="edit-opp-title"
                className="relative flex w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
                style={{ maxHeight: "min(90vh, 680px)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Left step sidebar ── */}
                <div className="hidden w-56 shrink-0 border-r border-gray-100 bg-gray-50/60 p-6 md:flex md:flex-col md:justify-between">
                    <div>
                        <h2
                            id="edit-opp-title"
                            className="font-manrope text-lg font-bold text-ink"
                        >
                            Edit opportunity
                        </h2>
                        <nav className="mt-6 space-y-1" aria-label="Form steps">
                            {STEPS.map((s, i) => {
                                const isActive = s.key === step;
                                const isPast = i < stepIndex;
                                return (
                                    <button
                                        key={s.key}
                                        type="button"
                                        onClick={() => goToStep(s.key)}
                                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${isActive
                                            ? "bg-white shadow-sm"
                                            : "hover:bg-white/60"
                                            }`}
                                    >
                                        <span
                                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${isActive
                                                ? "bg-orange-500 text-white"
                                                : isPast
                                                    ? "bg-emerald-100 text-emerald-600"
                                                    : "bg-gray-200 text-gray-500"
                                                }`}
                                        >
                                            {isPast ? (
                                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                i + 1
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <span className={`block text-sm font-semibold ${isActive ? "text-ink" : "text-muted"}`}>{s.label}</span>
                                            <span className="block text-[11px] text-muted">{s.desc}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Delete zone */}
                    <div className="mt-4 border-t border-gray-200 pt-4">
                        {confirmDelete ? (
                            <div className="space-y-2">
                                <p className="text-xs text-red-600 font-medium">Delete this opportunity?</p>
                                <div className="flex gap-2">
                                    <button type="button" onClick={handleDelete} disabled={submitting} className="flex-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                                        {submitting ? "Deleting…" : "Confirm"}
                                    </button>
                                    <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-muted hover:bg-gray-50">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => setConfirmDelete(true)}
                                className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                                Delete opportunity
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Right content area ── */}
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* Mobile header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 md:py-3">
                        <div className="md:hidden">
                            <h2 className="font-manrope text-lg font-bold text-ink">Edit opportunity</h2>
                            <p className="text-xs text-muted">
                                Step {stepIndex + 1} of {STEPS.length} — {STEPS[stepIndex].label}
                            </p>
                        </div>
                        <p className="hidden text-sm text-muted md:block">{STEPS[stepIndex].desc}</p>
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

                    {/* Form */}
                    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
                        <div className="flex-1 px-6 py-5">
                            {/* Step 1: Details */}
                            <div className={step === "details" ? "space-y-5" : "hidden"}>
                                <label className="block text-sm font-medium text-ink">
                                    Title <span className="text-orange-500">*</span>
                                    <input
                                        name="title"
                                        defaultValue={opportunity.title}
                                        placeholder="Add a title"
                                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        maxLength={128}
                                        required
                                    />
                                </label>
                                <label className="block text-sm font-medium text-ink">
                                    Event date/time <span className="text-orange-500">*</span>
                                    <input
                                        name="eventDate"
                                        type="datetime-local"
                                        defaultValue={toDateTimeLocalValue(opportunity.eventDate)}
                                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        required
                                    />
                                </label>
                                <label className="block text-sm font-medium text-ink">
                                    Description <span className="text-orange-500">*</span>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        maxLength={1024}
                                        defaultValue={opportunity.description}
                                        placeholder="Describe the opportunity..."
                                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        required
                                    />
                                </label>
                                <div className="text-sm font-medium text-ink">
                                    SDG tags <span className="text-orange-500">*</span>
                                    <div className="mt-1.5">
                                        <SdgMultiSelect name="sdgs" defaultValue={opportunity.sdgs} required />
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Media */}
                            <div className={step === "media" ? "space-y-5" : "hidden"}>
                                <p className="text-sm text-muted">Change or upload a cover image for this opportunity.</p>
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition ${dragOver
                                        ? "border-orange-400 bg-orange-50/50"
                                        : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                                        }`}
                                >
                                    {imagePreview ? (
                                        <div className="relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element -- blob preview URL */}
                                            <img src={imagePreview} alt="Preview" className="h-40 w-auto rounded-lg object-cover" />
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); removeImage(); }}
                                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                                                aria-label="Remove image"
                                            >
                                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m-4 4l4-4 4 4M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                            </svg>
                                            <p className="mt-3 text-sm text-muted">
                                                Drag & drop an image here, or <span className="font-medium text-orange-500">browse</span>
                                            </p>
                                            <p className="mt-1 text-xs text-muted">JPG, PNG, WebP · Max 5 MB</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="hidden"
                                    onChange={onFileChange}
                                />
                            </div>

                            {/* Step 3: Settings */}
                            <div className={step === "settings" ? "space-y-5" : "hidden"}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block text-sm font-medium text-ink">
                                        Status
                                        <select
                                            name="published"
                                            defaultValue={opportunity.published ? "true" : "false"}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                                        >
                                            <option value="false">Draft</option>
                                            <option value="true">Published</option>
                                        </select>
                                    </label>
                                    <label className="block text-sm font-medium text-ink">
                                        Contact name
                                        <input
                                            name="signupContactName"
                                            defaultValue={opportunity.signupContactName ?? ""}
                                            maxLength={128}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                    </label>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block text-sm font-medium text-ink">
                                        Contact email
                                        <input
                                            name="signupContactEmail"
                                            type="email"
                                            defaultValue={opportunity.signupContactEmail ?? ""}
                                            maxLength={256}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                    </label>
                                    <label className="block text-sm font-medium text-ink">
                                        Contact phone
                                        <input
                                            name="signupContactPhone"
                                            defaultValue={opportunity.signupContactPhone ?? ""}
                                            maxLength={64}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                    </label>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    <label className="block text-sm font-medium text-ink">
                                        Capacity needed
                                        <input
                                            name="capacity"
                                            type="number"
                                            min={0}
                                            defaultValue={String(opportunity.capacity)}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                    </label>
                                    <label className="block text-sm font-medium text-ink">
                                        Current volunteers
                                        <input
                                            name="currentVolunteers"
                                            type="number"
                                            min={0}
                                            defaultValue={String(opportunity.currentVolunteers)}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                    </label>
                                    <label className="block text-sm font-medium text-ink">
                                        Waitlist
                                        <select
                                            name="waitlistEnabled"
                                            defaultValue={opportunity.waitlistEnabled ? "true" : "false"}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                                        >
                                            <option value="false">Disabled</option>
                                            <option value="true">Enabled</option>
                                        </select>
                                    </label>
                                </div>

                                {/* Mobile delete */}
                                <div className="md:hidden border-t border-gray-100 pt-4">
                                    {confirmDelete ? (
                                        <div className="flex gap-2">
                                            <button type="button" onClick={handleDelete} disabled={submitting} className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60">
                                                {submitting ? "Deleting…" : "Confirm delete"}
                                            </button>
                                            <button type="button" onClick={() => setConfirmDelete(false)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-muted hover:bg-gray-50">
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button type="button" onClick={() => setConfirmDelete(true)} className="w-full rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50">
                                            Delete opportunity
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={stepIndex === 0 ? onClose : goPrev}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-muted transition hover:bg-gray-50 hover:text-ink"
                            >
                                {stepIndex === 0 ? "Cancel" : "Back"}
                            </button>
                            {isLast ? (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-lg bg-ink px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? "Saving…" : "Save changes"}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={goNext}
                                    className="rounded-lg bg-ink px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
                                >
                                    Continue
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
}
