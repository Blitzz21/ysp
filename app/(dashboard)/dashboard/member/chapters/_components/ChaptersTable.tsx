"use client";

import { DataTable, type Column } from "@/components/dashboard/DataTable";
import type { Chapter, ChapterMembership } from "@/services/types";

type ChaptersTableProps = {
    chapters: Chapter[];
    membershipMap: Map<string, ChapterMembership>;
    joinAction: (formData: FormData) => void | Promise<void>;
    leaveAction: (formData: FormData) => void | Promise<void>;
};

function StatusBadge({ membership }: { membership?: ChapterMembership }) {
    if (!membership) {
        return (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
                Not joined
            </span>
        );
    }
    const colors: Record<string, string> = {
        active: "bg-emerald-100 text-emerald-700",
        pending: "bg-amber-100 text-amber-700",
        removed: "bg-red-100 text-red-600",
    };
    const labels: Record<string, string> = {
        active: "Active",
        pending: "Pending",
        removed: "Removed",
    };
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[membership.status] ?? "bg-gray-100 text-gray-500"}`}
        >
            {labels[membership.status] ?? membership.status}
        </span>
    );
}

export function ChaptersTable({
    chapters,
    membershipMap,
    joinAction,
    leaveAction,
}: ChaptersTableProps) {
    const columns: Column<Chapter>[] = [
        {
            header: "Name",
            cell: (row) => (
                <span className="font-semibold text-ink">{row.name}</span>
            ),
        },
        {
            header: "Location",
            cell: (row) => (
                <span className="text-muted">
                    {row.location ?? "TBA"}
                </span>
            ),
            hideOnMobile: true,
        },
        {
            header: "Status",
            align: "center",
            cell: (row) => <StatusBadge membership={membershipMap.get(row.id)} />,
        },
        {
            header: "Action",
            align: "right",
            cell: (row) => {
                const membership = membershipMap.get(row.id);
                if (!membership) {
                    return (
                        <form action={joinAction}>
                            <input type="hidden" name="chapterId" value={row.id} />
                            <button
                                type="submit"
                                className="rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600"
                            >
                                Join
                            </button>
                        </form>
                    );
                }
                if (membership.status === "removed") {
                    return (
                        <form action={joinAction}>
                            <input type="hidden" name="chapterId" value={row.id} />
                            <button
                                type="submit"
                                className="rounded-full border border-orange-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
                            >
                                Rejoin
                            </button>
                        </form>
                    );
                }
                return (
                    <form action={leaveAction}>
                        <input type="hidden" name="chapterId" value={row.id} />
                        <button
                            type="submit"
                            className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:border-orange-300 hover:text-orange-600"
                        >
                            Leave
                        </button>
                    </form>
                );
            },
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={chapters}
            rowKey={(row) => row.id}
            pageSize={8}
            title="All Chapters"
            subtitle={`${chapters.length} published chapters`}
            emptyMessage="No chapters are published yet. Please check back soon."
            searchPlaceholder="Search chapters…"
            searchFilter={(row, q) =>
                row.name.toLowerCase().includes(q) ||
                (row.location?.toLowerCase().includes(q) ?? false)
            }
        />
    );
}
