import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 12)));
    const offset = (page - 1) * limit;

    try {
        const sql = getDB();
        const countResult = await sql`SELECT COUNT(*) as total FROM team_members`;
        const total = Number(countResult[0].total);
        const rows = await sql`SELECT id, name, title, bio, initials, photo_url, linkedin_url, order_num, is_featured FROM team_members ORDER BY order_num ASC, id ASC LIMIT ${limit} OFFSET ${offset}`;

        const members = rows.map((r) => ({
            id: r.id,
            name: r.name,
            title: r.title || "",
            bio: r.bio || "",
            initials: r.initials || "",
            photoUrl: r.photo_url || "",
            linkedinUrl: r.linkedin_url || "",
            orderNum: r.order_num || 0,
            isFeatured: r.is_featured || false,
        }));

        return NextResponse.json({
            members,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
