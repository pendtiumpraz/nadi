"use client";

import * as React from "react";

interface PasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    /** Optional ref to forward to the underlying input. */
    inputRef?: React.Ref<HTMLInputElement>;
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
                    fontSize: "1rem",
                    lineHeight: 1,
                    color: "#666",
                    opacity: 0.75,
                }}
            >
                {visible ? "🙈" : "👁"}
            </button>
        </div>
    );
}
