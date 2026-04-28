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
            await sql`INSERT INTO users (email, name, password, role, status) VALUES ('admin@nadi-health.id', 'Admin', ${hash}, 'admin', 'active')`;
        }

        // Seed one test account per role (password: Nadi@2025!) — only if missing
        const testUsers = [
            { email: "reviewer@nadi-health.id", name: "Test Reviewer", role: "reviewer" },
            { email: "contributor@nadi-health.id", name: "Test Contributor", role: "contributor" },
            { email: "partner@nadi-health.id", name: "Test Partner", role: "partner" },
        ];
        for (const u of testUsers) {
            const found = await sql`SELECT id FROM users WHERE email = ${u.email}`;
            if (found.length === 0) {
                const hash = await bcrypt.hash("Nadi@2025!", 10);
                await sql`INSERT INTO users (email, name, password, role, status) VALUES (${u.email}, ${u.name}, ${hash}, ${u.role}, 'active')`;
            }
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

        // Seed team members if table is empty
        const teamCount = await sql`SELECT COUNT(*) as count FROM team_members`;
        if (Number(teamCount[0].count) === 0) {
            const team = [
                { name: "Dr. Widyaretna Buenastuti", title: "Founder & Director", bio: "Health policy strategist with 20+ years across MoH, multilaterals, and global health institutions.", initials: "W", order: 1, featured: true },
                { name: "Soleh Ayubi, PhD", title: "Co-founder & Partner", bio: "Healthcare strategist with almost 20 years across academia, large corporations, and global health institutions.", initials: "S", order: 2, featured: true },
                { name: "Dr. Siti Maharani", title: "Lead, Policy Design", bio: "Academic and practitioner bridging evidence-based research with regulatory implementation.", initials: "S", order: 3, featured: true },
                { name: "Jonathan Kusuma", title: "Head of Public Affairs", bio: "Cross-sector communicator with experience in pharma, government relations, and advocacy.", initials: "J", order: 4, featured: true },
                { name: "Dr. Nadia Wulandari", title: "Expert, Global Health Financing", bio: "Specialist in UHC, health economics, and sustainable financing for emerging markets.", initials: "N", order: 5, featured: true },
                { name: "Marco Djuanda", title: "Advisor, Strategic Partnerships", bio: "Builds and manages cross-sector alliances between academic, government, and industry actors.", initials: "M", order: 6, featured: true },
            ];
            for (const m of team) {
                await sql`INSERT INTO team_members (name, title, bio, initials, order_num, is_featured) VALUES (${m.name}, ${m.title}, ${m.bio}, ${m.initials}, ${m.order}, ${m.featured})`;
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
