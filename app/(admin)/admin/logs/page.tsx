import Link from "next/link";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { listAdminAuditLog } from "@/services/adminAudit";
import { type SearchParams, readParam } from "@/lib/pageHelpers";

const PAGE_SIZE = 50;
const MANILA_TIMEZONE = "Asia/Manila";

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: MANILA_TIMEZONE,
  }).format(date);
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    "program.create": "Created program",
    "program.update": "Updated program",
    "program.delete": "Deleted program",
    "chapter.create": "Created chapter",
    "chapter.update": "Updated chapter",
    "chapter.delete": "Deleted chapter",
    "chapter.join": "Joined chapter",
    "chapter.leave": "Left chapter",
    "chapter.transfer": "Transferred chapter ownership",
    "chapter.contact.update": "Updated chapter contact",
    "opportunity.create": "Created opportunity",
    "opportunity.update": "Updated opportunity",
    "opportunity.delete": "Deleted opportunity",
    "opportunity.join": "Joined opportunity",
    "settings.update": "Updated site settings",
    "stats.update": "Updated site stats",
    "role.create": "Created officer role",
    "role.update": "Updated officer role",
    "officer.assign": "Assigned officer",
    "officer.remove": "Removed officer",
    "member.approve": "Approved member",
    "member.decline": "Declined member",
    "member.remove": "Removed member",
    "profile.update": "Updated profile",
    "avatar.update": "Updated avatar",
    "account.email.update": "Updated account email",
    "account.password.update": "Updated account password",
  };
  return labels[action] ?? action;
}

function roleBadgeColor(role: string): string {
  switch (role) {
    case "admin":
      return "bg-orange-50 text-orange-700";
    case "chapter_head":
      return "bg-sky-50 text-sky-700";
    case "officer":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default async function AdminLogsPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = (await props.searchParams) ?? {};
  const pageParam = readParam(searchParams, "page");
  const currentPage = Math.max(1, Number(pageParam) || 1);
  const offset = (currentPage - 1) * PAGE_SIZE;

  const entries = await listAdminAuditLog({ limit: PAGE_SIZE + 1, offset });
  const hasNextPage = entries.length > PAGE_SIZE;
  const displayEntries = entries.slice(0, PAGE_SIZE);

  return (
    <section className="space-y-6">
      <PageHeader
        label="Admin"
        title="Activity Log"
        subtitle="Audit trail of all actions across the platform. No personal data is stored."
      />

      {displayEntries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-muted shadow-soft">
          <p className="text-ink">No activity recorded yet.</p>
          <p className="mt-1 text-xs">
            Actions will appear here once users interact with the platform.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-soft">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Time
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Actor
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Role
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Action
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                    Target
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayEntries.map((entry, i) => (
                  <tr key={`${entry.createdAt}-${i}`} className="transition hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                      {formatTimestamp(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {entry.actorId.slice(0, 8)}...
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleBadgeColor(entry.actorRole)}`}
                      >
                        {entry.actorRole}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-ink">
                      {actionLabel(entry.action)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {entry.targetLabel || entry.targetId || entry.targetType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              Page {currentPage}
              {hasNextPage ? "" : " (last)"}
            </p>
            <div className="flex gap-2">
              {currentPage > 1 ? (
                <Link
                  href={`/admin/logs?page=${currentPage - 1}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gray-50"
                >
                  Previous
                </Link>
              ) : null}
              {hasNextPage ? (
                <Link
                  href={`/admin/logs?page=${currentPage + 1}`}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-gray-50"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
