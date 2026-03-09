"use client";

import { useEffect, useMemo, useRef, useState, useTransition, useCallback } from "react";

const CANVAS_SIZE = 320;

type AvatarUploadAction = (formData: FormData) => Promise<void>;

type AvatarUploaderProps = {
  name?: string | null;
  roleLabel?: string | null;
  initialUrl?: string | null;
  onUpload: AvatarUploadAction;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export default function AvatarUploader({
  name,
  roleLabel,
  initialUrl,
  onUpload,
}: AvatarUploaderProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayName = name?.trim() || "Member";
  const displayRole = roleLabel?.trim() || "Member";

  const previewUrl = fileUrl ?? initialUrl ?? null;
  const hasCustomImage = Boolean(fileUrl);

  /* ── Lock body scroll when modal is open ── */
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openEditor = () => setIsOpen(true);
  const closeEditor = () => {
    setIsOpen(false);
    setFileUrl(null);
    setZoom(1);
    setRotation(0);
    imageRef.current = null;
  };

  /* ── Canvas drawing ── */
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.save();
    ctx.translate(CANVAS_SIZE / 2, CANVAS_SIZE / 2);
    const angle = (rotation * Math.PI) / 180;
    ctx.rotate(angle);

    const scale = zoom;
    const imageRatio = Math.max(
      CANVAS_SIZE / image.naturalWidth,
      CANVAS_SIZE / image.naturalHeight
    );
    const drawWidth = image.naturalWidth * imageRatio * scale;
    const drawHeight = image.naturalHeight * imageRatio * scale;

    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }, [zoom, rotation]);

  /* ── File handling ── */
  const processFile = useCallback((file: File) => {
    const nextUrl = URL.createObjectURL(file);
    setFileUrl(nextUrl);
    setZoom(1);
    setRotation(0);

    const image = new Image();
    image.src = nextUrl;
    image.onload = () => {
      imageRef.current = image;
      requestAnimationFrame(() => {
        const canvas = canvasRef.current;
        if (!canvas || !imageRef.current) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const ratio = Math.max(
          CANVAS_SIZE / imageRef.current.naturalWidth,
          CANVAS_SIZE / imageRef.current.naturalHeight
        );
        const dw = imageRef.current.naturalWidth * ratio;
        const dh = imageRef.current.naturalHeight * ratio;
        ctx.drawImage(imageRef.current, (CANVAS_SIZE - dw) / 2, (CANVAS_SIZE - dh) / 2, dw, dh);
      });
    };
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  /* ── Drag and drop ── */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = clamp(Number(event.target.value), 1, 3);
    setZoom(value);
    requestAnimationFrame(drawPreview);
  };

  const handleRotateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = clamp(Number(event.target.value), -180, 180);
    setRotation(value);
    requestAnimationFrame(drawPreview);
  };

  const handleUpload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.set("avatar", file);

      startTransition(async () => {
        await onUpload(formData);
        closeEditor();
      });
    }, "image/jpeg", 0.92);
  };

  const initials = useMemo(() => {
    const parts = displayName.split(" ").filter(Boolean);
    if (!parts.length) return "YS";
    const first = parts[0]?.[0] ?? "";
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    return `${first}${second}`.toUpperCase();
  }, [displayName]);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-[radial-gradient(circle_at_top,_#fff4da_0%,_#ffffff_45%,_#fdf6ef_100%)] p-6">
        <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
              Profile
            </p>
            <h2 className="mt-2 font-manrope text-2xl font-semibold text-ink">
              {displayName}
            </h2>
            <p className="mt-1 text-sm text-muted">{displayRole} dashboard access</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Avatar with hover overlay */}
            <button
              type="button"
              onClick={openEditor}
              className="group relative aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-soft transition hover:shadow-xl"
              aria-label="Change profile photo"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-orange-600">
                  {initials}
                </div>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-all duration-200 group-hover:bg-black/40">
                <svg
                  className="h-6 w-6 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </div>
            </button>
            <div className="space-y-2 text-xs text-muted">
              <div>
                <p className="font-semibold text-ink">Profile photo</p>
                <p>Square preview used across dashboards.</p>
              </div>
              <button
                type="button"
                onClick={openEditor}
                className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-600 transition hover:border-orange-300 hover:text-orange-700"
              >
                Change photo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upload Modal ── */}
      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) closeEditor(); }}
        >
          <div className="w-full max-w-xl rounded-3xl border border-gray-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
                  Change profile photo
                </p>
                <p className="mt-1 text-sm text-muted">
                  Upload a photo and adjust to your liking.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-ink"
                aria-label="Close"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Drag and drop zone OR preview */}
              {!hasCustomImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 transition-colors ${isDragging
                      ? "border-orange-400 bg-orange-50"
                      : "border-gray-200 bg-gray-50/50 hover:border-orange-300 hover:bg-orange-50/30"
                    }`}
                >
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${isDragging ? "bg-orange-100" : "bg-gray-100"
                    }`}>
                    <svg className={`h-7 w-7 transition-colors ${isDragging ? "text-orange-500" : "text-gray-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-ink">
                      Drag & drop your photo here
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      or <span className="font-semibold text-orange-600">click to browse</span>
                    </p>
                  </div>
                  <p className="text-[10px] text-muted">
                    JPG, PNG or WebP · Max 5 MB
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Canvas preview */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <canvas
                        ref={canvasRef}
                        width={CANVAS_SIZE}
                        height={CANVAS_SIZE}
                        className="h-48 w-48 rounded-full border-2 border-gray-200 bg-white shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFileUrl(null);
                          setZoom(1);
                          setRotation(0);
                          imageRef.current = null;
                        }}
                        className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm transition hover:bg-red-50 hover:text-red-500"
                        aria-label="Remove photo"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18" />
                          <path d="m6 6 12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap items-center justify-center gap-6">
                    <label className="flex items-center gap-3 text-xs font-semibold text-ink">
                      <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        <line x1="11" y1="8" x2="11" y2="14" />
                        <line x1="8" y1="11" x2="14" y2="11" />
                      </svg>
                      <input
                        className="w-28 accent-orange-500"
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={handleZoomChange}
                      />
                    </label>
                    <label className="flex items-center gap-3 text-xs font-semibold text-ink">
                      <svg className="h-4 w-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                      </svg>
                      <input
                        className="w-28 accent-orange-500"
                        type="range"
                        min={-180}
                        max={180}
                        step={1}
                        value={rotation}
                        onChange={handleRotateChange}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!hasCustomImage || isPending}
                  className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-200"
                >
                  {isPending ? "Uploading…" : "Change profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
