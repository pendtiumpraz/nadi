"use client";

import { useState } from "react";

interface Props { isAdmin: boolean }

const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "articles", label: "Articles & PDF", icon: "✎" },
    { id: "events", label: "Events", icon: "◈" },
    { id: "media", label: "Media", icon: "▶" },
    { id: "team", label: "Team", icon: "◉" },
    { id: "newsletter", label: "Newsletter", icon: "✉" },
    { id: "ai", label: "AI Writer", icon: "✦" },
    { id: "settings", label: "Settings", icon: "⚙" },
];

const ADMIN_TAB = { id: "users", label: "Users", icon: "⊕" };

export default function DocsClient({ isAdmin }: Props) {
    const tabs = isAdmin ? [...TABS, ADMIN_TAB] : TABS;
    const [active, setActive] = useState("dashboard");

    return (
        <div className="admin-content admin-content--wide">
            <div className="admin-content-header" style={{ marginBottom: "1.5rem" }}>
                <div>
                    <h1 className="admin-page-title">Documentation</h1>
                    <p className="admin-page-desc">Complete guide to all NADI CMS features — usage, tips, and troubleshooting.</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="docs-tabs">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        className={`docs-tab${active === t.id ? " docs-tab--active" : ""}${t.id === "users" ? " docs-tab--admin" : ""}`}
                        onClick={() => setActive(t.id)}
                    >
                        <span className="docs-tab-icon">{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="docs-panel">
                {active === "dashboard" && <DashboardDocs />}
                {active === "articles" && <ArticlesDocs />}
                {active === "events" && <EventsDocs />}
                {active === "media" && <MediaDocs />}
                {active === "team" && <TeamDocs />}
                {active === "newsletter" && <NewsletterDocs />}
                {active === "ai" && <AIDocs />}
                {active === "settings" && <SettingsDocs />}
                {active === "users" && isAdmin && <UsersDocs />}
            </div>

            <div className="docs-footer">
                <p>NADI CMS Documentation — Last updated April 2026</p>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════ */
/* INDIVIDUAL TAB CONTENT COMPONENTS          */
/* ═══════════════════════════════════════════ */

function DashboardDocs() {
    return (
        <div className="docs-card">
            <h3>What is the Dashboard?</h3>
            <p>
                The Dashboard is the main landing page after login. It provides a high-level overview of the website&apos;s status —
                including total published articles, active newsletter subscribers, and your access level.
            </p>

            <h3>Dashboard Features</h3>
            <div className="docs-feature-list">
                <div className="docs-feature">
                    <div className="docs-feature-title">📊 Statistics</div>
                    <div className="docs-feature-desc">Displays total articles, active subscribers, and your access level (Full for admin, Write for editor).</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">⚡ Quick Actions</div>
                    <div className="docs-feature-desc">Shortcut buttons to create a new article, view subscriber list, manage users (admin only), and open the public website.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">📰 Latest Publication</div>
                    <div className="docs-feature-desc">Shows the most recently published article with its metadata. Click to edit directly.</div>
                </div>
            </div>
        </div>
    );
}

function ArticlesDocs() {
    return (
        <div className="docs-card">
            <h3>Managing Publications</h3>
            <p>
                The <strong>Articles</strong> page is the central hub for managing all NADI publications — from Policy Briefs, Research Papers,
                Strategic Analyses, to Working Papers. Each article supports an elegant magazine-style layout format.
            </p>

            <h3>How to Create a New Article</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div><strong>Click &quot;+ New Article&quot;</strong> on the Articles page, or use the Quick Action shortcut from the Dashboard.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div><strong>Fill in article metadata:</strong> Title, Subtitle, Category, Author, Read Time, and Cover Color.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div><strong>Upload Cover Image</strong> (optional) — click or drag-and-drop an image. Max 5MB.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">4</span>
                    <div><strong>Upload PDF Document</strong> (optional) — if the article has a full PDF version. Max 20MB. Stored in Vercel Blob and displayed as an embedded viewer on the publication page.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">5</span>
                    <div><strong>Write your content</strong> — use the rich text editor with toolbar for formatting.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">6</span>
                    <div><strong>SEO</strong> — fill in Description and Keywords. Leave blank to auto-generate.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">7</span>
                    <div><strong>Save</strong> — click &quot;Save Article&quot;. It will immediately appear on /publications.</div>
                </div>
            </div>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">📄 About the PDF Feature</div>
                <p>When an article has an attached PDF, the publication page will display:</p>
                <ul>
                    <li><strong>&quot;📄 PDF&quot; badge</strong> in the publications list and article header.</li>
                    <li><strong>Embedded PDF Viewer</strong> below the article content.</li>
                    <li><strong>&quot;Open in New Tab&quot; button</strong> for fullscreen reading or download.</li>
                </ul>
            </div>

            <h3>Editing &amp; Deleting Articles</h3>
            <p>Each article has <strong>Edit</strong> and <strong>Delete</strong> buttons. Delete is permanent and cannot be undone.</p>

            <div className="docs-callout docs-callout--warning">
                <div className="docs-callout-title">⚠ Warning</div>
                <p>Deleting an article is <strong>permanent</strong> and cannot be undone.</p>
            </div>

            <h3>Available Categories</h3>
            <div className="docs-tags">
                <span className="docs-tag">POLICY BRIEF</span>
                <span className="docs-tag">RESEARCH PAPER</span>
                <span className="docs-tag">STRATEGIC ANALYSIS</span>
                <span className="docs-tag">WORKING PAPER</span>
                <span className="docs-tag">RESEARCH NOTE</span>
            </div>
        </div>
    );
}

function EventsDocs() {
    return (
        <div className="docs-card">
            <h3>Managing Events</h3>
            <p>The Events page allows you to add, edit, and delete events organized by NADI — seminars, webinars, conferences, and workshops.</p>

            <h3>How to Add an Event</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div>Click <strong>&quot;+ New Event&quot;</strong> on the Events page.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div>Fill in all fields: <strong>Title, Date, Location, Location Type</strong> (online/offline), <strong>Category, Status</strong> (upcoming/completed), and <strong>Description</strong>.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div>Upload an event image if available, then click <strong>Save</strong>.</div>
                </div>
            </div>

            <h3>Event Status</h3>
            <div className="docs-tags">
                <span className="docs-tag docs-tag--green">Upcoming</span>
                <span className="docs-tag docs-tag--muted">Completed</span>
            </div>
            <p style={{ marginTop: "0.75rem" }}>
                Events with <strong>Upcoming</strong> status are displayed prominently on the public /events page. Once finished, change the status to <strong>Completed</strong>.
            </p>
        </div>
    );
}

function MediaDocs() {
    return (
        <div className="docs-card">
            <h3>Managing Media Content</h3>
            <p>The Media page manages all NADI multimedia content — videos, podcasts, webinar recordings, interviews, and panel discussions.</p>

            <h3>Supported Media Types</h3>
            <div className="docs-tags">
                <span className="docs-tag">🎬 Video</span>
                <span className="docs-tag">🎙️ Podcast</span>
                <span className="docs-tag">💻 Webinar</span>
                <span className="docs-tag">🎤 Interview</span>
                <span className="docs-tag">👥 Panel</span>
            </div>

            <h3>How to Add Media</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div>Click <strong>&quot;+ New Media&quot;</strong>.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div>Fill in <strong>Title, Type, Category, Date, Duration</strong>, and <strong>Embed URL</strong>.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div>Add <strong>Description &amp; Speakers</strong> (optional), then <strong>Save</strong>.</div>
                </div>
            </div>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">💡 Embed URL Tips</div>
                <p>
                    For YouTube: <code>https://www.youtube.com/embed/VIDEO_ID</code><br />
                    For Spotify: <code>https://open.spotify.com/embed/episode/EPISODE_ID</code>
                </p>
            </div>
        </div>
    );
}

function TeamDocs() {
    return (
        <div className="docs-card">
            <h3>Managing Team Members</h3>
            <p>The Team page allows you to add, edit, reorder, and remove team members displayed on the website.</p>

            <h3>Available Fields</h3>
            <div className="docs-feature-list">
                <div className="docs-feature">
                    <div className="docs-feature-title">👤 Full Name &amp; Title</div>
                    <div className="docs-feature-desc">Full name and role/position (e.g., &quot;Co-founder &amp; Partner&quot;).</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">🔤 Initials</div>
                    <div className="docs-feature-desc">1-2 letter abbreviation displayed as an avatar when no photo is provided (e.g., &quot;WB&quot;).</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">📝 Bio</div>
                    <div className="docs-feature-desc">A brief description of the team member&apos;s background and expertise.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">🔗 LinkedIn URL &amp; Photo URL</div>
                    <div className="docs-feature-desc">Optional — LinkedIn profile link and profile photo URL.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">📌 Display Order &amp; Featured</div>
                    <div className="docs-feature-desc">Order number controls display sequence (lower = higher). &quot;Featured&quot; checkbox: Featured = Homepage + Team page. Non-featured = Team page only.</div>
                </div>
            </div>
        </div>
    );
}

function NewsletterDocs() {
    return (
        <div className="docs-card">
            <h3>Newsletter System</h3>
            <p>
                Visitors can subscribe by entering their email on the Landing Page. No registration or login required.
                The system includes multi-layered anti-spam protection.
            </p>

            <h3>Anti-Spam Protection</h3>
            <div className="docs-feature-list">
                <div className="docs-feature">
                    <div className="docs-feature-title">🔒 IP Rate Limiting</div>
                    <div className="docs-feature-desc">Each IP address can only subscribe once. Duplicate IPs with different emails are rejected server-side.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">💾 Local Storage Protection</div>
                    <div className="docs-feature-desc">After subscribing, the state is saved in the browser. The form is auto-disabled on revisit.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">📧 Duplicate Email Check</div>
                    <div className="docs-feature-desc">If the same email is re-entered, the system rejects it with an &quot;already subscribed&quot; message.</div>
                </div>
            </div>

            <h3>Managing Subscribers (CMS)</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div>Open <strong>Newsletter</strong> in the sidebar to see the full <strong>subscriber list</strong> with status and subscription date.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div><strong>Search &amp; Filter</strong> — search by email. Filter by Active Only, Inactive Only, or All.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div><strong>Activate / Deactivate</strong> — toggle status. Deactivated subscribers won&apos;t receive broadcasts.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">4</span>
                    <div><strong>Remove</strong> — permanently delete a subscriber from the database.</div>
                </div>
            </div>

            <h3>Export CSV</h3>
            <p>Click <strong>&quot;📥 Export CSV&quot;</strong> to download the subscriber list. Import into Mailchimp, Brevo, or MailerLite for professional email blasts.</p>

            <h3>Send Email Broadcast (via Gmail)</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div>Click <strong>&quot;✉️ Kirim Broadcast&quot;</strong> on the Newsletter page.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div>Fill in the <strong>Subject</strong> and <strong>Email Body</strong> (HTML is supported).</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div>Click <strong>&quot;Send Broadcast&quot;</strong>. Emails are sent to all active subscribers via Gmail SMTP using BCC.</div>
                </div>
            </div>

            <div className="docs-callout docs-callout--warning">
                <div className="docs-callout-title">⚠ Gmail Sending Limits</div>
                <p>Gmail limits: ~<strong>500/day</strong> (standard) or ~<strong>2,000/day</strong> (Workspace). For larger lists, use Mailchimp or Brevo.</p>
            </div>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">💡 Broadcast Tips</div>
                <ul>
                    <li>Write compelling subject lines for higher open rates.</li>
                    <li>Include links to latest articles in the body.</li>
                    <li>Send consistently (e.g., weekly on Fridays).</li>
                    <li>Body supports HTML: <code>&lt;b&gt;</code>, <code>&lt;br&gt;</code>, <code>&lt;a href=&quot;...&quot;&gt;</code>.</li>
                </ul>
            </div>
        </div>
    );
}

function AIDocs() {
    return (
        <div className="docs-card">
            <h3>What is AI Writer?</h3>
            <p>
                AI Writer uses <strong>DeepSeek AI</strong> to generate topics and full article content automatically.
                Output is structured JSON ready for magazine-style layout blocks.
            </p>

            <h3>How to Use</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div><strong>Generate Topics</strong> — enter a theme (e.g., &quot;generic drug policy&quot;). AI produces several topic suggestions.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div><strong>Select a topic</strong> — click one of the generated topics.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div><strong>Generate Article</strong> — AI writes a complete article with layout blocks, SEO description, and keywords.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">4</span>
                    <div><strong>Review &amp; Publish</strong> — edit if necessary, then save as a new article.</div>
                </div>
            </div>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">💡 Tips</div>
                <ul>
                    <li>More specific prompts yield more relevant results.</li>
                    <li>Always review AI output before publishing — verify facts and data.</li>
                    <li>AI Writer uses the DeepSeek API configured in <code>.env.local</code>.</li>
                </ul>
            </div>
        </div>
    );
}

function SettingsDocs() {
    return (
        <div className="docs-card">
            <h3>Website Configuration</h3>
            <p>The Settings page lets you configure the global appearance of the website.</p>

            <h3>Landing Page Mode</h3>
            <div className="docs-feature-list">
                <div className="docs-feature">
                    <div className="docs-feature-title">🌓 V2 — Light Theme (New)</div>
                    <div className="docs-feature-desc">Modern light theme with ECG visualization, team cards, and partner marquee.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">🌑 V1 — Dark Theme (Original)</div>
                    <div className="docs-feature-desc">Original dark corporate design with gradient backgrounds.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">🚧 Under Development</div>
                    <div className="docs-feature-desc">Maintenance / coming soon page — useful during major updates.</div>
                </div>
            </div>

            <h3>Admin Panel Theme</h3>
            <p>Choose <strong>Dark</strong> (default) or <strong>Light V2</strong> (crimson topbar, white sidebar). Refresh the page after changing.</p>

            <h3>Troubleshooting</h3>
            <div className="docs-faq">
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ New article doesn&apos;t appear on the public site</div>
                    <div className="docs-faq-a">Make sure you pressed <strong>&quot;Save Article&quot;</strong>. Try hard refresh (Ctrl + Shift + R).</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ Image / PDF upload fails</div>
                    <div className="docs-faq-a">Check file limits: <strong>images max 5MB, PDFs max 20MB</strong>. Ensure <code>BLOB_READ_WRITE_TOKEN</code> is set.</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ Email broadcast fails</div>
                    <div className="docs-faq-a">Verify <code>SMTP_USER</code>, <code>SMTP_PASS</code> (App Password), and <code>SMTP_FROM</code> in <code>.env.local</code>. Google requires 2-Step Verification for App Passwords.</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ &quot;Application error: server-side exception&quot;</div>
                    <div className="docs-faq-a">Database tables may not be migrated. Open <code>/api/db/migrate</code> in your browser. Ensure <code>DATABASE_URL</code> is correct.</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ PDF viewer doesn&apos;t appear</div>
                    <div className="docs-faq-a">Only shows if a PDF was uploaded. Check for <strong>&quot;✓ PDF uploaded!&quot;</strong> in the editor before saving.</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ Subscribe form is disabled</div>
                    <div className="docs-faq-a">The user previously subscribed (localStorage). For testing: DevTools → Application → Local Storage → delete <code>nadi_subscribed</code>.</div>
                </div>
            </div>
        </div>
    );
}

function UsersDocs() {
    return (
        <div className="docs-card">
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <h3 style={{ paddingTop: 0, margin: 0 }}>Managing Users</h3>
                <span className="docs-admin-badge">Admin Only</span>
            </div>
            <p>Only accessible to users with the <strong>admin</strong> role. Add new users, change roles, update passwords, and remove users.</p>

            <h3>Roles &amp; Permissions</h3>
            <table className="docs-table">
                <thead>
                    <tr><th>Role</th><th>Access Level</th><th>Description</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span className="docs-tag docs-tag--crimson">admin</span></td>
                        <td>Full Access</td>
                        <td>Everything — including user management and settings.</td>
                    </tr>
                    <tr>
                        <td><span className="docs-tag">editor</span></td>
                        <td>Write Access</td>
                        <td>Create/edit articles, events, media, team, newsletter. No user management.</td>
                    </tr>
                </tbody>
            </table>

            <h3>How to Add a New User</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div>Open <strong>Users</strong> in the sidebar (admin only).</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div>Click <strong>&quot;+ Add User&quot;</strong>.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div>Fill in <strong>Name, Email, Password</strong>, and select a <strong>Role</strong>.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">4</span>
                    <div>Click Save. The user can immediately log in.</div>
                </div>
            </div>

            <h3>Changing Password &amp; Role</h3>
            <p>Click <strong>&quot;Change Password&quot;</strong> to set a new password (min 6 chars). Click the <strong>role badge</strong> to toggle between admin and editor.</p>

            <div className="docs-callout docs-callout--warning">
                <div className="docs-callout-title">⚠ Warning</div>
                <p>Never delete the last admin account! Always keep at least 1 active admin. If none exist, you must manually reset via the database.</p>
            </div>
        </div>
    );
}
