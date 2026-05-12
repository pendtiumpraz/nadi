"use client";

import { usePathname } from "next/navigation";
import PrivacyPopup from "./PrivacyPopup";

/**
 * Gates the global privacy popup so it only mounts on public pages.
 * Admin users authenticate through a separate flow and should never see this.
 */
export default function PrivacyPopupGate() {
    const pathname = usePathname();
    if (pathname && pathname.startsWith("/admin")) return null;
    return <PrivacyPopup />;
}
