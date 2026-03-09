"use client";

import {
    useRef,
    useState,
    useCallback,
    type DragEvent,
    type ChangeEvent,
} from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getOpportunityImageUrl(fileId: string): string {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
    return `${endpoint}/storage/buckets/696dac0d0000f9557fbd/files/${fileId}/preview?project=${projectId}&width=400&output=webp`;
}

/**
 * Interactive image upload/manage widget for the admin opportunity edit form.
 *
 * Renders existing images (from DB) as removable thumbnails, plus a
 * drag-and-drop zone for adding new ones.  Writes the kept existing IDs
 * into a hidden input (`existingImageFileIds`) and appends new File
 * objects under the `imageFiles` multi-value field – both expected by
 * the server action.
 */
export function AdminImageUploader({
    opportunityId,
    existingFileIds,
}: {
    opportunityId: string;
    existingFileIds: string[];
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [keptIds, setKeptIds] = useState<string[]>(existingFileIds);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [newPreviews, setNewPreviews] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");

    const handleFiles = useCallback((files: FileList | File[]) => {
        setError("");
        const accepted: File[] = [];

        for (const file of Array.from(files)) {
            if (!ACCEPTED_TYPES.includes(file.type)) {
                setError("Only JPG, PNG, and WebP images are supported.");
                continue;
            }
            if (file.size > MAX_FILE_SIZE) {
                setError("Each image must be under 5 MB.");
                continue;
            }
            accepted.push(file);
        }

        if (!accepted.length) return;

        for (const file of accepted) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewFiles((prev) => [...prev, file]);
                setNewPreviews((prev) => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    function onDrop(e: DragEvent) {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    }

    function onFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files?.length) handleFiles(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function removeExisting(fileId: string) {
        setKeptIds((prev) => prev.filter((id) => id !== fileId));
    }

    function removeNew(index: number) {
        setNewFiles((prev) => prev.filter((_, i) => i !== index));
        setNewPreviews((prev) => prev.filter((_, i) => i !== index));
    }

    const totalCount = keptIds.length + newFiles.length;

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-ink">Images</p>

            {/* Thumbnails row */}
            {(keptIds.length > 0 || newPreviews.length > 0) && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {/* Existing */}
                    {keptIds.map((fileId) => (
                        <div
                            key={fileId}
                            className="group/img relative aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- dynamic Appwrite storage URL */}
                            <img
                                src={getOpportunityImageUrl(fileId)}
                                alt="Existing image"
                                className="h-full w-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeExisting(fileId)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition group-hover/img:opacity-100 hover:bg-red-600"
                                aria-label="Remove image"
                            >
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                            <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[9px] font-medium text-white">
                                Saved
                            </span>
                        </div>
                    ))}

                    {/* New (not yet saved) */}
                    {newPreviews.map((src, i) => (
                        <div
                            key={`new-${i}`}
                            className="group/img relative aspect-video overflow-hidden rounded-xl border border-orange-200 bg-orange-50"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                            <img
                                src={src}
                                alt={`New image ${i + 1}`}
                                className="h-full w-full object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => removeNew(i)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition group-hover/img:opacity-100 hover:bg-red-600"
                                aria-label={`Remove new image ${i + 1}`}
                            >
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                            <span className="absolute bottom-1 left-1 rounded bg-orange-500/80 px-1 py-0.5 text-[9px] font-medium text-white">
                                New
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-6 transition ${dragOver
                    ? "border-orange-400 bg-orange-50/60"
                    : "border-gray-200 bg-gray-50/60 hover:border-gray-300"
                    }`}
            >
                <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m-4 4l4-4 4 4M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                <p className="mt-2 text-xs text-muted">
                    {totalCount > 0
                        ? <><span className="font-medium text-orange-500">Add more</span> or drag &amp; drop</>
                        : <>Drag &amp; drop, or <span className="font-medium text-orange-500">browse</span></>
                    }
                </p>
                <p className="mt-0.5 text-[11px] text-muted">JPG, PNG, WebP · Max 5 MB each</p>
            </div>

            {error && (
                <p className="text-xs text-red-600">{error}</p>
            )}

            {/* Hidden inputs for the server action */}
            <input
                type="hidden"
                name="existingImageFileIds"
                value={keptIds.join(",")}
            />
            {/* New files appended via JS to FormData — use hidden file input trick */}
            {newFiles.map((file, i) => (
                <NewFileInput key={i} file={file} />
            ))}
        </div>
    );
}

/**
 * Attaches a File object to the form so the server action can read it
 * via `formData.getAll("imageFiles")`.  We use a DataTransfer trick to
 * set the file list on a hidden input programmatically.
 */
/**
 * Simplified uploader for the "create opportunity" form (no existing images).
 */
export function AdminCreateImageUploader() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState("");

    const handleFiles = useCallback((selected: FileList | File[]) => {
        setError("");
        const accepted: File[] = [];
        for (const file of Array.from(selected)) {
            if (!ACCEPTED_TYPES.includes(file.type)) { setError("Only JPG, PNG, and WebP images are supported."); continue; }
            if (file.size > MAX_FILE_SIZE) { setError("Each image must be under 5 MB."); continue; }
            accepted.push(file);
        }
        if (!accepted.length) return;
        for (const file of accepted) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFiles((prev) => [...prev, file]);
                setPreviews((prev) => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    function onDrop(e: DragEvent) { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); }
    function onFileChange(e: ChangeEvent<HTMLInputElement>) { if (e.target.files?.length) handleFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ""; }
    function remove(index: number) { setFiles((p) => p.filter((_, i) => i !== index)); setPreviews((p) => p.filter((_, i) => i !== index)); }

    return (
        <div className="space-y-3">
            <p className="text-xs font-semibold text-ink">Images <span className="font-normal text-muted">(optional)</span></p>

            {previews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {previews.map((src, i) => (
                        <div key={i} className="group/img relative aspect-video overflow-hidden rounded-xl border border-orange-200 bg-orange-50">
                            {/* eslint-disable-next-line @next/next/no-img-element -- blob preview */}
                            <img src={src} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => remove(i)}
                                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition group-hover/img:opacity-100 hover:bg-red-600"
                                aria-label={`Remove image ${i + 1}`}
                            >
                                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed py-6 transition ${dragOver ? "border-orange-400 bg-orange-50/60" : "border-gray-200 bg-gray-50/60 hover:border-gray-300"}`}
            >
                <svg className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m-4 4l4-4 4 4M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                </svg>
                <p className="mt-2 text-xs text-muted">
                    {previews.length > 0
                        ? <><span className="font-medium text-orange-500">Add more</span> or drag &amp; drop</>
                        : <>Drag &amp; drop, or <span className="font-medium text-orange-500">browse</span></>
                    }
                </p>
                <p className="mt-0.5 text-[11px] text-muted">JPG, PNG, WebP · Max 5 MB each</p>
            </div>

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={onFileChange} />
            {error && <p className="text-xs text-red-600">{error}</p>}
            {files.map((file, i) => <NewFileInput key={i} file={file} />)}
        </div>
    );
}

function NewFileInput({ file }: { file: File }) {
    const ref = useRef<HTMLInputElement>(null);

    const attachFile = useCallback(
        (el: HTMLInputElement | null) => {
            if (!el) return;
            try {
                const dt = new DataTransfer();
                dt.items.add(file);
                el.files = dt.files;
            } catch {
                // DataTransfer not supported (rare) — file won't be attached
            }
        },
        [file]
    );

    return (
        <input
            ref={(el) => { (ref as React.MutableRefObject<HTMLInputElement | null>).current = el; attachFile(el); }}
            type="file"
            name="imageFiles"
            className="hidden"
            aria-hidden="true"
        />
    );
}
