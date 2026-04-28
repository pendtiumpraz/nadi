# Implementation Progress

Tracker for the work in `PLAN.md`. Tick boxes as items land. Keep ordering aligned with `PLAN.md` §5 (Implementation Order).

**Status legend** — `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked / needs decision

---

## Phase 1 — Roles & Approval Foundation

### 1.1 Database

- [x] Add `status VARCHAR(20) DEFAULT 'pending'` to `users` (values: `pending|active|suspended`)
- [x] Widen `users.role` allowed values: `admin | reviewer | contributor | partner` (enforced in app via union type)
- [x] Backfill existing users → `status='active'` and remap `role='user'` → `role='contributor'`
- [x] Add `status VARCHAR(20) DEFAULT 'published'` to `articles`, `media`, `events` (existing rows backfilled to `published` via DEFAULT)
- [x] Add nullable `author_id` to articles/media/events for tracking
- [x] Create `submissions` table (`id, type, ref_slug, author_id, reviewer_id, status, notes, created_at, updated_at`)
- [x] Create `user_events` audit table (`id, actor_id, target_user_id, action, meta JSONB, created_at`)
- [x] Wire all of the above into `src/lib/db.ts → migrate()`; idempotent (uses ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS)

### 1.2 Auth & registration

- [x] Reject sign-in if `users.status !== 'active'` in `src/lib/auth.ts` authorize callback (throws PENDING_APPROVAL or ACCOUNT_SUSPENDED)
- [x] Add public `/register` page (name, email, password — role hard-coded to contributor)
- [x] `POST /api/register` creates row with `status='pending'` + writes `user_events` audit row
- [ ] Email notify admins + standing CC list on signup (see Phase 2)
- [x] `/admin/users` filters pending/active/suspended; shows count per filter; Activate / Suspend / Reactivate buttons
- [x] Audit log row written on activate / suspend / role change / delete (via `user_events`)
- [x] Login page surfaces clear error for pending and suspended states; links to `/register`
- [ ] Sidebar badge: count of `users.status='pending'` (filter chip on /admin/users covers it for now)

### 1.3 Submission workflow

- [x] Permission helper (`src/lib/permissions.ts`) — `canPublish`, `canReview`, `canManageUsers`, `canEditOwnContent`, `canCreateContent`
- [x] `POST /api/articles/[slug]/transition` — handles submit / approve / request_changes in one endpoint
- [x] Public endpoints filter to `status='published'` (`/api/public/articles`, `.../media`, `.../events` — events use `publish_status` to avoid colliding with the existing lifecycle column)
- [x] `getAllArticlesAsync` (server-side data layer) also filters to published
- [x] Admin "Review queue" at `/admin/review` (gated to reviewer/admin) — lists pending articles with Approve / Request Changes
- [x] `ArticleEditor` shows current status badge + role-aware buttons (Update & Publish / Submit for Review / Save as Draft)
- [x] `POST /api/articles` honors role: contributor saves as draft (or in_review if `submit:true`); admin/reviewer can publish directly
- [x] `PUT /api/articles` enforces `canEditOwnContent` and same status policy
- [ ] Mirror `transition` endpoint + editor buttons for media (`/api/media/[slug]/transition`) — DEFERRED
- [ ] Mirror `transition` endpoint + editor buttons for events (`/api/events/[slug]/transition`) — DEFERRED

### 1.4 Role × Menu access matrix (admin only)

- [x] Default matrix in `src/lib/permissions-matrix.ts` (admin: all; reviewer/contributor/partner subsets)
- [x] Persisted in `site_settings.role_menu_matrix` JSON
- [x] `/admin/permissions` page (admin-only) — checkbox grid; admin row locked
- [x] `GET / PUT /api/permissions` — GET open to any logged-in user; PUT admin-only
- [x] `AdminNav` filters sidebar links by the saved matrix; new keys: review, permissions

---

## Phase 2 — Notifications

- [x] Mailer: nodemailer (already installed). Reads `SMTP_HOST/PORT/USER/PASS/FROM` env. Falls back to console.log when SMTP isn't configured (so dev works).
- [x] `src/lib/notify.ts` — typed events + helper functions (`notifyUserSignup`, `notifyUserActivated`, `notifyArticleSubmitted`, `notifyArticleApproved`, `notifyArticleChangesRequested`)
- [x] Inline HTML/text templates per event (small, branded — same NADI dark header as the contact form template)
- [x] `site_settings.notification_cc` seeded with Amira / Widyaretna / Soleh @inkemaris.com
- [x] `/admin/settings` UI: CC list editor (add / remove / save)
- [x] Wired into `/api/register`, `/api/users` PATCH (status=active), and `/api/articles/[slug]/transition`
- [x] All sends are fire-and-forget (`.catch(() => {})`); failures logged via `console.error` and never block the request
- [ ] Smoke test on staging once SMTP creds are set

---

## Phase 3 — Copy & Category Renames

- [x] DB migration: `UPDATE articles SET category='OPINION' WHERE category='WORKING PAPER'`
- [x] DB migration: `UPDATE articles SET category='POLICY ANALYSIS' WHERE category='STRATEGIC ANALYSIS'`
- [x] Update editor `<select>` options in `src/components/ArticleEditor.tsx`
- [x] Update `CATEGORIES` constant in `src/app/publications/page.tsx` and `PublicationsList.tsx`
- [x] Update any AI prompt that mentions the old names (`src/app/api/ai/*`)
- [x] Update admin docs page (`src/app/admin/docs/DocsClient.tsx`)
- [x] Add **Events & Engagements** subtitle on `/events` page
- [x] Rename `Resources` → `Learning Materials` (label only — slugs stay)
- [x] Section title → `Media & Learning Materials`
- [x] Add subtitle below `Media & Learning Materials` (copy in PLAN §2.3)
- [x] V2PageLayout extended with optional `subtitle` prop + matching CSS class
- [x] Navbar link kept as short `Media` (full title only on page header)

---

## Phase 4 — Media: TikTok / Instagram / Keywords

- [x] Extend `MediaType` union in `src/data/media/types.ts` (add `tiktok`, `instagram`, `reel`)
- [x] Add `keywords TEXT[]` column to `media` table (migration in `src/lib/db.ts`)
- [x] Editor: Keywords field (new + edit pages)
- [x] Editor: TikTok/IG URL normalizer (auto-converts watch URL → embed URL)
- [x] Public `/media` page renders TikTok/IG embeds with vertical (9:16) modal
- [x] `/api/public/media` returns `keywords`
- [ ] Generate thumbnails for TikTok/IG (requires oEmbed API; deferred — fallback gradient placeholder used for now)

---

## Phase 5 — Opinion Templates (download / upload)

- [ ] Author Opinion `.docx` template, save to `public/templates/opinion-template.docx`
- [ ] (Optional) PDF preview at `public/templates/opinion-template-preview.pdf`
- [ ] Editor button: **Download Opinion Template**
- [ ] Editor button: **Upload Filled Template**
- [ ] `POST /api/articles/parse-template` — parse uploaded `.docx` (mammoth) → block array
- [ ] Pre-populate editor state from parsed blocks
- [ ] (Future) replicate for Policy Analysis / Research Paper / Policy Brief — defer until Opinion ships

---

## Phase 6 — Dashboard Topic Chat

- [ ] DB: `topic_threads`, `topic_messages` tables (migration)
- [ ] `/admin/topics/[id]` page renders thread + message list
- [ ] `POST /api/topics/[id]/messages` — auth required
- [ ] `GET /api/topics/[id]/messages?since=...` — for polling
- [ ] Markdown rendering with sanitization
- [ ] @mention parsing → trigger email notify
- [ ] Poll every 15s on the page (no websockets in v1)

---

## Phase 7 — Contributor / Partner Event posting

- [ ] Allow contributor to create event, with the < 7-day fast-path described in PLAN §1.2
- [ ] Allow partner to create event (always goes through review queue)
- [ ] Audit log entries on both paths

---

## Sign-off Checklist (before declaring "done")

- [ ] All migrations applied on staging DB; `/api/db/migrate` re-run verified idempotent
- [ ] Manual QA: sign up → admin activate → contributor submits article → reviewer approves → public sees it; emails received at every step
- [ ] Manual QA: TikTok + Instagram embeds render on `/media` and on detail pages
- [ ] Manual QA: Opinion template round-trip (download → fill → upload → publish) produces a valid article
- [ ] All public APIs verified to return only `status='published'` rows
- [ ] No regressions on existing newsletter, contact, AI generation flows
- [ ] CC list is editable from `/admin/settings`, not hardcoded
- [ ] `PLAN.md` and this `PROGRESS.md` updated with anything that drifted during implementation

---

## Notes / Open Questions

_Use this section to log decisions, blockers, and follow-ups as work proceeds._

- (none yet)
