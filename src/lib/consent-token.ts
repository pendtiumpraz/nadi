import crypto from "crypto";

// ════════════════════════════════════════════════════════════════════
// Consent-to-publish token
// ────────────────────────────────────────────────────────────────────
// Signed URLs sent in the "article approved" email. The token grants the
// holder permission to open the /consent/[slug] form for THIS slug only,
// until the expiry timestamp. Verification is HMAC over slug+expiry
// using AUTH_SECRET (already required by next-auth).
//
// Format: base64url(slug:expiresMs:hmac)
// ════════════════════════════════════════════════════════════════════

const DEFAULT_TTL_DAYS = 30;

function secret(): string {
    const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
    if (!s) throw new Error("AUTH_SECRET (or NEXTAUTH_SECRET) must be set to sign consent tokens.");
    return s;
}

function hmac(payload: string): string {
    return crypto.createHmac("sha256", secret()).update(payload).digest("hex");
}

function b64url(input: Buffer | string): string {
    const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
    return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(token: string): string {
    const padded = token.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (token.length % 4)) % 4);
    return Buffer.from(padded, "base64").toString("utf8");
}

export function signConsentToken(slug: string, ttlDays: number = DEFAULT_TTL_DAYS): string {
    const expiresMs = Date.now() + ttlDays * 24 * 60 * 60 * 1000;
    const payload = `${slug}:${expiresMs}`;
    return b64url(`${payload}:${hmac(payload)}`);
}

export interface VerifiedToken {
    ok: true;
    slug: string;
    expiresAt: Date;
}
export interface InvalidToken {
    ok: false;
    reason: "malformed" | "bad_signature" | "expired" | "slug_mismatch";
}

export function verifyConsentToken(token: string, expectedSlug: string): VerifiedToken | InvalidToken {
    let decoded: string;
    try {
        decoded = b64urlDecode(token);
    } catch {
        return { ok: false, reason: "malformed" };
    }
    // payload format: slug:expiresMs:hmac. slug itself may contain colons? Slugify guarantees no — but be defensive.
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon === -1) return { ok: false, reason: "malformed" };
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const secondColon = payload.lastIndexOf(":");
    if (secondColon === -1) return { ok: false, reason: "malformed" };
    const slug = payload.slice(0, secondColon);
    const expiresMs = Number(payload.slice(secondColon + 1));
    if (!Number.isFinite(expiresMs)) return { ok: false, reason: "malformed" };

    const expected = hmac(payload);
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
        return { ok: false, reason: "bad_signature" };
    }
    if (slug !== expectedSlug) return { ok: false, reason: "slug_mismatch" };
    if (Date.now() > expiresMs) return { ok: false, reason: "expired" };
    return { ok: true, slug, expiresAt: new Date(expiresMs) };
}
