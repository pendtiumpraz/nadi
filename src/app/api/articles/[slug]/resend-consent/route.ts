import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { getArticleBySlugStore } from "@/lib/articles-store";
import { getUserById } from "@/lib/users";
import { signConsentToken } from "@/lib/consent-token";
import { notifyArticleApproved } from "@/lib/notify";

interface Params {
    params: Promise<{ slug: string }>;
}

// Admin/reviewer convenience: re-send the consent-to-publish email link for an
// article currently in `approved` state. Issues a fresh signed token (default
// 30-day TTL) so the previous link is effectively superseded.
export async function POST(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canReview(session.user)) {
        return NextResponse.json({ error: "Reviewer or admin role required" }, { status: 403 });
    }

    const { slug } = await params;
    const article = await getArticleBySlugStore(slug);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    if (article.status !== "approved") {
        return NextResponse.json(
            { error: `Cannot resend consent link from status='${article.status}' (article must be 'approved').` },
            { status: 400 }
        );
    }

    const author = article.authorId ? await getUserById(article.authorId) : null;
    if (!author?.email) {
        return NextResponse.json({ error: "Article author has no email on file." }, { status: 400 });
    }

    const baseUrl = req.nextUrl?.origin || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
    const token = signConsentToken(slug);
    const consentUrl = `${baseUrl}/consent/${slug}?token=${encodeURIComponent(token)}`;

    notifyArticleApproved({
        title: article.title,
        slug,
        authorEmail: author.email,
        consentUrl,
        baseUrl,
    }).catch(() => { });

    return NextResponse.json({ success: true, sentTo: author.email });
}
