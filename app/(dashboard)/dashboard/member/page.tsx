import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/services/auth";
import { listPublicChapters } from "@/services/chapters";
import { toPublicDomainError } from "@/services/errorContract";
import { joinChapter, leaveChapter, listMyMemberships } from "@/services/memberships";
import { getMyProfile } from "@/services/profiles";
import type { Chapter, ChapterMembership } from "@/services/types";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type StatusType = "success" | "error";

type MembershipMap = Map<string, ChapterMembership>;

function readParam(searchParams: SearchParams, key: string): string | undefined {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildRedirect(status: StatusType, message: string): never {
  const encoded = encodeURIComponent(message);
  redirect(`/dashboard/member?status=${status}&message=${encoded}`);
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

function getMembershipLabel(status: ChapterMembership["status"]) {
  if (status === "active") return "Active";
  if (status === "pending") return "Pending approval";
  return "Removed";
}

async function joinChapterAction(formData: FormData): Promise<void> {
  "use server";
  const chapterId = String(formData.get("chapterId") ?? "").trim();
  if (!chapterId) {
    buildRedirect("error", "Please select a chapter first.");
  }
  try {
    await joinChapter(chapterId);
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to join chapter.").message;
    buildRedirect("error", message);
  }

  revalidatePath("/dashboard/member");
  buildRedirect("success", "Chapter join request submitted.");
}

async function leaveChapterAction(formData: FormData): Promise<void> {
  "use server";
  const chapterId = String(formData.get("chapterId") ?? "").trim();
  if (!chapterId) {
    buildRedirect("error", "Please select a chapter first.");
  }
  try {
    await leaveChapter(chapterId);
  } catch (error) {
    const message = toPublicDomainError(error, "Unable to update membership.").message;
    buildRedirect("error", message);
  }

  revalidatePath("/dashboard/member");
  buildRedirect("success", "Membership updated.");
}

function buildMembershipMap(memberships: ChapterMembership[]): MembershipMap {
  return new Map(memberships.map((membership) => [membership.chapterId, membership]));
}

function MembershipCard({
  chapter,
  membership,
}: {
  chapter: Chapter;
  membership?: ChapterMembership;
}) {
  const isPending = membership?.status === "pending";
  const isActive = membership?.status === "active";
  const isRemoved = membership?.status === "removed";

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-manrope text-lg font-semibold text-ink">{chapter.name}</h3>
          <p className="mt-1 text-sm text-muted">
            {chapter.location ?? "Location to be announced."}
          </p>
        </div>
        {membership ? (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              isActive
                ? "bg-emerald-100 text-emerald-700"
                : isPending
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {getMembershipLabel(membership.status)}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {membership ? (
          <form action={leaveChapterAction}>
            <input type="hidden" name="chapterId" value={chapter.id} />
            <button
              type="submit"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
            >
              {isActive || isPending ? "Leave chapter" : "Clear status"}
            </button>
          </form>
        ) : (
          <form action={joinChapterAction}>
            <input type="hidden" name="chapterId" value={chapter.id} />
            <button
              type="submit"
              className="rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:bg-orange-600"
            >
              Join chapter
            </button>
          </form>
        )}
        {isRemoved ? (
          <form action={joinChapterAction}>
            <input type="hidden" name="chapterId" value={chapter.id} />
            <button
              type="submit"
              className="rounded-full border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-600 transition hover:border-orange-300 hover:text-orange-700"
            >
              Rejoin
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

export default async function MemberDashboardPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const status = readParam(searchParams, "status");
  const message = readParam(searchParams, "message");

  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/member");
  }
  const isAdmin = session.role === "admin";
  const isChapterHead = session.role === "chapter_head";

  let loadError: string | null = null;
  const profile = await getMyProfile();
  let memberships: ChapterMembership[] = [];
  let chapters: Chapter[] = [];

  try {
    const [membershipRows, chapterRows] = await Promise.all([
      listMyMemberships(),
      listPublicChapters(),
    ]);
    memberships = membershipRows;
    chapters = chapterRows;
  } catch (error) {
    loadError = toPublicDomainError(error, "Unable to load dashboard data.").message;
  }

  const membershipMap = buildMembershipMap(memberships);
  const activeMemberships = memberships.filter(
    (membership) => membership.status === "active" || membership.status === "pending"
  );
  const chapterNameById = new Map(chapters.map((chapter) => [chapter.id, chapter.name]));

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
              Member dashboard
            </p>
            <h1 className="mt-3 font-manrope text-3xl font-semibold text-ink">
              Welcome{profile.name ? `, ${profile.name}` : ""}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Manage your chapter connections and keep your profile up to date.
            </p>
          </div>
          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            Role: <span className="font-semibold capitalize">{profile.role ?? "member"}</span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Memberships</p>
            <p className="mt-2 text-2xl font-semibold text-ink">
              {activeMemberships.length}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Assigned chapter</p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {profile.assignedChapterId ?? "Not assigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Profile status</p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {profile.email ? "Linked" : "Needs update"}
            </p>
          </div>
        </div>
      </section>

      <StatusBanner status={status} message={message} />
      {loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-manrope text-2xl font-semibold text-ink">Your chapters</h2>
              <p className="mt-2 text-sm text-muted">
                Track your membership status and request to join new chapters.
              </p>
            </div>
            <Link
              href="/settings"
              className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
            >
              Update profile
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {chapters.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-sm text-muted">
                No chapters are published yet. Please check back soon.
              </div>
            ) : (
              chapters.map((chapter) => (
                <MembershipCard
                  key={chapter.id}
                  chapter={chapter}
                  membership={membershipMap.get(chapter.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
            <h3 className="font-manrope text-xl font-semibold text-ink">Membership status</h3>
            <p className="mt-2 text-sm text-muted">
              Use the status badges to track where you are in the approval process.
            </p>
            <div className="mt-4 space-y-3 text-sm">
              {memberships.length === 0 ? (
                <p className="text-muted">You have not joined a chapter yet.</p>
              ) : (
                memberships.map((membership) => (
                  <div key={membership.id} className="flex items-center justify-between">
                    <span className="text-ink">
                      {chapterNameById.get(membership.chapterId) ?? membership.chapterId}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                      {membership.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
            <h3 className="font-manrope text-xl font-semibold text-ink">Opportunities</h3>
            <p className="mt-2 text-sm text-muted">
              Browse volunteer opportunities and track your join status.
            </p>
            <Link
              href="/volunteer-opportunities"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-600"
            >
              Explore opportunities
            </Link>
          </div>
          {(isAdmin || isChapterHead) && (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-soft">
              <h3 className="font-manrope text-xl font-semibold text-ink">Switch dashboards</h3>
              <p className="mt-2 text-sm text-muted">
                Jump to the dashboards you are allowed to access.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {(isChapterHead || isAdmin) && (
                  <Link
                    href="/chapter"
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                  >
                    Chapter dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                  >
                    Admin console
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
