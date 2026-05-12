import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { getDB } from "@/lib/db";

interface Params {
    params: Promise<{ id: string }>;
}

// Returns the full single consent record (admin / reviewer only).
export async function GET(_req: Request, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canReview(session.user)) {
        return NextResponse.json({ error: "Reviewer or admin role required" }, { status: 403 });
    }

    const { id } = await params;
    const consentId = Number(id);
    if (!Number.isFinite(consentId) || consentId <= 0) {
        return NextResponse.json({ error: "Invalid consent id" }, { status: 400 });
    }

    const sql = getDB();
    const rows = await sql`
        SELECT id, article_slug, title_of_paper, authors,
               signatory_full_name, signatory_signature_url, signatory_date,
               ack_ethical, ack_original, ack_edited, ack_ai_disclosure,
               ack_may_reject, ack_no_liability, agree_on_behalf, created_at
        FROM article_consents WHERE id = ${consentId}
    `;
    if (rows.length === 0) {
        return NextResponse.json({ error: "Consent form not found" }, { status: 404 });
    }
    const r = rows[0];
    return NextResponse.json({
        consent: {
            id: r.id,
            articleSlug: r.article_slug,
            titleOfPaper: r.title_of_paper,
            authors: r.authors,
            signatoryFullName: r.signatory_full_name,
            signatorySignatureUrl: r.signatory_signature_url,
            signatoryDate: r.signatory_date,
            ackEthical: r.ack_ethical,
            ackOriginal: r.ack_original,
            ackEdited: r.ack_edited,
            ackAiDisclosure: r.ack_ai_disclosure,
            ackMayReject: r.ack_may_reject,
            ackNoLiability: r.ack_no_liability,
            agreeOnBehalf: r.agree_on_behalf,
            createdAt: r.created_at,
        },
    });
}
