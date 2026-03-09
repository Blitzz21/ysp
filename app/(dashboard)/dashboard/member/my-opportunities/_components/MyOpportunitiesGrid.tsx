"use client";

import { useState } from "react";
import type { VolunteerOpportunity } from "@/services/types";

/* ── Helpers ── */
function getOpportunityImageUrl(fileId: string): string {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
    return `${endpoint}/storage/buckets/696dac0d0000f9557fbd/files/${fileId}/preview?project=${projectId}&width=400&output=webp`;
}

function formatEventDate(value: string): string {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getStatusInfo(
    signupStatus: "joined" | "waitlisted",
    eventDate: string
): { label: string; color: string } {
    const isPast = new Date(eventDate) < new Date();
    if (isPast) return { label: "Completed", color: "bg-gray-100 text-gray-600" };
    if (signupStatus === "waitlisted") return { label: "Waitlisted", color: "bg-amber-100 text-amber-700" };
    return { label: "Joined", color: "bg-emerald-100 text-emerald-700" };
}

/* ── Types ── */
export interface JoinedOpportunityItem {
    opportunity: VolunteerOpportunity;
    signupStatus: "joined" | "waitlisted";
    joinedAt: string;
    chapterName: string;
}

/* ── Main Component ── */
export function MyOpportunitiesGrid({
    items,
}: {
    items: JoinedOpportunityItem[];
}) {
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

    const now = new Date();
    const filtered = items.filter((item) => {
        if (filter === "all") return true;
        const isPast = new Date(item.opportunity.eventDate) < now;
        return filter === "past" ? isPast : !isPast;
    });

    const upcomingCount = items.filter((i) => new Date(i.opportunity.eventDate) >= now).length;
    const pastCount = items.length - upcomingCount;

    return (
        <>
            {/* ── Filter tabs ── */}
            <div className="mb-5 flex items-center gap-1 rounded-xl bg-gray-100 p-1 w-fit">
                {[
                    { key: "all" as const, label: `All (${items.length})` },
                    { key: "upcoming" as const, label: `Upcoming (${upcomingCount})` },
                    { key: "past" as const, label: `Past (${pastCount})` },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilter(tab.key)}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${filter === tab.key
                            ? "bg-white text-ink shadow-sm"
                            : "text-muted hover:text-ink"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Grid ── */}
            {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
                    <svg className="mx-auto h-10 w-10 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <p className="mt-3 text-sm text-muted">
                        {filter === "past"
                            ? "You haven't completed any opportunities yet."
                            : filter === "upcoming"
                                ? "No upcoming opportunities. Browse opportunities to find new ones!"
                                : "You haven't joined any opportunities yet. Browse available opportunities to get started!"}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((item) => {
                        const { opportunity, signupStatus, joinedAt, chapterName } = item;
                        const status = getStatusInfo(signupStatus, opportunity.eventDate);
                        const imageUrl = opportunity.imageFileIds?.length
                            ? getOpportunityImageUrl(opportunity.imageFileIds[0])
                            : null;

                        return (
                            <div
                                key={opportunity.id}
                                className="group flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden transition hover:shadow-md"
                            >
                                {/* Image / fallback gradient */}
                                {imageUrl ? (
                                    <div className="h-28 w-full bg-gray-100">
                                        {/* eslint-disable-next-line @next/next/no-img-element -- Appwrite URL */}
                                        <img
                                            src={imageUrl}
                                            alt={opportunity.title}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-orange-400 to-amber-300">
                                        <svg className="h-10 w-10 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                                        </svg>
                                    </div>
                                )}

                                <div className="flex flex-1 flex-col p-4">
                                    {/* Status + date */}
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.color}`}>
                                            {status.label}
                                        </span>
                                        <span className="text-[10px] text-muted">
                                            {formatEventDate(opportunity.eventDate)}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h3 className="mt-2 font-manrope text-sm font-semibold text-ink line-clamp-2">
                                        {opportunity.title}
                                    </h3>

                                    {/* Chapter */}
                                    <p className="mt-1 text-xs text-muted">{chapterName}</p>

                                    {/* Joined at */}
                                    <p className="mt-auto pt-3 text-[10px] text-muted">
                                        Joined {new Date(joinedAt).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
