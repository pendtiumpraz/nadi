import { NextRequest, NextResponse } from "next/server";
import { getDB } from "@/lib/db";

// Public endpoint — no auth needed, reads all published articles
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || 9)));
    const offset = (page - 1) * limit;

    try {
        const sql = getDB();

        const countResult = await sql`SELECT COUNT(*) as total FROM articles`;
        const total = Number(countResult[0].total);

        const rows = await sql`SELECT slug, title, subtitle, category, date, read_time, author, cover_color, cover_image, seo_description, seo_keywords FROM articles ORDER BY date DESC LIMIT ${limit} OFFSET ${offset}`;

        const articles = rows.map((row) => ({
            slug: row.slug,
            title: row.title,
            subtitle: row.subtitle || "",
            category: row.category || "ARTICLE",
            date: row.date ? new Date(row.date as string).toISOString().split("T")[0] : "",
            readTime: row.read_time || "5 min read",
            author: row.author || "NADI",
            coverColor: row.cover_color || "charcoal",
            coverImage: row.cover_image || "",
            seo: {
                description: row.seo_description || "",
                keywords: row.seo_keywords || [],
            },
        }));

        return NextResponse.json({
            articles,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
