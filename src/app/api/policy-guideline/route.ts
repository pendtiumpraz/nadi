import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'guideline_url'`;
        const url =
            rows.length > 0 && typeof rows[0].value === "string"
                ? rows[0].value.trim()
                : "";

        if (url.length > 0) {
            return NextResponse.redirect(url, 302);
        }
        return NextResponse.redirect(new URL("/policy-guideline", req.url), 302);
    } catch {
        return NextResponse.redirect(new URL("/policy-guideline", req.url), 302);
    }
}
