"use client";

import { usePathname } from "next/navigation";
import PrivacyPopup from "./PrivacyPopup";

/**
 * Gates the global privacy popup so it only mounts on public pages.
 * Admin users authenticate through a separate flow and should never see this.
 */
// Paths that should never show the popup: admin chrome (already authenticated),
// auth pages (focused single-purpose), and the consent flow (a partner clicking
// the email link is mid-task and shouldn't be interrupted).
const SUPPRESSED_PREFIXES = ["/admin", "/login", "/register", "/consent"];

export default function PrivacyPopupGate() {
    const pathname = usePathname();
    if (pathname && SUPPRESSED_PREFIXES.some((p) => pathname.startsWith(p))) return null;
    return <PrivacyPopup />;
}
