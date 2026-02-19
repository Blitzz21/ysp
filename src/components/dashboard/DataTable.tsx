"use client";

import { useState, useMemo, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type Column<T> = {
    /** Column header label */
    header: string;
    /** Key of the data row to render, OR a custom render fn */
    accessor?: keyof T;
    /** Custom cell renderer — overrides accessor */
    cell?: (row: T, index: number) => ReactNode;
    /** Header alignment */
    align?: "left" | "center" | "right";
    /** Whether the column is hidden on mobile (< md) */
    hideOnMobile?: boolean;
};

type DataTableProps<T> = {
    /** Array of column definitions */
    columns: Column<T>[];
    /** Data rows */
    data: T[];
    /** Unique key extractor per row */
    rowKey: (row: T, index: number) => string;
    /** Rows per page — defaults to 10 */
    pageSize?: number;
    /** Title shown above the table */
    title?: string;
    /** Subtitle / helper shown below title */
    subtitle?: string;
    /** Right-side header actions slot */
    actions?: ReactNode;
    /** Custom empty-state message */
    emptyMessage?: string;
    /** Optional search placeholder — set to enable client-side search */
    searchPlaceholder?: string;
    /** Custom search fn — matches rows against the query string */
    searchFilter?: (row: T, query: string) => boolean;
};

/* ------------------------------------------------------------------ */
/*  Pagination helpers                                                */
/* ------------------------------------------------------------------ */

function PaginationButton({
    label,
    active,
    disabled,
    onClick,
}: {
    label: string | number;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2.5 text-xs font-semibold transition ${active
                    ? "bg-orange-500 text-white shadow-sm"
                    : disabled
                        ? "cursor-not-allowed text-gray-300"
                        : "text-ink hover:bg-orange-50 hover:text-orange-600"
                }`}
        >
            {label}
        </button>
    );
}

function buildPageNumbers(
    current: number,
    total: number,
): (number | "...")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (
        let i = Math.max(2, current - 1);
        i <= Math.min(total - 1, current + 1);
        i++
    ) {
        pages.push(i);
    }
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
}

/* ------------------------------------------------------------------ */
/*  DataTable                                                         */
/* ------------------------------------------------------------------ */

export function DataTable<T>({
    columns,
    data,
    rowKey,
    pageSize = 10,
    title,
    subtitle,
    actions,
    emptyMessage = "No data available.",
    searchPlaceholder,
    searchFilter,
}: DataTableProps<T>) {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");

    /* Filtered data */
    const filtered = useMemo(() => {
        if (!search.trim() || !searchFilter) return data;
        const q = search.trim().toLowerCase();
        return data.filter((row) => searchFilter(row, q));
    }, [data, search, searchFilter]);

    /* Pagination math */
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const pageData = filtered.slice(start, start + pageSize);
    const pageNumbers = buildPageNumbers(safePage, totalPages);

    /* Alignment helper */
    const align = (col: Column<T>) =>
        col.align === "right"
            ? "text-right"
            : col.align === "center"
                ? "text-center"
                : "text-left";

    const hideOnMobile = (col: Column<T>) =>
        col.hideOnMobile ? "hidden md:table-cell" : "";

    return (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            {(title || actions || searchPlaceholder) && (
                <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {title && (
                            <h3 className="font-manrope text-lg font-semibold text-ink">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {searchPlaceholder && searchFilter && (
                            <div className="relative">
                                <svg
                                    className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        cx="11"
                                        cy="11"
                                        r="7"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    />
                                    <path
                                        d="m16.5 16.5 4 4"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="h-8 w-48 rounded-lg border border-gray-200 pl-8 pr-3 text-xs text-ink placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                                />
                            </div>
                        )}
                        {actions}
                    </div>
                </div>
            )}

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="px-5 py-12 text-center text-sm text-muted">
                    {emptyMessage}
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    {columns.map((col, i) => (
                                        <th
                                            key={i}
                                            className={`px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted ${align(col)} ${hideOnMobile(col)}`}
                                        >
                                            {col.header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pageData.map((row, ri) => (
                                    <tr
                                        key={rowKey(row, start + ri)}
                                        className="transition hover:bg-orange-50/30"
                                    >
                                        {columns.map((col, ci) => (
                                            <td
                                                key={ci}
                                                className={`px-5 py-3.5 ${align(col)} ${hideOnMobile(col)}`}
                                            >
                                                {col.cell
                                                    ? col.cell(row, start + ri)
                                                    : col.accessor
                                                        ? String((row as Record<string, unknown>)[col.accessor as string] ?? "")
                                                        : null}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
                            <p className="text-xs text-muted">
                                Showing {start + 1}–{Math.min(start + pageSize, filtered.length)}{" "}
                                of {filtered.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <PaginationButton
                                    label="Previous"
                                    disabled={safePage <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                />
                                {pageNumbers.map((n, i) =>
                                    n === "..." ? (
                                        <span key={`e${i}`} className="px-1 text-xs text-muted">
                                            …
                                        </span>
                                    ) : (
                                        <PaginationButton
                                            key={n}
                                            label={n}
                                            active={n === safePage}
                                            onClick={() => setPage(n)}
                                        />
                                    ),
                                )}
                                <PaginationButton
                                    label="Next"
                                    disabled={safePage >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                />
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
