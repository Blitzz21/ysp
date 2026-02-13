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

function buildRedirect(status: StatusType, message: string): never {
  const encoded = encodeURIComponent(message);
  redirect(`/settings?status=${status}&message=${encoded}`);
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

async function updateProfileAction(formData: FormData): Promise<void> {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const ageRaw = String(formData.get("age") ?? "").trim();
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  const age = ageRaw ? Number(ageRaw) : undefined;
  if (ageRaw && Number.isNaN(age)) {
    buildRedirect("error", "Age must be a valid number.");
  }

  try {
    await updateProfile({
      name: name || undefined,
      age,
      avatarUrl: avatarUrl || undefined,
      email: email || undefined,
    });
    revalidatePath("/settings");
    buildRedirect("success", "Profile updated.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update profile.").message;
    buildRedirect("error", message);
  }
}

async function updateAvatarAction(formData: FormData): Promise<void> {
  "use server";
  const file = formData.get("avatar");
  if (!file || typeof file === "string") {
    buildRedirect("error", "Please select an avatar image.");
  }
  try {
    await updateAvatar(file as File);
    revalidatePath("/settings");
    buildRedirect("success", "Avatar updated.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update avatar.").message;
    buildRedirect("error", message);
  }
}

async function updateEmailAction(formData: FormData): Promise<void> {
  "use server";
  const email = String(formData.get("accountEmail") ?? "").trim();
  const password = String(formData.get("accountPassword") ?? "");

  try {
    await updateAccountEmail({ email, password });
    revalidatePath("/settings");
    buildRedirect("success", "Account email updated.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update email.").message;
    buildRedirect("error", message);
  }
}

async function updatePasswordAction(formData: FormData): Promise<void> {
  "use server";
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const nextPassword = String(formData.get("nextPassword") ?? "");

  try {
    await updateAccountPassword({ currentPassword, nextPassword });
    revalidatePath("/settings");
    buildRedirect("success", "Password updated.");
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update password.").message;
    buildRedirect("error", message);
  }
}

export default async function SettingsPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const status = readParam(searchParams, "status");
  const message = readParam(searchParams, "message");

  const session = await getSession();
  if (!session) {
    redirect("/login?next=/settings");
  }

  const profile = await getMyProfile();

  return (
    <div className="space-y-10">
      <AvatarUploader
        name={profile.name ?? null}
        roleLabel={profile.role ?? "member"}
        initialUrl={profile.avatarUrl ?? null}
        onUpload={updateAvatarAction}
      />
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
          Settings
        </p>
        <h1 className="mt-3 font-manrope text-3xl font-semibold text-ink">
          Account and profile
        </h1>
        <p className="mt-2 text-sm text-muted">
          Keep your member profile updated and manage login credentials.
        </p>
      </header>

      <StatusBanner status={status} message={message} />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form
          action={updateProfileAction}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
        >
          <h2 className="font-manrope text-2xl font-semibold text-ink">Profile details</h2>
          <p className="mt-2 text-sm text-muted">
            These details are shown inside your member dashboard.
          </p>
          <div className="mt-6 grid gap-4">
            <label className="text-sm font-semibold text-ink">
              Full name
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="name"
                placeholder="Your name"
                defaultValue={profile.name ?? ""}
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              Age
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="age"
                placeholder="Optional"
                type="number"
                min={0}
                max={120}
                defaultValue={profile.age ?? ""}
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              Avatar URL
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="avatarUrl"
                placeholder="https://"
                defaultValue={profile.avatarUrl ?? ""}
              />
            </label>
            <label className="text-sm font-semibold text-ink">
              Contact email
              <input
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="email"
                type="email"
                placeholder="you@example.com"
                defaultValue={profile.email ?? ""}
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-6 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600"
          >
            Save profile
          </button>
        </form>

        <div className="space-y-6">
          <form
            action={updateEmailAction}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
          >
            <h2 className="font-manrope text-xl font-semibold text-ink">Account email</h2>
            <p className="mt-2 text-sm text-muted">
              Update the email you use to log in.
            </p>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-semibold text-ink">
                New email
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  name="accountEmail"
                  type="email"
                  placeholder="new@email.com"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-ink">
                Current password
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  name="accountPassword"
                  type="password"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
            >
              Update email
            </button>
          </form>

          <form
            action={updatePasswordAction}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
          >
            <h2 className="font-manrope text-xl font-semibold text-ink">Password</h2>
            <p className="mt-2 text-sm text-muted">
              Choose a strong password to keep your account secure.
            </p>
            <div className="mt-4 grid gap-4">
              <label className="text-sm font-semibold text-ink">
                Current password
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  name="currentPassword"
                  type="password"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-ink">
                New password
                <input
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  name="nextPassword"
                  type="password"
                  required
                />
              </label>
            </div>
            <button
              type="submit"
              className="mt-5 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
            >
              Update password
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
