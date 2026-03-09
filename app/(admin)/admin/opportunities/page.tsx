import { revalidatePath } from "next/cache";

import { CountedInput, CountedTextarea } from "@/components/admin/CountedField";
import { SdgMultiSelect } from "@/components/ui/SdgMultiSelect";
import { ToastForm } from "@/components/ui/ToastForm";
import { adminListChapters } from "@/services/chapters";
import { toPublicDomainError } from "@/services/errorContract";
import {
  adminListOpportunities,
  createOpportunity,
  deleteOpportunity,
  updateOpportunity,
} from "@/services/opportunities";
import type { Chapter, VolunteerOpportunity } from "@/services/types";
import { AdminImageUploader, AdminCreateImageUploader } from "./_components/AdminImageUploader";

function parseDateTime(value: string, fieldName: string): Date {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${fieldName} must be a valid date/time`);
  }
  return parsed;
}

function parseSdgs(value: string): string[] {
  const parsed = value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!parsed.length) {
    throw new Error("At least one SDG tag is required");
  }
  return parsed;
}

function parseCount(value: string, fieldName: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative number`);
  }
  return Math.floor(parsed);
}

function toDateTimeLocalValue(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  const yyyy = parsed.getFullYear();
  const mm = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const dd = `${parsed.getDate()}`.padStart(2, "0");
  const hh = `${parsed.getHours()}`.padStart(2, "0");
  const min = `${parsed.getMinutes()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

async function createOpportunityAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  try {
    const title = String(formData.get("title") ?? "").trim();
    const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
    const chapterId = String(formData.get("chapterId") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const sdgsRaw = String(formData.get("sdgs") ?? "").trim();
    const signupContactName = String(formData.get("signupContactName") ?? "").trim();
    const signupContactEmail = String(formData.get("signupContactEmail") ?? "").trim();
    const signupContactPhone = String(formData.get("signupContactPhone") ?? "").trim();
    const capacity = parseCount(String(formData.get("capacity") ?? "").trim(), "Capacity");
    const currentVolunteers = parseCount(
      String(formData.get("currentVolunteers") ?? "").trim(),
      "Current volunteers"
    );
    const waitlistEnabled =
      String(formData.get("waitlistEnabled") ?? "false") === "true";
    const published = String(formData.get("published") ?? "false") === "true";

    const imageFiles = formData.getAll("imageFiles").filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    );

    await createOpportunity({
      title,
      eventDate: parseDateTime(eventDateRaw, "Event date"),
      chapterId,
      description,
      sdgs: parseSdgs(sdgsRaw),
      signupContactName: signupContactName.length ? signupContactName : undefined,
      signupContactEmail: signupContactEmail.length ? signupContactEmail : undefined,
      signupContactPhone: signupContactPhone.length ? signupContactPhone : undefined,
      capacity,
      currentVolunteers,
      waitlistEnabled,
      published,
      imageFiles: imageFiles.length ? imageFiles : undefined,
    });
    revalidatePath("/admin/opportunities");
    return { ok: true, message: "Opportunity created." };
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to create opportunity").message;
    return { ok: false, message };
  }
}

async function updateOpportunityAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    const title = String(formData.get("title") ?? "").trim();
    const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
    const chapterId = String(formData.get("chapterId") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const sdgsRaw = String(formData.get("sdgs") ?? "").trim();
    const signupContactName = String(formData.get("signupContactName") ?? "").trim();
    const signupContactEmail = String(formData.get("signupContactEmail") ?? "").trim();
    const signupContactPhone = String(formData.get("signupContactPhone") ?? "").trim();
    const capacity = parseCount(String(formData.get("capacity") ?? "").trim(), "Capacity");
    const currentVolunteers = parseCount(
      String(formData.get("currentVolunteers") ?? "").trim(),
      "Current volunteers"
    );
    const waitlistEnabled =
      String(formData.get("waitlistEnabled") ?? "false") === "true";
    const published = String(formData.get("published") ?? "false") === "true";

    const imageFiles = formData.getAll("imageFiles").filter(
      (entry): entry is File => entry instanceof File && entry.size > 0
    );
    const existingImageFileIdsRaw = String(formData.get("existingImageFileIds") ?? "").trim();
    const existingImageFileIds = existingImageFileIdsRaw
      ? existingImageFileIdsRaw.split(",").filter(Boolean)
      : undefined;

    await updateOpportunity(id, {
      title: title.length ? title : undefined,
      eventDate: eventDateRaw.length
        ? parseDateTime(eventDateRaw, "Event date")
        : undefined,
      chapterId: chapterId.length ? chapterId : undefined,
      description: description.length ? description : undefined,
      sdgs: sdgsRaw.length ? parseSdgs(sdgsRaw) : undefined,
      signupContactName: signupContactName.length ? signupContactName : undefined,
      signupContactEmail: signupContactEmail.length ? signupContactEmail : undefined,
      signupContactPhone: signupContactPhone.length ? signupContactPhone : undefined,
      capacity,
      currentVolunteers,
      waitlistEnabled,
      published,
      imageFiles: imageFiles.length ? imageFiles : undefined,
      existingImageFileIds,
    });
    revalidatePath("/admin/opportunities");
    return { ok: true, message: "Opportunity updated." };
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to update opportunity").message;
    return { ok: false, message };
  }
}

async function deleteOpportunityAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    await deleteOpportunity(id);
    revalidatePath("/admin/opportunities");
    return { ok: true, message: "Opportunity deleted." };
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to delete opportunity").message;
    return { ok: false, message };
  }
}

function OpportunityCard({
  opportunity,
  chapters,
}: {
  opportunity: VolunteerOpportunity;
  chapters: Chapter[];
}) {
  const chapterLabel =
    chapters.find((chapter) => chapter.id === opportunity.chapterId)?.name ??
    opportunity.chapterId;

  return (
    <details className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-manrope text-lg font-semibold">{opportunity.title}</h3>
          <p className="text-xs text-muted">
            {chapterLabel} · {new Date(opportunity.eventDate).toLocaleString("en-PH")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${opportunity.published
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-muted"
              }`}
          >
            {opportunity.published ? "Published" : "Draft"}
          </span>
          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-ink transition group-open:border-orange-300 group-open:text-orange-600">
            Edit
          </span>
        </div>
      </summary>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <ToastForm action={updateOpportunityAction} className="space-y-3">
          <input type="hidden" name="id" value={opportunity.id} />
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-ink">
              Title
              <CountedInput
                name="title"
                defaultValue={opportunity.title}
                maxLength={128}
                hint="Required"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Event date/time
              <input
                name="eventDate"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(opportunity.eventDate)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
              />
            </label>
          </div>
          <label className="text-xs font-semibold text-ink">
            Description
            <CountedTextarea
              name="description"
              defaultValue={opportunity.description}
              maxLength={1024}
              rows={3}
              hint="Required"
            />
          </label>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-ink">
              Chapter
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="chapterId"
                defaultValue={opportunity.chapterId}
              >
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold text-ink">
              Status
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="published"
                defaultValue={opportunity.published ? "true" : "false"}
              >
                <option value="false">Draft</option>
                <option value="true">Published</option>
              </select>
            </label>
          </div>
          <div className="text-xs font-semibold text-ink">
            SDG tags
            <SdgMultiSelect
              name="sdgs"
              defaultValue={opportunity.sdgs}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs font-semibold text-ink">
              Contact name
              <CountedInput
                name="signupContactName"
                defaultValue={opportunity.signupContactName}
                maxLength={128}
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Contact email
              <CountedInput
                name="signupContactEmail"
                defaultValue={opportunity.signupContactEmail}
                maxLength={256}
                type="email"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Contact phone
              <CountedInput
                name="signupContactPhone"
                defaultValue={opportunity.signupContactPhone}
                maxLength={64}
              />
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-xs font-semibold text-ink">
              Capacity needed
              <input
                name="capacity"
                type="number"
                min={0}
                defaultValue={String(opportunity.capacity)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Current volunteers
              <input
                name="currentVolunteers"
                type="number"
                min={0}
                defaultValue={String(opportunity.currentVolunteers)}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Waitlist
              <select
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="waitlistEnabled"
                defaultValue={opportunity.waitlistEnabled ? "true" : "false"}
              >
                <option value="false">Disabled</option>
                <option value="true">Enabled</option>
              </select>
            </label>
          </div>
          <AdminImageUploader
            opportunityId={opportunity.id}
            existingFileIds={opportunity.imageFileIds ?? []}
          />
          <button
            type="submit"
            className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
          >
            Save changes
          </button>
        </ToastForm>

        <aside className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-xs text-muted">
          <p className="font-semibold text-ink">Quick guidance</p>
          <ul className="mt-2 space-y-2">
            <li>Use at least one SDG tag.</li>
            <li>Publish only when chapter and contacts are validated.</li>
            <li>Event date controls public ordering.</li>
          </ul>
          <ToastForm action={deleteOpportunityAction} className="mt-4">
            <input type="hidden" name="id" value={opportunity.id} />
            <button
              type="submit"
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700"
            >
              Delete opportunity
            </button>
          </ToastForm>
        </aside>
      </div>
    </details>
  );
}

export default async function AdminOpportunitiesPage() {
  let opportunities: VolunteerOpportunity[] = [];
  let chapters: Chapter[] = [];
  let hasLoadError = false;

  try {
    [opportunities, chapters] = await Promise.all([
      adminListOpportunities({ includeDrafts: true }),
      adminListChapters(),
    ]);
  } catch {
    hasLoadError = true;
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-600">Admin</p>
        <h1 className="mt-2 font-manrope text-4xl font-bold text-navy">Opportunities</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Create, publish, and manage volunteer opportunities across chapters.
        </p>
      </div>

      <ToastForm
        action={createOpportunityAction}
        className="mb-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-manrope text-3xl font-semibold text-navy">New opportunity</h2>
          <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Required fields marked
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold text-ink">
            Title <span className="ml-1 text-orange-600">Required</span>
            <CountedInput name="title" maxLength={128} hint="Max 128 characters." required />
          </label>
          <label className="text-xs font-semibold text-ink">
            Event date/time <span className="ml-1 text-orange-600">Required</span>
            <input
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="eventDate"
              type="datetime-local"
              required
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold text-ink">
          Description <span className="ml-1 text-orange-600">Required</span>
          <CountedTextarea
            name="description"
            maxLength={1024}
            rows={4}
            hint="Describe goals, deliverables, and requirements."
            required
          />
        </label>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="text-xs font-semibold text-ink">
            Chapter <span className="ml-1 text-orange-600">Required</span>
            <select
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
              name="chapterId"
              required
              disabled={!chapters.length}
            >
              {chapters.length ? (
                chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                  </option>
                ))
              ) : (
                <option value="">No chapters available</option>
              )}
            </select>
          </label>
          <label className="text-xs font-semibold text-ink">
            SDG tags <span className="ml-1 text-orange-600">Required</span>
            <CountedInput
              name="sdgs"
              maxLength={256}
              hint="Comma-separated, e.g. Quality Education, Climate Action"
              required
            />
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
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
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
        <div className="mt-3 grid gap-3 md:grid-cols-3">
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
            <div className="mt-1 text-[11px] text-muted">
              Existing volunteers already committed.
            </div>
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
        <AdminCreateImageUploader />
        <button
          type="submit"
          className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
          disabled={!chapters.length}
        >
          Create opportunity
        </button>
      </ToastForm>

      {hasLoadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Opportunities are unavailable. Please confirm admin access and Appwrite
          configuration.
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-muted">
          No opportunities yet. Create your first opportunity above.
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              chapters={chapters}
            />
          ))}
        </div>
      )}
    </section>
  );
}
