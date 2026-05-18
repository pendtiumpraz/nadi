import { Metadata } from "next";
import V2PageLayout from "@/components/V2PageLayout";
import LegalDocument from "@/components/LegalDocument";
import { getDB } from "@/lib/db";
import { DEFAULT_PRIVACY_POLICY_HTML } from "@/lib/legal-content";
import "@/app/landing-v2.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Kebijakan Privasi — NADI",
    description: "Bagaimana NADI mengumpulkan, menggunakan, dan melindungi data pengguna platform riset dan publikasi kebijakan kesehatan.",
};

async function getPolicy(): Promise<{ html: string; updatedAt: string | null }> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value, updated_at FROM site_settings WHERE key = 'privacy_policy_html'`;
        if (rows.length > 0 && typeof rows[0].value === "string" && rows[0].value.trim().length > 0) {
            return {
                html: rows[0].value as string,
                updatedAt: rows[0].updated_at ? new Date(rows[0].updated_at as string).toISOString() : null,
            };
        }
    } catch {
        // fall through to default
    }
    return { html: DEFAULT_PRIVACY_POLICY_HTML, updatedAt: null };
}

export default async function PrivacyPolicyPage() {
    const { html, updatedAt } = await getPolicy();
    return (
        <V2PageLayout title="Kebijakan <em>Privasi</em>" eyebrow="Legal & Compliance">
            <LegalDocument
                title="Kebijakan Privasi"
                eyebrow="Privacy Policy"
                intro="Komitmen NADI terhadap pengelolaan data pengguna platform riset dan publikasi kebijakan kesehatan."
                updatedAt={updatedAt || undefined}
                html={html}
            />
        </V2PageLayout>
    );
}
