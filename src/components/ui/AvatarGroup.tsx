"use client";

/**
 * Shadcn-inspired avatar group with overlap and +N count badge.
 *
 * Usage:
 *   <AvatarGroup
 *     avatars={[{ src: "...", fallback: "JD" }, { fallback: "AM" }]}
 *     max={3}
 *   />
 */

import { getFileViewUrl } from "@/lib/imageUrl";

function getAvatarUrl(fileId: string): string {
    return getFileViewUrl(fileId);
}

export interface AvatarItem {
    /** Appwrite file ID (not full URL) */
    avatarFileId?: string;
    /** Two-letter initials fallback, e.g. "JD" */
    fallback: string;
}

interface AvatarGroupProps {
    avatars: AvatarItem[];
    /** Max visible avatars before showing "+N" */
    max?: number;
    /** Total signup count (if known, for an accurate "+N" count) */
    totalCount?: number;
    size?: "sm" | "md";
}

const SIZE = {
    sm: { ring: "h-7 w-7", text: "text-[10px]", overlap: "-ml-2" },
    md: { ring: "h-9 w-9", text: "text-xs", overlap: "-ml-2.5" },
} as const;

// Soft pastel palette for initials backgrounds
const COLORS = [
    "bg-orange-100 text-orange-700",
    "bg-sky-100 text-sky-700",
    "bg-emerald-100 text-emerald-700",
    "bg-violet-100 text-violet-700",
    "bg-pink-100 text-pink-700",
    "bg-amber-100 text-amber-700",
    "bg-teal-100 text-teal-700",
];

function colorForIndex(i: number) {
    return COLORS[i % COLORS.length];
}

export function AvatarGroup({
    avatars,
    max = 3,
    totalCount,
    size = "sm",
}: AvatarGroupProps) {
    const s = SIZE[size];
    const visible = avatars.slice(0, max);
    const remaining = (totalCount ?? avatars.length) - visible.length;

    if (!avatars.length && !totalCount) return null;

    return (
        <div className="flex items-center">
            {visible.map((av, i) => (
                <span
                    key={i}
                    className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm ${s.ring} ${i > 0 ? s.overlap : ""}`}
                    style={{ zIndex: max - i }}
                >
                    {av.avatarFileId ? (
                        /* eslint-disable-next-line @next/next/no-img-element -- dynamic Appwrite URL */
                        <img
                            src={getAvatarUrl(av.avatarFileId)}
                            alt={av.fallback}
                            className="h-full w-full rounded-full object-cover"
                        />
                    ) : (
                        <span
                            className={`flex h-full w-full items-center justify-center rounded-full font-semibold ${s.text} ${colorForIndex(i)}`}
                        >
                            {av.fallback}
                        </span>
                    )}
                </span>
            ))}

            {remaining > 0 && (
                <span
                    className={`relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-white bg-gray-100 font-semibold text-gray-600 shadow-sm ${s.ring} ${s.text} ${s.overlap}`}
                    style={{ zIndex: 0 }}
                >
                    +{remaining}
                </span>
            )}
        </div>
    );
}
