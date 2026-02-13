"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const displayName = name?.trim() || "Member";
  const displayRole = roleLabel?.trim() || "Member";

  const previewUrl = fileUrl ?? initialUrl ?? null;

  const hasCustomImage = Boolean(fileUrl);

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
  const closeEditor = () => setIsOpen(false);

  const drawPreview = () => {
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
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const nextUrl = URL.createObjectURL(file);
    setFileUrl(nextUrl);
    setZoom(1);
    setRotation(0);

    const image = new Image();
    image.src = nextUrl;
    image.onload = () => {
      imageRef.current = image;
      drawPreview();
    };
  };

  const handleImageLoaded = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    imageRef.current = image;
    drawPreview();
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

  const handleReset = () => {
    setFileUrl(null);
    setZoom(1);
    setRotation(0);
    imageRef.current = null;
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
        setIsOpen(false);
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
            <button
              type="button"
              onClick={openEditor}
              className="relative h-24 w-24 overflow-hidden rounded-full border border-white bg-white shadow-soft transition hover:shadow-xl"
              aria-label="Change profile photo"
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                  onLoad={handleImageLoaded}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-orange-600">
                  {initials}
                </div>
              )}
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

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-5xl rounded-3xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
                  Avatar editor
                </p>
                <p className="mt-1 text-sm text-muted">
                  Upload a photo, then adjust zoom and rotation before saving.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
              >
                Close
              </button>
            </div>
            <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-5">
                <p className="text-sm font-semibold text-ink">Edit avatar</p>
                <p className="mt-2 text-xs text-muted">
                  Upload a photo, then adjust zoom and rotation before saving.
                </p>
                <input
                  className="mt-4 block w-full text-xs text-ink"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  <label className="text-xs font-semibold text-ink">
                    Zoom
                    <input
                      className="mt-2 w-40"
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={zoom}
                      onChange={handleZoomChange}
                      disabled={!hasCustomImage}
                    />
                  </label>
                  <label className="text-xs font-semibold text-ink">
                    Rotate
                    <input
                      className="mt-2 w-40"
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={rotation}
                      onChange={handleRotateChange}
                      disabled={!hasCustomImage}
                    />
                  </label>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={!hasCustomImage || isPending}
                    className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-200"
                  >
                    {isPending ? "Uploading..." : "Save avatar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={!hasCustomImage || isPending}
                    className="rounded-full border border-gray-200 bg-white px-5 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-5 shadow-soft">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  className="h-48 w-48 rounded-3xl border border-gray-200 bg-white"
                />
                <p className="mt-3 text-xs text-muted">Live preview</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
