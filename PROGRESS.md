# Implementation Progress

Tracker for the work in `PLAN.md`. Tick boxes as items land. Keep ordering aligned with `PLAN.md` §5 (Implementation Order).

**Status legend** — `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked / needs decision

---

## Phase 1 — Roles & Approval Foundation

### 1.1 Database

- [ ] Add `status VARCHAR(20) DEFAULT 'pending'` to `users` (values: `pending|active|suspended`)
- [ ] Widen `users.role` allowed values: `admin | reviewer | contributor | partner` (keep VARCHAR; enforce in app)
- [ ] Backfill existing users → `status='active'` and remap `role='user'` → `role='contributor'`
- [ ] Add `status VARCHAR(20) DEFAULT 'draft'` to `articles`, `media`, `events` (`draft|in_review|published`)
- [ ] Backfill existing rows → `status='published'`
- [ ] Create `submissions` table (`id, type, ref_slug, author_id, reviewer_id, status, notes, created_at, updated_at`)
- [ ] Create `user_events` audit table (`id, actor_id, target_user_id, action, meta JSONB, created_at`)
- [ ] Wire all of the above into `src/lib/db.ts → migrate()`; verify `/api/db/migrate` is idempotent

### 1.2 Auth & registration

- [ ] Reject sign-in if `users.status !== 'active'` in `src/lib/auth.ts` authorize callback
- [ ] Add public `/register` page (email, name, password, role default `contributor`)
- [ ] `POST /api/register` creates row with `status='pending'`
- [ ] Email notify admins + standing CC list on signup (see Phase 3)
- [ ] `/admin/users` lists pending users with **Activate** / **Reject** actions
- [ ] Sidebar badge: count of `users.status='pending'`
- [ ] Audit log row written on activate/reject

### 1.3 Submission workflow

- [ ] `POST /api/articles/[slug]/submit` → `status='in_review'`
- [ ] `POST /api/articles/[slug]/approve` (reviewer/admin only) → `status='published'`
- [ ] `POST /api/articles/[slug]/request-changes` → `status='draft'` + persist reviewer notes
- [ ] Same trio for `/api/media/[slug]/*` and `/api/events/[slug]/*`
- [ ] Public endpoints (`/api/public/articles`, `.../media`, `.../events`) filter `status='published'`
- [ ] Admin "Review queue" page: `/admin/review` lists everything in `in_review` across types
- [ ] Article/media/event editors get a **Submit for review** button (replaces direct Publish for non-admins)
- [ ] Permission middleware (`src/lib/permissions.ts`) for `canPublish`, `canReview`, `canEdit(item, user)`

---

## Phase 2 — Notifications

- [ ] Pick mailer (Resend recommended) and add `RESEND_API_KEY` to env
- [ ] `src/lib/notify.ts` — single entrypoint `notify({ event, payload })`
- [ ] React Email templates in `src/emails/*.tsx` for: signup, activation, submitted, approved, changes-requested
- [ ] `site_settings.notification_cc` stores CC list (default: Amira / Widyaretna / Soleh — see PLAN §3.2)
- [ ] `/admin/settings` UI to edit the CC list
- [ ] Wire `notify()` into all events from PLAN §3.1
- [ ] Sends are async + error-logged (do **not** await in API handlers; use `waitUntil` or fire-and-forget)
- [ ] Smoke test: signup triggers email to admins + CC list; publish triggers email to author + CC list

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
