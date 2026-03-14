"use client";

import { useState } from "react";

import { CountedInput, CountedTextarea } from "@/components/admin/CountedField";
import { useToast } from "@/components/ui/Toast";
import type { Program } from "@/services/types";

type Props = {
  program: Program;
  updateAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
  deleteAction: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
};

export function ProgramCard({ program, updateAction, deleteAction }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    const formData = new FormData(e.currentTarget);
    setSaving(true);
    try {
      const result = await updateAction(formData);
      toast(result.message, result.ok ? "success" : "error");
    } catch {
      toast("An unexpected error occurred.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (deleting) return;
    const formData = new FormData(e.currentTarget);
    setDeleting(true);
    try {
      const result = await deleteAction(formData);
      toast(result.message, result.ok ? "success" : "error");
    } catch {
      toast("An unexpected error occurred.", "error");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <details className="group rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* ── Summary row ── */}
      <summary className="flex cursor-pointer list-none select-none flex-wrap items-center justify-between gap-3 px-6 py-4 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 text-muted transition group-open:border-orange-200 group-open:bg-orange-50 group-open:text-orange-500">
            <svg className="h-3.5 w-3.5 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
          {program.imageFileId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/file/${program.imageFileId}?w=80`}
              alt=""
              className="h-10 w-10 shrink-0 rounded-xl object-cover"
            />
          ) : null}
          <div className="min-w-0">
            <h3 className="font-manrope text-base font-semibold leading-tight text-ink">{program.title}</h3>
            <p className="mt-0.5 truncate text-xs text-muted">/{program.slug}</p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            program.published ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          {program.published ? "Published" : "Draft"}
        </span>
      </summary>

      {/* ── Edit panel ── */}
      <div className="border-t border-gray-100 px-6 pb-6 pt-5">
        <form onSubmit={handleUpdate} encType="multipart/form-data" className="space-y-5">
          <input type="hidden" name="id" value={program.id} />

          {/* Row 1: Title + Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">Title</label>
              <CountedInput name="title" defaultValue={program.title} maxLength={128} hint="Max 128 characters." />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">Slug</label>
              <CountedInput name="slug" defaultValue={program.slug} maxLength={128} hint="Lowercase, numbers, hyphens." />
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-ink">Description</label>
            <CountedTextarea name="description" defaultValue={program.description} maxLength={1024} hint="Max 1024 characters." rows={4} />
          </div>

          {/* Row 3: Status + Image */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">Status</label>
              <select
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-ink focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                name="published"
                defaultValue={program.published ? "true" : "false"}
              >
                <option value="false">Draft</option>
                <option value="true">Published</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">Replace image</label>
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 py-2.5">
                <input
                  className="w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-orange-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-orange-600 hover:file:bg-orange-100"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                />
                <p className="mt-1.5 text-[11px] text-muted">jpg, png, svg, gif allowed.</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                <input className="h-3.5 w-3.5 accent-orange-500" type="checkbox" name="removeImage" />
                Remove current image
              </label>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end border-t border-gray-100 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        {/* Delete — separate form, never nested */}
        <div className="mt-3 border-t border-gray-100 pt-4">
          <form onSubmit={handleDelete}>
            <input type="hidden" name="id" value={program.id} />
            <button
              type="submit"
              disabled={deleting}
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete program"}
            </button>
          </form>
        </div>
      </div>
    </details>
  );
}
