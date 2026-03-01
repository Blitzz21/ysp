"use client";

import { useEffect, useRef, useState } from "react";

/* ── 17 UN Sustainable Development Goals ── */

const SDG_OPTIONS = [
    { id: 1, label: "No Poverty", color: "#E5243B" },
    { id: 2, label: "Zero Hunger", color: "#DDA63A" },
    { id: 3, label: "Good Health and Well-Being", color: "#4C9F38" },
    { id: 4, label: "Quality Education", color: "#C5192D" },
    { id: 5, label: "Gender Equality", color: "#FF3A21" },
    { id: 6, label: "Clean Water and Sanitation", color: "#26BDE2" },
    { id: 7, label: "Affordable and Clean Energy", color: "#FCC30B" },
    { id: 8, label: "Decent Work and Economic Growth", color: "#A21942" },
    { id: 9, label: "Industry Innovation and Infrastructure", color: "#FD6925" },
    { id: 10, label: "Reduced Inequalities", color: "#DD1367" },
    { id: 11, label: "Sustainable Cities and Communities", color: "#FD9D24" },
    { id: 12, label: "Responsible Consumption and Production", color: "#BF8B2E" },
    { id: 13, label: "Climate Action", color: "#3F7E44" },
    { id: 14, label: "Life Below Water", color: "#0A97D9" },
    { id: 15, label: "Life on Land", color: "#56C02B" },
    { id: 16, label: "Peace Justice and Strong Institutions", color: "#00689D" },
    { id: 17, label: "Partnerships for the Goals", color: "#19486A" },
] as const;

interface SdgMultiSelectProps {
    name: string;
    defaultValue?: string[];
    required?: boolean;
}

export function SdgMultiSelect({
    name,
    defaultValue = [],
    required,
}: SdgMultiSelectProps) {
    const [selected, setSelected] = useState<string[]>(defaultValue);
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    /* Close dropdown on outside click */
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    function toggleOption(label: string) {
        setSelected((prev) =>
            prev.includes(label)
                ? prev.filter((s) => s !== label)
                : [...prev, label]
        );
    }

    /* Hidden input for form submission */
    const value = selected.join(", ");

    return (
        <div ref={containerRef} className="relative mt-1">
            {/* Hidden form value */}
            <input type="hidden" name={name} value={value} />
            {required && selected.length === 0 && (
                <input
                    tabIndex={-1}
                    className="absolute inset-0 h-0 w-0 opacity-0"
                    required
                    value=""
                    onChange={() => { }}
                />
            )}

            {/* Trigger button */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm transition hover:border-orange-300 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            >
                <span className={selected.length ? "text-ink" : "text-muted"}>
                    {selected.length ? `${selected.length} SDG${selected.length > 1 ? "s" : ""} selected` : "Select SDG tags…"}
                </span>
                <svg
                    className={`h-4 w-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    {SDG_OPTIONS.map((sdg) => {
                        const isChecked = selected.includes(sdg.label);
                        return (
                            <button
                                key={sdg.id}
                                type="button"
                                onClick={() => toggleOption(sdg.label)}
                                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition hover:bg-gray-50 ${isChecked ? "bg-orange-50/50" : ""
                                    }`}
                            >
                                <span
                                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                                    style={{
                                        borderColor: isChecked ? sdg.color : "#d1d5db",
                                        backgroundColor: isChecked ? sdg.color : "transparent",
                                    }}
                                >
                                    {isChecked && (
                                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </span>
                                <span
                                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                                    style={{ backgroundColor: sdg.color }}
                                >
                                    {sdg.id}
                                </span>
                                <span className="text-ink">{sdg.label}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selected pills */}
            {selected.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.map((label) => {
                        const sdg = SDG_OPTIONS.find((s) => s.label === label);
                        return (
                            <span
                                key={label}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                                style={{ backgroundColor: sdg?.color ?? "#6b7280" }}
                            >
                                {sdg?.id}. {label}
                                <button
                                    type="button"
                                    onClick={() => toggleOption(label)}
                                    className="ml-0.5 rounded-full p-0.5 opacity-80 transition hover:opacity-100"
                                    aria-label={`Remove ${label}`}
                                >
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
