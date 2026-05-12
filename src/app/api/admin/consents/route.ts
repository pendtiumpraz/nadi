import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { getDB } from "@/lib/db";

// ════════════════════════════════════════════════════════════════════
// Admin / reviewer: list submitted consent forms
// ════════════════════════════════════════════════════════════════════

interface AuthorRow {
    surnameFirstName: string;
    affiliation: string;
}

function parseAuthors(raw: unknown): AuthorRow[] {
    let value: unknown = raw;
    if (typeof value === "string") {
        try {
            value = JSON.parse(value);
        } catch {
            return [];
        }
    }
    if (!Array.isArray(value)) return [];
    return value
        .filter((a): a is Record<string, unknown> => !!a && typeof a === "object")
        .map((a) => ({
            surnameFirstName: typeof a.surnameFirstName === "string" ? a.surnameFirstName : "",
            affiliation: typeof a.affiliation === "string" ? a.affiliation : "",
        }));
}

export async function GET() {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canReview(session.user)) {
        return NextResponse.json({ error: "Reviewer or admin role required" }, { status: 403 });
    }

    const sql = getDB();
    const rows = await sql`
        SELECT id, article_slug, title_of_paper, authors,
               signatory_full_name, signatory_date, created_at
        FROM article_consents
        ORDER BY created_at DESC
    `;

    return NextResponse.json({
        consents: rows.map((r) => ({
            id: Number(r.id),
            articleSlug: r.article_slug as string,
            titleOfPaper: r.title_of_paper as string,
            signatoryFullName: r.signatory_full_name as string,
            signatoryDate: r.signatory_date
                ? new Date(r.signatory_date as string).toISOString().split("T")[0]
                : "",
            createdAt: r.created_at,
            authors: parseAuthors(r.authors),
        })),
    });
}
