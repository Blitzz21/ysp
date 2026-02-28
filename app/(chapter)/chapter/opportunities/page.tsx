import { revalidatePath } from "next/cache";

import { CountedInput, CountedTextarea } from "@/components/admin/CountedField";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { toPublicDomainError } from "@/services/errorContract";
import {
  createMyChapterOpportunity,
  deleteOpportunity,
  listMyChapterOpportunities,
  updateOpportunity,
} from "@/services/opportunities";
import { PageHeader } from "@/components/dashboard/PageHeader";
import type { VolunteerOpportunity } from "@/services/types";
import { type SearchParams, readParam, createRedirectBuilder } from "@/lib/pageHelpers";

const buildRedirect = createRedirectBuilder("/chapter/opportunities");

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

async function createOpportunityAction(formData: FormData): Promise<void> {
  "use server";
  try {
    const title = String(formData.get("title") ?? "").trim();
    const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
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

    await createMyChapterOpportunity({
      title,
      eventDate: parseDateTime(eventDateRaw, "Event date"),
      description,
      sdgs: parseSdgs(sdgsRaw),
      signupContactName: signupContactName.length ? signupContactName : undefined,
      signupContactEmail: signupContactEmail.length ? signupContactEmail : undefined,
      signupContactPhone: signupContactPhone.length ? signupContactPhone : undefined,
      capacity,
      currentVolunteers,
      waitlistEnabled,
      published,
    });
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to create opportunity").message;
    buildRedirect("error", message);
  }

  revalidatePath("/chapter/opportunities");
  buildRedirect("success", "Opportunity created.");
}

async function updateOpportunityAction(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    const title = String(formData.get("title") ?? "").trim();
    const eventDateRaw = String(formData.get("eventDate") ?? "").trim();
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

    await updateOpportunity(id, {
      title: title.length ? title : undefined,
      eventDate: eventDateRaw.length
        ? parseDateTime(eventDateRaw, "Event date")
        : undefined,
      description: description.length ? description : undefined,
      sdgs: sdgsRaw.length ? parseSdgs(sdgsRaw) : undefined,
      signupContactName: signupContactName.length ? signupContactName : undefined,
      signupContactEmail: signupContactEmail.length ? signupContactEmail : undefined,
      signupContactPhone: signupContactPhone.length ? signupContactPhone : undefined,
      capacity,
      currentVolunteers,
      waitlistEnabled,
      published,
    });
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to update opportunity").message;
    buildRedirect("error", message);
  }

  revalidatePath("/chapter/opportunities");
  buildRedirect("success", "Opportunity updated.");
}

async function deleteOpportunityAction(formData: FormData): Promise<void> {
  "use server";
  const id = String(formData.get("id") ?? "").trim();
  try {
    await deleteOpportunity(id);
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to delete opportunity").message;
    buildRedirect("error", message);
  }

  revalidatePath("/chapter/opportunities");
  buildRedirect("success", "Opportunity deleted.");
}


function OpportunityCard({ opportunity }: { opportunity: VolunteerOpportunity }) {
  return (
    <details className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-manrope text-lg font-semibold">{opportunity.title}</h3>
          <p className="text-xs text-muted">
            {new Date(opportunity.eventDate).toLocaleString("en-PH")}
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
        <form action={updateOpportunityAction} className="space-y-3">
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
            <label className="text-xs font-semibold text-ink">
              SDG tags
              <CountedInput
                name="sdgs"
                defaultValue={opportunity.sdgs.join(", ")}
                maxLength={256}
                hint="Comma-separated tags"
              />
            </label>
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
          <button
            type="submit"
            className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
          >
            Save changes
          </button>
        </form>

        <aside className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-xs text-muted">
          <p className="font-semibold text-ink">Quick guidance</p>
          <ul className="mt-2 space-y-2">
            <li>Drafts are visible only to your chapter head view.</li>
            <li>Publish when chapter approvals are complete.</li>
            <li>Event date controls public ordering.</li>
          </ul>
          <form action={deleteOpportunityAction} className="mt-4">
            <input type="hidden" name="id" value={opportunity.id} />
            <button
              type="submit"
              className="rounded-full border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-700"
            >
              Delete opportunity
            </button>
          </form>
        </aside>
      </div>
    </details>
  );
}

export default async function ChapterOpportunitiesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const status = readParam(params, "status");
  const message = readParam(params, "message");

  let opportunities: VolunteerOpportunity[] = [];
  let hasLoadError = false;

  try {
    opportunities = await listMyChapterOpportunities();
  } catch {
    hasLoadError = true;
  }

  return (
    <section>
      <PageHeader
        label="Chapter head"
        title="Chapter Opportunities"
        subtitle="Manage volunteer opportunities for your assigned chapter."
      />

      <StatusBanner status={status} message={message} className="mb-6" />

      <form
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
        <div className="mt-3 grid gap-3 md:grid-cols-2">
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
        <button
          type="submit"
          className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow"
        >
          Create opportunity
        </button>
      </form>

      {hasLoadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Opportunities are unavailable. Please confirm your chapter head access.
        </div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-muted">
          No opportunities yet. Create your first opportunity above.
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      )}
    </section>
  );
}
