export const dynamic = "force-dynamic";

import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { toPublicDomainError } from "@/services/errorContract";
import {
  createMyChapterOpportunity,
  deleteOpportunity,
  listMyChapterOpportunities,
  updateOpportunity,
} from "@/services/opportunities";
import type { VolunteerOpportunity } from "@/services/types";

import { OpportunitiesClientWrapper } from "./_components/OpportunitiesClientWrapper";

const REVALIDATE_PATH = "/dashboard/chapter-head/opportunities";

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

async function createOpportunityAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
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
    revalidatePath(REVALIDATE_PATH);
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
    revalidatePath(REVALIDATE_PATH);
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
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Opportunity deleted." };
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to delete opportunity").message;
    return { ok: false, message };
  }
}

export default async function ChapterHeadOpportunitiesPage() {
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
        title="Opportunities"
        subtitle="Create, edit, and manage volunteer opportunities for your chapter."
      />

      {hasLoadError ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Opportunities are unavailable. Please confirm your chapter head access.
        </div>
      ) : (
        <OpportunitiesClientWrapper
          opportunities={opportunities}
          createAction={createOpportunityAction}
          updateAction={updateOpportunityAction}
          deleteAction={deleteOpportunityAction}
        />
      )}
    </section>
  );
}
