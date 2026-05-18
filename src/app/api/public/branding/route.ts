import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

const DEFAULTS = {
    logoUrl: "/logo-nadi-color.png",
    logoWhiteUrl: "/logo-nadi-white.png",
    faviconUrl: "/favicon-32.png",
};

/** Public read of the active branding URLs. Sourced from site_settings
 *  (branding_logo_url / branding_logo_white_url / branding_favicon_url),
 *  falling back to the static defaults shipped in /public. */
export async function GET() {
    try {
        const sql = getDB();
        const rows = (await sql`
            SELECT key, value FROM site_settings
            WHERE key IN ('branding_logo_url', 'branding_logo_white_url', 'branding_favicon_url')
        `) as { key: string; value: string }[];
        const byKey: Record<string, string> = {};
        for (const r of rows) byKey[r.key] = r.value;
        return NextResponse.json({
            logoUrl: byKey.branding_logo_url || DEFAULTS.logoUrl,
            logoWhiteUrl: byKey.branding_logo_white_url || DEFAULTS.logoWhiteUrl,
            faviconUrl: byKey.branding_favicon_url || DEFAULTS.faviconUrl,
        });
    } catch {
        return NextResponse.json(DEFAULTS);
    }
}
