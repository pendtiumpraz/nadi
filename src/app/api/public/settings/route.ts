import { NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'landing_version'`;
        return NextResponse.json({ version: rows.length > 0 ? rows[0].value : "v2" });
    } catch {
        return NextResponse.json({ version: "v2" });
    }
}
