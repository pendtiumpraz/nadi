# NADI Article Workflow — Visual Documentation

End-to-end submission → review → publish flow, matched line-by-line to
`Workflow Website Article Submit - QC - Publish.pdf` (the canonical NADI
spec). Each diagram is followed by the code paths that implement it.

---

## State machine (overview)

```mermaid
stateDiagram-v2
    [*] --> draft: Partner creates article
    draft --> in_review: Partner clicks Submit
    in_review --> draft: Reviewer/Admin clicks Request Changes
    in_review --> approved: Reviewer/Admin clicks Approve
    approved --> consent_received: Partner submits consent form
    consent_received --> published: Admin clicks Publish
    published --> [*]
    note right of approved
        Partner gets email with
        signed /consent/[slug]?token=...
        link (HMAC, 30-day TTL)
    end note
    note right of consent_received
        Article ready to go live.
        Admin sees it in /admin/review
        'Ready to Publish' bucket.
    end note
```

Code paths:
- Enum: `src/data/articles/types.ts → ArticleStatus`
- Transition route: `src/app/api/articles/[slug]/transition/route.ts`
- Guards: `src/lib/permissions.ts` (canPublish / canReview / canEditOwnContent)

---

## Workflow 1 — Submit to QC

```mermaid
sequenceDiagram
    participant P as Partner
    participant FE as Web App
    participant API as /api/articles/*
    participant DB as Postgres
    participant MAIL as Email (notify.ts)
    participant A as Admin (WB / SA / Amira)

    P->>FE: Log in (/login)
    Note over FE: Privacy Popup<br/>(first visit only)
    P->>FE: Open /admin/articles/new
    P->>FE: Choose Policy Product Type<br/>(Opinion Piece / Policy Brief / Policy Paper)
    Note over FE: Dropdown shows short description<br/>per guideline; "📥 Download Guideline" link
    FE->>FE: Auto-seed editor scaffold<br/>(section headings + placeholder hints)
    P->>FE: Fill title, content, authorship ack, AI disclosure
    P->>FE: Click "Submit for Review"
    FE->>API: POST /api/articles<br/>(submit:true, policy_product_type, ack)
    API->>DB: INSERT articles status='in_review'
    API->>DB: INSERT submissions audit row
    API->>MAIL: notifyArticleSubmitted<br/>(to: admins+reviewers, CC: Amira/WB/SA)
    API->>MAIL: notifySubmissionReceived<br/>(to: partner only)
    API-->>FE: 201 Created
    MAIL-->>P: Email — "Thank you for submitting your work.<br/>We will review your work and get back<br/>to you in 7 days"
    MAIL-->>A: Email + standing CC — "New submission: <title>"

    A->>FE: Log in → /admin/review
    Note over FE: 3 buckets — 'Pending QC / Review' (this article)<br/>'Awaiting Consent Form' / 'Ready to Publish'
    A->>FE: Open article → read body → add comment
    FE->>API: POST /api/articles/[slug]/comments
    API->>DB: INSERT article_comments + flip articles.feedback_pending=true
    API->>MAIL: notifyFeedbackReceived (to: partner)
    MAIL-->>P: Email — "Your work has been reviewed.<br/>Please kindly proceed with the<br/>necessary revisions at your earliest convenience"
```

Code paths:
- Editor: `src/components/ArticleEditor.tsx` (PolicyProductPicker + TemplateScaffold + AuthorshipAck + AiDisclosureField)
- Picker data: `src/data/policy-products.ts` (verbatim from guideline.docx)
- Save: `src/app/api/articles/route.ts` POST → `saveArticle` in `src/lib/articles-store.ts`
- Submission email: `notifySubmissionReceived` + `notifyArticleSubmitted` in `src/lib/notify.ts`
- ETA days: `getReviewEtaDays()` reads `site_settings.review_eta_days` (default 7)
- CC list: `site_settings.notification_cc` (seeded with Amira/WB/SA, editable in /admin/settings)
- Comment thread: `src/components/CommentThread.tsx` mounted in `ArticleEditor` when `isEdit && slug`
- Review queue: `/admin/review` → `src/components/ReviewQueue.tsx`

---

## Workflow 2 — Revision to Approval

```mermaid
sequenceDiagram
    participant P as Partner
    participant FE as Web App
    participant API as /api/articles/*
    participant DB as Postgres
    participant MAIL as Email
    participant A as Admin / Reviewer

    P->>FE: Log in → /admin/articles<br/>('My Submissions' for partner role)
    Note over FE: Status badge "In Review" + 💬 feedback flag
    P->>FE: Open article → see Feedback Pending banner<br/>+ CommentThread with reviewer's comment
    P->>FE: Read feedback, revise, Submit again
    FE->>API: PUT /api/articles + transition action="submit"
    API->>DB: UPDATE articles status='in_review', feedback_pending=false
    API->>MAIL: notifyArticleSubmitted (to: admins+reviewers, CC)
    API->>MAIL: notifySubmissionReceived (to: partner)

    A->>FE: /admin/review → open article → QC again
    alt Needs more revision
        A->>FE: Add comment via CommentThread
        FE->>API: POST /api/articles/[slug]/comments
        Note over API,MAIL: feedback loop — back to top of this workflow
    else Approve
        A->>FE: Click "Approve" button (green)
        FE->>API: POST /api/articles/[slug]/transition<br/>action="approve"
        API->>API: signConsentToken(slug, 30 days)<br/>→ HMAC over slug+expiry using AUTH_SECRET
        API->>DB: UPDATE articles status='approved'
        API->>DB: INSERT submissions audit row
        API->>MAIL: notifyArticleApproved<br/>(to: partner, CC: standing list)
        MAIL-->>P: Email — "Your work has been approved.<br/>Please kindly complete and submit the<br/>consent form for publication"<br/>(includes /consent/[slug]?token=... link)
    end
```

Code paths:
- "My Submissions" filter: `src/app/admin/articles/page.tsx` calls `getArticlesByAuthor` when role=partner
- Status badge + filter chips: `src/components/ArticleList.tsx`
- Feedback banner: `src/components/ArticleEditor.tsx` (renders when `feedback_pending` is true)
- Approve button: `src/components/ApproveButton.tsx`
- Approve transition: `src/app/api/articles/[slug]/transition/route.ts` action="approve"
- Token signing: `src/lib/consent-token.ts → signConsentToken`
- Approval email: `notifyArticleApproved` in `src/lib/notify.ts`

---

## Workflow 3 — Approval to Publish

```mermaid
sequenceDiagram
    participant P as Partner
    participant FE as Consent Page<br/>(/consent/[slug]?token=...)
    participant API as /api/consent/*
    participant DB as Postgres
    participant MAIL as Email
    participant A as Admin

    P->>FE: Click email link
    FE->>API: GET /api/consent/[slug]?token=...<br/>(verifyConsentToken)
    alt Token invalid / expired
        API-->>FE: 401 with reason<br/>(malformed / bad_signature / expired / slug_mismatch)
        FE-->>P: Friendly "Link expired" page
    else Valid
        API->>DB: SELECT article (must be status='approved')
        API-->>FE: prefill { titleOfPaper, authors: [{name,affiliation:""}] }
    end

    FE->>FE: Render ConsentForm:<br/>4 author declarations (interactive)<br/>2 NADI terms (🔒 locked-acknowledged)<br/>effect clause + title + dynamic authors<br/>+ signature image upload + name + date
    P->>FE: Fill all required fields → Submit
    FE->>API: POST /api/upload/signature<br/>(JPG/PNG, max 2MB)
    API-->>FE: { url: "/uploads/signatures/..." }
    FE->>API: POST /api/consent/[slug]?token=...
    API->>API: Validate 7 acks + ≥1 author + signature + name + date
    API->>DB: INSERT article_consents
    API->>DB: UPDATE articles status='consent_received', consent_id=...
    API->>MAIL: notifyConsentReceived<br/>(to: admins+reviewers, CC: standing list)
    API-->>FE: 201 → redirect to /consent/[slug]/done

    MAIL-->>A: Email — "Consent received: <title>"
    A->>FE: /admin/review → 'Ready to Publish' bucket<br/>OR /admin/articles/[slug] → Publish button (crimson)
    A->>FE: Click "Publish"
    FE->>API: POST /api/articles/[slug]/transition action="publish"
    API->>DB: UPDATE articles status='published'
    API->>MAIL: notifyArticlePublished (to: partner, CC)
    MAIL-->>P: Email — "Your article is now live"
    Note over FE: Article appears on public /publications<br/>+ /publications/[slug] detail page
```

Code paths:
- Consent token: `src/lib/consent-token.ts` (HMAC SHA-256 over slug+expiresMs)
- Consent page: `src/app/consent/[slug]/page.tsx` (token-gated public route, no auth)
- Done page: `src/app/consent/[slug]/done/page.tsx`
- Consent form: `src/components/ConsentForm.tsx` (split into Author Declarations 1-4 interactive + NADI Terms 5-6 locked)
- Consent API: `src/app/api/consent/[slug]/route.ts` (GET prefill, POST submit)
- Signature upload: `src/app/api/upload/signature/route.ts` (validateUpload preset)
- Admin viewer: `/admin/consents` + `/admin/consents/[id]` printable detail
- Resend link: `src/app/api/articles/[slug]/resend-consent/route.ts` (admin/reviewer convenience)
- Publish button: `src/components/PublishButton.tsx`
- Publish transition: `src/app/api/articles/[slug]/transition/route.ts` action="publish"

---

## Email matrix (verbatim PDF copy where given)

| Event | To | CC | Subject / body (verbatim) |
|---|---|---|---|
| Partner signs up | All admins | Standing CC | "New contributor signup: \<name\>" |
| Admin activates partner | The partner | — | "Your NADI account is now active" |
| **Article submitted** (partner-side auto-reply) | Partner | — | **"Thank you for submitting your work. We will review your work and get back to you in {X} days"** |
| **Article submitted** (admin notification) | Reviewers + admins | Standing CC | "Article submitted for review: \<title\>" |
| **Comment posted** (admin → partner) | Partner (article author) | — | **"Your work has been reviewed. Please kindly proceed with the necessary revisions at your earliest convenience"** |
| **Article approved** | Partner | Standing CC | **"Your work has been approved. Please kindly complete and submit the consent form for publication"** (+ consent-form link) |
| **Consent received** | Admins + reviewers | Standing CC | "Consent received: \<title\>" |
| **Article published** | Partner | Standing CC | "Your article is now live" |

Standing CC list = Amira / Widyaretna Buenastuti / Soleh Ayubi @inkemaris.com.
Editable in `/admin/settings → Notification CC list`.

Helper: every notify call is **fire-and-forget**. SMTP failures log via `console.error` and never block the request lifecycle. If `SMTP_HOST` and `SMTP_USER` aren't set, the helper falls back to `console.log` so dev mode keeps working.

---

## Privacy Policy popup (Annex)

```mermaid
flowchart TD
    A[Public visitor opens nadi-health.id] --> B{localStorage.privacy_ack set?}
    B -- yes --> X[No popup]
    B -- no --> C{Path starts with /admin /login /register /consent ?}
    C -- yes --> X
    C -- no --> D[Show Kumparan-style modal]
    D --> E{Action?}
    E -- 'Nanti Saja' --> F[sessionStorage.privacy_dismissed = 1<br/>Popup hidden for this tab only]
    E -- 'Setujui Semua' --> G[POST /api/privacy-consent + IP + token]
    G --> H[localStorage.privacy_ack = UUID<br/>Popup never shown again on this browser]
```

Editable body in `/admin/settings → Privacy & Terms body`.
Component: `src/components/PrivacyPopup.tsx` + `PrivacyPopupGate.tsx` (suppression logic).

---

## Where this doc lives in the bigger picture

- **PLAN.md** — strategic scoping, phase order, open questions
- **PROGRESS.md** — implementation checklist (what's done vs deferred)
- **UAT.md** — 10 manual smoke-test scenarios for tester sign-off
- **WORKFLOW.md** (this file) — visual reference of the canonical PDF workflow

For step-by-step manual testing, see UAT.md. For the spec source, see the three artefacts in the repo root:
`Workflow Website Article Submit - QC - Publish.pdf`,
`NADI Policy Product Guideline and Templates.docx`,
`Consent-to-publish form.docx`.
