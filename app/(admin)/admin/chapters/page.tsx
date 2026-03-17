import { revalidatePath } from "next/cache";

import { CountedInput } from "@/components/admin/CountedField";
import { ToastForm } from "@/components/ui/ToastForm";
import { writeAdminAudit } from "@/services/adminAudit";
import { getSession } from "@/services/auth";
import { toPublicDomainError } from "@/services/errorContract";
import {
  adminListChapters,
  createChapter,
  deleteChapter,
  updateChapter,
} from "@/services/chapters";
import type { Chapter } from "@/services/types";

async function createChapterAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  try {
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const location = String(formData.get("location") ?? "").trim();
    const contactEmail = String(formData.get("contactEmail") ?? "").trim();
    const contactPhone = String(formData.get("contactPhone") ?? "").trim();
    const facebookUrl = String(formData.get("facebookUrl") ?? "").trim();
    const chapterHeadUserId = String(formData.get("chapterHeadUserId") ?? "").trim();
    const published = String(formData.get("published") ?? "false") === "true";

    await createChapter({
      name,
      slug: slug.length ? slug : undefined,
      location: location.length ? location : undefined,
      contactEmail: contactEmail.length ? contactEmail : undefined,
      contactPhone: contactPhone.length ? contactPhone : undefined,
      facebookUrl: facebookUrl.length ? facebookUrl : undefined,
      chapterHeadUserId: chapterHeadUserId.length ? chapterHeadUserId : undefined,
      published,
    });
    revalidatePath("/admin/chapters");
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "admin", action: "chapter.create", targetType: "chapter", targetLabel: name });
    return { ok: true, message: "Chapter created." };
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to create chapter").message;
    return { ok: false, message };
  }
}

async function updateChapterAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
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
    const published = String(formData.get("published") ?? "false") === "true";

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
      published,
    });
    revalidatePath("/admin/chapters");
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "admin", action: "chapter.update", targetType: "chapter", targetId: id, targetLabel: name });
    return { ok: true, message: "Chapter updated." };
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to update chapter").message;
    return { ok: false, message };
  }
}

async function deleteChapterAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    await deleteChapter(id);
    revalidatePath("/admin/chapters");
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "admin", action: "chapter.delete", targetType: "chapter", targetId: id });
    return { ok: true, message: "Chapter deleted." };
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to delete chapter").message;
    return { ok: false, message };
  }
}

function ChapterCard({ chapter }: { chapter: Chapter }) {
  const isPublished = chapter.published ?? false;
  return (
    <details className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-manrope text-lg font-semibold">{chapter.name}</h3>
          <p className="text-xs text-muted">
            {chapter.location ?? "Location not set"}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-muted"
              }`}
          >
            {isPublished ? "Published" : "Draft"}
          </span>
          <span>Head: {chapter.chapterHeadUserId ?? "Unassigned"}</span>
          <span className="rounded-full border border-gray-200 px-3 py-1 font-semibold text-ink transition group-open:border-orange-300 group-open:text-orange-600">
            Edit
          </span>
        </div>
      </summary>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            Chapter profile
          </h4>
          <ToastForm action={updateChapterAction} className="space-y-3">
            <input type="hidden" name="id" value={chapter.id} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-ink">
                Name
                <CountedInput
                  name="name"
                  defaultValue={chapter.name}
                  maxLength={256}
                  hint="Max 256 characters."
                />
              </label>
              <label className="text-xs font-semibold text-ink">
                Slug
                <CountedInput
                  name="slug"
                  defaultValue={chapter.slug}
                  maxLength={128}
                  hint="Lowercase, numbers, hyphens."
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold text-ink">
                Location
                <CountedInput
                  name="location"
                  defaultValue={chapter.location}
                  maxLength={256}
                  hint="City or region."
                />
              </label>
              <label className="text-xs font-semibold text-ink">
                Contact email
                <CountedInput
                  name="contactEmail"
                  defaultValue={chapter.contactEmail}
                  maxLength={256}
                  type="email"
                  hint="Public email for inquiries."
                />
              </label>
              <label className="text-xs font-semibold text-ink">
                Contact phone
                <CountedInput
                  name="contactPhone"
                  defaultValue={chapter.contactPhone}
                  maxLength={64}
                  hint="Include country code."
                />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-semibold text-ink">
                Facebook URL
                <CountedInput
                  name="facebookUrl"
                  defaultValue={chapter.facebookUrl}
                  maxLength={256}
                  type="url"
                  hint="Paste full URL."
                />
              </label>
              <label className="text-xs font-semibold text-ink">
                Chapter head user ID
                <CountedInput
                  name="chapterHeadUserId"
                  defaultValue={chapter.chapterHeadUserId}
                  maxLength={128}
                  hint="Appwrite user ID."
                />
              </label>
            </div>
            <label className="text-xs font-semibold text-ink">
              Status
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="published"
                defaultValue={isPublished ? "true" : "false"}
              >
                <option value="false">Draft</option>
                <option value="true">Published</option>
              </select>
            </label>
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
          </ToastForm>
        </div>

        <aside className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-xs text-muted">
          <p className="font-semibold text-ink">Quick guidance</p>
          <ul className="mt-2 space-y-2">
            <li>Keep chapter names consistent with location.</li>
            <li>Only assign a chapter head if verified.</li>
            <li>Contacts appear on public pages.</li>
          </ul>
          <ToastForm action={deleteChapterAction} className="mt-4">
            <input type="hidden" name="id" value={chapter.id} />
            <button
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700"
              type="submit"
            >
              Delete chapter
            </button>
          </ToastForm>
        </aside>
      </div>
    </details>
  );
}

export default async function AdminChaptersPage() {
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

      <ToastForm
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
            <CountedInput
              name="name"
              required
              placeholder="YSP Manila Chapter"
              maxLength={256}
              hint="Max 256 characters."
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Slug (optional)
            <CountedInput
              name="slug"
              placeholder="ysp-manila"
              maxLength={128}
              hint="Leave empty to auto-generate."
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-semibold text-ink">
            Location
            <CountedInput
              name="location"
              placeholder="Metro Manila"
              maxLength={256}
              hint="City or region."
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Contact email
            <CountedInput
              name="contactEmail"
              placeholder="chapter@email.org"
              type="email"
              maxLength={256}
              hint="Public email."
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Contact phone
            <CountedInput
              name="contactPhone"
              placeholder="+63 9xx xxx xxxx"
              maxLength={64}
              hint="Include country code."
            />
          </label>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-ink">
            Facebook URL
            <CountedInput
              name="facebookUrl"
              placeholder="https://facebook.com/..."
              type="url"
              maxLength={256}
              hint="Paste full URL."
            />
          </label>
          <label className="text-xs font-semibold text-ink">
            Chapter head user ID
            <CountedInput
              name="chapterHeadUserId"
              placeholder="appwrite-user-id"
              maxLength={128}
              hint="Appwrite user ID."
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold text-ink">
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
        <button
          className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-xs font-semibold text-white shadow-glow"
          type="submit"
        >
          Create chapter
        </button>
      </ToastForm>

      {hasLoadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Chapters are unavailable. Please confirm admin access and Appwrite
          configuration.
        </div>
      ) : null}

      {!hasLoadError && chapters.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff2e1] text-2xl">
            *
          </div>
          <p className="text-sm text-ink">No chapters yet.</p>
          <p className="mt-1 text-xs text-muted">
            Add a chapter to start publishing local opportunities.
          </p>
          <div className="mt-4 grid gap-2 text-xs text-muted md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              Use a city-based name.
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              Add contact info for public pages.
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-3">
              Assign a chapter head when ready.
            </div>
          </div>
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


