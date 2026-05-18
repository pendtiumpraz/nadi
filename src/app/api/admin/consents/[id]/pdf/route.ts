import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PageSizes } from "pdf-lib";
import { auth } from "@/lib/auth";
import { canReview } from "@/lib/permissions";
import { getDB } from "@/lib/db";

export const dynamic = "force-dynamic";

interface ConsentAuthor {
    surnameFirstName?: string;
    affiliation?: string;
}

interface ConsentRecord {
    id: number;
    article_slug: string;
    title_of_paper: string;
    authors: ConsentAuthor[] | unknown;
    signatory_full_name: string;
    signatory_signature_url: string | null;
    signatory_date: string;
    ack_ethical: boolean;
    ack_original: boolean;
    ack_edited: boolean;
    ack_ai_disclosure: boolean;
    ack_may_reject: boolean;
    ack_no_liability: boolean;
    agree_on_behalf: boolean;
    created_at: string;
}

const AUTHOR_CLAUSES: { key: "ack_ethical" | "ack_original" | "ack_edited" | "ack_ai_disclosure"; text: string }[] = [
    { key: "ack_ethical", text: "The policy product has been developed in an ethical, responsible manner and in compliance with the code of scientific research ethics;" },
    { key: "ack_original", text: "The policy product meets basic publication standards, is original and free of plagiarism;" },
    { key: "ack_edited", text: "The policy product has been edited in accordance with the guidelines and revisions imposed by the quality control team;" },
    { key: "ack_ai_disclosure", text: "The policy product has used artificial intelligence (AI) tools in a responsible and transparent manner, with all AI-assisted content reviewed and verified by the author;" },
];

const NADI_TERMS_CLAUSES: { key: "ack_may_reject" | "ack_no_liability"; text: string }[] = [
    { key: "ack_may_reject", text: "The author(s) agree that the NADI Quality Control team may reject the paper if it violates any of the above declarations (Nos. 1-4) or contains deficiencies." },
    { key: "ack_no_liability", text: "The author(s) agree that NADI assumes no responsibility for the content, accuracy, or opinions expressed in the policy paper, which remain solely the responsibility of the author(s)." },
];

// Paper-size presets in points (1pt = 1/72in). pdf-lib's PageSizes covers A4
// and Letter; Legal and F4/Folio are listed manually so callers can pick the
// regional default they need (F4 / Folio is very common in Indonesia).
const PAGE_SIZES: Record<string, [number, number]> = {
    A4: PageSizes.A4 as [number, number],
    LETTER: PageSizes.Letter as [number, number],
    LEGAL: [612, 1008],   // 8.5 x 14 in
    F4: [612, 936],       // 8.5 x 13 in (Folio)
};

function parseAuthors(value: unknown): ConsentAuthor[] {
    if (!value) return [];
    if (Array.isArray(value)) return value as ConsentAuthor[];
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? (parsed as ConsentAuthor[]) : [];
        } catch {
            return [];
        }
    }
    return [];
}

function formatLongDate(value: string | null | undefined): string {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Wrap a string into lines that fit within `maxWidth` (in PDF points) at the
// given font + size. Mirrors what the browser does in CSS — we have to do it
// manually here because pdf-lib has no layout engine.
function wrapText(text: string, font: import("pdf-lib").PDFFont, size: number, maxWidth: number): string[] {
    if (!text) return [""];
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
            line = candidate;
        } else {
            if (line) lines.push(line);
            line = word;
        }
    }
    if (line) lines.push(line);
    return lines.length > 0 ? lines : [""];
}

async function buildPDF(c: ConsentRecord, sizeKey: string, baseUrl: string): Promise<Uint8Array> {
    const [pageWidth, pageHeight] = PAGE_SIZES[sizeKey] || PAGE_SIZES.A4;

    const doc = await PDFDocument.create();
    doc.setTitle(`Consent — ${c.signatory_full_name} — ${c.article_slug}`);
    doc.setSubject("NADI Consent-to-Publish Form");
    doc.setCreator("NADI CMS");

    const fontRegular = await doc.embedFont(StandardFonts.TimesRoman);
    const fontBold = await doc.embedFont(StandardFonts.TimesRomanBold);
    const fontItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

    let page = doc.addPage([pageWidth, pageHeight]);

    // Margins (~25mm)
    const marginLeft = 72;
    const marginRight = 72;
    const marginTop = 64;
    const marginBottom = 64;
    const contentWidth = pageWidth - marginLeft - marginRight;
    let y = pageHeight - marginTop;

    const black = rgb(0, 0, 0);
    const greyDark = rgb(0.33, 0.33, 0.33);
    const greyLight = rgb(0.6, 0.6, 0.6);
    const crimson = rgb(139 / 255, 28 / 255, 28 / 255);

    // Ensure we have space for the next block — if not, paginate.
    const ensureSpace = (needed: number) => {
        if (y - needed < marginBottom) {
            page = doc.addPage([pageWidth, pageHeight]);
            y = pageHeight - marginTop;
        }
    };

    // Draw a stroked checkbox at (x, top-aligned to y) and tick if checked.
    const drawCheckbox = (x: number, top: number, checked: boolean) => {
        const size = 10;
        const cy = top - size + 2;
        page.drawRectangle({ x, y: cy, width: size, height: size, borderColor: black, borderWidth: 1 });
        if (checked) {
            // Simple checkmark via two line segments.
            page.drawLine({ start: { x: x + 1.5, y: cy + size / 2 - 1 }, end: { x: x + size / 2 - 1, y: cy + 1.5 }, color: black, thickness: 1.2 });
            page.drawLine({ start: { x: x + size / 2 - 1, y: cy + 1.5 }, end: { x: x + size - 1, y: cy + size - 1 }, color: black, thickness: 1.2 });
        }
    };

    const drawWrapped = (text: string, x: number, top: number, opts: {
        font?: import("pdf-lib").PDFFont;
        size?: number;
        width?: number;
        color?: import("pdf-lib").RGB;
        lineGap?: number;
    } = {}): number => {
        const font = opts.font || fontRegular;
        const size = opts.size || 11;
        const width = opts.width ?? (contentWidth - (x - marginLeft));
        const color = opts.color || black;
        const lineGap = opts.lineGap ?? 3;
        const lines = wrapText(text, font, size, width);
        let curTop = top;
        for (const ln of lines) {
            page.drawText(ln, { x, y: curTop - size, size, font, color });
            curTop -= size + lineGap;
        }
        return curTop; // returns new y position (top of next line)
    };

    // ── Top-left NADI letterhead. Embed the brand logo (color variant)
    // from the admin-configured branding URL, falling back to the
    // /public/logo-nadi-color.png shipped with the build. Drawn at a fixed
    // height so layout stays predictable regardless of source dimensions.
    {
        const logoTargetHeight = 56;
        try {
            // Prefer the admin-configured logo if set; fall back to the
            // bundled default file in /public.
            let logoSource = `${baseUrl}/logo-nadi-color.png`;
            try {
                const sql = getDB();
                const rows = (await sql`SELECT value FROM site_settings WHERE key = 'branding_logo_url' LIMIT 1`) as { value: string }[];
                if (rows[0]?.value && rows[0].value.trim().length > 0) {
                    const v = rows[0].value;
                    logoSource = v.startsWith("http") ? v : `${baseUrl}${v.startsWith("/") ? v : `/${v}`}`;
                }
            } catch { /* fall back to default */ }

            const res2 = await fetch(logoSource);
            if (res2.ok) {
                const buf = new Uint8Array(await res2.arrayBuffer());
                const isPng = (res2.headers.get("content-type") || "").includes("png") || logoSource.toLowerCase().endsWith(".png");
                const img = isPng ? await doc.embedPng(buf) : await doc.embedJpg(buf);
                const scale = logoTargetHeight / img.height;
                const w = img.width * scale;
                page.drawImage(img, {
                    x: marginLeft,
                    y: y - logoTargetHeight,
                    width: w,
                    height: logoTargetHeight,
                });
                y -= logoTargetHeight + 22;
            } else {
                throw new Error("logo fetch failed");
            }
        } catch {
            // Text-based fallback if the logo image can't be loaded.
            const wordmark = "NADI";
            const wordmarkSize = 24;
            page.drawText(wordmark, {
                x: marginLeft,
                y: y - wordmarkSize,
                size: wordmarkSize,
                font: fontBold,
                color: crimson,
            });
            page.drawText("Advancing Development & Innovation".toUpperCase(), {
                x: marginLeft,
                y: y - wordmarkSize - 10,
                size: 7.5,
                font: fontRegular,
                color: crimson,
            });
            y -= wordmarkSize + 28;
        }
    }

    // ── Document title
    {
        const title = "CONSENT-TO-PUBLISH FORM";
        const titleSize = 16;
        const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
        page.drawText(title, { x: (pageWidth - titleWidth) / 2, y: y - titleSize, size: titleSize, font: fontBold, color: black });
        y -= titleSize + 6;
        const sub = "NADI — Network for Advancing Development & Innovation in Health · 2026";
        const subSize = 10;
        const subWidth = fontItalic.widthOfTextAtSize(sub, subSize);
        page.drawText(sub, { x: (pageWidth - subWidth) / 2, y: y - subSize, size: subSize, font: fontItalic, color: greyDark });
        y -= subSize + 24;
    }

    // ── Intro
    y = drawWrapped(
        "I, the undersigned, hereby confirm that I consent to publish my submitted policy product and declare that:",
        marginLeft,
        y,
        { size: 11, lineGap: 4 }
    );
    y -= 12;

    // ── Author declarations 1-4
    const drawClause = (n: number, checked: boolean, text: string) => {
        const checkX = marginLeft;
        const numWidth = fontBold.widthOfTextAtSize(`${n}.`, 11);
        const textX = checkX + 16 + numWidth + 4;
        const textWidth = contentWidth - (textX - marginLeft);
        // Pre-compute lines to know height
        const lines = wrapText(text, fontRegular, 11, textWidth);
        const blockHeight = lines.length * (11 + 4) + 4;
        ensureSpace(blockHeight);
        drawCheckbox(checkX, y, checked);
        page.drawText(`${n}.`, { x: checkX + 16, y: y - 11, size: 11, font: fontBold, color: black });
        let curTop = y;
        for (const ln of lines) {
            page.drawText(ln, { x: textX, y: curTop - 11, size: 11, font: fontRegular, color: black });
            curTop -= 11 + 4;
        }
        y = curTop - 6;
    };

    AUTHOR_CLAUSES.forEach((cl, i) => drawClause(i + 1, Boolean(c[cl.key]), cl.text));

    // ── NADI terms label + 5-6
    ensureSpace(40);
    y -= 4;
    page.drawText("NADI Standard Terms (accepted on submission):", { x: marginLeft, y: y - 11, size: 11, font: fontItalic, color: greyDark });
    y -= 11 + 8;
    NADI_TERMS_CLAUSES.forEach((cl, i) => drawClause(i + 5, Boolean(c[cl.key]), cl.text));

    // ── Effect clause divider + paragraph
    ensureSpace(60);
    y -= 4;
    page.drawLine({ start: { x: marginLeft, y }, end: { x: marginLeft + contentWidth, y }, color: black, thickness: 0.5 });
    y -= 10;
    {
        const effectChecked = Boolean(c.agree_on_behalf);
        const text = "This consent and the above declarations take effect upon signature by at least one author, who signs on behalf of all co-authors, if applicable. I confirm I sign on behalf of all co-authors.";
        const checkX = marginLeft;
        const textX = checkX + 20;
        const textWidth = contentWidth - 20;
        const lines = wrapText(text, fontRegular, 11, textWidth);
        const blockHeight = lines.length * (11 + 4) + 4;
        ensureSpace(blockHeight + 6);
        drawCheckbox(checkX, y, effectChecked);
        let curTop = y;
        for (const ln of lines) {
            page.drawText(ln, { x: textX, y: curTop - 11, size: 11, font: fontRegular, color: black });
            curTop -= 11 + 4;
        }
        y = curTop - 6;
    }
    page.drawLine({ start: { x: marginLeft, y }, end: { x: marginLeft + contentWidth, y }, color: black, thickness: 0.5 });
    y -= 18;

    // ── Title of the paper
    ensureSpace(60);
    page.drawText("TITLE OF THE PAPER", { x: marginLeft, y: y - 9, size: 9, font: fontBold, color: greyDark });
    y -= 16;
    {
        const text = c.title_of_paper || "—";
        const lines = wrapText(text, fontRegular, 12, contentWidth);
        for (const ln of lines) {
            page.drawText(ln, { x: marginLeft, y: y - 12, size: 12, font: fontRegular, color: black });
            y -= 12 + 4;
        }
        y -= 2;
        page.drawLine({ start: { x: marginLeft, y }, end: { x: marginLeft + contentWidth, y }, color: black, thickness: 0.5 });
        y -= 16;
    }

    // ── Authors table
    ensureSpace(80);
    page.drawText("AUTHORS", { x: marginLeft, y: y - 9, size: 9, font: fontBold, color: greyDark });
    y -= 16;
    const authors = parseAuthors(c.authors);
    {
        const col1 = 36;  // #
        const col2 = 220; // Name
        const col3 = contentWidth - col1 - col2; // Affiliation
        const rowH = 22;

        // Header
        const headerY = y;
        page.drawRectangle({ x: marginLeft, y: headerY - rowH, width: contentWidth, height: rowH, color: rgb(0.96, 0.94, 0.91) });
        page.drawText("#", { x: marginLeft + 10, y: headerY - rowH + 7, size: 10, font: fontBold, color: black });
        page.drawText("SURNAME, FIRST NAME", { x: marginLeft + col1 + 8, y: headerY - rowH + 7, size: 9, font: fontBold, color: black });
        page.drawText("AFFILIATION", { x: marginLeft + col1 + col2 + 8, y: headerY - rowH + 7, size: 9, font: fontBold, color: black });
        // Header border
        page.drawRectangle({ x: marginLeft, y: headerY - rowH, width: contentWidth, height: rowH, borderColor: black, borderWidth: 0.5 });
        y = headerY - rowH;

        if (authors.length === 0) {
            page.drawText("No authors recorded.", { x: marginLeft + 10, y: y - rowH + 7, size: 10, font: fontItalic, color: greyLight });
            page.drawRectangle({ x: marginLeft, y: y - rowH, width: contentWidth, height: rowH, borderColor: black, borderWidth: 0.5 });
            y -= rowH;
        } else {
            for (let i = 0; i < authors.length; i++) {
                ensureSpace(rowH + 4);
                const a = authors[i];
                const nameLines = wrapText(a.surnameFirstName || "—", fontRegular, 10, col2 - 16);
                const affLines = wrapText(a.affiliation || "—", fontRegular, 10, col3 - 16);
                const lineCount = Math.max(nameLines.length, affLines.length, 1);
                const thisRowH = Math.max(rowH, lineCount * 12 + 10);
                page.drawText(`${i + 1}.`, { x: marginLeft + 10, y: y - 14, size: 10, font: fontRegular, color: black });
                let lineY = y - 14;
                for (const ln of nameLines) {
                    page.drawText(ln, { x: marginLeft + col1 + 8, y: lineY, size: 10, font: fontRegular, color: black });
                    lineY -= 12;
                }
                lineY = y - 14;
                for (const ln of affLines) {
                    page.drawText(ln, { x: marginLeft + col1 + col2 + 8, y: lineY, size: 10, font: fontRegular, color: black });
                    lineY -= 12;
                }
                page.drawRectangle({ x: marginLeft, y: y - thisRowH, width: contentWidth, height: thisRowH, borderColor: black, borderWidth: 0.5 });
                // Column dividers
                page.drawLine({ start: { x: marginLeft + col1, y }, end: { x: marginLeft + col1, y: y - thisRowH }, color: black, thickness: 0.5 });
                page.drawLine({ start: { x: marginLeft + col1 + col2, y }, end: { x: marginLeft + col1 + col2, y: y - thisRowH }, color: black, thickness: 0.5 });
                y -= thisRowH;
            }
            // Header column dividers (drawn after rows so they extend through)
            page.drawLine({ start: { x: marginLeft + col1, y: headerY }, end: { x: marginLeft + col1, y: headerY - rowH }, color: black, thickness: 0.5 });
            page.drawLine({ start: { x: marginLeft + col1 + col2, y: headerY }, end: { x: marginLeft + col1 + col2, y: headerY - rowH }, color: black, thickness: 0.5 });
        }
        y -= 18;
    }

    // ── Signature block
    ensureSpace(160);
    page.drawText("SIGNED BY", { x: marginLeft, y: y - 9, size: 9, font: fontBold, color: greyDark });
    y -= 16;

    const sigBlockHeight = 110;
    const halfWidth = (contentWidth - 24) / 2;
    const sigTop = y;

    // Left half: signature image
    {
        let sigImageDrawn = false;
        if (c.signatory_signature_url) {
            try {
                const res = await fetch(c.signatory_signature_url);
                if (res.ok) {
                    const buf = new Uint8Array(await res.arrayBuffer());
                    const contentType = res.headers.get("content-type") || "";
                    const isPng = contentType.includes("png") || c.signatory_signature_url.toLowerCase().endsWith(".png");
                    const img = isPng ? await doc.embedPng(buf) : await doc.embedJpg(buf);
                    const scale = Math.min(halfWidth / img.width, (sigBlockHeight - 10) / img.height, 1);
                    const w = img.width * scale;
                    const h = img.height * scale;
                    page.drawImage(img, { x: marginLeft, y: sigTop - h - 4, width: w, height: h });
                    sigImageDrawn = true;
                }
            } catch {
                /* fall through to placeholder */
            }
        }
        if (!sigImageDrawn) {
            page.drawText("(no signature on file)", { x: marginLeft, y: sigTop - 30, size: 10, font: fontItalic, color: greyLight });
        }
        const lineY = sigTop - sigBlockHeight;
        page.drawLine({ start: { x: marginLeft, y: lineY }, end: { x: marginLeft + halfWidth, y: lineY }, color: black, thickness: 0.5 });
        page.drawText("Signature", { x: marginLeft, y: lineY - 12, size: 9, font: fontRegular, color: greyDark });
    }

    // Right half: date
    {
        const dateX = marginLeft + halfWidth + 24;
        const dateStr = formatLongDate(c.signatory_date);
        page.drawText(dateStr, { x: dateX, y: sigTop - sigBlockHeight + 6, size: 12, font: fontRegular, color: black });
        const lineY = sigTop - sigBlockHeight;
        page.drawLine({ start: { x: dateX, y: lineY }, end: { x: dateX + halfWidth, y: lineY }, color: black, thickness: 0.5 });
        page.drawText("Date", { x: dateX, y: lineY - 12, size: 9, font: fontRegular, color: greyDark });
    }
    y = sigTop - sigBlockHeight - 28;

    // Full name signature
    ensureSpace(40);
    page.drawText(c.signatory_full_name || "—", { x: marginLeft, y: y - 12, size: 12, font: fontRegular, color: black });
    y -= 18;
    page.drawLine({ start: { x: marginLeft, y }, end: { x: marginLeft + contentWidth, y }, color: black, thickness: 0.5 });
    y -= 12;
    page.drawText("Full name of the signatory", { x: marginLeft, y: y - 9, size: 9, font: fontRegular, color: greyDark });
    y -= 30;

    // ── Footer
    ensureSpace(20);
    const footer = `Form submitted ${new Date(c.created_at).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} · Reference ID ${c.id}`;
    const footerWidth = fontItalic.widthOfTextAtSize(footer, 9);
    page.drawText(footer, { x: (pageWidth - footerWidth) / 2, y: marginBottom / 2, size: 9, font: fontItalic, color: greyLight });

    return doc.save();
}

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    if (!canReview(session.user)) return NextResponse.json({ error: "Reviewer or admin required" }, { status: 403 });

    const { id } = await params;
    const consentId = Number(id);
    if (!Number.isFinite(consentId) || consentId <= 0) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const requestedSize = (new URL(req.url).searchParams.get("size") || "A4").toUpperCase();
    const sizeKey = PAGE_SIZES[requestedSize] ? requestedSize : "A4";

    const sql = getDB();
    const rows = await sql`
        SELECT id, article_slug, title_of_paper, authors,
               signatory_full_name, signatory_signature_url, signatory_date,
               ack_ethical, ack_original, ack_edited, ack_ai_disclosure,
               ack_may_reject, ack_no_liability, agree_on_behalf, created_at
        FROM article_consents WHERE id = ${consentId}
    `;
    if (rows.length === 0) {
        return NextResponse.json({ error: "Consent not found" }, { status: 404 });
    }
    const c = rows[0] as unknown as ConsentRecord;

    const baseUrl =
        req.nextUrl?.origin ||
        `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host") || "localhost:3000"}`;
    const pdf = await buildPDF(c, sizeKey, baseUrl);
    const filename = `Consent-${c.article_slug}-${c.signatory_full_name.replace(/[^a-z0-9]+/gi, "-")}.pdf`;

    return new NextResponse(pdf as unknown as BodyInit, {
        status: 200,
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Cache-Control": "no-store",
        },
    });
}
