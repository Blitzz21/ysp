import { revalidatePath } from "next/cache";

import { CountedInput } from "@/components/admin/CountedField";
import { StatusBanner } from "@/components/dashboard/StatusBanner";
import { toPublicDomainError } from "@/services/errorContract";
import { getSiteSettings, updateSiteSettings } from "@/services/settings";
import { getSiteStats, updateSiteStats } from "@/services/stats";
import { type SearchParams, readParam, createRedirectBuilder } from "@/lib/pageHelpers";

const buildRedirect = createRedirectBuilder("/admin/settings");

function toOptionalString(value: FormDataEntryValue | null): string | undefined {
  const parsed = String(value ?? "").trim();
  return parsed.length ? parsed : undefined;
}

function parseOptionalInteger(value: FormDataEntryValue | null): number | undefined {
  const parsed = String(value ?? "").trim();
  if (!parsed.length) return undefined;
  const asNumber = Number.parseInt(parsed, 10);
  if (Number.isNaN(asNumber)) {
    throw new Error("Stats values must be whole numbers");
  }
  return asNumber;
}

async function updateSettingsAction(formData: FormData): Promise<void> {
  "use server";
  try {
    await updateSiteSettings({
      email: toOptionalString(formData.get("email")),
      mobile: toOptionalString(formData.get("mobile")),
      facebookUrl: toOptionalString(formData.get("facebookUrl")),
      membershipFormUrl: toOptionalString(formData.get("membershipFormUrl")),
      createChapterFormUrl: toOptionalString(formData.get("createChapterFormUrl")),
    });
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to update site settings").message;
    buildRedirect("error", message);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/contact");
  revalidatePath("/membership");
  buildRedirect("success", "Site settings updated.");
}

async function updateStatsAction(formData: FormData): Promise<void> {
  "use server";
  try {
    await updateSiteStats({
      projectsCount: parseOptionalInteger(formData.get("projectsCount")),
      chaptersCount: parseOptionalInteger(formData.get("chaptersCount")),
      membersCount: parseOptionalInteger(formData.get("membersCount")),
      livesImpactedCount: parseOptionalInteger(formData.get("livesImpactedCount")),
    });
  } catch (error) {
    const message = toPublicDomainError(error, "Failed to update site stats").message;
    buildRedirect("error", message);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  buildRedirect("success", "Site stats updated.");
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const status = readParam(params, "status");
  const message = readParam(params, "message");

  let hasLoadError = false;
  let settings = {
    email: "",
    mobile: "",
    facebookUrl: "",
    membershipFormUrl: "",
    createChapterFormUrl: "",
  };
  let stats = {
    projectsCount: 0,
    chaptersCount: 0,
    membersCount: 0,
    livesImpactedCount: 0,
  };

  try {
    const [siteSettings, siteStats] = await Promise.all([
      getSiteSettings(),
      getSiteStats(),
    ]);

    settings = {
      email: siteSettings.email ?? "",
      mobile: siteSettings.mobile ?? "",
      facebookUrl: siteSettings.facebookUrl ?? "",
      membershipFormUrl: siteSettings.membershipFormUrl ?? "",
      createChapterFormUrl: siteSettings.createChapterFormUrl ?? "",
    };
    stats = siteStats;
  } catch {
    hasLoadError = true;
  }

  return (
    <section>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-600">Admin</p>
        <h1 className="mt-2 font-manrope text-4xl font-bold text-navy">Settings</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Configure public contact endpoints and homepage counters from a single place.
        </p>
      </div>

      <StatusBanner status={status} message={message} className="mb-6" />

      {hasLoadError ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Settings are unavailable. Please confirm admin access and service connectivity.
        </div>
      ) : null}

      <div className="space-y-6">
        <form
          action={updateSettingsAction}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
        >
          <div className="mb-4">
            <h2 className="font-manrope text-3xl font-semibold text-navy">Public contact settings</h2>
            <p className="mt-2 text-sm text-muted">
              Values are consumed by public contact and membership pages.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-xs font-semibold text-ink">
              Public email
              <CountedInput
                name="email"
                defaultValue={settings.email}
                maxLength={256}
                type="email"
                hint="Displayed on contact pages."
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Public mobile
              <CountedInput
                name="mobile"
                defaultValue={settings.mobile}
                maxLength={64}
                hint="Displayed as call contact."
              />
            </label>
          </div>
          <div className="mt-3 grid gap-3">
            <label className="text-xs font-semibold text-ink">
              Facebook URL
              <CountedInput
                name="facebookUrl"
                defaultValue={settings.facebookUrl}
                maxLength={512}
                type="url"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Membership form URL
              <CountedInput
                name="membershipFormUrl"
                defaultValue={settings.membershipFormUrl}
                maxLength={512}
                type="url"
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Create chapter form URL
              <CountedInput
                name="createChapterFormUrl"
                defaultValue={settings.createChapterFormUrl}
                maxLength={512}
                type="url"
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-glow"
          >
            Save contact settings
          </button>
        </form>

        <form
          action={updateStatsAction}
          className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft"
        >
          <div className="mb-4">
            <h2 className="font-manrope text-3xl font-semibold text-navy">Homepage counters</h2>
            <p className="mt-2 text-sm text-muted">
              Counters used for public trust signals on landing and related pages.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold text-ink">
              Projects count
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="projectsCount"
                type="number"
                min={0}
                step={1}
                defaultValue={stats.projectsCount}
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Chapters count
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="chaptersCount"
                type="number"
                min={0}
                step={1}
                defaultValue={stats.chaptersCount}
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Members count
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="membersCount"
                type="number"
                min={0}
                step={1}
                defaultValue={stats.membersCount}
              />
            </label>
            <label className="text-xs font-semibold text-ink">
              Lives impacted count
              <input
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                name="livesImpactedCount"
                type="number"
                min={0}
                step={1}
                defaultValue={stats.livesImpactedCount}
              />
            </label>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-full border border-orange-200 bg-orange-50 px-5 py-2 text-sm font-semibold text-orange-700"
          >
            Save counters
          </button>
        </form>
      </div>
    </section>
  );
}
