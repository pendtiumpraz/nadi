import nodemailer from "nodemailer";
import { getDB } from "@/lib/db";

export interface CCRecipient {
    name: string;
    email: string;
}

export type NotifyEvent =
    | "user_signup"
    | "user_registration_received"
    | "user_activated"
    | "password_reset_request"
    | "article_submitted"
    | "article_approved"
    | "article_changes_requested"
    | "feedback_received"
    | "author_reply"
    | "submission_received"
    | "consent_received"
    | "article_published";

interface NotifyPayload {
    actorName?: string;       // who triggered the event
    actorEmail?: string;
    targetName?: string;      // user being acted on / content title
    targetEmail?: string;
    title?: string;           // content title
    slug?: string;
    notes?: string;           // reviewer notes when requesting changes
    url?: string;             // optional CTA URL
}

const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@nadi-health.id";

// Read editable CC list from site_settings.notification_cc.
// Falls back to the standing list (Amira / Widyaretna / Soleh) if missing.
export async function getNotificationCC(): Promise<CCRecipient[]> {
    const fallback: CCRecipient[] = [
        { name: "Amira", email: "amira.hn@inkemaris.com" },
        { name: "Widyaretna Buenastuti", email: "widyaretna.buenastuti@inkemaris.com" },
        { name: "Soleh Ayubi", email: "soleh.ayubi@inkemaris.com" },
    ];
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'notification_cc'`;
        if (rows.length === 0) return fallback;
        const parsed = JSON.parse(rows[0].value as string) as CCRecipient[];
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
    } catch {
        return fallback;
    }
}

async function getEmailsByRole(role: "admin" | "reviewer"): Promise<string[]> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT email FROM users WHERE role = ${role} AND status = 'active'`;
        return rows.map((r) => r.email as string).filter(Boolean);
    } catch {
        return [];
    }
}

function ccHeader(list: CCRecipient[]): string {
    return list.map((c) => (c.name ? `"${c.name}" <${c.email}>` : c.email)).join(", ");
}

function transporter() {
    if (!process.env.SMTP_HOST && !process.env.SMTP_USER) return null;
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

interface RenderedEmail {
    subject: string;
    html: string;
    text: string;
}

function render(event: NotifyEvent, p: NotifyPayload): RenderedEmail {
    const wrap = (heading: string, body: string, cta?: { label: string; href: string }) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 32px;">
  <div style="background: #2C2C2C; padding: 24px 32px; margin: -32px -32px 32px;">
    <h1 style="font-family: Georgia, serif; color: #fff; font-size: 1.4rem; font-weight: 400; letter-spacing: 0.15em; margin: 0;">NADI</h1>
    <p style="color: #C08080; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase; margin: 4px 0 0;">${heading}</p>
  </div>
  <div style="color:#2C2C2C; font-size: 0.95rem; line-height: 1.7;">${body}</div>
  ${cta ? `<p style="margin-top: 24px;"><a href="${cta.href}" style="display:inline-block;background:#8B1C1C;color:#fff;padding:10px 22px;text-decoration:none;border-radius:4px;font-size:0.85rem;letter-spacing:0.05em;">${cta.label}</a></p>` : ""}
  <div style="text-align:center;color:#999;font-size:0.75rem;padding-top:24px;margin-top:32px;border-top:1px solid #eee;">NADI — Network for Advancing Development &amp; Innovation in Health</div>
</div>`;

    switch (event) {
        case "user_signup":
            return {
                subject: `New contributor signup: ${p.targetName || p.targetEmail}`,
                html: wrap(
                    "New Account Pending",
                    `<p>A new contributor account has been requested:</p>
                     <p><strong>${p.targetName || "—"}</strong><br/><a href="mailto:${p.targetEmail}" style="color:#8B1C1C;">${p.targetEmail}</a></p>
                     <p>Activate or reject from the admin Users page.</p>`,
                    p.url ? { label: "Open Admin → Users", href: p.url } : undefined
                ),
                text: `New contributor signup: ${p.targetName} <${p.targetEmail}>. Activate at ${p.url || "/admin/users"}.`,
            };
        case "user_activated":
            return {
                subject: "Your NADI account is now active",
                html: wrap(
                    "Account Activated",
                    `<p>Hi ${p.targetName || ""},</p>
                     <p>Your NADI contributor account has been activated. You can now sign in and start submitting content for review.</p>`,
                    p.url ? { label: "Sign in", href: p.url } : undefined
                ),
                text: `Your NADI account is now active. Sign in at ${p.url || "/login"}.`,
            };
        case "user_registration_received":
            return {
                subject: "We've received your NADI registration",
                html: wrap(
                    "Registration Received",
                    `<p>Hi ${p.targetName || ""},</p>
                     <p>Thank you for signing up for a NADI contributor account. Your request is now pending admin review — you'll receive a follow-up email once your account is activated and ready to sign in.</p>
                     <p style="color:#6B6B6B;font-size:0.82rem;">Activation typically happens within 1–2 business days. No action is required from you in the meantime.</p>`
                ),
                text: `Hi ${p.targetName || ""}, thank you for signing up for a NADI contributor account. Your request is pending admin review and you'll be notified by email once activated.`,
            };
        case "password_reset_request":
            return {
                subject: "Reset your NADI password",
                html: wrap(
                    "Password Reset",
                    `<p>Hi ${p.targetName || ""},</p>
                     <p>We received a request to reset the password for your NADI account. Click the button below to choose a new password — the link is valid for <strong>1 hour</strong>.</p>
                     <p style="color:#6B6B6B;font-size:0.82rem;">If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
                    p.url ? { label: "Reset password", href: p.url } : undefined
                ),
                text: `Reset your NADI password (valid 1 hour): ${p.url || ""}. Ignore this email if you didn't request the reset.`,
            };
        case "article_submitted":
            return {
                subject: `Article submitted for review: ${p.title}`,
                html: wrap(
                    "Article Submitted",
                    `<p><strong>${p.actorName || "A contributor"}</strong> submitted <em>${p.title}</em> for review.</p>
                     <p>Open the review queue to approve or send it back with notes.</p>`,
                    p.url ? { label: "Open Review Queue", href: p.url } : undefined
                ),
                text: `${p.actorName || "A contributor"} submitted "${p.title}" for review. ${p.url || ""}`,
            };
        case "article_approved":
            return {
                subject: `Your work has been approved: ${p.title}`,
                html: wrap(
                    "Approved — Consent Required",
                    `<p>Your work <strong>${p.title}</strong> has been approved. Please kindly complete and submit the consent form for publication.</p>`,
                    p.url ? { label: "Open Consent Form", href: p.url } : undefined
                ),
                text: `Your work "${p.title}" has been approved. Please kindly complete and submit the consent form for publication. ${p.url || ""}`,
            };
        case "consent_received":
            return {
                subject: `Consent received: ${p.title}`,
                html: wrap(
                    "Consent Form Submitted",
                    `<p>The consent-to-publish form has been submitted for <strong>${p.title}</strong>.</p>
                     <p>Signed by: <strong>${p.actorName || "—"}</strong></p>
                     <p>The article is now ready to publish — open the admin article page and click <em>Publish</em>.</p>`,
                    p.url ? { label: "Open Article", href: p.url } : undefined
                ),
                text: `Consent received for "${p.title}" signed by ${p.actorName || "—"}. Ready to publish. ${p.url || ""}`,
            };
        case "article_published":
            return {
                subject: `Your article is now live: ${p.title}`,
                html: wrap(
                    "Article Published",
                    `<p>Your article <strong>${p.title}</strong> is now live on the NADI publications page.</p>`,
                    p.url ? { label: "View Article", href: p.url } : undefined
                ),
                text: `Your article "${p.title}" is now live. ${p.url || ""}`,
            };
        case "article_changes_requested":
            return {
                subject: `Changes requested: ${p.title}`,
                html: wrap(
                    "Changes Requested",
                    `<p>Your article <strong>${p.title}</strong> needs revisions before it can be published.</p>
                     ${p.notes ? `<div style="background:#fff;border-left:3px solid #8B1C1C;padding:16px 20px;margin:16px 0;"><p style="color:#6B6B6B;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Reviewer Notes</p><p style="margin:0;white-space:pre-wrap;">${p.notes}</p></div>` : ""}
                     <p>Edit and resubmit when ready.</p>`,
                    p.url ? { label: "Edit Article", href: p.url } : undefined
                ),
                text: `Changes requested on "${p.title}". Notes: ${p.notes || "(none)"}. Edit at ${p.url || ""}.`,
            };
        case "feedback_received":
            return {
                subject: p.title ? `New comment on: ${p.title}` : "Your work has been reviewed",
                html: wrap(
                    "Feedback Received",
                    `<p>${p.actorName ? `<strong>${p.actorName}</strong> posted` : "A reviewer posted"} a comment on your work${p.title ? ` <strong>${p.title}</strong>` : ""}.</p>
                     ${p.notes ? `<div style="background:#fff;border-left:3px solid #8B1C1C;padding:16px 20px;margin:16px 0;"><p style="color:#6B6B6B;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Comment</p><p style="margin:0;white-space:pre-wrap;">${p.notes}</p></div>` : ""}
                     <p style="color:#6B6B6B;font-size:0.85rem;">Open the article in the CMS to read the full thread and reply.</p>`,
                    p.url ? { label: "Open Article", href: p.url } : undefined
                ),
                text: `${p.actorName || "A reviewer"} posted a comment${p.title ? ` on "${p.title}"` : ""}.${p.notes ? `\n\nComment:\n${p.notes}\n` : ""}${p.url ? `\nOpen: ${p.url}` : ""}`,
            };
        case "author_reply":
            return {
                subject: p.title ? `Author replied on: ${p.title}` : "Author replied to feedback",
                html: wrap(
                    "Author Reply",
                    `<p>${p.actorName ? `<strong>${p.actorName}</strong>` : "The author"} replied on the comment thread${p.title ? ` for <strong>${p.title}</strong>` : ""}.</p>
                     ${p.notes ? `<div style="background:#fff;border-left:3px solid #8B1C1C;padding:16px 20px;margin:16px 0;"><p style="color:#6B6B6B;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Reply</p><p style="margin:0;white-space:pre-wrap;">${p.notes}</p></div>` : ""}
                     <p style="color:#6B6B6B;font-size:0.85rem;">Open the article in the CMS to see the full thread and respond.</p>`,
                    p.url ? { label: "Open Article", href: p.url } : undefined
                ),
                text: `${p.actorName || "The author"} replied${p.title ? ` on "${p.title}"` : ""}.${p.notes ? `\n\nReply:\n${p.notes}\n` : ""}${p.url ? `\nOpen: ${p.url}` : ""}`,
            };
        case "submission_received":
            return {
                subject: "We've received your submission",
                html: wrap(
                    "Submission Received",
                    `<p>Thank you for submitting your work. We will review your work and get back to you in <strong>${p.notes}</strong> days.</p>
                     <p>Title: <em>${p.title || ""}</em></p>`,
                    p.url ? { label: "View your submission", href: p.url } : undefined,
                ),
                text: `Thank you for submitting your work. We will review your work and get back to you in ${p.notes} days. Title: "${p.title}". ${p.url || ""}`,
            };
    }
}

interface SendArgs {
    event: NotifyEvent;
    to: string | string[];
    cc?: CCRecipient[];
    payload: NotifyPayload;
}

async function send({ event, to, cc, payload }: SendArgs): Promise<void> {
    const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
    if (recipients.length === 0) return;

    const t = transporter();
    const { subject, html, text } = render(event, payload);

    if (!t) {
        // SMTP not configured — log instead so dev mode still works
        console.log(`[notify:${event}] to=${recipients.join(",")} cc=${cc?.map((c) => c.email).join(",") || "—"} subject="${subject}"`);
        return;
    }

    try {
        await t.sendMail({
            from: SMTP_FROM,
            to: recipients.join(", "),
            cc: cc && cc.length > 0 ? ccHeader(cc) : undefined,
            subject,
            html,
            text,
        });
    } catch (err) {
        console.error(`[notify:${event}] send failed:`, (err as Error).message);
    }
}

// ────────────────────────────────────────────────────────────────────
// High-level helpers used by API routes. Each is fire-and-forget —
// callers SHOULD NOT await, but it's safe to since failures are swallowed.
// ────────────────────────────────────────────────────────────────────

export async function notifyUserSignup(payload: { name: string; email: string; baseUrl?: string }): Promise<void> {
    const admins = await getEmailsByRole("admin");
    const cc = await getNotificationCC();
    await send({
        event: "user_signup",
        to: admins,
        cc,
        payload: {
            targetName: payload.name,
            targetEmail: payload.email,
            url: payload.baseUrl ? `${payload.baseUrl}/admin/users` : undefined,
        },
    });
}

export async function notifyUserActivated(payload: { name: string; email: string; baseUrl?: string }): Promise<void> {
    await send({
        event: "user_activated",
        to: payload.email,
        payload: {
            targetName: payload.name,
            url: payload.baseUrl ? `${payload.baseUrl}/login` : undefined,
        },
    });
}

export async function notifyRegistrationReceived(payload: { name: string; email: string }): Promise<void> {
    await send({
        event: "user_registration_received",
        to: payload.email,
        payload: { targetName: payload.name, targetEmail: payload.email },
    });
}

export async function notifyPasswordResetRequest(payload: { name: string; email: string; resetUrl: string }): Promise<void> {
    await send({
        event: "password_reset_request",
        to: payload.email,
        payload: { targetName: payload.name, targetEmail: payload.email, url: payload.resetUrl },
    });
}

export async function notifyArticleSubmitted(payload: { title: string; slug: string; actorName: string; baseUrl?: string }): Promise<void> {
    const reviewers = await getEmailsByRole("reviewer");
    const admins = await getEmailsByRole("admin");
    const cc = await getNotificationCC();
    await send({
        event: "article_submitted",
        to: [...new Set([...reviewers, ...admins])],
        cc,
        payload: {
            title: payload.title,
            slug: payload.slug,
            actorName: payload.actorName,
            url: payload.baseUrl ? `${payload.baseUrl}/admin/review` : undefined,
        },
    });
}

export async function notifySubmissionReceived(payload: { title: string; slug: string; authorEmail: string; etaDays: number; baseUrl?: string }): Promise<void> {
    await send({
        event: "submission_received",
        to: payload.authorEmail,
        payload: {
            title: payload.title,
            slug: payload.slug,
            notes: String(payload.etaDays),
            url: payload.baseUrl ? `${payload.baseUrl}/admin/articles/${payload.slug}` : undefined,
        },
    });
}

export async function getReviewEtaDays(): Promise<number> {
    try {
        const sql = getDB();
        const rows = await sql`SELECT value FROM site_settings WHERE key = 'review_eta_days'`;
        const n = Number(rows[0]?.value || 7);
        return Number.isFinite(n) && n > 0 ? n : 7;
    } catch {
        return 7;
    }
}

export async function notifyArticleApproved(payload: { title: string; slug: string; authorEmail: string; consentUrl: string; baseUrl?: string }): Promise<void> {
    const cc = await getNotificationCC();
    await send({
        event: "article_approved",
        to: payload.authorEmail,
        cc,
        payload: {
            title: payload.title,
            slug: payload.slug,
            // The CTA in the approval email MUST link to the consent form, not the article.
            url: payload.consentUrl,
        },
    });
}

export async function notifyConsentReceived(payload: { title: string; slug: string; signatoryName: string; baseUrl?: string }): Promise<void> {
    const admins = await getEmailsByRole("admin");
    const reviewers = await getEmailsByRole("reviewer");
    const cc = await getNotificationCC();
    await send({
        event: "consent_received",
        to: [...new Set([...admins, ...reviewers])],
        cc,
        payload: {
            title: payload.title,
            slug: payload.slug,
            actorName: payload.signatoryName,
            url: payload.baseUrl ? `${payload.baseUrl}/admin/articles/${payload.slug}` : undefined,
        },
    });
}

export async function notifyArticlePublished(payload: { title: string; slug: string; authorEmail: string; baseUrl?: string }): Promise<void> {
    const cc = await getNotificationCC();
    await send({
        event: "article_published",
        to: payload.authorEmail,
        cc,
        payload: {
            title: payload.title,
            slug: payload.slug,
            url: payload.baseUrl ? `${payload.baseUrl}/publications/${payload.slug}` : undefined,
        },
    });
}

export async function notifyArticleChangesRequested(payload: { title: string; slug: string; authorEmail: string; notes: string; baseUrl?: string }): Promise<void> {
    await send({
        event: "article_changes_requested",
        to: payload.authorEmail,
        payload: {
            title: payload.title,
            slug: payload.slug,
            notes: payload.notes,
            url: payload.baseUrl ? `${payload.baseUrl}/admin/articles/${payload.slug}` : undefined,
        },
    });
}

export async function notifyFeedbackReceived(payload: { title: string; slug: string; authorEmail: string; commenterName: string; commentBody?: string; baseUrl?: string }): Promise<void> {
    await send({
        event: "feedback_received",
        to: payload.authorEmail,
        payload: {
            title: payload.title,
            slug: payload.slug,
            actorName: payload.commenterName,
            notes: payload.commentBody,
            url: payload.baseUrl ? `${payload.baseUrl}/admin/articles/${payload.slug}` : undefined,
        },
    });
}

/** When an author (contributor / partner) replies on the comment thread we
 *  fan the reply out to every active admin + reviewer plus the standing CC
 *  list configured in Settings → Notifications, so the reviewers don't have
 *  to keep refreshing the CMS to see responses. */
export async function notifyAuthorReply(payload: { title: string; slug: string; authorName: string; commentBody: string; baseUrl?: string }): Promise<void> {
    const admins = await getEmailsByRole("admin");
    const reviewers = await getEmailsByRole("reviewer");
    const recipients = [...new Set([...admins, ...reviewers])];
    const cc = await getNotificationCC();
    await send({
        event: "author_reply",
        to: recipients,
        cc,
        payload: {
            title: payload.title,
            slug: payload.slug,
            actorName: payload.authorName,
            notes: payload.commentBody,
            url: payload.baseUrl ? `${payload.baseUrl}/admin/articles/${payload.slug}` : undefined,
        },
    });
}
