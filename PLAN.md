# NADI Platform — Roadmap & Implementation Plan

This document captures the agreed scope for the next iteration of the NADI platform: **role management with approval workflows, content/copy refinements, multi-channel notifications, and collaboration features**. Each section maps directly to the work items in `PROGRESS.md`.

---

## 1. Role Management

### 1.1 Roles

| Role            | Purpose                                                                 | Self-register? | Auth gate          |
| --------------- | ----------------------------------------------------------------------- | -------------- | ------------------ |
| **admin**       | Full platform control — users, settings, publishing, moderation         | No (seeded)    | —                  |
| **reviewer**    | Reviews & approves contributor submissions before they go live          | No             | Activated by admin |
| **contributor** | Drafts articles, media, events; submits for review                      | **Yes**        | Activated by admin |
| **partner**     | Read-only "trusted" view (early access, internal docs); can post events | No             | Activated by admin |

> Database column today (`users.role`) is `"admin" | "user"`. Needs to widen to the 4 roles above + a `status` column (`pending | active | suspended`).

### 1.2 Permission matrix

Legend: ✅ allowed · 👁 read-only · ✏️ create/edit own only · 🛑 blocked

| Capability                          | admin | reviewer | contributor | partner |
| ----------------------------------- | :---: | :------: | :---------: | :-----: |
| Manage users (activate/role/delete) |  ✅   |    🛑    |     🛑      |   🛑    |
| Approve registrations               |  ✅   |    🛑    |     🛑      |   🛑    |
| Publish article (final)             |  ✅   |    ✅    |     🛑      |   🛑    |
| Submit article (draft → review)     |  ✅   |    ✅    |     ✅      |   🛑    |
| Edit any article                    |  ✅   |    ✅    |   ✏️ own    |   🛑    |
| Publish media                       |  ✅   |    ✅    |     🛑      |   🛑    |
| Submit media                        |  ✅   |    ✅    |     ✅      |   🛑    |
| Publish event                       |  ✅   |    ✅    |     ✅\*    |   ✅\*  |
| Edit team / settings                |  ✅   |    🛑    |     🛑      |   🛑    |
| Topic chat (dashboard)              |  ✅   |    ✅    |     ✅      |   👁    |
| View admin docs                     |  ✅   |    ✅    |     ✅      |   👁    |
| Download role template (Opinion)    |  ✅   |    ✅    |     ✅      |   👁    |

\* Events posted by contributor/partner still flow through the review queue when the event date is **> 7 days out**, so they don't bypass moderation. "Mendekat" (imminent, < 7 days) events bypass review for contributors only — they're time-critical and signed off implicitly.

### 1.3 Registration & activation flow

```
Sign-up form (public)
        │
        ▼
  user row inserted
  status = 'pending'
  role   = 'contributor'  (default; admin can change later)
        │
        ▼
  email → admin queue + CC list   (see §3 Notifications)
        │
        ▼
  Admin opens /admin/users
  → click "Activate" → status='active'   OR   "Reject" → row deleted
        │
        ▼
  user receives activation email; can now sign in
```

**Acceptance criteria**

- A pending user **cannot** sign in (auth callback rejects `status !== 'active'`).
- Admin sees a "Pending approvals" badge in sidebar with count.
- Activation/rejection is logged (audit trail in `user_events` table).

### 1.4 Publish approval workflow

Articles, media, and "future" events all share one submission state machine:

```
draft  ──submit──▶  in_review  ──approve──▶  published
                       │                          ▲
                       └──request_changes──▶ draft (with reviewer notes)
```

- New table `submissions(id, type, ref_slug, author_id, reviewer_id, status, notes, created_at, updated_at)`
- `articles.status`, `media.status`, `events.status` columns added (`draft | in_review | published`)
- `/api/articles/[slug]/submit`, `.../approve`, `.../request-changes` endpoints
- **Public APIs (`/api/public/*`) only return `status='published'`** — no leaks of drafts.

---

## 2. Content & Copy Changes

### 2.1 Categories

Rename in **all places** — DB seed values, dropdowns, filter chips, validators, AI prompts:

| Old                  | New               |
| -------------------- | ----------------- |
| `WORKING PAPER`      | `OPINION`         |
| `STRATEGIC ANALYSIS` | `POLICY ANALYSIS` |

Migration: `UPDATE articles SET category = 'OPINION' WHERE category = 'WORKING PAPER';` (and likewise for Policy Analysis). Idempotent — safe to run multiple times.

Files to update (non-exhaustive — check with global rename):

- `src/components/ArticleEditor.tsx` (the `<select>` options)
- `src/app/publications/page.tsx` (the `CATEGORIES` constant)
- `src/components/PublicationsList.tsx`
- `src/data/articles/types.ts` (if categories are union-typed)
- AI prompt files in `src/app/api/ai/*`

### 2.2 Templates per role

Each role (admin, reviewer, contributor) gets a downloadable **Opinion template** (`.docx`) that they can fill out, and the editor accepts an upload that pre-populates the article. The template defines the expected sections (intro, argument, references) so submissions are uniform.

- Storage: `public/templates/{role}-opinion-template.docx` (and PDF preview)
- UI: button "Download Opinion Template" + "Upload Filled Template" in `ArticleEditor.tsx`
- Backend: `/api/articles/parse-template` extracts sections via [`mammoth`](https://www.npmjs.com/package/mammoth) → returns block array

> Future: same pattern for "Policy Analysis", "Research Paper", "Policy Brief" — start with Opinion only.

### 2.3 Section copy

#### Events & Engagements

> Subtitle (below title): "If you want to share any events or engagements through NADI, feel free to contact us."

#### Media & Learning Materials

- Rename section title `Media` → **Media & Learning Materials**
- Rename internal label `Resources` → **Learning Materials**
- Subtitle: "If you want to share any videos, podcasts, reels, webinar talks, and other materials for knowledge sharing through NADI, feel free to contact us."
- Add **TikTok** and **Instagram** as embed source types (alongside YouTube). Update:
  - `src/data/media/types.ts` — extend `MediaType` union
  - `src/components/MediaListPublic.tsx` — render tiktok/ig embeds
  - `src/app/admin/media/[slug]/page.tsx` — accept those URLs in the editor
- Add a **Keywords** field on each media item (text[] in DB, comma-separated in editor) for search/SEO — mirror the `seo_keywords` pattern used by articles.

---

## 3. Notifications

### 3.1 Trigger map

| Event                          | To                                | CC                                     |
| ------------------------------ | --------------------------------- | -------------------------------------- |
| New user signup                | All admins                        | Standing CC list (below)               |
| User activated                 | The user                          | —                                      |
| Article submitted for review   | All reviewers + admins            | Standing CC list                       |
| Article approved/published     | Author                            | Standing CC list                       |
| Article changes requested      | Author                            | —                                      |
| Media submitted / published    | Reviewers (submit) / Author (pub) | Standing CC list (on publish)          |
| Event submitted / published    | Reviewers (submit) / Author (pub) | Standing CC list (on publish)          |
| Newsletter subscriber added    | All admins                        | —                                      |
| Topic chat @mention            | The mentioned user                | —                                      |

### 3.2 Standing CC list

These three addresses are CC'd on **every publish** (article, media, event) and on **every new signup**:

```
Amira <amira.hn@inkemaris.com>
Widyaretna Buenastuti <widyaretna.buenastuti@inkemaris.com>
Soleh Ayubi <soleh.ayubi@inkemaris.com>
```

Stored as a JSON array in `site_settings` under key `notification_cc` so it's editable from `/admin/settings` without a code change.

### 3.3 Implementation

- Use Resend (already in `package.json` if present) or nodemailer over SMTP.
- One helper: `src/lib/notify.ts` — `notify({ event, payload })` looks up recipients + CC list, renders MJML template, sends.
- Templates in `src/emails/*.tsx` (React Email).
- All sends are **fire-and-forget** with error logging — must never block the request lifecycle.

---

## 4. Dashboard Topic Chat

A lightweight in-app discussion thread on the admin dashboard so admins/reviewers/contributors can debate research topics before a topic graduates into an article assignment.

- New table: `topic_threads(id, topic_id, title, created_by, created_at)` and `topic_messages(id, thread_id, author_id, body, created_at)`
- UI: `/admin/topics/[id]` shows the topic + a chat panel (reverse-chronological).
- Realtime is **out of scope for v1** — poll every 15s, or use SWR + manual refresh.
- @mention support → triggers email notification (see §3.1).
- Markdown rendering in messages (use `react-markdown`, sanitize).

> **Why on the topics page?** The current `/admin/topics` route already exists for topic ideation. Threading it onto the same record keeps context in one place rather than a separate inbox.

---

## 5. Implementation Order (suggested)

1. **DB migration & roles foundation** — `users.status`, role union widened, `submissions` table, `*_status` columns. Safe to ship behind admin-only UI.
2. **Auth gate** — block `status='pending'` from signing in; admin-side activation UI.
3. **Submission workflow API** — endpoints for submit/approve/request-changes; gate public APIs to `published`.
4. **Notifications** — wire up `notify()` for the events above. Settings UI for CC list.
5. **Copy & category renames** — small but visible; do as a single pass.
6. **Media: TikTok/IG + Keywords** — backwards-compatible additions.
7. **Templates (download/upload)** — Opinion first, expand later.
8. **Topic chat** — last, since it's the most contained net-new surface.

Ship 1–4 in one branch (the role/approval foundation); 5 onward can ship incrementally.

---

## 6. Out of Scope (deliberate)

- Full audit log UI (only the underlying `user_events` table for now)
- Realtime websockets for chat (poll-based v1 is enough)
- 2FA / SSO
- Public profile pages for contributors
- File-attachment in chat messages (text only for v1)

These are flagged so they don't creep silently.
