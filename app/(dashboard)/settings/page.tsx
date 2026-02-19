import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/services/auth";
import { toPublicDomainError } from "@/services/errorContract";
import {
  updateAccountEmail,
  updateAccountPassword,
  updateAvatar,
  updateProfile,
  getMyProfile,
} from "@/services/profiles";
import AvatarUploader from "@/components/settings/AvatarUploader";
import SettingsNav from "@/components/settings/SettingsNav";
import { resolveTab, type SettingsTab } from "@/lib/settingsTabs";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type StatusType = "success" | "error";

function readParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildRedirect(status: StatusType, message: string, tab: SettingsTab): never {
  const encoded = encodeURIComponent(message);
  redirect(`/settings?tab=${tab}&status=${status}&message=${encoded}`);
}

/* ── Status banner ── */
function StatusBanner({ status, message }: { status?: string; message?: string }) {
  if (!message) return null;
  const isError = status === "error";
  return (
    <div
      className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${isError
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-green-200 bg-green-50 text-green-700"
        }`}
    >
      {message}
    </div>
  );
}

/* ── Form field styling ── */
const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-400 transition focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100";

const secondaryBtnClass =
  "rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-gray-300 hover:bg-gray-50";

const primaryBtnClass =
  "rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600";

/* ── Server Actions ── */
async function updateProfileAction(formData: FormData): Promise<void> {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  const age = ageRaw ? Number(ageRaw) : undefined;
  if (ageRaw && Number.isNaN(age)) {
    buildRedirect("error", "Age must be a valid number.", "profile");
  }

  try {
    await updateProfile({
      name: name || undefined,
      age,
      email: email || undefined,
    });
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update profile.").message;
    buildRedirect("error", message, "profile");
  }

  revalidatePath("/settings");
  buildRedirect("success", "Profile updated.", "profile");
}

async function updateAvatarAction(formData: FormData): Promise<void> {
  "use server";
  const file = formData.get("avatar");
  if (!file || typeof file === "string") {
    buildRedirect("error", "Please select an avatar image.", "profile");
  }
  try {
    await updateAvatar(file as File);
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update avatar.").message;
    buildRedirect("error", message, "profile");
  }

  revalidatePath("/settings");
  buildRedirect("success", "Avatar updated.", "profile");
}

async function updateEmailAction(formData: FormData): Promise<void> {
  "use server";
  const email = String(formData.get("accountEmail") ?? "").trim();
  const password = String(formData.get("accountPassword") ?? "");

  try {
    await updateAccountEmail({ email, password });
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update email.").message;
    buildRedirect("error", message, "email");
  }

  revalidatePath("/settings");
  buildRedirect("success", "Account email updated.", "email");
}

async function updatePasswordAction(formData: FormData): Promise<void> {
  "use server";
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (nextPassword !== confirmPassword) {
    buildRedirect("error", "Passwords do not match.", "password");
  }

  try {
    await updateAccountPassword({ currentPassword, nextPassword });
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update password.").message;
    buildRedirect("error", message, "password");
  }

  revalidatePath("/settings");
  buildRedirect("success", "Password updated.", "password");
}

/* ── Tab Panels ── */
function ProfileTab({
  profile,
  avatarSrc,
}: {
  profile: { name?: string | null; age?: number | null; email?: string | null; role?: string | null; avatarFileId?: string | null };
  avatarSrc: string | null;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-manrope text-xl font-semibold text-ink">Profile</h2>
        <p className="mt-1 text-sm text-muted">
          Manage your personal details and avatar.
        </p>
      </div>

      <AvatarUploader
        name={profile.name ?? null}
        roleLabel={profile.role ?? "member"}
        initialUrl={avatarSrc}
        onUpload={updateAvatarAction}
      />

      <form action={updateProfileAction}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Full name
            <input
              className={inputClass}
              name="name"
              placeholder="Your name"
              defaultValue={profile.name ?? ""}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Age
            <input
              className={inputClass}
              name="age"
              placeholder="Optional"
              type="number"
              min={0}
              max={120}
              defaultValue={profile.age ?? ""}
            />
          </label>
          <label className="block text-sm font-medium text-ink sm:col-span-2">
            Contact email
            <input
              className={inputClass}
              name="email"
              type="email"
              placeholder="you@example.com"
              defaultValue={profile.email ?? ""}
            />
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <button type="reset" className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="submit" className={primaryBtnClass}>
            Save profile
          </button>
        </div>
      </form>
    </div>
  );
}

function EmailTab() {
  return (
    <div className="space-y-1">
      <h2 className="font-manrope text-xl font-semibold text-ink">Account Email</h2>
      <p className="text-sm text-muted">
        Update the email address you use to log in.
      </p>

      <form action={updateEmailAction} className="pt-5">
        <div className="grid gap-5">
          <label className="block text-sm font-medium text-ink">
            New email
            <input
              className={inputClass}
              name="accountEmail"
              type="email"
              placeholder="new@email.com"
              required
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Current password
            <input
              className={inputClass}
              name="accountPassword"
              type="password"
              placeholder="••••••••"
              required
            />
            <span className="mt-1 block text-xs text-muted">
              Enter your current password to confirm this change.
            </span>
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <button type="reset" className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="submit" className={primaryBtnClass}>
            Update email
          </button>
        </div>
      </form>
    </div>
  );
}

function PasswordTab() {
  return (
    <div className="space-y-1">
      <h2 className="font-manrope text-xl font-semibold text-ink">Password</h2>
      <p className="text-sm text-muted">
        Please enter your current password to change your password.
      </p>

      <form action={updatePasswordAction} className="pt-5">
        <div className="grid gap-5">
          <label className="block text-sm font-medium text-ink">
            Current password
            <input
              className={inputClass}
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            New password
            <input
              className={inputClass}
              name="nextPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
            />
            <span className="mt-1 block text-xs text-muted">
              Your new password must be more than 8 characters.
            </span>
          </label>
          <label className="block text-sm font-medium text-ink">
            Confirm new password
            <input
              className={inputClass}
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
            />
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
          <button type="reset" className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="submit" className={primaryBtnClass}>
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Page ── */
export default async function SettingsPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const status = readParam(searchParams, "status");
  const message = readParam(searchParams, "message");
  const tab = resolveTab(readParam(searchParams, "tab"));

  const session = await getSession();
  if (!session) {
    redirect("/login?next=/settings");
  }

  const profile = await getMyProfile();
  const avatarSrc = profile.avatarFileId
    ? `/api/profile/avatar?rev=${profile.avatarFileId}`
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        label="Settings"
        title="Account & Profile"
        subtitle="Keep your member profile updated and manage login credentials."
      />

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft md:p-8">
        <SettingsNav>
          <StatusBanner status={status} message={message} />

          {tab === "profile" && (
            <ProfileTab profile={profile} avatarSrc={avatarSrc} />
          )}
          {tab === "email" && <EmailTab />}
          {tab === "password" && <PasswordTab />}
        </SettingsNav>
      </div>
    </div>
  );
}
