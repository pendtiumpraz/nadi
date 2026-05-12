import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getAllArticlesStore,
    getArticleBySlugStore,
    getArticlesByAuthor,
    saveArticle,
    deleteArticle,
    articleExists,
} from "@/lib/articles-store";
import { canPublish, canEditOwnContent, asRole } from "@/lib/permissions";
import { getUserById } from "@/lib/users";
import { notifyArticleSubmitted, notifySubmissionReceived, getReviewEtaDays } from "@/lib/notify";
import { checkSubmissionAllowed } from "@/lib/submission-throttle";
import { getDB } from "@/lib/db";
import type { Article, ArticleStatus } from "@/data/articles/types";

function buildBaseUrl(req: NextRequest): string {
    return req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
}

async function fireSubmitEmails(req: NextRequest, article: Article, actorName: string): Promise<void> {
    const baseUrl = buildBaseUrl(req);
    notifyArticleSubmitted({ title: article.title, slug: article.slug, actorName, baseUrl }).catch(() => { });
    if (article.authorId) {
        const author = await getUserById(article.authorId);
        if (author?.email) {
            const etaDays = await getReviewEtaDays();
            notifySubmissionReceived({ title: article.title, slug: article.slug, authorEmail: author.email, etaDays, baseUrl }).catch(() => { });
        }
    }
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// GET all articles (or single by slug query param)
export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
        const article = await getArticleBySlugStore(slug);
        if (!article)
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(article);
    }

    // Partners can only see their own submissions; admin/reviewer/contributor see all.
    const articles =
        asRole(session.user.role) === "partner"
            ? await getArticlesByAuthor(session.user.id)
            : await getAllArticlesStore();
    return NextResponse.json(articles);
}

// POST create new article
// Body may include `submit: true` to send straight to review (used by contributors).
// Admins/reviewers can pass `status` directly.
export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body: Article & { submit?: boolean } = await req.json();
        if (!body.title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        if (!body.slug) body.slug = slugify(body.title);
        if (await articleExists(body.slug)) {
            return NextResponse.json(
                { error: "Article with this slug already exists" },
                { status: 400 }
            );
        }

        if (!body.date) body.date = new Date().toISOString().split("T")[0];
        if (!body.author) body.author = session.user.name || "NADI";
        if (!body.readTime) body.readTime = "5 min read";
        if (!body.coverColor) body.coverColor = "charcoal";
        if (!body.category) body.category = "ARTICLE";
        if (!body.seo) body.seo = { description: "", keywords: [] };
        if (!body.blocks) body.blocks = [];

        // Decide status: contributors/partners can never publish directly.
        // Admins/reviewers can publish unless they explicitly chose draft/in_review.
        let status: ArticleStatus;
        if (canPublish(session.user)) {
            status = (body.status as ArticleStatus) || "published";
        } else if (body.submit) {
            status = "in_review";
        } else {
            status = "draft";
        }
        body.status = status;
        body.authorId = body.authorId || session.user.id;
        body.feedbackPending = false; // fresh row never has pending feedback

        // Daily submission cap — only enforced on non-publisher submits.
        if (status === "in_review" && !canPublish(session.user)) {
            const check = await checkSubmissionAllowed(session.user.id);
            if (!check.ok) {
                return NextResponse.json({ error: check.error }, { status: 429 });
            }
        }

        await saveArticle(body);
        // Fire submission emails when a non-publisher creates a row that lands in_review
        if (status === "in_review" && !canPublish(session.user)) {
            // Audit-row so the daily cap counts this submit (mirrors the transition route).
            try {
                const sql = getDB();
                await sql`
                    INSERT INTO submissions (type, ref_slug, author_id, status, notes)
                    VALUES ('article', ${body.slug}, ${Number(session.user.id)}, 'in_review', 'created via POST /api/articles')
                `;
            } catch { /* non-fatal — don't block the create on audit failure */ }
            fireSubmitEmails(req, body, session.user.name || "A contributor").catch(() => { });
        }
        return NextResponse.json(body, { status: 201 });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

// PUT update article
export async function PUT(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body: Article & { submit?: boolean } = await req.json();
        if (!body.slug) {
            return NextResponse.json({ error: "Slug is required" }, { status: 400 });
        }

        const existing = await getArticleBySlugStore(body.slug);
        if (!existing) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        // Permission check: contributor can only edit own articles
        if (!canEditOwnContent(session.user, existing.authorId)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Status policy on edit:
        // - admin/reviewer: keeps existing OR caller-supplied status
        // - contributor: editing a draft/in_review/feedback article moves it to in_review when they
        //   submit, else stays draft (or in_review if it was). They cannot publish.
        // - non-publisher edits while article is already `approved` or `consent_received` MUST NOT
        //   demote it back to draft — preserve the state.
        const lockedStates: ArticleStatus[] = ["approved", "consent_received", "published"];
        let status: ArticleStatus;
        if (canPublish(session.user)) {
            status = (body.status as ArticleStatus) || existing.status || "draft";
        } else if (lockedStates.includes(existing.status as ArticleStatus)) {
            // Partner / contributor cannot regress these states by saving.
            status = existing.status as ArticleStatus;
        } else if (body.submit) {
            status = "in_review";
        } else {
            status = existing.status === "in_review" ? "in_review" : "draft";
        }
        const wasInReview = existing.status === "in_review";
        body.status = status;
        body.authorId = existing.authorId || body.authorId;
        // Partner re-saving clears feedback_pending (they've addressed the comments).
        // Admin/reviewer re-saving doesn't touch it — only commenting flips it.
        body.feedbackPending = canPublish(session.user) ? !!existing.feedbackPending : false;

        // Daily submission cap — only enforced when a non-publisher actually
        // transitions an article TO in_review (first submit OR resubmit).
        if (status === "in_review" && !wasInReview && !canPublish(session.user)) {
            const check = await checkSubmissionAllowed(session.user.id);
            if (!check.ok) {
                return NextResponse.json({ error: check.error }, { status: 429 });
            }
        }

        await saveArticle(body);
        // Fire submission emails when a non-publisher transitions an article TO in_review
        // (resubmit-after-feedback OR first submit from a draft).
        if (status === "in_review" && !wasInReview && !canPublish(session.user)) {
            // Audit-row so the daily cap counts this submit (mirrors the transition route).
            try {
                const sql = getDB();
                await sql`
                    INSERT INTO submissions (type, ref_slug, author_id, status, notes)
                    VALUES ('article', ${body.slug}, ${Number(session.user.id)}, 'in_review', 'resubmit via PUT /api/articles')
                `;
            } catch { /* non-fatal */ }
            fireSubmitEmails(req, body, session.user.name || "A contributor").catch(() => { });
        }
        return NextResponse.json(body);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
}

// DELETE article
export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) {
        return NextResponse.json({ error: "Slug required" }, { status: 400 });
    }

    const existing = await getArticleBySlugStore(slug);
    if (!existing) {
        return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Only admin/reviewer or original author can delete
    if (!canEditOwnContent(session.user, existing.authorId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Non-publishers can ONLY delete their own DRAFTS. Anything in review,
    // approved, consent_received, or published is locked — only an admin
    // or reviewer can delete those (e.g. takedown of published content).
    if (!canPublish(session.user) && existing.status && existing.status !== "draft") {
        return NextResponse.json(
            { error: "Cannot delete an article once submitted. Contact an admin to take it down." },
            { status: 403 }
        );
    }

    await deleteArticle(slug);
    return NextResponse.json({ success: true });
}
