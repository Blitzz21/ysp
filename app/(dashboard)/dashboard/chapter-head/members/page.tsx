export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { PermissionSelect } from "@/components/dashboard/PermissionSelect";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { getSession } from "@/services/auth";
import { toPublicDomainError } from "@/services/errorContract";
import {
  approveMember,
  assignOfficer,
  createOfficerRole,
  declineMember,
  listChapterMembers,
  listOfficerRoles,
  listPendingMembers,
  removeMember,
  removeOfficer,
  updateOfficerPermissions,
} from "@/services/memberships";
import { listMemberSignups, listMyChapterOpportunities } from "@/services/opportunities";
import { getProfileByUserId } from "@/services/profiles";
import type { ChapterMembership, OpportunitySignup, UserProfile, VolunteerOpportunity } from "@/services/types";
import { type SearchParams, readParam } from "@/lib/pageHelpers";
import { revalidatePath } from "next/cache";

import { MembersClientWrapper, MemberToastForm } from "./_components/MembersClientWrapper";

const REVALIDATE_PATH = "/dashboard/chapter-head/members";

async function createRoleAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const label = String(formData.get("label") ?? "").trim();
  const permissions = String(formData.get("permissions") ?? "").trim();
  try {
    await createOfficerRole({ label, permissions });
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Officer role created." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to create officer role.").message;
    return { ok: false, message };
  }
}

async function updateRoleAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const roleId = String(formData.get("roleId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const permissions = String(formData.get("permissions") ?? "").trim();
  try {
    await updateOfficerPermissions({ roleId, label: label || undefined, permissions });
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Officer role updated." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update officer role.").message;
    return { ok: false, message };
  }
}

async function assignOfficerAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "").trim();
  try {
    await assignOfficer({ userId, roleId });
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Officer assigned." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to assign officer.").message;
    return { ok: false, message };
  }
}

async function removeOfficerAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  try {
    await removeOfficer({ userId });
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Officer removed." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to remove officer.").message;
    return { ok: false, message };
  }
}

async function removeMemberAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  try {
    await removeMember({ userId });
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Member removed." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to remove member.").message;
    return { ok: false, message };
  }
}

async function approveMemberAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  try {
    await approveMember({ userId });
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Member approved." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to approve member.").message;
    return { ok: false, message };
  }
}

async function declineMemberAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  try {
    await declineMember({ userId });
    revalidatePath(REVALIDATE_PATH);
    return { ok: true, message: "Member request declined." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to decline member.").message;
    return { ok: false, message };
  }
}

type MemberWithProfile = ChapterMembership & {
  profile?: UserProfile | null;
  signups?: (OpportunitySignup & { opportunityTitle?: string })[];
};

async function enrichWithProfiles(
  members: ChapterMembership[],
  opportunities: VolunteerOpportunity[]
): Promise<MemberWithProfile[]> {
  const oppMap = new Map(opportunities.map((o) => [o.id, o.title]));

  return Promise.all(
    members.map(async (m) => {
      let profile: UserProfile | null = null;
      try {
        profile = await getProfileByUserId(m.userId);
      } catch {
        // Profile may not exist
      }

      let signups: (OpportunitySignup & { opportunityTitle?: string })[] = [];
      try {
        const raw = await listMemberSignups(m.userId);
        signups = raw.map((s) => ({
          ...s,
          opportunityTitle: oppMap.get(s.opportunityId),
        }));
      } catch {
        // Signups may not be accessible
      }

      return { ...m, profile, signups };
    })
  );
}

function MemberCard({
  member,
  officerRoles,
  isPending,
}: {
  member: MemberWithProfile;
  officerRoles: { id: string; roleId: string; label: string }[];
  isPending?: boolean;
}) {
  const displayName = member.profile?.name ?? member.profile?.email ?? member.userId;
  const displayEmail = member.profile?.email ?? "";

  return (
    <details className="group rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold text-ink">{displayName}</p>
          {displayEmail && (
            <p className="mt-0.5 text-xs text-muted">{displayEmail}</p>
          )}
          <p className="mt-0.5 text-xs text-muted">
            Role: {member.role} · Status: {member.status}
            {member.profile?.sector && ` · Sector: ${member.profile.sector}`}
          </p>
        </div>
        <svg className="h-4 w-4 shrink-0 text-gray-300 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>

      <div className="border-t border-gray-200/60 px-4 pb-4 pt-3 space-y-4">
        <div className="flex flex-wrap gap-2">
          {isPending ? (
            <>
              <MemberToastForm action={approveMemberAction}>
                <input type="hidden" name="userId" value={member.userId} />
                <button
                  type="submit"
                  className="rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-600 transition hover:bg-emerald-50"
                >
                  Approve
                </button>
              </MemberToastForm>
              <MemberToastForm action={declineMemberAction}>
                <input type="hidden" name="userId" value={member.userId} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  Decline
                </button>
              </MemberToastForm>
            </>
          ) : (
            <>
              <MemberToastForm action={assignOfficerAction} className="flex items-center gap-2">
                <input type="hidden" name="userId" value={member.userId} />
                <select
                  name="roleId"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs"
                  defaultValue={member.officerRoleId ?? ""}
                >
                  <option value="" disabled>
                    Select role
                  </option>
                  {officerRoles.map((role) => (
                    <option key={role.id} value={role.roleId}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800"
                >
                  Assign
                </button>
              </MemberToastForm>
              <MemberToastForm action={removeOfficerAction}>
                <input type="hidden" name="userId" value={member.userId} />
                <button
                  type="submit"
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-gray-50 hover:text-ink"
                >
                  Remove officer
                </button>
              </MemberToastForm>
              <MemberToastForm action={removeMemberAction}>
                <input type="hidden" name="userId" value={member.userId} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  Remove member
                </button>
              </MemberToastForm>
            </>
          )}
        </div>

        {!isPending && member.signups && member.signups.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink mb-2">
              Joined Opportunities ({member.signups.length})
            </p>
            <div className="space-y-1.5">
              {member.signups.map((signup) => (
                <div
                  key={signup.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/50 px-3 py-2"
                >
                  <p className="text-sm text-ink">
                    {signup.opportunityTitle ?? signup.opportunityId}
                  </p>
                  <p className="text-[11px] text-muted">
                    {new Date(signup.joinedAt).toLocaleDateString("en-PH")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isPending && (
          <p className="text-[11px] text-muted">
            Joined chapter: {new Date(member.joinedAt).toLocaleDateString("en-PH")}
          </p>
        )}
      </div>
    </details>
  );
}

export default async function ChapterHeadMembersPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const view = readParam(searchParams, "view") ?? "active";

  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/chapter-head/members");
  }

  const [members, pendingMembers, officerRoles, opportunities] = await Promise.all([
    listChapterMembers(),
    listPendingMembers(),
    listOfficerRoles(),
    listMyChapterOpportunities(),
  ]);

  const activeMembers = members.filter((m) => m.status === "active");
  const displayMembers = view === "pending" ? pendingMembers : activeMembers;
  const enrichedMembers = await enrichWithProfiles(displayMembers, opportunities);

  return (
    <div className="space-y-8">
      <PageHeader
        label="Chapter head"
        title="Members"
        subtitle="Manage your chapter members and officer roles."
      />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-manrope text-xl font-semibold text-ink">Members</h2>
            <div className="flex rounded-full border border-gray-200 bg-gray-50 p-0.5">
              <a
                href="/dashboard/chapter-head/members?view=active"
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${view === "active"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-muted hover:text-ink"
                  }`}
              >
                Active ({activeMembers.length})
              </a>
              <a
                href="/dashboard/chapter-head/members?view=pending"
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${view === "pending"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-muted hover:text-ink"
                  }`}
              >
                Pending ({pendingMembers.length})
              </a>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">
            {view === "pending"
              ? "Review and approve or decline membership requests."
              : "Click on a member to see their details, joined opportunities, and manage their role."}
          </p>
          <div className="mt-6 space-y-4">
            {enrichedMembers.length ? (
              enrichedMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  officerRoles={officerRoles}
                  isPending={view === "pending"}
                />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-sm text-muted">
                {view === "pending"
                  ? "No pending membership requests."
                  : "No members found for this chapter yet."}
              </p>
            )}
          </div>
        </div>

        <MembersClientWrapper createRoleAction={createRoleAction}>
          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h3 className="font-manrope text-lg font-semibold text-ink">Edit roles</h3>
              <div className="mt-4 space-y-4">
                {officerRoles.length ? (
                  officerRoles.map((role) => (
                    <MemberToastForm
                      key={role.id}
                      action={updateRoleAction}
                      className="rounded-2xl border border-gray-100 bg-[#fdf6ef] p-4"
                    >
                      <input type="hidden" name="roleId" value={role.roleId} />
                      <label className="text-xs font-semibold text-ink">
                        Label
                        <input
                          name="label"
                          className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          defaultValue={role.label}
                        />
                      </label>
                      <div className="mt-3 text-xs font-semibold text-ink">
                        Permissions
                        <PermissionSelect name="permissions" defaultValue={role.permissions} />
                      </div>
                      <button
                        type="submit"
                        className="mt-3 rounded-full border border-gray-200 bg-white px-4 py-1 text-xs font-semibold text-ink"
                      >
                        Update role
                      </button>
                    </MemberToastForm>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-sm text-muted">
                    No officer roles yet. Click &quot;Add Officer Role&quot; to create one.
                  </p>
                )}
              </div>
            </div>
          </div>
        </MembersClientWrapper>
      </section>
    </div>
  );
}
