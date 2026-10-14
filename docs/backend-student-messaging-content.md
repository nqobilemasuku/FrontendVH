# Backend contract — student data, notifications, messaging & admin content

> Status: **none of these are live yet** (the deployed `/openapi/v1.json` still
> only exposes the original student endpoints). The frontend is wired to the
> paths below and activates when the C# backend ships them.
>
> **No new migration needed** — every endpoint here reads/writes tables that
> already exist in `20260724000000_init.sql` (`payments`, `events`,
> `accommodations`, `conversations`, `conversation_participants`, `messages`,
> `career_recommendations`, `notifications`, `documents`, `job_applications`,
> `saved_jobs`, `bursary_applications`, `bursary_bookmarks`).
>
> Responses are **camelCase**; `date` → `yyyy-MM-dd`, `timestamptz` → ISO-8601.
> "current student" = `auth.uid()` (students share the profile id).

---

## 1. Student dashboard & profile

### `GET /api/me/summary`
Aggregate for the dashboard tiles. Compute for the current student:
```jsonc
{
  "applications": 3,           // count(applications where student_id = me)
  "feePaid": true,             // exists(payments where student_id = me and status='paid' and description ~ 'application fee')
  "unreadNotifications": 5,    // count(notifications where user_id = me and not is_read)
  "upcomingDeadlines": 2,      // count(programmes/applications with a future deadline) — your call
  "aps": 34                    // the student's computed APS (same value as /api/me/aps), or null
}
```
The frontend treats every field as optional — extra fields are fine.

### `GET /api/me/recommendations`
Counsellor career recommendations for the current student, from
`career_recommendations`:
```jsonc
[{ "id": "…", "title": "Consider a BSc in Data Science", "body": "Based on your Maths + IT marks…", "createdAt": "…" }]
```

### `GET /api/me/payments`
The student's payment history from `payments` (newest first):
```jsonc
[{ "amount": 150.00, "currency": "ZAR", "method": "card", "status": "paid",
   "reference": "VH-…", "paidAt": "…", "createdAt": "…" }]
```

---

## 2. Jobs & Bursaries — student tabs

Add to the existing controllers (student-scoped):

| Method | Path | Returns |
| --- | --- | --- |
| GET | `/api/Jobs/mine` | `[{ id, jobId, title, company, status, appliedAt }]` — my `job_applications` joined to `jobs` |
| GET | `/api/Jobs/saved` | full `Job[]` — `jobs` joined via `saved_jobs` for me |
| GET | `/api/Jobs/{id}` | single `Job` detail |
| GET | `/api/Bursaries/mine` | my `bursary_applications` joined to `bursaries` `[{ id, bursaryId, name, provider, status, submittedAt }]` |
| GET | `/api/Bursaries/bookmarked` | full `Bursary[]` via `bursary_bookmarks` |
| GET | `/api/Bursaries/{id}` | single `Bursary` detail |

`Job` / `Bursary` shapes are the same as `GET /api/Jobs` / `GET /api/Bursaries`.

---

## 3. Documents

### Upload flow (three steps — already partly live)
1. `POST /api/Documents/upload-url { filename }` → **`{ uploadUrl, storagePath }`**.
   `uploadUrl` is a **short-lived signed URL** the browser can write to directly
   (Supabase Storage signed upload URL / presigned S3 PUT). `storagePath` is the
   object key to persist in step 3.
2. The browser does `PUT {uploadUrl}` with the raw file body and its
   `Content-Type` — **no app Authorization header** (it's a signed URL). The
   backend must issue a URL that accepts this PUT.
3. `POST /api/Documents { name, type, storagePath, sizeBytes }` → creates the
   `documents` row and returns `DocumentDetail`.

`type` MUST be one of the `document_type` enum values:
`id | passport | matric_certificate | results | proof_of_residence | study_permit | cv | other`.
(The frontend previously sent non-enum values like `academic`/`photo` — those are
gone; reject anything not in the enum.)

### `DELETE /api/Documents/{id}`
Delete the current user's document (row in `documents` + the storage object).
Enforce ownership (404 if not theirs). Return 204.

---

## 4. Notifications (add two)

| Method | Path | Behaviour |
| --- | --- | --- |
| GET | `/api/Notifications/unread-count` | `{ "count": 5 }` — `count(notifications where user_id = me and not is_read)`. The bell in every dashboard shell polls this every 60s. |
| PATCH | `/api/Notifications/read-all` | mark ALL of the caller's notifications read; return 204. |

(`GET /api/Notifications` and `PATCH /api/Notifications/{id}/read` already exist.)

---

## 5. Messaging (`conversations` / `conversation_participants` / `messages`)

A user only sees conversations they're a participant of
(`conversation_participants.profile_id = me`).

| Method | Path | Body | Returns / behaviour |
| --- | --- | --- | --- |
| GET | `/api/conversations` | — | `[{ id, subject, lastMessage, lastMessageAt, unreadCount }]`. `lastMessage`/`lastMessageAt` = latest message; `unreadCount` = messages in the convo with `read_at is null` and `sender_id <> me`. |
| GET | `/api/conversations/{id}/messages` | — | `[{ id, senderId, body, readAt, createdAt }]` ordered oldest→newest. 403 if not a participant. |
| POST | `/api/conversations/{id}/messages` | `{ body }` | insert `messages` (`sender_id = me`); return the created message. **Notify** the other participant(s) (category `message`). |
| PATCH | `/api/conversations/{id}/read` | — | set `read_at = now()` on messages in the convo where `sender_id <> me and read_at is null`; return 204. |
| POST | `/api/conversations` | `{ subject, participantIds: string[], message }` | create `conversations` (`created_by = me`), insert `conversation_participants` for me + each `participantIds`, insert the first `messages` row, **notify** participants. Return `{ id }`. |

---

## 6. Super-admin content (so the student hubs aren't empty)

All `super_admin` only (403 otherwise). Tables: `events`, `accommodations`,
`faculties`. Standard REST list/create/update/delete + `applicantCount`-style
extras not needed here.

### Events — `events`
| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/events` | — | all events |
| POST | `/api/admin/events` | `NewEvent` | `created_by = me` |
| PATCH | `/api/admin/events/{id}` | partial | |
| DELETE | `/api/admin/events/{id}` | — | |

`NewEvent` columns: `title`, `type` (`career_fair|workshop|networking|open_day|seminar`),
`host?`, `location?`, `isOnline?`, `capacity?`, `startsAt` (required), `endsAt?`, `description?`.

### Accommodations — `accommodations`
`GET/POST /api/admin/accommodations`, `PATCH/DELETE /api/admin/accommodations/{id}`.
Columns: `name`, `type` (`single_room|shared_room|bachelor|res|apartment`),
`pricePerMonth`, `campus?`, `distanceText?`, `rating?`, `amenities` (string[]),
`isVerified?`, `nsfasAccredited?`, `isActive?`.

### Faculties (super-admin, any university) — `faculties`
| Method | Path | Body | Notes |
| --- | --- | --- | --- |
| GET | `/api/admin/faculties?universityId={id}` | — | faculties for that university |
| POST | `/api/admin/faculties` | `{ universityId, name }` | |
| PATCH | `/api/admin/faculties/{id}` | `{ name }` | rename |
| DELETE | `/api/admin/faculties/{id}` | — | |

(This is the super-admin counterpart of the existing `/api/uni-admin/faculties`,
which is scoped to the admin's own university.)

---

## 7. Dev-only: testing the apply flow without PayFast

Guard behind config `Payments__AllowDevConfirm=true` (dev/local only; **must be
false in production**):

- `POST /api/payments/dev/mark-paid` — mark the current student's application fee
  paid (insert/update a `payments` row `status='paid'`), so `application-fee/status`
  flips to paid and applications can be submitted without a real PayFast round-trip.
