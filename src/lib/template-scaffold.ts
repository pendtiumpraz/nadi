// ════════════════════════════════════════════════════════════════════
// Editor scaffold helpers.
//
// When a partner picks a Policy Product Type in <ArticleEditor>, the
// contentEditable body is seeded with H2 section headings + italic
// muted placeholder hints (one <p> per section) that the partner
// replaces with real content.
//
// Contract:
//   buildScaffoldHTML(type)   -> pure HTML string, no DOM access
//   isUntouchedScaffold(html) -> true iff the plain-text equals the
//                                concatenated placeholders of ANY
//                                product's scaffold (forgiving across
//                                product types, so switching products
//                                doesn't accidentally clobber writing).
// ════════════════════════════════════════════════════════════════════
import { POLICY_PRODUCTS, type PolicyProductDef } from "@/data/policy-products";

function escape(s: string): string {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

export function buildScaffoldHTML(product: PolicyProductDef | null | undefined): string {
    if (!product) return "";
    return product.sections
        .map(
            (s) =>
                `<h2>${escape(s.heading)}</h2>\n` +
                `<p><em style="color: #888">${escape(s.placeholder)}</em></p>`,
        )
        .join("\n");
}

function toPlainText(html: string): string {
    return html
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
}

/** Returns true when the editor body is identical to any known scaffold —
 *  used to decide whether picking a different product type can safely reseed
 *  the editor without overwriting real writing. Takes an optional `extra`
 *  list so the caller can include dynamic types loaded from the API. */
export function isUntouchedScaffold(html: string, extra: PolicyProductDef[] = []): boolean {
    const actual = toPlainText(html);
    if (!actual) return false;
    const all: PolicyProductDef[] = [...Object.values(POLICY_PRODUCTS), ...extra];
    for (const product of all) {
        const expected = product.sections
            .map((s) => `${s.heading} ${s.placeholder}`)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        if (actual === expected) return true;
    }
    return false;
}
