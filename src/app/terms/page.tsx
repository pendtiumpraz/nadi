import { Metadata } from "next";
import V2PageLayout from "@/components/V2PageLayout";
import LegalDocument from "@/components/LegalDocument";
import { getDB } from "@/lib/db";
import { DEFAULT_TERMS_OF_SERVICE_HTML } from "@/lib/legal-content";
import "@/app/landing-v2.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Ketentuan Penggunaan Layanan — NADI",
    description: "Ketentuan dan syarat penggunaan platform NADI untuk kontributor, partner, reviewer, dan pengunjung umum.",
};

async function getTerms(): Promise<{ html: string; updatedAt: string | null }> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value, updated_at FROM site_settings WHERE key = 'terms_of_service_html'`;
        if (rows.length > 0 && typeof rows[0].value === "string" && rows[0].value.trim().length > 0) {
            return {
                html: rows[0].value as string,
                updatedAt: rows[0].updated_at ? new Date(rows[0].updated_at as string).toISOString() : null,
            };
        }
    } catch {
        // fall through to default
    }
    return { html: DEFAULT_TERMS_OF_SERVICE_HTML, updatedAt: null };
}

export default async function TermsPage() {
    const { html, updatedAt } = await getTerms();
    return (
        <V2PageLayout title="Ketentuan <em>Penggunaan</em>" eyebrow="Terms of Service">
            <LegalDocument
                title="Ketentuan Penggunaan Layanan"
                eyebrow="Terms of Service"
                intro="Syarat dan ketentuan yang mengatur penggunaan platform NADI oleh pengunjung, kontributor, dan partner."
                updatedAt={updatedAt || undefined}
                html={html}
            />
        </V2PageLayout>
    );
}
