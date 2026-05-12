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
- [x] Migration: create `article_comments` table (PLAN §3.1)
- [x] Migration: add `articles.feedback_pending BOOLEAN DEFAULT false`

### API
- [x] `GET /api/articles/[slug]/comments` — admin/reviewer OR article author only; JOIN users for authorName
- [x] `POST /api/articles/[slug]/comments` — sets `articles.feedback_pending=true` if commenter is admin/reviewer
- [x] When partner edits + saves, `PUT /api/articles` clears `feedback_pending=false`

### UI
- [x] `<CommentThread>` — chat-style list + new-comment textarea + role-coloured author pills + relative timestamp + Ctrl/Cmd+Enter submit
- [x] Mounted on `/admin/articles/[slug]` (inside `ArticleEditor` when editing)
- [x] Admin's comment does NOT reset article status — only flags `feedback_pending=true` (per design decision)

### Email
- [x] `feedback_received` event added to `notify.ts` — verbatim PDF copy "Your work has been reviewed. Please kindly proceed with the necessary revisions at your earliest convenience."
- [x] Comment POST fires `notifyFeedbackReceived` only when commenter is admin/reviewer

### Verify
- [ ] Manual smoke: partner can see admin comments and reply
- [ ] Manual smoke: `feedback_pending` flips correctly through full loop

---

## Phase B — Policy Product Type + template scaffold + submit emails

### Schema
- [x] Migration: add `articles.policy_product_type VARCHAR(30)`
- [x] Migration: add `articles.ai_disclosure TEXT DEFAULT ''`
- [x] Migration: add `articles.contains_primary_research BOOLEAN DEFAULT false`
- [x] Migration: seed `site_settings.review_eta_days = '7'`

### Data
- [x] `src/data/policy-products.ts` — verbatim from guideline (3 types × full section scaffold + word counts + tone + primary-research notes + Authorship rules)
- [x] When `policy_product_type` is chosen, auto-set legacy `category` (opinion_piece → OPINION etc.)

### UI
- [x] `<PolicyProductPicker>` — accessible radio-card grid, selected card has crimson border + bg tint, optional "📥 Download guideline" link
- [x] `buildScaffoldHTML(type)` injects section headings + italic placeholder hints into the editor; only replaces when content is empty or still an untouched scaffold
- [x] `<AuthorshipAck>` — 3-checkbox tuple, gated before submit / publish
- [x] `<AiDisclosureField>` — "no AI used" toggle + textarea; submit blocked if neither given
- [x] `<WordCounter>` shows `current vs min–max` with amber-under / crimson-over colouring
- [x] Partner-side `/admin/articles` lists only own articles (server + API both gated by `asRole === "partner"`)
- [ ] Title char counter 0/80 (Kumparan ref — Phase G)
- [ ] "Saved as DRAFT" indicator (Phase G)
- [ ] Move Submit button to top-right of editor side panel (Phase G)
- [x] Empty state for partners on `/admin/articles`: "Submit your first policy product"

### Settings
- [x] `/admin/settings` — "Review ETA (days)" number input added next to CC list
- [x] Value flows into auto-reply email via `getReviewEtaDays()`

### Email
- [x] New `submission_received` event in `notify.ts` — verbatim PDF copy "Thank you for submitting your work. We will review your work and get back to you in **{X}** days"
- [x] Wired into `/api/articles/[slug]/transition` on `action="submit"` — partner gets auto-reply, admin+CC get notification
- [x] Helper `notifySubmissionReceived({ title, slug, authorEmail, etaDays, baseUrl })`

### Verify
- [ ] Manual smoke: partner picks Opinion Piece → editor seeds 5 sections + ABC hint
- [ ] Manual smoke: cannot Submit without authorship + AI ack
- [ ] Manual smoke: auto email arrives with correct ETA number
- [ ] Manual smoke: admin + standing CC get notified

---

## Phase C — State machine extension (Approve / Publish split)

### Schema
- [x] `articles.status` widened in app: `draft | in_review | approved | consent_received | published` (column stays VARCHAR; permitted values enforced in TS types + transition route)
- [x] Backfill not needed — DEFAULT 'published' on legacy rows still works

### API
- [x] `POST /api/articles/[slug]/transition` now handles: `submit`, `request_changes`, `approve` (→ approved + consent email), `publish` (→ published, requires `consent_received`)
- [x] State gates: approve only valid from `in_review`; publish only valid from `consent_received`
- [x] Public APIs unchanged — still filter `status='published'`

### UI
- [x] `<ApproveButton>` (green) mounted on `/admin/articles/[slug]` — enabled only when `status='in_review'`, admin/reviewer only
- [x] `<PublishButton>` (crimson) — enabled only when `status='consent_received'`
- [x] Status badge handles all 5 states with distinct colours (amber/purple/blue/green for in_review/approved/consent_received/published)
- [x] `/admin/review` splits into 3 buckets: "Pending QC / Review", "Awaiting Consent Form", "Ready to Publish" — each with appropriate action buttons

### Email
- [x] `article_approved`: subject "Your work has been approved", body verbatim PDF copy, CTA links to `/consent/[slug]?token=`
- [x] `article_published`: subject "Your article is now live", CTA links to `/publications/[slug]`

### Verify
- [ ] Manual smoke: full Approve → email arrives → click link → consent form → publish → article live

---

## Phase D — Consent-to-publish form

### Schema
- [x] `article_consents` table created (PLAN §3.2 shape — 6 ack booleans + effect clause + title + authors JSONB + signatory name + signature URL + date)
- [x] `articles.consent_id` column added

### Pages
- [x] `/consent/[slug]` — public, token-gated; fetches prefill from API; submits to API; redirects to `/done` on success
- [x] `/consent/[slug]/done` — thank-you page, no nav chrome
- [x] `/admin/consents` — list of submitted consents (admin/reviewer)
- [x] `/admin/consents/[id]` — printable-style detail view with all 7 acks rendered + signature image

### Components
- [x] `<ConsentForm>` — 6 numbered declaration checkboxes (verbatim docx copy) + effect-clause checkbox + title + dynamic authors table + signature image upload (max 2MB, jpg/png/webp) + full name + date
- [ ] Sig upload: image upload only (canvas-draw deferred to v2)

### API
- [x] `GET /api/consent/[slug]?token=` — verifies token, returns prefill `{ titleOfPaper, authors }` and `alreadySubmitted` flag
- [x] `POST /api/consent/[slug]?token=` — verifies token + status='approved', validates 7 acks + ≥1 author + signature + name + date, INSERTs row, sets article status to `consent_received` via `setConsentReceived(slug, id)`, fires consent_received notification
- [x] `POST /api/upload/signature` — multipart, image/* only, 2MB cap; Vercel Blob on prod, public/uploads/signatures locally
- [x] `GET /api/admin/consents` — list endpoint
- [x] `GET /api/admin/consents/[id]` — single detail endpoint

### Token
- [x] `src/lib/consent-token.ts` — HMAC SHA-256 over `slug:expiresMs` using `AUTH_SECRET`, base64url-encoded; 30-day default TTL; `verifyConsentToken` returns typed reason on failure (malformed / bad_signature / expired / slug_mismatch)

### Email
- [x] `consent_received` notification — to admins + reviewers + standing CC list; subject "Consent received: {title}"

### Verify
- [ ] Manual smoke: email link opens form, prefills title + author 1
- [ ] Manual smoke: form requires 7 acks + ≥1 author + signature image + name + date
- [ ] Manual smoke: after submit, article appears in /admin/consents and Publish button enabled on /admin/articles/[slug]
- [ ] Manual smoke: expired token shows friendly error

---

## Phase E — Privacy Policy popup (Kumparan-style)

### Schema
- [x] Migration: create `privacy_consents` table (PLAN §3.3)
- [x] Migration: seed `site_settings.privacy_terms_md` with placeholder Indonesian copy

### UI
- [x] `<PrivacyPopup>` — Kumparan-style modal: title, callout banner, scrollable body (markdown rendered inline), "Nanti Saja" / "Setujui Semua" buttons
- [x] Mounted globally via `<PrivacyPopupGate>` in root layout; suppressed on `/admin/*` via `usePathname()`
- [x] Shows on first page load (localStorage.privacy_ack check); session-suppressed on "Nanti Saja"
- [x] Mobile: full-width bottom sheet on <600px

### Admin
- [x] `/admin/settings` — markdown textarea (rows=12, monospace) for the popup body, Save button

### API
- [x] `POST /api/privacy-consent` — body `{ token }`; inserts row with IP + optional user_id

### Verify
- [ ] Manual smoke: popup shows on `/` for new visitor, hides after Setujui Semua
- [ ] Manual smoke: not shown on `/admin/*`
- [ ] Manual smoke: admin edits body in settings, popup reflects new copy on next reload

---

## Phase F — Downloadable Policy Product Guideline

### Pages
- [x] `/policy-guideline` — public download page using V2 layout; shows download button if URL set, friendly empty state otherwise
- [x] `/admin/guidelines` — admin-only upload page; shows current file with download link + uploader

### Storage
- [x] Vercel Blob `guidelines/` on prod / `public/uploads/guidelines/` locally — mirrors articles/upload pattern
- [x] `site_settings.guideline_url` upserted on each upload

### API
- [x] `POST /api/guidelines/upload` (admin only, `canManageUsers` gate) — multipart, .pdf/.docx, 25MB cap
- [x] `GET /api/policy-guideline` — 302-redirects to `site_settings.guideline_url` (or back to the page if empty)

### UI
- [x] `<PolicyProductPicker>` "📥 Download guideline" link → always renders, points to `/policy-guideline`
- [x] Sidebar: new "Guidelines" menu item (admin-only in default matrix)

---

## Phase G — Kumparan-style editor polish

- [x] Action buttons (Publish/Submit + Save Draft) moved to a sticky right side panel (280px col); main form is the left column. Mobile breakpoint <1024px collapses to single column.
- [x] "Saved as ..." indicator in the side panel with relative time ("beberapa detik / N menit / N jam yang lalu") — `formatRelative()` helper, 15s tick interval
- [x] Title character counter `0/80` — shown both inline next to the Title label and in the side panel meta row
- [x] Description field (`seoDesc`) — 0/200 counter inline + side panel
- [x] "Summary Social" field — new `articles.summary_social TEXT` column + new editor field with 0/200 counter, persisted via store/API
- [ ] Channel selector renaming (existing `category` select stays as "Category" for now — `policy_product_type` already supersedes its role) — DEFERRED, not strictly needed since Phase B picker handles product type

---

## Phase H — Final wiring & QA

Three parallel audit agents reviewed email / state / UI surfaces; fixes below.

### Audit findings → fixes shipped

- [x] `POST/PUT /api/articles` now fires `notifyArticleSubmitted` + `notifySubmissionReceived` when a non-publisher save lands in `in_review` (was missing — only the transition route fired them)
- [x] `PUT /api/articles` no longer demotes `approved` / `consent_received` / `published` back to `draft` when a partner re-saves their own article (locked-state preservation)
- [x] `articles-store.saveArticle` default status `published` → `draft` (defensive)
- [x] `transition action=submit` now requires source = `draft` or `in_review` (was unguarded — reviewer could regress any state)
- [x] `transition action=request_changes` now requires source = `in_review`
- [x] `notifyUserActivated` gated to first activation (pending → active) only — no longer fires on reactivation from suspended
- [x] `permissions-matrix` partner default now includes `articles` (so they can reach "My Submissions" via sidebar)
- [x] `PrivacyPopupGate` suppresses popup on `/admin/*`, `/login`, `/register`, `/consent/*` (was only admin)
- [x] ArticleEditor shows "Approved — check email for consent form" banner when partner views own `approved` article
- [x] ArticleEditor shows "Live! View on public site →" banner when status=`published`
- [x] PublishButton success message includes a "View →" link to `/publications/[slug]`
- [x] `/admin/review` H1 renamed to "Pending QC / Review" per PDF terminology
- [x] Duplicate `<h1>` removed from `/admin/articles/[slug]` and `/admin/articles/new` (ArticleEditor renders its own title)
- [x] ConsentForm signature missing-error now sets `firstMissingRef` so the scroll-to-error works for the e-signature field
- [x] Auth gate flipped from blocklist to allowlist: only an explicit `status='active'` (or normalized-null legacy rows) passes; any unknown future status blocks

### Smoke test (manual — to run with SMTP set or watch console logs)

- [ ] Partner registers → admin activates → partner logs in (gets activation email)
- [ ] Partner accepts Privacy Popup; popup is suppressed on `/admin/*`, `/login`, `/register`, `/consent/*`
- [ ] Partner clicks Create Article → picks Opinion Piece → editor scaffolds 5 sections + authorship ack + AI disclosure
- [ ] Partner submits → receives auto email "We'll review in 7 days" → admins + CC get notified
- [ ] Admin opens `/admin/review` → opens article → posts comment
- [ ] Partner gets "Your work has been reviewed" email → opens "My Submissions" → reads comment → edits → resubmits
- [ ] Admin clicks Approve → partner gets email with consent-form link
- [ ] Partner clicks link → fills consent form → submits → admins + CC notified
- [ ] Admin opens article → clicks Publish → article appears on `/publications` → partner gets "Your article is now live" email
- [ ] All audit log rows present in `submissions` + `user_events` tables

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
