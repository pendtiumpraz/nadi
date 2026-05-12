import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";

// ════════════════════════════════════════════════════════════════════
// Signature image upload (for the consent-to-publish form)
// ────────────────────────────────────────────────────────────────────
// NO auth session required: the consent form is reached only via a
// signed token URL emailed to the partner, and that token gate
// (enforced on /api/consent/[slug]) is what protects the flow.
// Anyone with the token URL must be able to upload a signature image,
// so this endpoint is intentionally open. We still constrain MIME
// type and size to limit abuse.
// ════════════════════════════════════════════════════════════════════

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file || file.size === 0) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }
        if (!file.type.startsWith("image/") || !ALLOWED_MIME.has(file.type)) {
            return NextResponse.json({ error: "File must be a JPG, PNG, or WebP image" }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ error: "Image too large (max 2 MB)" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const originalName = (file.name || "").toLowerCase();
        const rawExt = originalName.includes(".") ? originalName.split(".").pop() || "" : "";
        const safeExt = /^(jpg|jpeg|png|webp)$/.test(rawExt) ? rawExt : "png";
        const filename = `signature-${Date.now()}.${safeExt}`;

        let url: string;
        if (process.env.VERCEL) {
            const blob = await put(`signatures/${filename}`, buffer, {
                access: "public",
                addRandomSuffix: true,
            });
            url = blob.url;
        } else {
            const dir = path.join(process.cwd(), "public/uploads/signatures");
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, filename), buffer);
            url = `/uploads/signatures/${filename}`;
        }

        return NextResponse.json({ url });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
