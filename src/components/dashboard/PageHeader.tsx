import type { ReactNode } from "react";

type PageHeaderProps = {
    /** Small uppercase kicker label (e.g. "Admin", "Member dashboard") */
    label?: string;
    /** Large page title */
    title: string;
    /** Optional subtitle description */
    subtitle?: string;
    /** Optional right-side actions (buttons, links) */
    actions?: ReactNode;
};

export function PageHeader({
    label,
    title,
    subtitle,
    actions,
}: PageHeaderProps) {
    return (
        <div className="mb-8 border-b border-gray-100 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    {label ? (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-orange-600">
                            {label}
                        </p>
                    ) : null}
                    <h1 className="mt-1.5 font-manrope text-2xl font-bold text-ink">
                        {title}
                    </h1>
                    {subtitle ? (
                        <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>
                    ) : null}
                </div>
                {actions ? (
                    <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>
                ) : null}
            </div>
        </div>
    );
}
