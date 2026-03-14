"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * Generic form wrapper that calls a server action returning {ok, message}
 * and shows a toast notification with the result.
 */
export function ToastForm({
    action,
    children,
    className,
    onSuccess,
}: {
    action: (formData: FormData) => Promise<{ ok: boolean; message: string }>;
    children: React.ReactNode;
    className?: string;
    onSuccess?: () => void;
}) {
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (submitting) return;
        // Capture FormData synchronously before any await — currentTarget
        // becomes null after the event loop yields.
        const formData = new FormData(e.currentTarget);
        setSubmitting(true);
        try {
            const result = await action(formData);
            toast(result.message, result.ok ? "success" : "error");
            if (result.ok && onSuccess) onSuccess();
        } catch {
            toast("An unexpected error occurred.", "error");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className={className} encType="multipart/form-data">
            {children}
        </form>
    );
}
