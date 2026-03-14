"use client";

import { useEffect, useRef, useState } from "react";

import { CountedInput, CountedTextarea } from "@/components/admin/CountedField";
import { ToastForm } from "@/components/ui/ToastForm";

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
};

export function AddProgramModal({ action }: Props) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape, trap focus
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "Tab") {
        const dialog = overlayRef.current?.querySelector("[data-dialog]") as HTMLElement | null;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
      >
        + Add program
      </button>

      {open && (
        <div
          ref={overlayRef}
          onClick={(e) => { if (e.target === overlayRef.current) setOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="New program"
            data-dialog
            className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            {/* Header */}
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-manrope text-lg font-semibold">New program</h3>
                <p className="mt-1 text-xs text-muted">
                  Slug will auto-generate if you leave it blank.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                  Required fields marked
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-muted transition hover:text-ink"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <ToastForm
              action={action}
              className="space-y-3"
              onSuccess={() => setOpen(false)}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-ink">
                  Title{" "}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                    Required
                  </span>
                  <CountedInput
                    name="title"
                    required
                    placeholder="Youth Action Labs"
                    maxLength={128}
                    hint="Max 128 characters."
                  />
                </label>
                <label className="text-xs font-semibold text-ink">
                  Slug (optional)
                  <CountedInput
                    name="slug"
                    placeholder="youth-action-labs"
                    maxLength={128}
                    hint="Leave empty to auto-generate."
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-ink">
                Description{" "}
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                  Required
                </span>
                <CountedTextarea
                  name="description"
                  rows={3}
                  required
                  placeholder="Describe the program objectives, cadence, and outcomes."
                  maxLength={1024}
                  hint="Max 1024 characters."
                />
              </label>

              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs font-semibold text-ink">
                  Status
                  <select
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    name="published"
                    defaultValue="false"
                  >
                    <option value="false">Draft</option>
                    <option value="true">Published</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-ink">
                  Image upload
                  <input
                    className="mt-1 w-full text-sm"
                    name="imageFile"
                    type="file"
                    accept="image/*"
                  />
                  <span className="mt-1 block text-[11px] text-muted">
                    Allowed: jpg, png, svg, gif. WebP is not enabled yet.
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-gray-200 px-5 py-2 text-xs font-semibold text-ink transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-orange-600"
                >
                  Create program
                </button>
              </div>
            </ToastForm>
          </div>
        </div>
      )}
    </>
  );
}
