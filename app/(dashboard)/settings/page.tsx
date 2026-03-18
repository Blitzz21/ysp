import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ToastForm } from "@/components/ui/ToastForm";
import { writeAdminAudit } from "@/services/adminAudit";
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
import { resolveTab } from "@/lib/settingsTabs";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DeleteAccountButton } from "@/components/settings/DeleteAccountButton";
import type { Gender } from "@/services/types";
import { type SearchParams, readParam } from "@/lib/pageHelpers";

export const dynamic = "force-dynamic";

/* ── Form field styling ── */
const inputClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-gray-400 transition focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100";

const selectClass =
  "mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-ink transition focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-100";

const secondaryBtnClass =
  "rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-gray-300 hover:bg-gray-50";

const primaryBtnClass =
  "rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600";

/* ── Server Actions ── */
async function updateProfileAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const name = [firstName, lastName].filter(Boolean).join(" ");
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const genderRaw = String(formData.get("gender") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();

  const age = ageRaw ? Number(ageRaw) : undefined;
  if (ageRaw && Number.isNaN(age)) {
    return { ok: false, message: "Age must be a valid number." };
  }

  const validGenders = ["male", "female", "other", "prefer_not_to_say"];
  const gender = validGenders.includes(genderRaw) ? (genderRaw as Gender) : undefined;

  try {
    await updateProfile({
      name: name || undefined,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      age,
      email: email || undefined,
      phone: phone || undefined,
      bio: bio || undefined,
      gender,
    });
    revalidatePath("/settings");
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "member", action: "profile.update", targetType: "profile" });
    return { ok: true, message: "Profile updated." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update profile.").message;
    return { ok: false, message };
  }
}

async function updateAvatarAction(formData: FormData): Promise<void> {
  "use server";
  const file = formData.get("avatar");
  if (!file || typeof file === "string") {
    return;
  }
  try {
    await updateAvatar(file as File);
  } catch {
    // Avatar upload errors handled by the component
    return;
  }

  revalidatePath("/settings");
  const session = await getSession();
  if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "member", action: "avatar.update", targetType: "profile" });
}

async function updateEmailAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const email = String(formData.get("accountEmail") ?? "").trim();
  const password = String(formData.get("accountPassword") ?? "");

  try {
    await updateAccountEmail({ email, password });
    revalidatePath("/settings");
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "member", action: "account.email.update", targetType: "account" });
    return { ok: true, message: "Account email updated." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update email.").message;
    return { ok: false, message };
  }
}

async function updatePasswordAction(
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  "use server";
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (nextPassword !== confirmPassword) {
    return { ok: false, message: "Passwords do not match." };
  }

  try {
    await updateAccountPassword({ currentPassword, nextPassword });
    revalidatePath("/settings");
    const session = await getSession();
    if (session) writeAdminAudit({ actorId: session.userId, actorRole: session.role ?? "member", action: "account.password.update", targetType: "account" });
    return { ok: true, message: "Password updated." };
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update password.").message;
    return { ok: false, message };
  }
}

/* ── Tab Panels ── */
function ProfileTab({
  profile,
  avatarSrc,
}: {
  profile: {
    name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
    email?: string | null;
    phone?: string | null;
    bio?: string | null;
    gender?: string | null;
    role?: string | null;
    avatarFileId?: string | null;
  };
  avatarSrc: string | null;
}) {
  return (
    <div className="space-y-8">
      {/* ── Avatar Card ── */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-orange-50/60 to-white p-6">
        <h2 className="font-manrope text-lg font-semibold text-ink">Profile Photo</h2>
        <p className="mt-1 text-sm text-muted">
          Upload a profile picture to personalize your account.
        </p>
        <div className="mt-5">
          <AvatarUploader
            name={profile.name ?? null}
            roleLabel={profile.role ?? "member"}
            initialUrl={avatarSrc}
            onUpload={updateAvatarAction}
          />
        </div>
      </div>

      {/* ── Personal Info Card ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="font-manrope text-lg font-semibold text-ink">Personal Information</h2>
        <p className="mt-1 text-sm text-muted">
          Update your personal details and contact information.
        </p>

        <ToastForm action={updateProfileAction} className="mt-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-ink">
              First name
              <input
                className={inputClass}
                name="firstName"
                placeholder="Jane"
                defaultValue={profile.firstName ?? ""}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Last name
              <input
                className={inputClass}
                name="lastName"
                placeholder="Doe"
                defaultValue={profile.lastName ?? ""}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Contact email
              <input
                className={inputClass}
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={profile.email ?? ""}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Phone number
              <input
                className={inputClass}
                name="phone"
                type="tel"
                placeholder="+63 912 345 6789"
                defaultValue={profile.phone ?? ""}
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
            <label className="block text-sm font-medium text-ink">
              Gender
              <select
                className={selectClass}
                name="gender"
                defaultValue={profile.gender ?? ""}
              >
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-ink sm:col-span-2">
              Bio
              <textarea
                className={`${inputClass} min-h-[100px] resize-y`}
                name="bio"
                placeholder="Tell us a little about yourself…"
                defaultValue={profile.bio ?? ""}
                maxLength={1024}
                rows={4}
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
        </ToastForm>
      </div>
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

      <ToastForm action={updateEmailAction} className="pt-5">
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
      </ToastForm>
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

      <ToastForm action={updatePasswordAction} className="pt-5">
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
      </ToastForm>
    </div>
  );
}

function NotificationsTab() {
  const toggles = [
    {
      id: "email-notifs",
      label: "Email Notifications",
      description: "Receive email updates about your account activity.",
    },
    {
      id: "opportunity-alerts",
      label: "Opportunity Alerts",
      description: "Get notified when new volunteer opportunities are posted.",
    },
    {
      id: "chapter-updates",
      label: "Chapter Updates",
      description: "Stay informed about activities in your joined chapters.",
    },
  ];

  return (
    <div className="space-y-1">
      <h2 className="font-manrope text-xl font-semibold text-ink">Notifications</h2>
      <p className="text-sm text-muted">
        Choose which notifications you&apos;d like to receive.
      </p>

      <div className="mt-6 space-y-4">
        {toggles.map((toggle) => (
          <div
            key={toggle.id}
            className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300"
          >
            <div>
              <p className="text-sm font-semibold text-ink">{toggle.label}</p>
              <p className="mt-0.5 text-xs text-muted">{toggle.description}</p>
            </div>
            {/* UI-only toggle — not wired to backend */}
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" defaultChecked />
              <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all after:content-[''] peer-checked:bg-orange-500 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-orange-100" />
            </label>
          </div>
        ))}
      </div>

      <p className="mt-5 text-xs text-muted">
        Notification preferences are currently visual placeholders. Toast notifications will be used for in-app alerts.
      </p>
    </div>
  );
}

function AccountTab({
  profile,
}: {
  profile: { userId: string; name?: string | null; firstName?: string | null; lastName?: string | null; email?: string | null; role?: string | null; createdAt: string };
}) {
  const joinedDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const displayName =
    profile.name ||
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    null;

  return (
    <div className="space-y-1">
      <h2 className="font-manrope text-xl font-semibold text-ink">Account Settings</h2>
      <p className="text-sm text-muted">
        View your account information and manage your session.
      </p>

      <div className="mt-6 space-y-4">
        {/* Account Info Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-ink">Account Information</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {displayName && (
              <div>
                <p className="text-xs font-medium text-muted">Name</p>
                <p className="mt-0.5 text-sm font-semibold text-ink">{displayName}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-muted">User ID</p>
              <p className="mt-0.5 text-sm font-mono text-ink">{profile.userId}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Role</p>
              <p className="mt-0.5 text-sm text-ink capitalize">{profile.role ?? "Member"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Account Email</p>
              <p className="mt-0.5 text-sm text-ink">{profile.email ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Member Since</p>
              <p className="mt-0.5 text-sm text-ink">{joinedDate}</p>
            </div>
          </div>
        </div>

        {/* Session */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-ink">Session</h3>
          <p className="mt-1 text-xs text-muted">
            Log out of your current session. You can always log back in.
          </p>
          <div className="mt-4">
            <a
              href="/api/auth/logout"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-gray-300 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </a>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-5">
          <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
          <p className="mt-1 text-xs text-red-600/80">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <div className="mt-4">
            <DeleteAccountButton />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Page ── */
export default async function SettingsPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};
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
          {tab === "profile" && (
            <ProfileTab profile={profile} avatarSrc={avatarSrc} />
          )}
          {tab === "email" && <EmailTab />}
          {tab === "password" && <PasswordTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "account" && (
            <AccountTab
              profile={profile}
            />
          )}
        </SettingsNav>
      </div>
    </div>
  );
}
