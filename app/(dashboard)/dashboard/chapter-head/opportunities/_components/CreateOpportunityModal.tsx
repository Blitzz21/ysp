"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/components/ui/Toast";
import { SdgMultiSelect } from "@/components/ui/SdgMultiSelect";

interface CreateOpportunityModalProps {
    onClose: () => void;
    createAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const STEPS = [
    { key: "details", label: "Details", desc: "Title, date, and description" },
    { key: "media", label: "Media", desc: "Upload images" },
    { key: "settings", label: "Settings", desc: "Status, contacts, capacity" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function CreateOpportunityModal({
    onClose,
    createAction,
}: CreateOpportunityModalProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<StepKey>("details");
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const stepIndex = STEPS.findIndex((s) => s.key === step);

    /* ── Image handling ── */
    const handleFiles = useCallback(
        (files: FileList | File[]) => {
            const newFiles: File[] = [];
            const newPreviews: string[] = [];
            for (const file of Array.from(files)) {
                if (!ACCEPTED_TYPES.includes(file.type)) {
                    toast("Only JPG, PNG, and WebP images are supported.", "error");
                    continue;
                }
                if (file.size > MAX_FILE_SIZE) {
                    toast("Image must be under 5 MB.", "error");
                    continue;
                }
                newFiles.push(file);
            }
            if (!newFiles.length) return;
            // Read previews for new files
            for (const file of newFiles) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    newPreviews.push(e.target?.result as string);
                    if (newPreviews.length === newFiles.length) {
                        setImageFiles((prev) => [...prev, ...newFiles]);
                        setImagePreviews((prev) => [...prev, ...newPreviews]);
                    }
                };
                reader.readAsDataURL(file);
            }
        },
        [toast]
    );

    function onDrop(e: DragEvent) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    }

    function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.length) handleFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function removeImage(index: number) {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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
        // media and settings have no required fields to block navigation
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
        // Going backward is always allowed; going forward requires validation
        if (targetIdx <= stepIndex) {
            setStep(target);
            return;
        }
        // Validate all steps between current and target
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
        for (const file of imageFiles) {
            formData.append("imageFiles", file);
        }

        try {
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

    const isLast = stepIndex === STEPS.length - 1;

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-opp-title"
                className="relative flex w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
                style={{ maxHeight: "min(90vh, 640px)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Left step sidebar ── */}
                <div className="hidden w-56 shrink-0 border-r border-gray-100 bg-gray-50/60 p-6 md:flex md:flex-col">
                    <h2
                        id="create-opp-title"
                        className="font-manrope text-lg font-bold text-ink"
                    >
                        New opportunity
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
                                        <span className={`block text-sm font-semibold ${isActive ? "text-ink" : "text-muted"}`}>
                                            {s.label}
                                        </span>
                                        <span className="block text-[11px] text-muted">
                                            {s.desc}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* ── Right content area ── */}
                <div className="flex min-w-0 flex-1 flex-col">
                    {/* Mobile header */}
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 md:py-3">
                        <div className="md:hidden">
                            <h2 className="font-manrope text-lg font-bold text-ink">
                                New opportunity
                            </h2>
                            <p className="text-xs text-muted">
                                Step {stepIndex + 1} of {STEPS.length} — {STEPS[stepIndex].label}
                            </p>
                        </div>
                        <p className="hidden text-sm text-muted md:block">
                            {STEPS[stepIndex].desc}
                        </p>
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

                    {/* Form — all fields rendered but only active step visible */}
                    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
                        <div className="flex-1 px-6 py-5">
                            {/* ── Step 1: Details ── */}
                            <div className={step === "details" ? "space-y-5" : "hidden"}>
                                <label className="block text-sm font-medium text-ink">
                                    Title <span className="text-orange-500">*</span>
                                    <input
                                        name="title"
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
                                        placeholder="Describe the opportunity..."
                                        className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        required
                                    />
                                </label>

                                <div className="text-sm font-medium text-ink">
                                    SDG tags <span className="text-orange-500">*</span>
                                    <div className="mt-1.5">
                                        <SdgMultiSelect name="sdgs" required />
                                    </div>
                                </div>
                            </div>

                            {/* ── Step 2: Media ── */}
                            <div className={step === "media" ? "space-y-5" : "hidden"}>
                                <p className="text-sm text-muted">Add images for this opportunity. These will be shown on the public listing.</p>

                                {/* Image previews grid */}
                                {imagePreviews.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="group/img relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                                                {/* eslint-disable-next-line @next/next/no-img-element -- blob preview URL */}
                                                <img src={preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm opacity-0 transition group-hover/img:opacity-100 hover:bg-red-600"
                                                    aria-label={`Remove image ${index + 1}`}
                                                >
                                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                        <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Drop zone / add more */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${imagePreviews.length > 0 ? "p-6" : "p-10"} ${dragOver
                                        ? "border-orange-400 bg-orange-50/50"
                                        : "border-gray-200 bg-gray-50/50 hover:border-gray-300"
                                        }`}
                                >
                                    <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m-4 4l4-4 4 4M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                    </svg>
                                    <p className="mt-3 text-sm text-muted">
                                        {imagePreviews.length > 0
                                            ? <>Add more images, or <span className="font-medium text-orange-500">browse</span></>
                                            : <>Drag & drop images here, or <span className="font-medium text-orange-500">browse</span></>
                                        }
                                    </p>
                                    <p className="mt-1 text-xs text-muted">JPG, PNG, WebP · Max 5 MB each</p>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    multiple
                                    className="hidden"
                                    onChange={onFileChange}
                                />
                            </div>

                            {/* ── Step 3: Settings ── */}
                            <div className={step === "settings" ? "space-y-5" : "hidden"}>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <label className="block text-sm font-medium text-ink">
                                        Status
                                        <select
                                            name="published"
                                            defaultValue="false"
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
                                            maxLength={256}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                    </label>
                                    <label className="block text-sm font-medium text-ink">
                                        Contact phone
                                        <input
                                            name="signupContactPhone"
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
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                    </label>
                                    <label className="block text-sm font-medium text-ink">
                                        Current volunteers
                                        <input
                                            name="currentVolunteers"
                                            type="number"
                                            min={0}
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm transition focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        />
                                    </label>
                                    <label className="block text-sm font-medium text-ink">
                                        Waitlist
                                        <select
                                            name="waitlistEnabled"
                                            defaultValue="false"
                                            className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
                                        >
                                            <option value="false">Disabled</option>
                                            <option value="true">Enabled</option>
                                        </select>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ── */}
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
                                    {submitting ? "Creating…" : "Create opportunity"}
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
