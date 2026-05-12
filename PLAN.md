# NADI Platform — Implementation Plan (v2)

> **Source of truth:** This plan is derived from three artefacts shared by the NADI policy team:
> - `Workflow Website Article Submit - QC - Publish.pdf` — the canonical end-to-end flow
> - `NADI Policy Product Guideline and Templates.docx` — product-type definitions, section scaffolds, and authorship rules
> - `Consent-to-publish form.docx` — the consent form fields and binding declarations
>
> Every requirement below traces back to one of these. Anything outside this scope is deferred.

---

## 0. What's already built (carry-over from v1 plan)

These are done and stay as the foundation. Where this v2 plan extends or replaces them, it's flagged in the relevant section.

| Built | Notes |
|---|---|
| Roles `admin / reviewer / contributor / partner` + status `pending/active/suspended` | `users.role`, `users.status` columns, auth gate, `/admin/users`, `/register` |
| Audit log | `user_events` table |
| Standing CC list (Amira / Widya / Soleh) | `site_settings.notification_cc`, editable in `/admin/settings` |
| Article state machine `draft → in_review → published` | `articles.status` |
| Per-content review queue at `/admin/review` | Article approve / request-changes |
| Public API filters to `status='published'` | `/api/public/articles`, `/media`, `/events` |
| Role × menu access matrix | `/admin/permissions`, `site_settings.role_menu_matrix` |
| Email infra via nodemailer | `src/lib/notify.ts`, SMTP env, fire-and-forget |
| Test seed accounts | `admin / reviewer / contributor / partner @nadi-health.id` (password `Nadi@2025!`), plus `admin2@nadi-health.id` |

---

## 1. The three workflows (canonical, from the PDF)

```
Workflow 1 — Submit to QC
─────────────────────────
Partner:  log in → Article page → Create → choose product type → fill template → Submit
                                                                                  │
Auto:                                                                             ├─→ auto email "Thx, review in XX days" (to partner)
                                                                                  └─→ notification email (to WB / SA / Amira + standing CC)
Admin:    log in → article page → open file → QC → comment → Send Notification
                                                                                  │
                                                                                  └─→ email "Your work has been reviewed. Please revise" (to partner)

Workflow 2 — Revision to Approval
─────────────────────────────────
Partner:  log in → Submitted Article → read comments → revise → Submit
                                                                  │
Auto:                                                             ├─→ auto email (to partner)
                                                                  └─→ notification email (to admins + CC)
Admin:    log in → article page → QC → EITHER
              (a) comment + Send Notification          ────→ back to revision loop
              (b) click "Approved" button              ────→ email "Approved. Fill consent form" (to partner, with link)

Workflow 3 — Approval to Publish
────────────────────────────────
Partner:  click email link → fill consent-to-publish form → Submit
                                                              │
Auto:                                                         └─→ notification email (to admins + CC)
Admin:    log in → Publish article via Article Page
```

The "XX days" in workflow 1 is editable copy — store as a `site_settings` value (default e.g. 7).

---

## 2. State machine (new vs current)

Current: `draft → in_review → published`.

The PDF flow needs a fourth state for "admin approved, waiting on consent" plus a sub-state for "feedback pending partner action". Final shape:

```
       (partner saves)
draft ─────────────────────────┐
  ▲                            │
  │ (admin: request_changes)   ▼
  │                       in_review ◀──┐
  │                            │       │
  │                            │       │ (partner: resubmit)
  └────────────────────────────┘       │
                                       │
                  (admin: approve)     │
                                       ▼
                              approved (awaiting consent)
                                       │
                  (partner submits consent form)
                                       ▼
                              consent_received
                                       │
                  (admin: publish)
                                       ▼
                                  published
```

**`articles.status` enum:**
- `draft` — partner editing; not yet sent for QC, or sent back after request_changes
- `in_review` — submitted; visible to QC
- `approved` — QC approved; partner must submit consent form
- `consent_received` — consent form filled; admin can click Publish
- `published` — live on the public site

**Additional fields on `articles`:**
- `feedback_pending BOOLEAN DEFAULT false` — true when admin added a comment partner hasn't responded to (resets when partner resubmits or admin approves/publishes)
- `policy_product_type VARCHAR(30)` — `opinion_piece | policy_brief | policy_paper`
- `ai_disclosure TEXT` — required acknowledgement per Authorship clause
- `contains_primary_research BOOLEAN DEFAULT false` — Policy-Brief-specific QC flag
- `consent_id INTEGER REFERENCES article_consents(id)` — set when consent form submitted

> **Backwards compat:** legacy rows keep `status='published'` and `policy_product_type=NULL`; they appear in publications as today and never block on the new flow.

---

## 3. Data model — new tables

### 3.1 `article_comments`

The PDF mandates a comment thread visible to both admin and partner. One row per comment.

```sql
CREATE TABLE article_comments (
  id            SERIAL PRIMARY KEY,
  article_slug  VARCHAR(500) NOT NULL,
  author_id     INTEGER NOT NULL,                  -- FK users.id
  author_role   VARCHAR(20) NOT NULL,              -- snapshot for display
  body          TEXT NOT NULL,
  -- Optional anchor for section-specific feedback (deferred; null = general)
  section_anchor VARCHAR(100) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT NOW()
);
CREATE INDEX article_comments_slug_idx ON article_comments (article_slug, created_at DESC);
```

### 3.2 `article_consents`

One row per consent submission. Authors and signatory live in JSON arrays (variable length per the docx).

```sql
CREATE TABLE article_consents (
  id                       SERIAL PRIMARY KEY,
  article_slug             VARCHAR(500) NOT NULL UNIQUE,
  title_of_paper           VARCHAR(500) NOT NULL,
  authors                  JSONB NOT NULL,    -- [{surname_first_name, affiliation}]
  signatory_full_name      VARCHAR(255) NOT NULL,
  signatory_signature_url  TEXT DEFAULT '',   -- uploaded image (Vercel Blob / local)
  signatory_date           DATE NOT NULL,
  -- per-clause acknowledgements (1–4 author affirmations, 5–6 disclaimers)
  ack_ethical              BOOLEAN NOT NULL,
  ack_original             BOOLEAN NOT NULL,
  ack_edited               BOOLEAN NOT NULL,
  ack_ai_disclosure        BOOLEAN NOT NULL,
  ack_may_reject           BOOLEAN NOT NULL,
  ack_no_liability         BOOLEAN NOT NULL,
  agree_on_behalf          BOOLEAN NOT NULL,  -- effect clause
  created_at               TIMESTAMP DEFAULT NOW()
);
```

### 3.3 `privacy_consents` (Privacy Policy popup tracking)

Lightweight ack so we don't re-show the popup to a returning visitor.

```sql
CREATE TABLE privacy_consents (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER,                -- nullable: anonymous visitors
  client_token  VARCHAR(64) NOT NULL,   -- localStorage UUID for anon
  ip_address    VARCHAR(100) DEFAULT '',
  accepted_at   TIMESTAMP DEFAULT NOW()
);
CREATE INDEX privacy_consents_token_idx ON privacy_consents (client_token);
```

> Per the Kumparan reference, the popup has two buttons: "Setujui Semua" (accept) and "Nanti Saja" (later). Only "Setujui Semua" inserts a row. "Nanti Saja" just dismisses for the session.

---

## 4. Policy Product Types — single source of truth

Stored as a TS constant (`src/data/policy-products.ts`), used everywhere a dropdown / template is rendered. Verbatim from the guideline doc.

```ts
export const POLICY_PRODUCTS = {
  opinion_piece: {
    label: "Opinion Piece",
    shortDescription: "Short persuasive commentary (600–1,200 words, ~1 page). Tone may be biased if evidence-backed.",
    wordCount: { min: 600, max: 1200 },
    pageLength: "≤ 1 page",
    sections: [
      "Opening",
      "Constructive Opinion / Argument 1",
      "Constructive Opinion / Argument 2",
      "Constructive Opinion / Argument 3",
      "Closing (ABC approach)",
    ],
  },
  policy_brief: {
    label: "Policy Brief",
    shortDescription: "Concise action-oriented brief (800–2,000 words, 2–4 pages) aimed at policymakers. Neutral tone, evidence-backed.",
    wordCount: { min: 800, max: 2000 },
    pageLength: "2–4 pages",
    sections: [
      "Key Messages (3–4 bullets)",
      "Problem Definition",
      "Analysis",
      "Recommendation (ABC approach, one page)",
      "Works Cited",
    ],
    flags: ["contains_primary_research"],
  },
  policy_paper: {
    label: "Policy Paper",
    shortDescription: "In-depth policy analysis (5,000–7,500+ words, 10–15 pages). Mixed-method research preferred.",
    wordCount: { min: 5000, max: null },
    pageLength: "10–15 pages",
    sections: [
      "Executive Summary",
      "Current Situation / Current Landscape",
      "Policy Review",
      "Analysis",
      "Recommendation (ABC approach, 1–2 pages)",
      "Works Cited",
      "Appendix",
    ],
  },
} as const;
```

**Authorship & Integrity clause** (shown as a mandatory checkbox above the editor — must be acknowledged at every submit):
> 1. Author retains full authorship for the content of their work.
> 2. Author bears full responsibility for any issues related to plagiarism and the validity of the data.
> 3. Author must disclose when and which parts of their work involve the use of artificial intelligence (AI).

**ABC approach** — recommendation titles must begin with A, then B, then C; do not introduce new information beyond what's in the body. Surface as inline hint in the Recommendation section; no hard validation in v1.

**Existing categories** (`POLICY BRIEF / RESEARCH PAPER / POLICY ANALYSIS / OPINION / RESEARCH NOTE`) stay as a free-text `category` column for legacy articles, but the new "Create Article" flow uses **`policy_product_type` only**. Article editor will default `category` from `policy_product_type` (e.g. `policy_brief → POLICY BRIEF`).

---

## 5. Pages & components — new and changed

### 5.1 Partner-facing

| Route | Purpose | Status |
|---|---|---|
| `/admin/articles/new` | Create article — now Kumparan-style: type picker + template scaffold + side panel (Description / Summary Social / Channel-equivalent) | **Rework existing `ArticleEditor`** |
| `/admin/articles` | Partner's "Submitted Article" dashboard | **Filter to own articles for partner role** |
| `/admin/articles/[slug]` | Open submitted article: read comments, revise, resubmit | **Reuse `ArticleEditor` + add `<CommentThread>`** |
| `/consent/[slug]` | Consent-to-publish form (linked from email) | **NEW** |
| `/consent/[slug]/done` | Thank-you page after consent submitted | **NEW** |
| `/_privacy-popup` | Not a route — a global client component that shows on first visit | **NEW** |

### 5.2 Admin-facing

| Route | Purpose | Status |
|---|---|---|
| `/admin/review` | "Pending QC/Review" queue (rename label to match PDF copy) | **Exists — already lists `status='in_review'`** |
| `/admin/articles/[slug]` | QC view: read article, write comments, Approve, Request Changes, Publish | **Add comment box + Approve button** |
| `/admin/consents` | List submitted consent forms; click row to see article | **NEW** (gated to admin / reviewer) |
| `/admin/settings` | Edit "Review in XX days" copy + CC list (already exists) | **Add `review_eta_days` field** |
| `/admin/guidelines` (or attach to `/admin/docs`) | Upload/replace downloadable Policy Product Guideline file | **NEW or extend docs admin** |

### 5.3 Public-facing

| Route | Purpose | Status |
|---|---|---|
| `/policy-guideline` | Download page — exposes the current Guideline PDF/DOCX so partners can grab it before writing | **NEW** |
| `/publications` | Browse published policy products (filter by `policy_product_type`) | **Add filter chip beside existing category filter** |

### 5.4 Components

| Component | Purpose | Status |
|---|---|---|
| `<PolicyProductPicker>` | Dropdown with helper-text descriptions per type. Drives template scaffold injection | **NEW** |
| `<TemplateScaffold>` | Renders the section headings + placeholder hints for the chosen type | **NEW** |
| `<CommentThread>` | Comment list + new-comment box; visible to admin & article author | **NEW** |
| `<AuthorshipAck>` | Checkbox group for the three Authorship rules | **NEW** |
| `<AiDisclosureField>` | Textarea + "no AI used" toggle | **NEW** |
| `<ConsentForm>` | The full consent-to-publish form (10 fields, 7 checkboxes, signature image upload) | **NEW** |
| `<PrivacyPopup>` | Kumparan-style modal, "Setujui Semua" / "Nanti Saja", stores ack in localStorage + `privacy_consents` | **NEW** |
| `<ApproveButton>` | Admin button on article page → triggers approved state + consent-link email | **NEW** |
| `<PublishButton>` | Admin button — only enabled when `status='consent_received'` | **NEW** |

---

## 6. API surface — new and changed

### 6.1 New endpoints

```
POST   /api/articles/[slug]/comments         body: { body } — adds comment, sets feedback_pending=true if admin
GET    /api/articles/[slug]/comments         returns thread; admin / article author only
POST   /api/articles/[slug]/transition       extend existing — new actions: "approve" (sets approved + sends consent email), "publish" (must be consent_received)
POST   /api/consent/[slug]                   public-ish: token-gated. Saves consent row, transitions article → consent_received
GET    /api/consent/[slug]                   serves the form prefill (title, authors hint)
POST   /api/upload/signature                 multipart: image. Stores to Vercel Blob / public/uploads/signatures
GET    /api/policy-guideline                 redirects to the latest uploaded guideline (or stream the bytes)
POST   /api/privacy-consent                  body: { token } — records anon/user accept
GET    /api/admin/consents                   admin/reviewer: list of submitted consent forms
```

### 6.2 Modified endpoints

```
POST /api/articles                  accepts policy_product_type, ai_disclosure, contains_primary_research, authorship_ack
PUT  /api/articles                  same, plus when partner re-saves: clears feedback_pending
POST /api/articles/[slug]/transition  approve / publish branches as above
POST /api/register                  unchanged; emails CC list as today
```

### 6.3 Permission gates

- Partner can only `GET/PUT` articles where `articles.author_id = session.user.id`
- Partner can `POST /comments` only on own articles
- Admin / reviewer can comment, approve, publish, view consents
- Public can `POST /consent/[slug]` if the slug is in `approved` state (no other auth — the email link is the credential; rate-limit by IP)

---

## 7. Email templates — copy mapped to the PDF

The PDF specifies exact wording for three of the five emails. Use it verbatim.

| Event | Trigger | To | CC | Subject | Body (PDF wording) |
|---|---|---|---|---|---|
| `submission_received` | Partner submits article | Partner | — | "We've received your submission" | "Thank you for submitting your work. We will review your work and get back to you in **{REVIEW_ETA_DAYS}** days" |
| `submission_to_admins` | Same event | WB/SA/Amira + standing CC | — | "New submission: {title}" | Link to `/admin/articles/[slug]` |
| `feedback_received` | Admin posts comment + clicks Send Notification | Partner | — | "Your work has been reviewed" | "Your work has been reviewed. Please kindly proceed with the necessary revisions at your earliest convenience" |
| `article_approved` | Admin clicks "Approved" | Partner | standing CC | "Your work has been approved" | "Your work has been approved. Please kindly complete and submit the consent form for publication." **Body must include link to `/consent/[slug]?token=…`** |
| `consent_received` | Partner submits consent form | WB/SA/Amira + standing CC | — | "Consent received: {title}" | Article is ready to publish |
| `article_published` | Admin clicks Publish | Partner | standing CC | "Your article is now live" | Link to `/publications/[slug]` |

The existing helpers in `src/lib/notify.ts` (`notifyArticleSubmitted`, `notifyArticleApproved`, etc.) will be repurposed and extended.

`REVIEW_ETA_DAYS` lives in `site_settings.review_eta_days` (integer, default `7`), editable in `/admin/settings`.

---

## 8. Privacy Policy Popup (Annex)

Kumparan-style. Specs from the screenshot in the PDF Annex:

- Modal centred, ~480px wide
- Title: "Konfirmasi Ketentuan dan Kebijakan Privasi"
- Highlighted callout: "Dengan klik Setujui Semua, saya telah membaca dan menyetujui Ketentuan dan Kebijakan Privasi NADI."
- Scrollable body with placeholder Terms of Service + Privacy Policy text (will be supplied by NADI legal — leave a CMS hook for editing)
- Two buttons: outline "Nanti Saja" (close, set sessionStorage flag) and filled crimson "Setujui Semua" (POST `/api/privacy-consent`, set localStorage flag, close)
- Shows on every page load until accepted; suppressed for admin routes (already authenticated)
- Mobile-friendly (full-width sheet on <600px)

---

## 9. Consent-to-Publish form — UI mapping

One page form, mirrors the docx layout.

```
Header: "Consent-to-Publish Form — 2026"

Lead-in: "I, the undersigned, hereby confirm that I consent to publish my submitted policy product and declare that…"

[ ] 1. The policy product has been developed in an ethical, responsible manner…
[ ] 2. The policy product meets basic publication standards, is original and free of plagiarism
[ ] 3. The policy product has been edited in accordance with the guidelines…
[ ] 4. The policy product has used AI tools in a responsible and transparent manner…
[ ] 5. The author(s) agree that NADI QC team may reject the paper…
[ ] 6. The author(s) agree that NADI assumes no responsibility for the content…
[ ] I confirm I sign on behalf of all co-authors  (effect clause — separate ack)

Title of the paper: [_____ prefilled from article ______ ]   (editable)

Authors  (dynamic list; add row button; ≥ 1 row required)
+---------------------------------------+--------------------+
| Surname, First name                   | Affiliation        |
+---------------------------------------+--------------------+
| [ row 1 — prefill from session user ] | [                ] |
+---------------------------------------+--------------------+
[ + Add another author ]

E-signature:  [ drop / upload PNG or draw ]
Full Name:    [________________________]
Date:         [ yyyy-mm-dd  default today ]

[ Submit Consent Form ]
```

All six clause checkboxes + the effect-clause checkbox + at least one author + signature + full name + date are required to submit. Backend re-validates.

---

## 10. Implementation phases (suggested merge order)

Each phase is independently shippable.

### Phase A — Comment thread (unblocks workflow)
- `article_comments` table
- `<CommentThread>` component
- `/api/articles/[slug]/comments` GET / POST
- Wire into `/admin/articles/[slug]` (both admin edit view AND partner edit view)
- Email: `feedback_received` on admin comment (use existing changes-requested template wording)

### Phase B — Policy Product Type + template scaffold + auto-emails
- `src/data/policy-products.ts`
- `<PolicyProductPicker>` + `<TemplateScaffold>` in `ArticleEditor`
- `articles.policy_product_type`, `ai_disclosure`, `contains_primary_research`
- `<AuthorshipAck>` + `<AiDisclosureField>` block before submit
- `site_settings.review_eta_days` (default 7)
- Wire `submission_received` auto email with the exact PDF copy
- Partner-side "Submitted Article" dashboard: `/admin/articles` shows only own articles when role=partner

### Phase C — State machine extension
- Add `approved`, `consent_received` to `articles.status` enum (just widen the string check in the app)
- `<ApproveButton>` on admin article page → transition `in_review → approved` + email partner with consent link
- `<PublishButton>` (admin) — only visible when `status='consent_received'`
- Email: `article_approved` (with consent link), `article_published`

### Phase D — Consent-to-publish form
- `article_consents` table
- `/consent/[slug]` page (token-gated; token is HMAC over slug+timestamp, embedded in email)
- `<ConsentForm>` component
- `/api/consent/[slug]` GET (prefill) + POST (submit)
- `/api/upload/signature`
- `/admin/consents` list page
- Email: `consent_received` to admins + CC

### Phase E — Privacy Policy popup
- `<PrivacyPopup>` global component mounted in root `layout.tsx` (suppressed for `/admin/*`)
- `privacy_consents` table
- `/api/privacy-consent` POST
- Editable Terms / Privacy body in `site_settings.privacy_terms_md` (markdown rendered)

### Phase F — Downloadable Guideline
- `/admin/guidelines` upload page (admin only)
- Stores file to Vercel Blob / `public/uploads/guidelines/policy-guideline-{date}.pdf`
- `site_settings.guideline_url` points at the active version
- `/policy-guideline` public download page
- Inline download button in `<PolicyProductPicker>` ("📥 Download guideline")

### Phase G — UX polish from Kumparan reference
- Side panel in editor (Description, Summary Social, Submit at top-right) — referenced in PDF Annex p.5
- "Saved as DRAFT" indicator
- Title character counter (0/80) and content word counter (with min/max per product type)

### Phase H — Final wiring & QA
- All notifications send to standing CC list per PDF
- Admin's "Pending QC/Review" page renames + breadcrumbs match PDF terminology
- Smoke test: partner submits opinion piece → admin comments → partner revises → admin approves → partner consents → admin publishes → public sees article

---

## 11. Out of scope (deliberate — flag to NADI if priorities change)

These came up while parsing the docs but are NOT mandated by the PDF flow. Listed so they don't creep in silently.

- Citation style enforcement (APA / Chicago etc.) — guideline doc does not specify
- Co-author login / co-author signature countersign (consent doc allows one signatory on behalf of all)
- Public commenting on published articles (we only build the QC comment thread)
- Plagiarism scanning integration
- AI-content detection integration
- Bahasa Indonesia / English translation toggle on public site
- Sub-chapter / nested headings in editor (article body stays flat — sections only)
- ABC-approach hard validation (only inline hint in v1)
- Inline section-anchored comments (table has a column; UI deferred)
- Mobile-app push notifications (email only)
- Versioned guideline history (only one active version at a time)

---

## 12. Open questions for NADI

These should be answered before Phase D and Phase E ship.

1. **REVIEW_ETA_DAYS default** — confirm: 7? 14?
2. **Consent token TTL** — should the consent-form link expire? Suggest 30 days.
3. **Signature input** — accept image upload only, or also a draw-with-mouse canvas?
4. **Privacy / ToS body text** — needs final wording from NADI legal before going live.
5. **Guideline file format** — PDF only, or also offer DOCX template? (recommend both: PDF for reading, DOCX as a starter)
6. **Email "From" address** — `noreply@nadi-health.id` works? Will it pass SPF/DKIM via the SMTP host?
7. **Who can resend the consent-form email if a partner loses it?** — admin button on `/admin/articles/[slug]`?
8. **Should partners be able to delete their own drafts?** — current code allows it; confirm.
9. **What happens if a partner ignores the consent step for X days?** — admin notification + manual nudge, or auto-expire back to `approved`?
10. **Multiple submissions from same partner** — any limit? (current: unlimited)
