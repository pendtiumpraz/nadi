"use client";

import dynamic from "next/dynamic";

const NewLanding = dynamic(() => import("@/components/NewLanding"), { ssr: false });
const OldLanding = dynamic(() => import("@/components/OldLanding"), { ssr: false });
const MaintenanceLanding = dynamic(() => import("@/components/MaintenanceLanding"), { ssr: false });

export default function LandingSwitcher({ version }: { version: string }) {
    if (version === "maintenance") return <MaintenanceLanding />;
    if (version === "v1") return <OldLanding />;
    return <NewLanding />;
}
