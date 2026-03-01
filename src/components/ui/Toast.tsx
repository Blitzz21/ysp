"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

/* ────────────────────────────────────────────── types ─── */

export type ToastVariant = "success" | "error" | "info";

export interface ToastItem {
    id: string;
    message: string;
    variant: ToastVariant;
    duration: number;
}

export interface ToastAPI {
    toast: (message: string, variant?: ToastVariant, duration?: number) => void;
    dismiss: (id: string) => void;
}

/* ────────────────────────────────────────── context ─── */

const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error("useToast must be used within a <ToastProvider>");
    }
    return ctx;
}

/* ────────────────────────────────────── icons ─── */

function SuccessIcon() {
    return (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
    );
}

function ErrorIcon() {
    return (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M15 9l-6 6M9 9l6 6" />
        </svg>
    );
}

function InfoIcon() {
    return (
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
        </svg>
    );
}

/* ────────────────────────────────── variant styles ─── */

const variantStyles: Record<ToastVariant, string> = {
    success:
        "border-emerald-200/60 bg-emerald-50/90 text-emerald-800 shadow-emerald-100/50",
    error:
        "border-red-200/60 bg-red-50/90 text-red-800 shadow-red-100/50",
    info:
        "border-sky-200/60 bg-sky-50/90 text-sky-800 shadow-sky-100/50",
};

const variantIcons: Record<ToastVariant, () => ReactNode> = {
    success: SuccessIcon,
    error: ErrorIcon,
    info: InfoIcon,
};

/* ────────────────────────────────── single toast ─── */

function ToastCard({
    item,
    onDismiss,
}: {
    item: ToastItem;
    onDismiss: (id: string) => void;
}) {
    const [exiting, setExiting] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const startExit = useCallback(() => {
        setExiting(true);
        setTimeout(() => onDismiss(item.id), 280);
    }, [item.id, onDismiss]);

    useEffect(() => {
        timerRef.current = setTimeout(startExit, item.duration);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [item.duration, startExit]);

    const Icon = variantIcons[item.variant];

    return (
        <div
            role="alert"
            className={`pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 ${variantStyles[item.variant]
                } ${exiting
                    ? "translate-x-full opacity-0"
                    : "translate-x-0 opacity-100 animate-in slide-in-from-right-full"
                }`}
        >
            <Icon />
            <p className="flex-1 leading-snug">{item.message}</p>
            <button
                type="button"
                onClick={startExit}
                className="shrink-0 rounded-full p-0.5 opacity-60 transition hover:opacity-100"
                aria-label="Dismiss notification"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
}

/* ─────────────────────────────── provider + portal ─── */

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const dismiss = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = useCallback(
        (message: string, variant: ToastVariant = "success", duration = 5000) => {
            const id = `toast-${++nextId}-${Date.now()}`;
            setToasts((prev) => [...prev, { id, message, variant, duration }]);
        },
        []
    );

    return (
        <ToastContext.Provider value={{ toast, dismiss }}>
            {children}
            {/* Toast container — fixed top-right */}
            <div
                aria-live="polite"
                aria-label="Notifications"
                className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-3"
            >
                {toasts.map((item) => (
                    <ToastCard key={item.id} item={item} onDismiss={dismiss} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
