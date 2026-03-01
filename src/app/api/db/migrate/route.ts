import { NextResponse } from "next/server";
import { migrate, getDB } from "@/lib/db";
import bcrypt from "bcryptjs";

// GET /api/db/migrate — create tables + seed admin user
export async function GET() {
    try {
        // Create tables
        await migrate();

        // Seed admin user if not exists
        const sql = getDB();
        const existing = await sql`SELECT id FROM users WHERE email = 'admin@nadi-health.id'`;
        if (existing.length === 0) {
            const hash = await bcrypt.hash("Nadi@2025!", 10);
            await sql`INSERT INTO users (email, name, password, role) VALUES ('admin@nadi-health.id', 'Admin', ${hash}, 'admin')`;
        }

        // Seed static articles if table is empty
        const articleCount = await sql`SELECT COUNT(*) as count FROM articles`;
        if (Number(articleCount[0].count) === 0) {
            // Import static articles
            const fs = await import("fs");
            const path = await import("path");
            const dir = path.join(process.cwd(), "src/data/articles");
            const files = fs.readdirSync(dir).filter((f: string) => f.endsWith(".json"));
            for (const f of files) {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8"));
                    await sql`INSERT INTO articles (slug, title, subtitle, category, date, read_time, author, cover_color, seo_description, seo_keywords, blocks)
            VALUES (${data.slug}, ${data.title}, ${data.subtitle || ""}, ${data.category}, ${data.date}, ${data.readTime}, ${data.author}, ${data.coverColor}, ${data.seo?.description || ""}, ${data.seo?.keywords || []}, ${JSON.stringify(data.blocks)})
            ON CONFLICT (slug) DO NOTHING`;
                } catch { /* skip */ }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Database migrated and seeded successfully",
        });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
