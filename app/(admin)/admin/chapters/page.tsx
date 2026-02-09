import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  adminListChapters,
  createChapter,
  deleteChapter,
  updateChapter,
} from "@/services/chapters";
import type { Chapter } from "@/services/types";

type SearchParams = Record<string, string | string[] | undefined>;

function readParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) return value[0];
  return value;
}

function buildRedirect(status: "success" | "error", message: string): never {
  const encoded = encodeURIComponent(message);
  redirect(`/admin/chapters?status=${status}&message=${encoded}`);
}

async function createChapterAction(formData: FormData): Promise<void> {
  "use server";
  try {
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const contactEmail = String(formData.get("contactEmail") ?? "").trim();
    const contactPhone = String(formData.get("contactPhone") ?? "").trim();
    const facebookUrl = String(formData.get("facebookUrl") ?? "").trim();
    const chapterHeadUserId = String(formData.get("chapterHeadUserId") ?? "").trim();

    await createChapter({
      name,
      slug: slug.length ? slug : undefined,
      location: location.length ? location : undefined,
      contactEmail: contactEmail.length ? contactEmail : undefined,
      contactPhone: contactPhone.length ? contactPhone : undefined,
      facebookUrl: facebookUrl.length ? facebookUrl : undefined,
      chapterHeadUserId: chapterHeadUserId.length ? chapterHeadUserId : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create chapter";
    buildRedirect("error", message);
  }

  revalidatePath("/admin/chapters");
  buildRedirect("success", "Chapter created.");
}

async function updateChapterAction(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const contactEmail = String(formData.get("contactEmail") ?? "").trim();
    const contactPhone = String(formData.get("contactPhone") ?? "").trim();
    const facebookUrl = String(formData.get("facebookUrl") ?? "").trim();
    const chapterHeadUserId = String(formData.get("chapterHeadUserId") ?? "").trim();
    const removeChapterHead = formData.get("removeChapterHead") === "on";

    await updateChapter(id, {
      name: name.length ? name : undefined,
      slug: slug.length ? slug : undefined,
      location: location.length ? location : undefined,
      contactEmail: contactEmail.length ? contactEmail : undefined,
      contactPhone: contactPhone.length ? contactPhone : undefined,
      facebookUrl: facebookUrl.length ? facebookUrl : undefined,
      chapterHeadUserId: removeChapterHead
        ? null
        : chapterHeadUserId.length
          ? chapterHeadUserId
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update chapter";
    buildRedirect("error", message);
  }

  revalidatePath("/admin/chapters");
  buildRedirect("success", "Chapter updated.");
}

async function deleteChapterAction(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    await deleteChapter(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete chapter";
    buildRedirect("error", message);
  }
  revalidatePath("/admin/chapters");
  buildRedirect("success", "Chapter deleted.");
}

function StatusBanner({ status, message }: { status?: string; message?: string }) {
  if (!message) return null;
  const isError = status === "error";
  return (
    <div
      className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {message}
    </div>
  );
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  return (
    <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-manrope text-lg font-semibold">{chapter.name}</h3>
          <p className="text-xs text-muted">Slug: {chapter.slug}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Location: {chapter.location ?? "Not set"}
      </p>
      <p className="mt-1 text-xs text-muted">
        Chapter head: {chapter.chapterHeadUserId ?? "Unassigned"}
      </p>

      <form action={updateChapterAction} className="mt-4 space-y-3">
        <input type="hidden" name="id" value={chapter.id} />
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-ink">
            Name
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="name"
              defaultValue={chapter.name}
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Slug
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="slug"
              defaultValue={chapter.slug}
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-xs font-semibold text-ink">
            Location
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="location"
              defaultValue={chapter.location}
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Contact email
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="contactEmail"
              defaultValue={chapter.contactEmail}
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Contact phone
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="contactPhone"
              defaultValue={chapter.contactPhone}
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-ink">
            Facebook URL
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="facebookUrl"
              defaultValue={chapter.facebookUrl}
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Chapter head user ID
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="chapterHeadUserId"
              defaultValue={chapter.chapterHeadUserId}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink">
          <input className="h-4 w-4" type="checkbox" name="removeChapterHead" />
          Clear chapter head assignment
        </label>
        <button
          className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
          type="submit"
        >
          Save changes
        </button>
      </form>
      <form action={deleteChapterAction} className="mt-3">
        <input type="hidden" name="id" value={chapter.id} />
        <button
          className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700"
          type="submit"
        >
          Delete
        </button>
      </form>
    </article>
  );
}

export default async function AdminChaptersPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const message = readParam(params, "message");
  const status = readParam(params, "status");

  let chapters: Chapter[] = [];
  let hasLoadError = false;

  try {
    chapters = await adminListChapters();
  } catch {
    hasLoadError = true;
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-orange-600">
          Admin
        </p>
        <h2 className="font-manrope text-2xl font-semibold">Chapters</h2>
        <p className="mt-2 text-sm text-muted">
          Manage chapter profiles, contact details, and chapter head assignments.
        </p>
      </div>

      <StatusBanner status={status} message={message} />

      <form
        action={createChapterAction}
        className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-manrope text-lg font-semibold">New chapter</h3>
            <p className="mt-1 text-xs text-muted">
              Use a clear chapter name. Slug will auto-generate if left empty.
            </p>
          </div>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
            Required fields marked
          </span>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-ink">
            Name{" "}
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-600">
              Required
            </span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="name"
              required
              placeholder="YSP Manila Chapter"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Slug (optional)
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="slug"
              placeholder="ysp-manila"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-semibold text-ink">
            Location
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="location"
              placeholder="Metro Manila"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Contact email
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="contactEmail"
              placeholder="chapter@email.org"
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Contact phone
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="contactPhone"
              placeholder="+63 9xx xxx xxxx"
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-ink">
            Facebook URL
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="facebookUrl"
              placeholder="https://facebook.com/..."
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Chapter head user ID
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="chapterHeadUserId"
              placeholder="appwrite-user-id"
            />
            <span className="mt-1 block text-[11px] text-muted">
              Use the Appwrite user ID for the chapter head.
            </span>
          </label>
        </div>
        <button
          className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-glow"
          type="submit"
        >
          Create chapter
        </button>
      </form>

      {hasLoadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Chapters are unavailable. Please confirm admin access and Appwrite
          configuration.
        </div>
      ) : null}

      {!hasLoadError && chapters.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
          No chapters yet. Create the first chapter to get started.
        </div>
      ) : null}

      {!hasLoadError && chapters.length > 0 ? (
        <div className="grid gap-6">
          {chapters.map((chapter) => (
            <ChapterCard key={chapter.id} chapter={chapter} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
