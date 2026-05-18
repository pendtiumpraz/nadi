"use client";

import * as React from "react";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    /** Optional ref to forward to the underlying input. */
    inputRef?: React.Ref<HTMLInputElement>;
}

// Plain stroked-icon eye / eye-with-slash — renders consistently on every
// platform (Windows shipped the eye-with-slash emoji as a monkey-with-eyes,
// which looked unprofessional next to a password field).
function EyeIcon({ open }: { open: boolean }): React.JSX.Element {
    if (open) {
        return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
            </svg>
        );
    }
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.77 19.77 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a19.86 19.86 0 0 1-2.16 3.19" />
            <path d="M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12" />
            <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
    );
}

/**
 * Password input with a built-in show/hide toggle (eye icon).
 *
 * Used wherever the user types a password — login, register, change-password
 * modals, and the reset-password page. Matches the visual style of native
 * input fields so it can be dropped in anywhere without further styling.
 */
export default function PasswordInput({ inputRef, style, ...rest }: PasswordInputProps): React.JSX.Element {
    const [visible, setVisible] = React.useState(false);

    return (
        <div style={{ position: "relative", width: "100%" }}>
            <input
                {...rest}
                ref={inputRef}
                type={visible ? "text" : "password"}
                style={{
                    width: "100%",
                    paddingRight: 42,
                    boxSizing: "border-box",
                    ...style,
                }}
            />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-label={visible ? "Hide password" : "Show password"}
                tabIndex={-1}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: 8,
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    color: "#666",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <EyeIcon open={visible} />
            </button>
        </div>
    );
}
