"use client";

import NewLanding from "./NewLanding";
import OldLanding from "./OldLanding";
import MaintenanceLanding from "./MaintenanceLanding";

export default function LandingSwitcher({ version }: { version: string }) {
    if (version === "maintenance") return <MaintenanceLanding />;
    if (version === "v1") return <OldLanding />;
    return <NewLanding />;
}
