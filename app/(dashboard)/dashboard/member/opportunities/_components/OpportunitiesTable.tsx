"use client";

import { DataTable, type Column } from "@/components/dashboard/DataTable";
import type { VolunteerOpportunity } from "@/services/types";

type OpportunitiesTableProps = {
    opportunities: VolunteerOpportunity[];
    chapterNameById: Map<string, string>;
};

function formatDate(iso: string): string {
    try {
        return new Date(iso).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return iso;
    }
}

function TimeBadge({ eventDate }: { eventDate: string }) {
    const now = new Date();
    const date = new Date(eventDate);
    const isUpcoming = date >= now;
    return (
        <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${isUpcoming
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
        >
            {isUpcoming ? "Upcoming" : "Past"}
        </span>
    );
}

function CapacityIndicator({
    current,
    capacity,
}: {
    current: number;
    capacity: number;
}) {
    if (capacity <= 0) return <span className="text-muted">Open</span>;
    const pct = Math.min(100, Math.round((current / capacity) * 100));
    const color =
        pct >= 90
            ? "bg-red-500"
            : pct >= 60
                ? "bg-amber-400"
                : "bg-emerald-500";
    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-muted">
                {current}/{capacity}
            </span>
        </div>
    );
}

export function OpportunitiesTable({
    opportunities,
    chapterNameById,
}: OpportunitiesTableProps) {
    const columns: Column<VolunteerOpportunity>[] = [
        {
            header: "Title",
            cell: (row) => (
                <div>
                    <span className="font-semibold text-ink">{row.title}</span>
                    <span className="mt-0.5 block text-xs text-muted md:hidden">
                        {formatDate(row.eventDate)}
                    </span>
                </div>
            ),
        },
        {
            header: "Chapter",
            cell: (row) => (
                <span className="text-muted">
                    {chapterNameById.get(row.chapterId) ?? "—"}
                </span>
            ),
            hideOnMobile: true,
        },
        {
            header: "Date",
            cell: (row) => (
                <span className="text-ink">{formatDate(row.eventDate)}</span>
            ),
            hideOnMobile: true,
        },
        {
            header: "Status",
            align: "center",
            cell: (row) => <TimeBadge eventDate={row.eventDate} />,
        },
        {
            header: "Capacity",
            align: "center",
            cell: (row) => (
                <CapacityIndicator
                    current={row.currentVolunteers}
                    capacity={row.capacity}
                />
            ),
            hideOnMobile: true,
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={opportunities}
            rowKey={(row) => row.id}
            pageSize={8}
            title="Volunteer Opportunities"
            subtitle={`${opportunities.length} published opportunities`}
            emptyMessage="No opportunities are available at the moment. Check back soon!"
            searchPlaceholder="Search opportunities…"
            searchFilter={(row, q) =>
                row.title.toLowerCase().includes(q) ||
                row.description.toLowerCase().includes(q) ||
                (chapterNameById.get(row.chapterId)?.toLowerCase().includes(q) ?? false)
            }
        />
    );
}
