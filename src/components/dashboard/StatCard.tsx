import type { ReactNode } from "react";

type AccentColor = "orange" | "amber" | "emerald" | "sky" | "red";

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
        <article className="group rounded-2xl border border-gray-200 bg-white px-5 py-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                {icon ? (
                    <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ICON_BG[accent]} transition-transform duration-200 group-hover:scale-105`}
                    >
                        {icon}
                    </span>
                ) : null}
                <div className="min-w-0 flex-1 text-right">
                    <p className="text-xs font-medium text-muted">
                        {label}
                    </p>
                    <p className="mt-1 font-manrope text-2xl font-bold text-ink">
                        {value}
                    </p>
                    {helper ? (
                        <p className="mt-0.5 truncate text-xs text-muted">{helper}</p>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
