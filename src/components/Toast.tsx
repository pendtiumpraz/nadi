"use client";

import * as React from "react";
import Swal, { SweetAlertIcon } from "sweetalert2";

export type ToastKind = "success" | "error" | "info" | "warning";

interface ToastContextValue {
    show: (message: string, kind?: ToastKind, durationMs?: number) => void;
    success: (message: string, durationMs?: number) => void;
    error: (message: string, durationMs?: number) => void;
    info: (message: string, durationMs?: number) => void;
    warning: (message: string, durationMs?: number) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

// SweetAlert2 mixin — same look on every page. Top-right, auto-dismiss, no
// blocking modal (toast: true means the backdrop is not used).
function fireToast(message: string, kind: ToastKind, durationMs: number) {
    const icon: SweetAlertIcon = kind === "info" ? "info" : kind;
    Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title: message,
        showConfirmButton: false,
        timer: durationMs,
        timerProgressBar: true,
        didOpen: (el) => {
            el.addEventListener("mouseenter", Swal.stopTimer);
            el.addEventListener("mouseleave", Swal.resumeTimer);
        },
    });
}

const DEFAULT_DURATION_MS = 4000;
const ERROR_DURATION_MS = 7000;

// Mounted-once API used by call-sites that don't have access to React context
// (e.g. inside a non-React event handler). Resolves to the same SweetAlert
// underneath as useToast(), so messages look identical.
export const toast = {
    show: (message: string, kind: ToastKind = "info", durationMs?: number) =>
        fireToast(message, kind, durationMs ?? (kind === "error" ? ERROR_DURATION_MS : DEFAULT_DURATION_MS)),
    success: (message: string, durationMs?: number) => fireToast(message, "success", durationMs ?? DEFAULT_DURATION_MS),
    error: (message: string, durationMs?: number) => fireToast(message, "error", durationMs ?? ERROR_DURATION_MS),
    info: (message: string, durationMs?: number) => fireToast(message, "info", durationMs ?? DEFAULT_DURATION_MS),
    warning: (message: string, durationMs?: number) => fireToast(message, "warning", durationMs ?? DEFAULT_DURATION_MS),
};

const contextApi: ToastContextValue = toast;

export function useToast(): ToastContextValue {
    const ctx = React.useContext(ToastContext);
    return ctx ?? contextApi;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    // Nothing to render — SweetAlert injects its own DOM. The provider is kept
    // for API symmetry (so call-sites that prefer the hook keep working) and so
    // future enhancements (e.g. queueing, per-route suppression) have a place
    // to live.
    return <ToastContext.Provider value={contextApi}>{children}</ToastContext.Provider>;
}

/* ───── Dialog helpers ───── */

interface ConfirmDialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    /** "danger" turns the confirm button crimson — use for destructive actions. */
    tone?: "default" | "danger";
}

/** SweetAlert-backed replacement for window.confirm. Resolves to true/false. */
export async function confirmDialog(opts: ConfirmDialogOptions | string): Promise<boolean> {
    const o: ConfirmDialogOptions = typeof opts === "string" ? { message: opts } : opts;
    const result = await Swal.fire({
        title: o.title || "Confirm",
        text: o.message,
        icon: o.tone === "danger" ? "warning" : "question",
        showCancelButton: true,
        confirmButtonText: o.confirmText || "Yes",
        cancelButtonText: o.cancelText || "Cancel",
        confirmButtonColor: o.tone === "danger" ? "#8B1C1C" : "#1d4a8a",
        cancelButtonColor: "#6c757d",
        reverseButtons: true,
        focusCancel: o.tone === "danger",
    });
    return result.isConfirmed;
}

interface PromptDialogOptions {
    title?: string;
    message: string;
    placeholder?: string;
    inputType?: "text" | "textarea";
    confirmText?: string;
    cancelText?: string;
    /** Optional validator — return a string to show as an error, or null to allow. */
    validate?: (value: string) => string | null;
}

/** SweetAlert-backed replacement for window.prompt. Resolves to the entered
 *  string, or null if the user cancelled. */
export async function promptDialog(opts: PromptDialogOptions | string): Promise<string | null> {
    const o: PromptDialogOptions = typeof opts === "string" ? { message: opts } : opts;
    const result = await Swal.fire({
        title: o.title || "Input required",
        text: o.message,
        input: o.inputType === "textarea" ? "textarea" : "text",
        inputPlaceholder: o.placeholder,
        showCancelButton: true,
        confirmButtonText: o.confirmText || "Submit",
        cancelButtonText: o.cancelText || "Cancel",
        confirmButtonColor: "#1d4a8a",
        cancelButtonColor: "#6c757d",
        reverseButtons: true,
        inputValidator: (value: string) => {
            if (o.validate) return o.validate(value) || undefined;
            return undefined;
        },
    });
    if (!result.isConfirmed) return null;
    return result.value ?? "";
}
