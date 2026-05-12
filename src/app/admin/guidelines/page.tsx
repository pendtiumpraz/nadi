import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canManageUsers } from "@/lib/permissions";
import { getDB } from "@/lib/db";
import GuidelineUploader from "@/components/GuidelineUploader";

export const dynamic = "force-dynamic";

async function getGuidelineUrl(): Promise<string> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'guideline_url'`;
        if (rows.length === 0) return "";
        return (rows[0].value as string) || "";
    } catch {
        return "";
    }
}

export default async function AdminGuidelinesPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");
    if (!canManageUsers(session.user)) redirect("/admin");

    const url = await getGuidelineUrl();

    return (
        <div className="admin-body">
            <h1 className="admin-page-title">Policy Product Guideline</h1>
            <p className="admin-page-desc">
                Upload the canonical PDF/DOCX. Replaces the previous version. Partners download from{" "}
                <code>/policy-guideline</code>.
            </p>

            <div className="editor" style={{ marginTop: "1.5rem" }}>
                <div className="editor-section">
                    <div className="editor-section-title">Current active file</div>
                    {url ? (
                        <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: "var(--crimson, #8B1C1C)", textDecoration: "underline" }}
                            >
                                Download current guideline
                            </a>
                            <span style={{ color: "var(--muted)", marginLeft: "0.5rem", fontSize: "0.78rem" }}>
                                ({url})
                            </span>
                        </p>
                    ) : (
                        <p style={{ fontStyle: "italic", color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                            No guideline uploaded yet.
                        </p>
                    )}
                </div>

                <div className="editor-section">
                    <div className="editor-section-title">Upload new version</div>
                    <p style={{ color: "var(--muted)", fontSize: "0.82rem", marginBottom: "1rem" }}>
                        Accepted formats: PDF or DOCX. Maximum size: 25&nbsp;MB. Uploading a new file immediately replaces
                        the URL partners download.
                    </p>
                    <GuidelineUploader currentUrl={url} />
                </div>
            </div>
        </div>
    );
}
