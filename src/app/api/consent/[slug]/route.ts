import { NextRequest, NextResponse } from "next/server";
import { verifyConsentToken } from "@/lib/consent-token";
import { getArticleBySlugStore, setConsentReceived } from "@/lib/articles-store";
import { getUserById } from "@/lib/users";
import { notifyConsentReceived } from "@/lib/notify";
import { getDB } from "@/lib/db";
import { createNotificationForUsers, getUserIdsByRole } from "@/lib/notifications-store";

// ════════════════════════════════════════════════════════════════════
// Consent-to-publish form API
// ────────────────────────────────────────────────────────────────────
// Token-gated; NO auth session required. The signed token (from the
// "article approved" email) is the only credential. Both GET (prefill)
// and POST (submit) verify it against the slug.
// ════════════════════════════════════════════════════════════════════

interface Params {
    params: Promise<{ slug: string }>;
}

interface AuthorRow {
    surnameFirstName: string;
    affiliation: string;
}

function buildBaseUrl(req: NextRequest): string {
    return (
        req.nextUrl?.origin ||
        `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`
    );
}

// GET — verify token + return prefill data
export async function GET(req: NextRequest, { params }: Params) {
    const { slug } = await params;
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
        return NextResponse.json({ ok: false, reason: "missing_token" }, { status: 400 });
    }

    const result = verifyConsentToken(token, slug);
    if (!result.ok) {
        return NextResponse.json({ ok: false, reason: result.reason }, { status: 401 });
    }

    const article = await getArticleBySlugStore(slug);
    if (!article) {
        return NextResponse.json({ ok: false, reason: "article_not_found" }, { status: 404 });
    }

    if (article.status !== "approved" && article.status !== "consent_received") {
        return NextResponse.json({ ok: false, reason: "not_in_consent_phase" }, { status: 409 });
    }

    let authors: AuthorRow[] = [];
    if (article.authorId) {
        const user = await getUserById(article.authorId);
        if (user?.name) {
            authors = [{ surnameFirstName: user.name, affiliation: "" }];
        }
    }

    return NextResponse.json({
        ok: true,
        prefill: {
            titleOfPaper: article.title,
            authors,
        },
        alreadySubmitted: article.status === "consent_received",
    });
}

// POST — submit consent form
export async function POST(req: NextRequest, { params }: Params) {
    const { slug } = await params;
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
        return NextResponse.json({ ok: false, reason: "missing_token" }, { status: 400 });
    }

    const result = verifyConsentToken(token, slug);
    if (!result.ok) {
        return NextResponse.json({ ok: false, reason: result.reason }, { status: 401 });
    }

    const article = await getArticleBySlugStore(slug);
    if (!article) {
        return NextResponse.json({ ok: false, reason: "article_not_found" }, { status: 404 });
    }
    if (article.status !== "approved") {
        return NextResponse.json({ ok: false, reason: "not_in_consent_phase" }, { status: 409 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
    }

    // ─── Validate acknowledgement booleans (all 7 must be true) ─────
    const ackKeys = [
        "ack_ethical",
        "ack_original",
        "ack_edited",
        "ack_ai_disclosure",
        "ack_may_reject",
        "ack_no_liability",
        "agree_on_behalf",
    ] as const;
    for (const k of ackKeys) {
        if (body[k] !== true) {
            return NextResponse.json(
                { ok: false, error: `All acknowledgements must be accepted (missing: ${k}).` },
                { status: 400 }
            );
        }
    }

    // ─── Title of paper ──────────────────────────────────────────────
    const titleOfPaper = typeof body.title_of_paper === "string" ? body.title_of_paper.trim() : "";
    if (!titleOfPaper) {
        return NextResponse.json({ ok: false, error: "Title of paper is required." }, { status: 400 });
    }

    // ─── Authors array ───────────────────────────────────────────────
    if (!Array.isArray(body.authors)) {
        return NextResponse.json({ ok: false, error: "Authors must be an array." }, { status: 400 });
    }
    const authors: AuthorRow[] = [];
    for (const raw of body.authors) {
        if (!raw || typeof raw !== "object") continue;
        const surnameFirstName = typeof raw.surnameFirstName === "string" ? raw.surnameFirstName.trim() : "";
        const affiliation = typeof raw.affiliation === "string" ? raw.affiliation.trim() : "";
        authors.push({ surnameFirstName, affiliation });
    }
    const hasOneComplete = authors.some((a) => a.surnameFirstName.length > 0 && a.affiliation.length > 0);
    if (!hasOneComplete) {
        return NextResponse.json(
            { ok: false, error: "At least one author with both name and affiliation is required." },
            { status: 400 }
        );
    }

    // ─── Signatory ───────────────────────────────────────────────────
    const signatoryFullName = typeof body.signatory_full_name === "string" ? body.signatory_full_name.trim() : "";
    if (!signatoryFullName) {
        return NextResponse.json({ ok: false, error: "Signatory full name is required." }, { status: 400 });
    }
    const signatorySignatureUrl =
        typeof body.signatory_signature_url === "string" ? body.signatory_signature_url.trim() : "";
    if (!signatorySignatureUrl) {
        return NextResponse.json({ ok: false, error: "Signature image is required." }, { status: 400 });
    }

    // ─── Signatory date (YYYY-MM-DD or parseable) ───────────────────
    const signatoryDateRaw = typeof body.signatory_date === "string" ? body.signatory_date.trim() : "";
    if (!signatoryDateRaw) {
        return NextResponse.json({ ok: false, error: "Signature date is required." }, { status: 400 });
    }
    const isoDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(signatoryDateRaw);
    const parsed = new Date(signatoryDateRaw);
    if (!isoDateMatch && Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ ok: false, error: "Signature date must be a valid date (YYYY-MM-DD)." }, { status: 400 });
    }
    const signatoryDate = isoDateMatch ? signatoryDateRaw : parsed.toISOString().split("T")[0];

    // ─── Insert into article_consents ────────────────────────────────
    const sql = getDB();
    let newId: number;
    try {
        const rows = await sql`
            INSERT INTO article_consents (
                article_slug,
                title_of_paper,
                authors,
                signatory_full_name,
                signatory_signature_url,
                signatory_date,
                ack_ethical,
                ack_original,
                ack_edited,
                ack_ai_disclosure,
                ack_may_reject,
                ack_no_liability,
                agree_on_behalf
            ) VALUES (
                ${slug},
                ${titleOfPaper},
                ${JSON.stringify(authors)},
                ${signatoryFullName},
                ${signatorySignatureUrl},
                ${signatoryDate},
                ${true},
                ${true},
                ${true},
                ${true},
                ${true},
                ${true},
                ${true}
            )
            RETURNING id
        `;
        newId = Number(rows[0].id);
    } catch (err) {
        return NextResponse.json(
            { ok: false, error: `Failed to save consent: ${(err as Error).message}` },
            { status: 400 }
        );
    }

    await setConsentReceived(slug, newId);

    // Fire-and-forget admin notification
    const baseUrl = buildBaseUrl(req);
    notifyConsentReceived({
        title: article.title,
        slug,
        signatoryName: signatoryFullName,
        baseUrl,
    }).catch(() => { });

    // In-app: ping every admin + reviewer that the article is ready to publish.
    Promise.all([getUserIdsByRole("admin"), getUserIdsByRole("reviewer")])
        .then(([admins, reviewers]) =>
            createNotificationForUsers([...admins, ...reviewers], {
                type: "consent_received",
                title: `Consent submitted: ${article.title}`,
                body: `Signed by ${signatoryFullName}. The article is ready to publish.`,
                link: `/admin/review`,
            })
        ).catch(() => { });

    return NextResponse.json({ ok: true }, { status: 201 });
}
