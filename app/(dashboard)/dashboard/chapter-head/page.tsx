import { redirect } from "next/navigation";

import { getSession } from "@/services/auth";
import { toPublicDomainError } from "@/services/errorContract";
import {
  assignOfficer,
  createOfficerRole,
  listChapterMembers,
  listOfficerRoles,
  removeMember,
  removeOfficer,
  updateOfficerPermissions,
} from "@/services/memberships";

type SearchParams = Record<string, string | string[] | undefined>;

type StatusType = "success" | "error";

function readParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildRedirect(status: StatusType, message: string): never {
  const encoded = encodeURIComponent(message);
  redirect(`/dashboard/chapter-head?status=${status}&message=${encoded}`);
}

function StatusBanner({ status, message }: { status?: string; message?: string }) {
  if (!message) return null;
  const isError = status === "error";
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-sm ${
        isError
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }`}
    >
      {message}
    </div>
  );
}

async function createRoleAction(formData: FormData): Promise<void> {
  "use server";
  const label = String(formData.get("label") ?? "").trim();
  const permissions = String(formData.get("permissions") ?? "").trim();

  try {
    await createOfficerRole({ label, permissions });
    buildRedirect("success", "Officer role created.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to create officer role.").message;
    buildRedirect("error", message);
  }
}

async function updateRoleAction(formData: FormData): Promise<void> {
  "use server";
  const roleId = String(formData.get("roleId") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const permissions = String(formData.get("permissions") ?? "").trim();

  try {
    await updateOfficerPermissions({ roleId, label: label || undefined, permissions });
    buildRedirect("success", "Officer role updated.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update officer role.").message;
    buildRedirect("error", message);
  }
}

async function assignOfficerAction(formData: FormData): Promise<void> {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "").trim();

  try {
    await assignOfficer({ userId, roleId });
    buildRedirect("success", "Officer assigned.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to assign officer.").message;
    buildRedirect("error", message);
  }
}

async function removeOfficerAction(formData: FormData): Promise<void> {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  try {
    await removeOfficer({ userId });
    buildRedirect("success", "Officer removed.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to remove officer.").message;
    buildRedirect("error", message);
  }
}

async function removeMemberAction(formData: FormData): Promise<void> {
  "use server";
  const userId = String(formData.get("userId") ?? "").trim();
  try {
    await removeMember({ userId });
    buildRedirect("success", "Member removed.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to remove member.").message;
    buildRedirect("error", message);
  }
}

export default async function ChapterHeadDashboard(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const status = readParam(searchParams, "status");
  const message = readParam(searchParams, "message");

  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/chapter-head");
  }

  const members = await listChapterMembers();
  const officerRoles = await listOfficerRoles();

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
          Chapter head
        </p>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-manrope text-3xl font-semibold text-ink">
              Chapter dashboard
            </h1>
            <p className="mt-2 text-sm text-muted">
              Manage your chapter members, officers, and roles.
            </p>
          </div>
          <a
            className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
            href="/chapter/opportunities"
          >
            Manage opportunities
          </a>
        </div>
      </header>

      <StatusBanner status={status} message={message} />

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <h2 className="font-manrope text-xl font-semibold text-ink">Members</h2>
          <p className="mt-2 text-sm text-muted">
            Assign officers or remove members from your chapter.
          </p>
          <div className="mt-6 space-y-4">
            {members.length ? (
              members.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl border border-gray-100 bg-[#fdf6ef] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{member.userId}</p>
                      <p className="text-xs text-muted">
                        Role: {member.role} · Status: {member.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={assignOfficerAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={member.userId} />
                        <select
                          name="roleId"
                          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs"
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
                          className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-600"
                        >
                          Assign officer
                        </button>
                      </form>
                      <form action={removeOfficerAction}>
                        <input type="hidden" name="userId" value={member.userId} />
                        <button
                          type="submit"
                          className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-ink"
                        >
                          Remove officer
                        </button>
                      </form>
                      <form action={removeMemberAction}>
                        <input type="hidden" name="userId" value={member.userId} />
                        <button
                          type="submit"
                          className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-semibold text-red-600"
                        >
                          Remove member
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-sm text-muted">
                No members found for this chapter yet.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
            <h2 className="font-manrope text-xl font-semibold text-ink">Officer roles</h2>
            <p className="mt-2 text-sm text-muted">
              Define role labels and permission descriptions for your officers.
            </p>
            <form action={createRoleAction} className="mt-5 space-y-3">
              <label className="text-xs font-semibold text-ink">
                Role label
                <input
                  name="label"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Operations lead"
                  required
                />
              </label>
              <label className="text-xs font-semibold text-ink">
                Permissions
                <textarea
                  name="permissions"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  rows={4}
                  placeholder="manage_opportunities, manage_members"
                  required
                />
              </label>
              <button
                type="submit"
                className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-glow"
              >
                Create role
              </button>
            </form>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
            <h3 className="font-manrope text-lg font-semibold text-ink">Edit roles</h3>
            <div className="mt-4 space-y-4">
              {officerRoles.length ? (
                officerRoles.map((role) => (
                  <form
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
                    <label className="mt-3 block text-xs font-semibold text-ink">
                      Permissions
                      <textarea
                        name="permissions"
                        className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                        rows={3}
                        defaultValue={role.permissions}
                      />
                    </label>
                    <button
                      type="submit"
                      className="mt-3 rounded-full border border-gray-200 bg-white px-4 py-1 text-xs font-semibold text-ink"
                    >
                      Update role
                    </button>
                  </form>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-gray-200 bg-[#fff7ea] p-4 text-sm text-muted">
                  Create your first officer role to begin assigning officers.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
