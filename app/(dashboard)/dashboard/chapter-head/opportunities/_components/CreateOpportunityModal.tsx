"use client";

import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from "react";
import { useToast } from "@/components/ui/Toast";
import { SdgMultiSelect } from "@/components/ui/SdgMultiSelect";

interface CreateOpportunityModalProps {
    onClose: () => void;
    createAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function CreateOpportunityModal({
    onClose,
    createAction,
}: CreateOpportunityModalProps) {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    /* ── Image handling ── */
    const handleFile = useCallback((file: File) => {
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
    }, [toast]);

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

    /* ── Submit ── */
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const formData = new FormData(e.currentTarget);
        if (imageFile) {
            formData.set("imageFile", imageFile);
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-opp-title"
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header gradient */}
                <div className="h-16 w-full rounded-t-3xl bg-gradient-to-br from-orange-400 to-amber-300" />

                {/* Close button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 transition hover:bg-white hover:text-ink"
                    aria-label="Close"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>

                <form ref={formRef} onSubmit={handleSubmit} className="px-6 pb-6 pt-4">
                    <h2 id="create-opp-title" className="font-manrope text-xl font-bold text-ink">
                        New Opportunity
                    </h2>
                    <p className="mt-1 text-sm text-muted">Create a volunteer opportunity for your chapter.</p>

                    <div className="mt-5 space-y-4">
                        {/* Title + date */}
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-xs font-semibold text-ink">
                                Title <span className="text-orange-500">*</span>
                                <input
                                    name="title"
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                                    maxLength={128}
                                    required
                                />
                            </label>
                            <label className="text-xs font-semibold text-ink">
                                Event date/time <span className="text-orange-500">*</span>
                                <input
                                    name="eventDate"
                                    type="datetime-local"
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                                    required
                                />
                            </label>
                        </div>

                        {/* Description */}
                        <label className="block text-xs font-semibold text-ink">
                            Description <span className="text-orange-500">*</span>
                            <textarea
                                name="description"
                                rows={3}
                                maxLength={1024}
                                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm transition focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                                required
                            />
                        </label>

                        {/* SDG tags */}
                        <div className="text-xs font-semibold text-ink">
                            SDG tags <span className="text-orange-500">*</span>
                            <SdgMultiSelect name="sdgs" required />
                        </div>

                        {/* Image upload — drag & drop */}
                        <div className="text-xs font-semibold text-ink">
                            Image (optional)
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={onDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${dragOver
                                        ? "border-orange-400 bg-orange-50"
                                        : "border-gray-200 bg-gray-50 hover:border-orange-300"
                                    }`}
                            >
                                {imagePreview ? (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="h-32 w-auto rounded-lg object-cover"
                                        />
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
                                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m-4 4l4-4 4 4M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                        </svg>
                                        <p className="mt-2 text-sm text-muted">
                                            Drag & drop an image here, or <span className="font-semibold text-orange-500">browse</span>
                                        </p>
                                        <p className="mt-1 text-[11px] text-muted">JPG, PNG, WebP · Max 5 MB</p>
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

                        {/* Status + Contact */}
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-xs font-semibold text-ink">
                                Status
                                <select
                                    name="published"
                                    defaultValue="false"
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                >
                                    <option value="false">Draft</option>
                                    <option value="true">Published</option>
                                </select>
                            </label>
                            <label className="text-xs font-semibold text-ink">
                                Contact name
                                <input
                                    name="signupContactName"
                                    maxLength={128}
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                            </label>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                            <label className="text-xs font-semibold text-ink">
                                Contact email
                                <input
                                    name="signupContactEmail"
                                    type="email"
                                    maxLength={256}
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-xs font-semibold text-ink">
                                Contact phone
                                <input
                                    name="signupContactPhone"
                                    maxLength={64}
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                            </label>
                        </div>

                        {/* Capacity + Waitlist */}
                        <div className="grid gap-3 md:grid-cols-3">
                            <label className="text-xs font-semibold text-ink">
                                Capacity needed
                                <input
                                    name="capacity"
                                    type="number"
                                    min={0}
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-xs font-semibold text-ink">
                                Current volunteers
                                <input
                                    name="currentVolunteers"
                                    type="number"
                                    min={0}
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                />
                            </label>
                            <label className="text-xs font-semibold text-ink">
                                Waitlist
                                <select
                                    name="waitlistEnabled"
                                    defaultValue="false"
                                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                                >
                                    <option value="false">Disabled</option>
                                    <option value="true">Enabled</option>
                                </select>
                            </label>
                        </div>

                        {/* Submit */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? "Creating…" : "Create opportunity"}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-muted transition hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
