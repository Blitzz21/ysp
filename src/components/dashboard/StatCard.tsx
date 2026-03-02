import type { ReactNode } from "react";

type AccentColor = "orange" | "amber" | "emerald" | "sky" | "red";

const ICON_BG: Record<AccentColor, string> = {
    orange: "bg-orange-50 text-orange-500",
    amber: "bg-amber-50 text-amber-500",
    emerald: "bg-emerald-50 text-emerald-500",
    sky: "bg-sky-50 text-sky-500",
    red: "bg-red-50 text-red-500",
};

type StatCardProps = {
    label: string;
    value: string | number;
    helper?: string;
    accent?: AccentColor;
    icon?: ReactNode;
    /** e.g. "+12.5%" or "-3.2%" — green for positive, red for negative */
    trend?: string;
};

export function StatCard({
    label,
    value,
    helper,
    accent = "orange",
    icon,
    trend,
}: StatCardProps) {
    const isPositive = trend ? !trend.startsWith("-") : true;

    return (
        <article className="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            {icon ? (
                <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ${ICON_BG[accent]} transition-transform duration-200 group-hover:scale-105`}
                >
                    {icon}
                </span>
            ) : null}
            <p className="mt-3 font-manrope text-3xl font-bold text-ink">
                {value}
            </p>
            <p className="mt-1 text-xs font-medium text-muted">
                {label}
            </p>
            {trend ? (
                <p className={`mt-1.5 text-xs font-semibold ${isPositive ? "text-emerald-500" : "text-red-500"}`}>
                    {isPositive ? "▲" : "▼"} {trend.replace(/^[+-]/, "")}
                </p>
            ) : null}
            {helper ? (
                <p className="mt-1 truncate text-xs text-muted">{helper}</p>
            ) : null}
        </article>
    );
}
