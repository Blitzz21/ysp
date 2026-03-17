"use client";

import { useEffect, useRef, useId } from "react";
import { getFileViewUrl } from "@/lib/imageUrl";

type ProgramDetailModalProps = {
  program: {
    title: string;
    description: string;
    imageFileId?: string;
    createdAt: string;
  } | null;
  onClose: () => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "long",
  }).format(date);
}

export function ProgramDetailModal({ program, onClose }: ProgramDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const uid = useId();
  const titleId = `program-title-${uid}`;
  const descId = `program-desc-${uid}`;

  useEffect(() => {
    if (!program) return;

    closeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }

      if (e.key === "Tab") {
        const dialog = overlayRef.current?.querySelector("[data-program-dialog]") as HTMLElement | null;
        if (!dialog) return;
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [program, onClose]);

  if (!program) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        data-program-dialog
        className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200"
      >
        {program.imageFileId ? (
          <div className="h-48 overflow-hidden rounded-t-3xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- Appwrite storage URL */}
            <img
              src={getFileViewUrl(program.imageFileId)}
              alt={program.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-48 rounded-t-3xl bg-[linear-gradient(135deg,#FFE1C2_0%,#FF7A1A_100%)]"></div>
        )}

        <div className="p-6">
          <h2 id={titleId} className="font-manrope text-2xl font-bold text-ink">
            {program.title}
          </h2>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-orange-600">
            Added {formatDate(program.createdAt)}
          </p>
          <p id={descId} className="mt-4 text-sm leading-relaxed text-muted">
            {program.description}
          </p>

          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="mt-6 w-full rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
