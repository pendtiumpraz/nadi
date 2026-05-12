# Implementation Progress (v2 — strict match to PDF + docx)

Mirror of `PLAN.md`. Tick boxes as items land. Phases map 1:1 to PLAN §10.

**Status legend** — `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked / needs decision

---

## Foundation (carry-over from v1 — already shipped)

- [x] Roles `admin / reviewer / contributor / partner` + status `pending|active|suspended`
- [x] Registration approval flow (`/register`, auth gate, `/admin/users` activation)
- [x] `user_events` audit log
- [x] Standing CC list seeded (Amira / Widya / Soleh @inkemaris.com)
- [x] Article state machine `draft → in_review → published`
- [x] `/admin/review` queue page (article approve / request-changes)
- [x] Public APIs filter to `status='published'` (+ events use `publish_status`)
- [x] Role × menu access matrix at `/admin/permissions`
- [x] `src/lib/notify.ts` + nodemailer + fire-and-forget
- [x] Test seed accounts for every role
- [x] Backfill SQL so legacy article/media rows show in public listings
- [x] coverImage rendered on `/publications` listing + detail hero

---

## Phase A — Comment thread (unblocks the PDF workflow)

### Schema
- [ ] Migration: create `article_comments` table (see PLAN §3.1)
- [ ] Migration: add `articles.feedback_pending BOOLEAN DEFAULT false`

### API
- [ ] `GET /api/articles/[slug]/comments` — admin/reviewer OR article author only
- [ ] `POST /api/articles/[slug]/comments` — sets `articles.feedback_pending=true` if commenter is admin/reviewer
- [ ] When partner edits + saves, set `feedback_pending=false`

### UI
- [ ] `<CommentThread>` component — list + new-comment box; shows author role badge + timestamp
- [ ] Mount on `/admin/articles/[slug]` for both admin/reviewer (write) and partner (write own thread)
- [ ] On admin's Comment submit → calls existing transition `request_changes` semantics OR a new "post comment" event that doesn't reset status (decision: don't reset; keep `in_review`, just flag `feedback_pending`)

### Email
- [ ] Send `feedback_received` to article author on admin/reviewer comment — body: "Your work has been reviewed. Please kindly proceed with the necessary revisions at your earliest convenience"

### Verify
- [ ] Partner can see admin comments and reply
- [ ] Admin gets nothing — only partner is notified (per PDF arrows)
- [ ] `feedback_pending` resets when partner re-saves

---

## Phase B — Policy Product Type + template scaffold + submit emails

### Schema
- [ ] Migration: add `articles.policy_product_type VARCHAR(30)`
- [ ] Migration: add `articles.ai_disclosure TEXT DEFAULT ''`
- [ ] Migration: add `articles.contains_primary_research BOOLEAN DEFAULT false`
- [ ] Migration: seed `site_settings.review_eta_days` = `7`

### Data
- [ ] `src/data/policy-products.ts` — single source of truth (PLAN §4)
- [ ] When `policy_product_type` is chosen and `category` is blank, auto-set `category` (opinion_piece → OPINION, etc.)

### UI
- [ ] `<PolicyProductPicker>` — radio cards w/ short description per type; "📥 Download guideline" link (wires to Phase F)
- [ ] `<TemplateScaffold>` — pre-fills editor `contentEditable` with section headings + placeholder hints
- [ ] `<AuthorshipAck>` checkbox group (3 clauses) — mandatory before submit
- [ ] `<AiDisclosureField>` — "no AI used" toggle + textarea
- [ ] Word counter under editor showing `current / min–max` per chosen product type (soft warning, no hard block)
- [ ] Title char counter 0/80 (Kumparan ref)
- [ ] "Saved as DRAFT" indicator (Kumparan ref)
- [ ] Move Submit button to top-right of editor side panel (Kumparan ref)
- [ ] Partner-side `/admin/articles` lists only `WHERE author_id = session.user.id` when role=partner

### Settings
- [ ] `/admin/settings` — add "Review ETA (days)" number input
- [ ] Surface that value to partners somewhere (auto email body)

### Email
- [ ] Update `notifyArticleSubmitted`: partner receives "Thank you for submitting your work. We will review your work and get back to you in {REVIEW_ETA_DAYS} days" (verbatim from PDF)
- [ ] Admin / CC notification on submit — link to `/admin/articles/[slug]`

### Verify
- [ ] Partner can pick a product type → editor scaffolds it
- [ ] Partner sees authorship + AI ack before submit; cannot submit without them
- [ ] Auto email matches PDF copy verbatim
- [ ] Admin + standing CC get notified

---

## Phase C — State machine extension (Approve / Publish split)

### Schema
- [ ] Allow `articles.status` values: `draft | in_review | approved | consent_received | published` (just app-level check; column stays VARCHAR)
- [ ] Backfill: existing `in_review` and `published` rows stay; nothing else to migrate

### API
- [ ] Extend `POST /api/articles/[slug]/transition`:
  - new action `approve` → `in_review → approved` (admin/reviewer only); sends `article_approved` email w/ consent link
  - new action `publish` → `consent_received → published` (admin only)
  - existing `submit` / `request_changes` keep their semantics
- [ ] Public APIs unchanged — still filter `status='published'`

### UI
- [ ] `<ApproveButton>` on `/admin/articles/[slug]` — only visible to admin/reviewer, only when `status='in_review'`
- [ ] `<PublishButton>` — only visible to admin, only when `status='consent_received'`
- [ ] Status badge expanded to show all 5 states (different colours)
- [ ] `/admin/review` lists `in_review` AND `consent_received` (with section headers)

### Email
- [ ] `article_approved`: to partner + standing CC. Subject "Your work has been approved". Body must include `/consent/[slug]?token=…` link
- [ ] `article_published`: to partner + standing CC after admin clicks Publish

### Verify
- [ ] After approve: partner gets email with link; article is invisible to public
- [ ] Article moves to public only after admin clicks Publish

---

## Phase D — Consent-to-publish form

### Schema
- [ ] Migration: create `article_consents` table (PLAN §3.2)
- [ ] Migration: add `articles.consent_id INTEGER REFERENCES article_consents(id)`

### Pages
- [ ] `/consent/[slug]` — public route, token-gated (HMAC signed URL from email)
- [ ] `/consent/[slug]/done` — thank-you page
- [ ] `/admin/consents` — list of submitted consents (admin/reviewer)
- [ ] `/admin/consents/[id]` — single consent detail view

### Components
- [ ] `<ConsentForm>` (PLAN §9): 6 declaration checkboxes + effect-clause checkbox + title + dynamic authors table + signature upload + full name + date
- [ ] Sig upload: drag/drop image OR (deferred to v2) canvas draw

### API
- [ ] `GET /api/consent/[slug]?token=` — verifies token, returns prefill data
- [ ] `POST /api/consent/[slug]?token=` — verifies token, validates required fields, saves consent, sets `articles.status='consent_received'` and `articles.consent_id`
- [ ] `POST /api/upload/signature` — multipart, image only, max 2MB
- [ ] `GET /api/admin/consents` — list for admin dashboard

### Token
- [ ] `src/lib/consent-token.ts` — `sign(slug, expiresAt)` + `verify(token, slug)`; HMAC over `AUTH_SECRET`; default TTL 30 days

### Email
- [ ] `consent_received` notification — to standing CC list on submit, subject "Consent received: {title}"

### Verify
- [ ] Email link opens `/consent/[slug]?token=` and prefills title + author 1 from session
- [ ] All 7 checkboxes + ≥1 author + signature + full name + date required
- [ ] After submit, article moves to `consent_received` and is listed in `/admin/consents`
- [ ] Token expires after 30 days → "Link expired. Contact admin." (admin can resend from `/admin/articles/[slug]`)

---

## Phase E — Privacy Policy popup (Kumparan-style)

### Schema
- [ ] Migration: create `privacy_consents` table (PLAN §3.3)
- [ ] Migration: seed `site_settings.privacy_terms_md` with placeholder copy (NADI legal will edit)

### UI
- [ ] `<PrivacyPopup>` — Kumparan-style modal: title, callout banner, scrollable body (markdown), "Nanti Saja" / "Setujui Semua" buttons
- [ ] Mount in `src/app/layout.tsx`; suppress on `/admin/*`
- [ ] Shows on first page load (check `localStorage.privacy_ack`); session-suppress on "Nanti Saja"
- [ ] Mobile: full-width bottom sheet on <600px

### Admin
- [ ] `/admin/settings` — add markdown editor for "Privacy Policy + Terms of Service" body

### API
- [ ] `POST /api/privacy-consent` — body `{ token }`; inserts a row with IP

### Verify
- [ ] Popup appears on first visit, hides after Setujui Semua
- [ ] Returning visitor (same browser) doesn't see it
- [ ] Admin can edit body, change reflects after page reload

---

## Phase F — Downloadable Policy Product Guideline

### Pages
- [ ] `/policy-guideline` — public download page with short blurb + download button
- [ ] `/admin/guidelines` — upload page (admin only); shows current active version, lets admin upload new one

### Storage
- [ ] Vercel Blob bucket `guidelines/` (on Vercel); `public/uploads/guidelines/` locally
- [ ] `site_settings.guideline_url` updated on each upload

### API
- [ ] `POST /api/guidelines/upload` (admin only) — multipart PDF/DOCX
- [ ] `GET /api/policy-guideline` — redirects to `site_settings.guideline_url`

### UI
- [ ] `<PolicyProductPicker>` "📥 Download guideline" link → `/api/policy-guideline`
- [ ] Optional: also expose `/policy-guideline` link in main nav (Footer "Resources" column)

---

## Phase G — Kumparan-style editor polish

- [ ] Move action buttons (Submit / Save Draft) to a sticky side panel, top-right of `/admin/articles/new`
- [ ] "Saved as DRAFT" indicator with relative-time "beberapa detik" updating every 30s
- [ ] Title character counter `0/80`
- [ ] Description field (separate from subtitle) — 0/200 char counter, used for SEO meta
- [ ] "Summary Social" field — 0/200 char counter, used for OG description
- [ ] Channel selector (replaces or alongside our existing Category select) — the user-visible label is "Channel"

---

## Phase H — Final wiring & QA

- [ ] All emails on the workflow send to standing CC list per PDF arrows
- [ ] Audit: `submission_received`, `feedback_received`, `article_approved`, `consent_received`, `article_published` all fire correctly
- [ ] `/admin/review` page label updated to "Pending QC / Review"
- [ ] Smoke test (end-to-end):
  - [ ] Partner registers → admin activates → partner logs in
  - [ ] Partner accepts Privacy Popup
  - [ ] Partner clicks Create Article → picks Opinion Piece → editor scaffolds 5 sections + authorship ack + AI disclosure
  - [ ] Partner submits → receives auto email "We'll review in 7 days" → admin + CC get notified
  - [ ] Admin opens `/admin/review` → opens article → posts comment
  - [ ] Partner gets "Your work has been reviewed" email → opens "Submitted Article" → reads comment → edits → resubmits
  - [ ] Admin clicks Approve → partner gets email with consent-form link
  - [ ] Partner clicks link → fills consent form → submits → admin + CC notified
  - [ ] Admin opens article → clicks Publish → article appears on `/publications`
  - [ ] All emails arrived; all states transitioned correctly; audit log has rows

---

## Open Questions / Decisions Needed

_Mirror of PLAN §12 — fill in answers as they come from NADI._

- [ ] REVIEW_ETA_DAYS default = ?
- [ ] Consent token TTL = 30 days OK?
- [ ] E-signature: image upload only, or also canvas draw?
- [ ] Privacy Policy + ToS final wording (legal)
- [ ] Guideline file: PDF only or PDF + DOCX template?
- [ ] Email FROM address + SPF/DKIM check
- [ ] Resend-consent-link button on admin side?
- [ ] Should partners be allowed to delete own drafts?
- [ ] Consent-step inactivity policy?
- [ ] Multiple-submission cap per partner?

---

## Notes / Log

_Use this section to log decisions and surprises as work proceeds._

- (none yet)
