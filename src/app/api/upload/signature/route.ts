import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import fs from "fs";
import path from "path";
import { validateUpload, PRESET_SIGNATURE_2MB } from "@/lib/upload-security";

// ════════════════════════════════════════════════════════════════════
// Signature image upload (for the consent-to-publish form)
// ────────────────────────────────────────────────────────────────────
// NO auth session required: the consent form is reached only via a
// signed token URL emailed to the partner, and that token gate
// (enforced on /api/consent/[slug]) is what protects the flow.
// Anyone with the token URL must be able to upload a signature image,
// so this endpoint is intentionally open. Validation rejects scripts,
// SVG, and anything outside JPG/PNG.
// ════════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const validation = validateUpload(file, PRESET_SIGNATURE_2MB);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const buffer = Buffer.from(await file!.arrayBuffer());
        const filename = `signature-${Date.now()}.${validation.extension}`;

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
