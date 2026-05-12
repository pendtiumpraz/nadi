"use client";

import { useState } from "react";

interface Props { isAdmin: boolean }

const TABS = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "roles", label: "Roles & Access", icon: "◐" },
    { id: "workflow", label: "Article Workflow", icon: "↻" },
    { id: "articles", label: "Articles & PDF", icon: "✎" },
    { id: "events", label: "Events", icon: "◈" },
    { id: "media", label: "Media", icon: "▶" },
    { id: "team", label: "Team", icon: "◉" },
    { id: "newsletter", label: "Newsletter", icon: "✉" },
    { id: "ai", label: "AI Writer", icon: "✦" },
    { id: "security", label: "Security", icon: "⛨" },
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
                {active === "roles" && <RolesDocs />}
                {active === "workflow" && <WorkflowDocs />}
                {active === "articles" && <ArticlesDocs />}
                {active === "events" && <EventsDocs />}
                {active === "media" && <MediaDocs />}
                {active === "team" && <TeamDocs />}
                {active === "newsletter" && <NewsletterDocs />}
                {active === "ai" && <AIDocs />}
                {active === "security" && <SecurityDocs />}
                {active === "settings" && <SettingsDocs />}
                {active === "users" && isAdmin && <UsersDocs />}
            </div>

            <div className="docs-footer">
                <p>NADI CMS Documentation — Last updated 12 May 2026</p>
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
                The Dashboard is the main landing page after login. It provides a high-level overview of the platform&apos;s status —
                including total published articles, active newsletter subscribers, and your role.
            </p>

            <h3>Dashboard Features</h3>
            <div className="docs-feature-list">
                <div className="docs-feature">
                    <div className="docs-feature-title">📊 Statistics</div>
                    <div className="docs-feature-desc">Total articles, active subscribers, and your role badge — admin, reviewer, contributor, or partner.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">⚡ Quick Actions</div>
                    <div className="docs-feature-desc">Shortcuts vary by role: partners see &quot;New Submission&quot;; reviewers/admins see &quot;Review Queue&quot;; admins also see User and Settings shortcuts.</div>
                </div>
                <div className="docs-feature">
                    <div className="docs-feature-title">📰 Latest Publication</div>
                    <div className="docs-feature-desc">Most recently published article with its metadata. Click to open.</div>
                </div>
            </div>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">💡 Sidebar items depend on your role</div>
                <p>If a menu item is missing, your role doesn&apos;t have access. See the <strong>Roles &amp; Access</strong> tab for the full matrix.</p>
            </div>
        </div>
    );
}

function RolesDocs() {
    return (
        <div className="docs-card">
            <h3>The Four Roles</h3>
            <p>
                NADI CMS has four roles. Each role determines which sidebar items appear and which actions are allowed in the article workflow.
            </p>

            <table className="docs-table">
                <thead>
                    <tr><th>Role</th><th>Access</th><th>Typical Use</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span className="docs-tag docs-tag--crimson">admin</span></td>
                        <td>Full access — every page and every action.</td>
                        <td>NADI core team. Manages users, settings, permissions, guidelines, consents, and the publish step of every article.</td>
                    </tr>
                    <tr>
                        <td><span className="docs-tag">reviewer</span></td>
                        <td>Review Queue, Articles, Comment threads. No user / settings / publish.</td>
                        <td>Internal QC. Reads incoming submissions, leaves comments, and approves or sends back.</td>
                    </tr>
                    <tr>
                        <td><span className="docs-tag">contributor</span></td>
                        <td>Own drafts, Articles list, comment threads on own articles.</td>
                        <td>NADI-affiliated writers who draft pieces directly inside the CMS.</td>
                    </tr>
                    <tr>
                        <td><span className="docs-tag">partner</span></td>
                        <td>Submit new article, view own submissions, fill consent form.</td>
                        <td>External partner organisations submitting Policy Products via the registration flow.</td>
                    </tr>
                </tbody>
            </table>

            <h3>Editing the Permissions Matrix</h3>
            <p>
                Admins can fine-tune which actions each role can perform at <code>/admin/permissions</code>. The matrix covers article actions
                (create, comment, approve, publish), settings access, and user management. Changes apply immediately — no redeploy needed.
            </p>

            <div className="docs-callout docs-callout--warning">
                <div className="docs-callout-title">⚠ Don&apos;t lock yourself out</div>
                <p>Removing the &quot;manage permissions&quot; flag from the admin role itself will require a database fix. The UI guards against this, but be careful.</p>
            </div>

            <h3>Test Seed Accounts</h3>
            <p>The platform ships with five seeded accounts for QA — all share the password <code>Nadi@2025!</code>:</p>
            <table className="docs-table">
                <thead>
                    <tr><th>Email</th><th>Role</th></tr>
                </thead>
                <tbody>
                    <tr><td><code>admin@nadi-health.id</code></td><td><span className="docs-tag docs-tag--crimson">admin</span></td></tr>
                    <tr><td><code>admin2@nadi-health.id</code></td><td><span className="docs-tag docs-tag--crimson">admin</span> (backup)</td></tr>
                    <tr><td><code>reviewer@nadi-health.id</code></td><td><span className="docs-tag">reviewer</span></td></tr>
                    <tr><td><code>contributor@nadi-health.id</code></td><td><span className="docs-tag">contributor</span></td></tr>
                    <tr><td><code>partner@nadi-health.id</code></td><td><span className="docs-tag">partner</span></td></tr>
                </tbody>
            </table>

            <div className="docs-callout docs-callout--warning">
                <div className="docs-callout-title">⚠ Change before going live</div>
                <p>Rotate or remove all seed passwords before the production cutover.</p>
            </div>
        </div>
    );
}

function WorkflowDocs() {
    return (
        <div className="docs-card">
            <h3>The 5-State Article Workflow</h3>
            <p>
                Every article moves through five states. Transitions fire email notifications and are recorded in the article&apos;s status history.
            </p>

            <div className="docs-tags" style={{ marginBottom: "0.75rem" }}>
                <span className="docs-tag docs-tag--muted">draft</span>
                <span className="docs-tag">in_review</span>
                <span className="docs-tag">approved</span>
                <span className="docs-tag">consent_received</span>
                <span className="docs-tag docs-tag--green">published</span>
            </div>

            <h3>End-to-End Flow</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div>
                        <strong>Partner registers &amp; gets activated.</strong> A partner self-registers at <code>/register</code>.
                        Admin then activates the account from <code>/admin/users</code> using the <strong>Pending</strong> filter chip.
                        The user receives an activation email with a login link.
                    </div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div>
                        <strong>Partner picks a Policy Product Type.</strong> On opening the editor, the partner selects one of:
                        <span className="docs-tag" style={{ marginLeft: "0.4rem" }}>Opinion Piece</span>{" "}
                        <span className="docs-tag">Policy Brief</span>{" "}
                        <span className="docs-tag">Policy Paper</span>.
                        The editor auto-fills the section scaffold (headings, prompts, word-count guidance) per the NADI Policy Product Guideline.
                    </div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div>
                        <strong>Partner fills the disclosure acks.</strong> Before submitting, the partner ticks the required
                        <strong> Authorship &amp; AI Disclosure</strong> acknowledgements. Submission is blocked until all are ticked.
                        State moves <code>draft → in_review</code>.
                    </div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">4</span>
                    <div>
                        <strong>Reviewer / admin runs QC.</strong> The article appears in <code>/admin/review</code> under the
                        <strong> Pending QC</strong> bucket. Reviewers post feedback in the <strong>comment thread</strong> on the article;
                        the partner sees a feedback-pending banner. When satisfied, the reviewer clicks <strong>Approve</strong>
                        — state moves <code>in_review → approved</code> and the partner is emailed a consent-form link.
                    </div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">5</span>
                    <div>
                        <strong>Partner fills the consent form.</strong> The partner opens the link, completes the consent-to-publish form
                        (declarations, authors table, signature image, signatory name &amp; date), and submits.
                        State moves <code>approved → consent_received</code>. See the <strong>Articles &amp; PDF</strong> tab for the consent-form spec.
                    </div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">6</span>
                    <div>
                        <strong>Admin publishes.</strong> The article now sits in the <strong>Ready-to-Publish</strong> bucket of <code>/admin/review</code>.
                        Admin clicks <strong>Publish</strong> — state moves <code>consent_received → published</code> and the article goes live on <code>/publications</code>.
                    </div>
                </div>
            </div>

            <h3>Comment Thread on Articles</h3>
            <p>
                Every in-progress article carries a comment thread. <strong>admin</strong> and <strong>reviewer</strong> can post on any article;
                <strong> contributor</strong> can post on their own articles. <strong>partner</strong> sees the thread read-only with a
                feedback-pending banner whenever a new reviewer comment is unread.
            </p>

            <h3>Resend Consent Link</h3>
            <p>
                If a partner loses the consent email, open the article from <code>/admin/review</code> and click
                <strong> &quot;Resend consent link&quot;</strong>. A fresh email is dispatched to the partner — no token regeneration needed on their side.
            </p>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">📧 Notifications fire at every milestone</div>
                <p>
                    Submitted, comment posted, approved, consent received, and published all dispatch emails to the relevant parties plus
                    the standing CC list (Amira / Widya / Soleh@inkemaris.com). Edit the CC list under <strong>Settings → Notifications</strong>.
                </p>
            </div>
        </div>
    );
}

function ArticlesDocs() {
    return (
        <div className="docs-card">
            <h3>Managing Publications</h3>
            <p>
                The <strong>Articles</strong> page is the central hub for managing all NADI publications. Each article supports a magazine-style
                layout, a Policy Product Type scaffold, an attached PDF, and a full comment / approval / consent chain
                (see the <strong>Article Workflow</strong> tab).
            </p>

            <h3>How to Create a New Article</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div><strong>Click &quot;+ New Article&quot;</strong> on the Articles page, or use the Quick Action shortcut from the Dashboard.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div>
                        <strong>Pick a Policy Product Type:</strong>{" "}
                        <span className="docs-tag">Opinion Piece</span>{" "}
                        <span className="docs-tag">Policy Brief</span>{" "}
                        <span className="docs-tag">Policy Paper</span>.
                        The editor auto-fills the matching section scaffold (headings, prompts, word-count guidance) from the NADI guideline.
                    </div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div><strong>Fill in metadata:</strong> Title, Subtitle, Category, Author, Read Time, and Cover Color.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">4</span>
                    <div><strong>Upload Cover Image</strong> (optional) — click or drag-and-drop. Max 5MB.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">5</span>
                    <div><strong>Upload PDF Document</strong> (optional) — full PDF version, max 20MB. Stored in Vercel Blob and rendered as an embedded viewer on the publication page.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">6</span>
                    <div><strong>Write your content</strong> using the rich-text editor. Follow the prompts in the scaffold.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">7</span>
                    <div><strong>SEO</strong> — fill in Description and Keywords. Leave blank to auto-generate.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">8</span>
                    <div>
                        <strong>Tick the Authorship &amp; AI Disclosure acks</strong> (required for partner submissions), then click
                        <strong> Save Draft</strong> or <strong>Submit for Review</strong>. Submitting moves the article to <code>in_review</code>.
                    </div>
                </div>
            </div>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">📄 About the PDF Feature</div>
                <p>When an article has an attached PDF, the publication page will display:</p>
                <ul>
                    <li><strong>&quot;📄 PDF&quot; badge</strong> in the publications list and article header.</li>
                    <li><strong>Embedded PDF viewer</strong> below the article content.</li>
                    <li><strong>&quot;Open in New Tab&quot; button</strong> for fullscreen reading or download.</li>
                </ul>
            </div>

            <h3>The Consent-to-Publish Form</h3>
            <p>
                After approval, the partner is emailed a link to the consent form (<code>/consent/[slug]</code>). The form has:
            </p>
            <ul>
                <li><strong>4 author declarations</strong> — interactive checkboxes the signatory must tick.</li>
                <li><strong>2 NADI terms</strong> — locked-acknowledged (always shown, always considered accepted on submit).</li>
                <li><strong>Dynamic authors table</strong> — add / remove rows for each co-author with name + affiliation.</li>
                <li><strong>Signature image upload</strong> — PNG / JPG of the wet or digital signature.</li>
                <li><strong>Signatory name and date</strong>.</li>
            </ul>
            <p>
                Submission moves the article to <code>consent_received</code>. Admins can view all submitted consents at
                <code> /admin/consents</code> and open any individual consent for full audit detail.
            </p>

            <h3>Available Categories</h3>
            <p>The category list now matches the canonical Policy Product Types from the NADI guideline:</p>
            <div className="docs-tags">
                <span className="docs-tag">POLICY BRIEF</span>
                <span className="docs-tag">POLICY PAPER</span>
                <span className="docs-tag">POLICY ANALYSIS</span>
                <span className="docs-tag">OPINION</span>
                <span className="docs-tag">RESEARCH NOTE</span>
            </div>
            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">ℹ Renamed categories</div>
                <p>
                    <strong>Working Paper</strong> has been renamed to <strong>Opinion</strong>, and
                    <strong> Strategic Analysis</strong> is now <strong>Policy Analysis</strong>. Existing articles were migrated automatically.
                </p>
            </div>

            <h3>Editing &amp; Deleting Articles</h3>
            <p>Each article has <strong>Edit</strong> and <strong>Delete</strong> buttons. Delete is permanent and cannot be undone.</p>

            <div className="docs-callout docs-callout--warning">
                <div className="docs-callout-title">⚠ Warning</div>
                <p>Deleting an article is <strong>permanent</strong> and cannot be undone — including its consent record and comment thread.</p>
            </div>

            <h3>Downloadable Policy Product Guideline</h3>
            <p>
                Admins upload the master guideline (PDF or DOCX) at <code>/admin/guidelines</code>. The latest upload is offered as a
                public download at <code>/policy-guideline</code> — useful to link partners to the source document before they start writing.
            </p>
        </div>
    );
}

function EventsDocs() {
    return (
        <div className="docs-card">
            <h3>Managing Events</h3>
            <p>The Events page allows you to add, edit, and delete events organised by NADI — seminars, webinars, conferences, and workshops.</p>

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
            <p>The Media page manages all NADI multimedia content — videos, podcasts, webinar recordings, interviews, panel discussions, and short-form social clips.</p>

            <h3>Supported Media Types</h3>
            <div className="docs-tags">
                <span className="docs-tag">🎬 Video</span>
                <span className="docs-tag">🎙️ Podcast</span>
                <span className="docs-tag">💻 Webinar</span>
                <span className="docs-tag">🎤 Interview</span>
                <span className="docs-tag">👥 Panel</span>
            </div>

            <h3>Supported Embed Sources</h3>
            <p>Media now supports embeds from multiple platforms — paste the share URL or embed URL and the viewer handles the rest:</p>
            <div className="docs-tags">
                <span className="docs-tag">YouTube</span>
                <span className="docs-tag">TikTok</span>
                <span className="docs-tag">Instagram</span>
                <span className="docs-tag">Instagram Reel</span>
                <span className="docs-tag">Spotify</span>
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
                    <div>Add <strong>Description, Speakers</strong>, and <strong>Keywords</strong> for SEO (comma-separated). Optional but recommended.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">4</span>
                    <div>Click <strong>Save</strong>.</div>
                </div>
            </div>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">💡 Embed URL Tips</div>
                <p>
                    YouTube: <code>https://www.youtube.com/embed/VIDEO_ID</code> or a regular watch URL<br />
                    TikTok: <code>https://www.tiktok.com/@user/video/VIDEO_ID</code><br />
                    Instagram: <code>https://www.instagram.com/p/POST_ID/</code> (post or Reel)<br />
                    Spotify: <code>https://open.spotify.com/embed/episode/EPISODE_ID</code>
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
                    <div><strong>Review &amp; Publish</strong> — edit if necessary, then save as a new article (the article still has to walk through the full review &amp; consent workflow).</div>
                </div>
            </div>

            <div className="docs-callout docs-callout--warning">
                <div className="docs-callout-title">⚠ Input cap &amp; per-user rate limit</div>
                <p>
                    Each AI request has a hard <strong>input character cap</strong> (configurable in Settings) — overlong prompts are rejected client-side and server-side.
                    Each authenticated user is also subject to a <strong>per-user rate limit</strong> on AI calls per minute / per day.
                    These guardrails prevent runaway costs and abuse.
                </p>
            </div>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">💡 Tips</div>
                <ul>
                    <li>More specific prompts yield more relevant results.</li>
                    <li>Always review AI output before publishing — verify facts and data.</li>
                    <li>If AI content is used substantively, the AI Disclosure ack on the article must reflect that.</li>
                    <li>AI Writer uses the DeepSeek API configured in <code>.env.local</code>.</li>
                </ul>
            </div>
        </div>
    );
}

function SecurityDocs() {
    return (
        <div className="docs-card">
            <h3>Login Throttling</h3>
            <p>
                The login endpoint progressively delays repeated failures from the same IP / username pair to defeat brute-force attempts.
                The default schedule (configurable in <strong>Settings → Security</strong>):
            </p>
            <table className="docs-table">
                <thead>
                    <tr><th>Failed attempts</th><th>Lockout</th></tr>
                </thead>
                <tbody>
                    <tr><td>3</td><td>30 seconds</td></tr>
                    <tr><td>5</td><td>5 minutes</td></tr>
                    <tr><td>10</td><td>1 hour</td></tr>
                </tbody>
            </table>
            <p>A successful login resets the counter. Lockouts are tracked server-side, so clearing cookies does not bypass them.</p>

            <h3>Upload Validation</h3>
            <p>
                All file uploads (cover images, article PDFs, signature images, guideline files) are passed through a hard MIME / extension blocklist.
                The following are <strong>always rejected</strong>:
            </p>
            <div className="docs-tags">
                <span className="docs-tag docs-tag--crimson">.php</span>
                <span className="docs-tag docs-tag--crimson">.svg</span>
                <span className="docs-tag docs-tag--crimson">.exe</span>
                <span className="docs-tag docs-tag--crimson">.bat</span>
                <span className="docs-tag docs-tag--crimson">.sh</span>
                <span className="docs-tag docs-tag--crimson">.html</span>
                <span className="docs-tag docs-tag--crimson">.js</span>
            </div>
            <p style={{ marginTop: "0.75rem" }}>
                The block also covers polyglot tricks (correct extension but executable MIME) and is enforced on the server — the client-side check is only a UX courtesy.
            </p>

            <h3>AI Guardrails</h3>
            <p>
                See the <strong>AI Writer</strong> tab for the input character cap and per-user rate limit. Both are enforced server-side and surface clear error messages.
            </p>

            <div className="docs-callout docs-callout--info">
                <div className="docs-callout-title">🔐 Where to tune limits</div>
                <p>Throttle thresholds, AI input cap, and AI rate limits are all editable under <strong>Settings → Security</strong>. No redeploy needed.</p>
            </div>
        </div>
    );
}

function SettingsDocs() {
    return (
        <div className="docs-card">
            <h3>Website Configuration</h3>
            <p>The Settings page is the single hub for global appearance, notifications, security thresholds, and the public privacy popup.</p>

            <h3>Landing Page Mode</h3>
            <div className="docs-feature-list">
                <div className="docs-feature">
                    <div className="docs-feature-title">🌓 V2 — Light Theme (New)</div>
                    <div className="docs-feature-desc">Modern light theme with ECG visualisation, team cards, and partner marquee.</div>
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

            <h3>Privacy Policy Popup</h3>
            <p>
                A Kumparan-style modal is shown to every public visitor on their first visit. The popup body (HTML) is editable in
                <strong> Settings → Privacy Popup</strong>. The modal is automatically suppressed on these routes:
            </p>
            <div className="docs-tags">
                <span className="docs-tag"><code>/admin</code></span>
                <span className="docs-tag"><code>/login</code></span>
                <span className="docs-tag"><code>/register</code></span>
                <span className="docs-tag"><code>/consent</code></span>
            </div>
            <p style={{ marginTop: "0.75rem" }}>
                Acceptance is stored in localStorage (<code>nadi_privacy_accepted</code>). To re-test, clear that key in DevTools.
            </p>

            <h3>Notifications &amp; CC List</h3>
            <p>
                Workflow emails (submitted, comment, approved, consent received, published) are dispatched automatically.
                A <strong>standing CC list</strong> is copied on every workflow email — by default
                <code> Amira</code>, <code>Widya</code>, and <code>Soleh@inkemaris.com</code>.
                Edit the list at <strong>Settings → Notifications</strong>; comma-separate multiple addresses.
            </p>

            <h3>Security Thresholds</h3>
            <p>
                Login throttle steps and AI guardrails (input cap, per-user rate limit) are configured at
                <strong> Settings → Security</strong>. See the <strong>Security</strong> tab for defaults.
            </p>

            <h3>Troubleshooting</h3>
            <div className="docs-faq">
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ New article doesn&apos;t appear on the public site</div>
                    <div className="docs-faq-a">An article only goes public once it reaches <code>published</code>. Check it&apos;s not stuck in <code>in_review</code>, <code>approved</code>, or <code>consent_received</code> on <code>/admin/review</code>.</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ Image / PDF upload fails</div>
                    <div className="docs-faq-a">Check file limits: <strong>images max 5MB, PDFs max 20MB</strong>. Also verify the extension isn&apos;t on the blocklist (see Security tab). Ensure <code>BLOB_READ_WRITE_TOKEN</code> is set.</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ Partner can&apos;t log in after registering</div>
                    <div className="docs-faq-a">Their account is still <strong>pending activation</strong>. Open <code>/admin/users</code>, switch to the <strong>Pending</strong> filter chip, and activate them.</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ Partner says they didn&apos;t get the consent email</div>
                    <div className="docs-faq-a">Open the article in <code>/admin/review</code> and click <strong>Resend consent link</strong>. Also verify the standing CC list / SMTP is correct.</div>
                </div>
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ I&apos;m locked out after too many login attempts</div>
                    <div className="docs-faq-a">Wait out the lockout (30s / 5min / 1hr depending on the count). Lockouts are server-side — clearing cookies will not bypass them.</div>
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
                <div className="docs-faq-item">
                    <div className="docs-faq-q">❓ Privacy popup keeps re-appearing</div>
                    <div className="docs-faq-a">The <code>nadi_privacy_accepted</code> key isn&apos;t persisting — check the visitor isn&apos;t in private/incognito mode and that no extension is wiping localStorage.</div>
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
            <p>
                Only accessible to users with the <strong>admin</strong> role. Add new users, activate pending registrations, change roles,
                update passwords, and remove users. The full role &amp; permissions matrix lives on the <strong>Roles &amp; Access</strong> tab.
            </p>

            <h3>Roles at a Glance</h3>
            <table className="docs-table">
                <thead>
                    <tr><th>Role</th><th>Access Level</th><th>Description</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td><span className="docs-tag docs-tag--crimson">admin</span></td>
                        <td>Full Access</td>
                        <td>Everything — including users, settings, permissions, guidelines, and the publish step.</td>
                    </tr>
                    <tr>
                        <td><span className="docs-tag">reviewer</span></td>
                        <td>Review &amp; Comment</td>
                        <td>Sees the Review Queue. Can comment and approve, but cannot publish or manage users.</td>
                    </tr>
                    <tr>
                        <td><span className="docs-tag">contributor</span></td>
                        <td>Author</td>
                        <td>Drafts articles inside the CMS. Limited to own content.</td>
                    </tr>
                    <tr>
                        <td><span className="docs-tag">partner</span></td>
                        <td>Submit only</td>
                        <td>External partner. Submits articles, fills the consent form, sees feedback on own submissions.</td>
                    </tr>
                </tbody>
            </table>
            <p>To fine-tune what each role can actually do, open <code>/admin/permissions</code>.</p>

            <h3>Registration &amp; Activation Flow</h3>
            <div className="docs-steps">
                <div className="docs-step">
                    <span className="docs-step-num">1</span>
                    <div><strong>Self-registration.</strong> Partners sign up themselves at <code>/register</code>. The account is created in <em>pending</em> state and cannot log in yet.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">2</span>
                    <div><strong>Admin activation.</strong> Open <code>/admin/users</code>, switch to the <strong>Pending</strong> filter chip, find the new account, and click <strong>Activate</strong>. Optionally adjust the role.</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">3</span>
                    <div><strong>Activation email.</strong> The user receives an automated email with a login link and is now able to sign in and submit content.</div>
                </div>
            </div>

            <h3>How to Add a User Manually</h3>
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
                    <div>Fill in <strong>Name, Email, Password</strong>, and select a <strong>Role</strong> (admin / reviewer / contributor / partner).</div>
                </div>
                <div className="docs-step">
                    <span className="docs-step-num">4</span>
                    <div>Click Save. Manually-created users are active immediately — no activation step needed.</div>
                </div>
            </div>

            <h3>Changing Password &amp; Role</h3>
            <p>
                Click <strong>&quot;Change Password&quot;</strong> to set a new password (min 6 chars). Click the <strong>role badge</strong> on a user row
                to cycle through admin / reviewer / contributor / partner.
            </p>

            <h3>Test Seed Accounts</h3>
            <p>The platform ships with five seeded accounts for QA — all share the password <code>Nadi@2025!</code>:</p>
            <ul>
                <li><code>admin@nadi-health.id</code> — admin</li>
                <li><code>admin2@nadi-health.id</code> — admin (backup)</li>
                <li><code>reviewer@nadi-health.id</code> — reviewer</li>
                <li><code>contributor@nadi-health.id</code> — contributor</li>
                <li><code>partner@nadi-health.id</code> — partner</li>
            </ul>

            <div className="docs-callout docs-callout--warning">
                <div className="docs-callout-title">⚠ Warning</div>
                <p>Never delete the last admin account! Always keep at least 1 active admin. Rotate the seed passwords before going to production.</p>
            </div>
        </div>
    );
}
