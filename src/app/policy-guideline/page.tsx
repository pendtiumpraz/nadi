import { Metadata } from "next";
import V2PageLayout from "@/components/V2PageLayout";
import { getDB } from "@/lib/db";
import "@/app/landing-v2.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Policy Product Guideline — NADI",
    description:
        "Download the canonical NADI guideline that defines policy product types, section structure, and word counts.",
};

async function getGuidelineUrl(): Promise<string> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'guideline_url'`;
        if (rows.length > 0 && typeof rows[0].value === "string") {
            return rows[0].value;
        }
        return "";
    } catch {
        return "";
    }
}

export default async function PolicyGuidelinePage() {
    const guidelineUrl = await getGuidelineUrl();
    const hasFile = guidelineUrl.trim().length > 0;

    return (
        <V2PageLayout
            title="Policy Product Guideline"
            eyebrow="Templates & Standards"
            subtitle="Download the canonical NADI guideline before writing your policy product."
        >
            <div
                style={{
                    maxWidth: 720,
                    margin: "0 auto",
                    padding: "1rem 0 3rem",
                }}
            >
                <p
                    style={{
                        fontSize: "1rem",
                        lineHeight: 1.65,
                        color: "#333",
                        marginBottom: "2rem",
                    }}
                >
                    The NADI Policy Product Guideline is the canonical reference for
                    every contributor writing a policy product on this platform.
                    Partners and authors must follow this guideline to ensure
                    consistency, quality, and editorial alignment with NADI&apos;s
                    standards.
                </p>

                <div
                    style={{
                        padding: "2rem",
                        background: "#fafafa",
                        border: "1px solid #E8E5E1",
                        borderRadius: 4,
                        textAlign: "center",
                        marginBottom: "1.5rem",
                    }}
                >
                    {hasFile ? (
                        <a
                            href={guidelineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: "inline-block",
                                padding: "14px 36px",
                                background: "#8B1C1C",
                                color: "#fff",
                                textDecoration: "none",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                borderRadius: 2,
                                transition: "opacity 0.2s",
                            }}
                        >
                            Download Guideline
                        </a>
                    ) : (
                        <p
                            style={{
                                color: "#888",
                                fontStyle: "italic",
                                margin: 0,
                                fontSize: "0.95rem",
                            }}
                        >
                            The guideline file has not been uploaded yet. Please
                            contact NADI.
                        </p>
                    )}
                </div>

                <p
                    style={{
                        fontSize: "0.85rem",
                        color: "#666",
                        lineHeight: 1.6,
                        textAlign: "center",
                        fontStyle: "italic",
                    }}
                >
                    The guideline defines three policy product types — Opinion Piece,
                    Policy Brief, and Policy Paper — and the section structure / word
                    counts for each.
                </p>
            </div>
        </V2PageLayout>
    );
}
