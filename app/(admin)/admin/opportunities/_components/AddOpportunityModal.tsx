"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CountedInput, CountedTextarea } from "@/components/admin/CountedField";
import { SdgMultiSelect } from "@/components/ui/SdgMultiSelect";
import { ToastForm } from "@/components/ui/ToastForm";
import type { Chapter } from "@/services/types";

import { AdminCreateImageUploader } from "./AdminImageUploader";

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
  chapters: Chapter[];
};

export function AddOpportunityModal({ action, chapters }: Props) {
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
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
        disabled={!chapters.length}
        className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        + Add opportunity
      </button>

      {open && createPortal(
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[200] overflow-y-auto bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === overlayRef.current) setOpen(false); }}
        >
          <div
            className="flex min-h-full items-center justify-center p-6"
            onClick={(e) => { if (e.currentTarget === e.target) setOpen(false); }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label="New opportunity"
              data-dialog
              className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white p-6 shadow-xl"
            >
              {/* Header */}
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-manrope text-lg font-semibold">New opportunity</h3>
                  <p className="mt-1 text-xs text-muted">Fill in the details and publish when ready.</p>
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
              <ToastForm action={action} className="space-y-3" onSuccess={() => setOpen(false)}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold text-ink">
                    Title{" "}
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                      Required
                    </span>
                    <CountedInput name="title" maxLength={128} hint="Max 128 characters." required />
                  </label>
                  <label className="text-xs font-semibold text-ink">
                    Event date/time{" "}
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                      Required
                    </span>
                    <input
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      name="eventDate"
                      type="datetime-local"
                      required
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
                    maxLength={1024}
                    rows={3}
                    hint="Describe goals, deliverables, and requirements."
                    required
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-xs font-semibold text-ink">
                    Chapter{" "}
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                      Required
                    </span>
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      name="chapterId"
                      required
                    >
                      {chapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>{ch.name}</option>
                      ))}
                    </select>
                  </label>
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
                    Waitlist
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                      name="waitlistEnabled"
                      defaultValue="false"
                    >
                      <option value="false">Disabled</option>
                      <option value="true">Enabled</option>
                    </select>
                  </label>
                </div>

                <div className="text-xs font-semibold text-ink">
                  SDG tags{" "}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                    Required
                  </span>
                  <SdgMultiSelect name="sdgs" />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-xs font-semibold text-ink">
                    Contact name
                    <CountedInput name="signupContactName" maxLength={128} />
                  </label>
                  <label className="text-xs font-semibold text-ink">
                    Contact email
                    <CountedInput name="signupContactEmail" maxLength={256} type="email" />
                  </label>
                  <label className="text-xs font-semibold text-ink">
                    Contact phone
                    <CountedInput name="signupContactPhone" maxLength={64} />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-semibold text-ink">
                    Capacity needed
                    <input
                      name="capacity"
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                    <div className="mt-1 text-[11px] text-muted">Total volunteers needed.</div>
                  </label>
                  <label className="text-xs font-semibold text-ink">
                    Current volunteers
                    <input
                      name="currentVolunteers"
                      type="number"
                      min={0}
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    />
                    <div className="mt-1 text-[11px] text-muted">Existing volunteers already committed.</div>
                  </label>
                </div>

                <AdminCreateImageUploader />

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
                    Create opportunity
                  </button>
                </div>
              </ToastForm>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
