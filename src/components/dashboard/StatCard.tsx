import type { ReactNode } from "react";

type AccentColor = "orange" | "amber" | "emerald" | "sky" | "red";

const ACCENT: Record<AccentColor, string> = {
    orange: "border-l-orange-500",
    amber: "border-l-amber-400",
    emerald: "border-l-emerald-500",
    sky: "border-l-sky-500",
    red: "border-l-red-500",
};

const ICON_BG: Record<AccentColor, string> = {
    orange: "bg-orange-50 text-orange-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    red: "bg-red-50 text-red-600",
};

type StatCardProps = {
    label: string;
    value: string | number;
    helper?: string;
    accent?: AccentColor;
    icon?: ReactNode;
};

export function StatCard({
    label,
    value,
    helper,
    accent = "orange",
    icon,
}: StatCardProps) {
    return (
        <article
            className={`rounded-2xl border border-gray-200 border-l-4 bg-white px-5 py-4 shadow-sm transition hover:shadow-md ${ACCENT[accent]}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                        {label}
                    </p>
                    <p className="mt-1.5 font-manrope text-2xl font-bold text-navy">
                        {value}
                    </p>
                    {helper ? (
                        <p className="mt-1 truncate text-xs text-muted">{helper}</p>
                    ) : null}
                </div>
                {icon ? (
                    <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${ICON_BG[accent]}`}
                    >
                        {icon}
                    </span>
                ) : null}
            </div>
        </article>
    );
}
