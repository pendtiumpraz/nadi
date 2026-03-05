import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET() {
    try {
        const sql = getDB();
        const rows = await sql`SELECT key, value FROM site_settings`;
        const settings: Record<string, string> = {};
        for (const r of rows) settings[r.key as string] = r.value as string;
        return NextResponse.json({ settings });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const sql = getDB();
        const { key, value } = await req.json();
        await sql`INSERT INTO site_settings (key, value, updated_at) VALUES (${key}, ${value}, NOW()) ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()`;
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
