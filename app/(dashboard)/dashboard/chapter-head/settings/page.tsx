export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { writeAdminAudit } from "@/services/adminAudit";
import { getSession } from "@/services/auth";
import { getMyChapter, transferChapterOwnership, updateMyChapterContact } from "@/services/chapters";
import { toPublicDomainError } from "@/services/errorContract";
import { listChapterMembers } from "@/services/memberships";
import { getProfileByUserId } from "@/services/profiles";
import type { ChapterMembership, UserProfile } from "@/services/types";

import { ToastForm } from "@/components/ui/ToastForm";

const REVALIDATE_PATH = "/dashboard/chapter-head/settings";

async function updateContactAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const facebookUrl = String(formData.get("facebookUrl") ?? "").trim();

  try {
    await updateMyChapterContact({
      contactEmail: contactEmail.length ? contactEmail : undefined,
      contactPhone: contactPhone.length ? contactPhone : undefined,
      facebookUrl: facebookUrl.length ? facebookUrl : undefined,
    });
    revalidatePath(REVALIDATE_PATH);
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "chapter_head", action: "chapter.contact.update", targetType: "chapter" });
    return { ok: true, message: "Contact details updated." };
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to update contact details.").message;
    return { ok: false, message };
  }
}

async function transferOwnershipAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const newOwnerUserId = String(formData.get("newOwnerUserId") ?? "").trim();
  if (!newOwnerUserId) {
    return { ok: false, message: "Please select a member to transfer ownership to." };
  }

  try {
    await transferChapterOwnership(newOwnerUserId);
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "chapter_head", action: "chapter.transfer", targetType: "chapter", targetId: newOwnerUserId });
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to transfer ownership.").message;
    return { ok: false, message };
  }

  redirect("/dashboard/member");
}

type MemberWithProfile = ChapterMembership & {
  profile?: UserProfile | null;
};

export default async function ChapterHeadSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/chapter-head/settings");
  }

  const [chapter, members] = await Promise.all([
    getMyChapter(),
    listChapterMembers(),
  ]);

  const activeMembers = members.filter((m) => m.status === "active" && m.userId !== session.userId);

  const membersWithProfiles: MemberWithProfile[] = await Promise.all(
    activeMembers.map(async (m) => {
      let profile: UserProfile | null = null;
      try {
        profile = await getProfileByUserId(m.userId);
      } catch {
        // Profile may not exist
      }
      return { ...m, profile };
    })
  );

  return (
    <div className="space-y-8">
      <PageHeader
        label="Chapter head"
        title="Chapter Settings"
        subtitle="Update your chapter details and manage ownership."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="font-manrope text-xl font-semibold text-ink">Chapter Details</h2>
          <p className="mt-2 text-sm text-muted">
            Basic information about your chapter.
          </p>

          <div className="mt-5 space-y-3">
            <div>
              <p className="text-xs font-semibold text-ink">Chapter Name</p>
              <p className="mt-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-muted">
                {chapter.name}
              </p>
              <p className="mt-1 text-[11px] text-muted">Contact an admin to change the chapter name.</p>
            </div>

            {chapter.location && (
              <div>
                <p className="text-xs font-semibold text-ink">Location</p>
                <p className="mt-1 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-muted">
                  {chapter.location}
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="font-manrope text-xl font-semibold text-ink">Contact Details</h2>
          <p className="mt-2 text-sm text-muted">
            Update how members and volunteers can reach your chapter.
          </p>

          <ToastForm action={updateContactAction} className="mt-5 space-y-3">
            <label className="text-xs font-semibold text-ink">
              Contact Email
              <input
                name="contactEmail"
                type="email"
                defaultValue={chapter.contactEmail ?? ""}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="chapter@example.com"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Contact Phone
              <input
                name="contactPhone"
                type="tel"
                defaultValue={chapter.contactPhone ?? ""}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="+63 912 345 6789"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Facebook URL
              <input
                name="facebookUrl"
                type="url"
                defaultValue={chapter.facebookUrl ?? ""}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                placeholder="https://facebook.com/..."
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
            >
              Save contact details
            </button>
          </ToastForm>
        </section>
      </div>

      <section className="rounded-3xl border border-red-100 bg-white p-6 shadow-soft">
        <h2 className="font-manrope text-xl font-semibold text-red-700">Transfer Ownership</h2>
        <p className="mt-2 text-sm text-muted">
          Transfer chapter head ownership to another active member. This action will remove your chapter head role
          and assign it to the selected member. This cannot be undone without admin intervention.
        </p>

        {membersWithProfiles.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-sm text-muted">
            No eligible members to transfer ownership to. You need at least one active member in your chapter.
          </p>
        ) : (
          <ToastForm action={transferOwnershipAction} className="mt-5 flex flex-wrap items-end gap-3">
            <label className="flex-1 text-xs font-semibold text-ink">
              New Chapter Head
              <select
                name="newOwnerUserId"
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Select a member
                </option>
                {membersWithProfiles.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.profile?.name ?? m.profile?.email ?? m.userId}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Transfer Ownership
            </button>
          </ToastForm>
        )}
      </section>
    </div>
  );
}
