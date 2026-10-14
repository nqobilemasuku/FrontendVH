# Backend contract — Jobs & Bursaries administration + Employer role

> Status: **the API does not implement any of this yet.** The live spec
> (`/openapi/v1.json`) currently exposes only the student-facing endpoints:
> `GET /api/Jobs`, `GET /api/Jobs/recommended`, `POST /api/Jobs/{id}/save|apply`,
> `GET /api/Bursaries`, `GET /api/Bursaries/recommended`,
> `POST /api/Bursaries/{id}/bookmark|apply`.
>
> The frontend screens listed at the bottom are built against the contract below.
> They will 404 until the C# backend implements these routes and you run the
> `employer role` migration in Supabase.

All routes require a Bearer JWT. Roles come from the `user_role` enum.
JSON is camelCase (the API already serializes camelCase elsewhere).

---

## 1. Super-admin — Jobs

`super_admin` only (RLS: `jobs: admin write`).

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/admin/jobs` | — | `AdminJob[]` |
| POST | `/api/admin/jobs` | `NewJob` | `AdminJob` |
| PATCH | `/api/admin/jobs/{id}` | `UpdateJob` | `AdminJob` |
| DELETE | `/api/admin/jobs/{id}` | — | 204 |
| GET | `/api/admin/jobs/{id}/applicants` | — | `JobApplicant[]` |
| PATCH | `/api/admin/job-applications/{id}` | `UpdateJobAppStatus` | `JobApplicant` |

On create, set `posted_by = current user id`.

## 2. Super-admin — Bursaries

`super_admin` only (RLS: `bursaries: admin write`).

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/admin/bursaries` | — | `AdminBursary[]` |
| POST | `/api/admin/bursaries` | `NewBursary` | `AdminBursary` |
| PATCH | `/api/admin/bursaries/{id}` | `UpdateBursary` | `AdminBursary` |
| DELETE | `/api/admin/bursaries/{id}` | — | 204 |
| GET | `/api/admin/bursaries/{id}/applicants` | — | `BursaryApplicant[]` |
| PATCH | `/api/admin/bursary-applications/{id}` | `UpdateBursaryAppStatus` | `BursaryApplicant` |

On create, set `created_by = current user id`.

## 2b. University-admin — Bursaries (offered at their university)

`university_admin` only. Requires the `university_id` column added by
`supabase/migrations/20260817000000_bursary_university.sql`. Scope every query to
the admin's linked university (same inference as `/api/uni-admin/programmes`).

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/uni-admin/bursaries` | — | `AdminBursary[]` (only `where university_id = <my uni>`) |
| POST | `/api/uni-admin/bursaries` | `NewBursary` (no universityId) | `AdminBursary` — set `university_id = my uni`, `created_by = me` |
| PATCH | `/api/uni-admin/bursaries/{id}` | `UpdateBursary` | own-university only → 404 otherwise |
| DELETE | `/api/uni-admin/bursaries/{id}` | — | own-university only |
| GET | `/api/uni-admin/bursaries/{id}/applicants` | — | `BursaryApplicant[]` (own bursary) |
| PATCH | `/api/uni-admin/bursary-applications/{id}` | `UpdateBursaryAppStatus` | own bursary; **notify student** (category `bursary`) |

Add an optional `universityId: string | null` to `AdminBursary` (null = national,
super-admin managed; non-null = university-specific). The existing
`/api/admin/bursaries` list should keep returning national bursaries; whether it
also returns university ones is your call (recommend: super admin sees all).

## 3. Employer (self-service) — role = `employer`

An employer owns **their own** jobs only. Scoping is by `jobs.posted_by = auth.uid()`.
`company` on new jobs is inferred from the employer's profile (ignore any client value).

| Method | Path | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/employer/profile` | — | `EmployerProfile` |
| PATCH | `/api/employer/profile` | `UpdateEmployerProfile` | `EmployerProfile` |
| GET | `/api/employer/jobs` | — | `AdminJob[]` (own) |
| POST | `/api/employer/jobs` | `NewJob` (company ignored) | `AdminJob` |
| PATCH | `/api/employer/jobs/{id}` | `UpdateJob` | `AdminJob` (own only → 403/404) |
| DELETE | `/api/employer/jobs/{id}` | — | 204 (own only) |
| GET | `/api/employer/jobs/{id}/applicants` | — | `JobApplicant[]` (own job only) |
| PATCH | `/api/employer/job-applications/{id}` | `UpdateJobAppStatus` | `JobApplicant` (own job only) |

`GET /api/me` must return `role: "employer"` for these users.

---

## DTOs

```ts
// jobs
type JobType = "internship" | "graduate_programme" | "part_time";
type JobAppStatus = "applied" | "viewed" | "interview" | "offer" | "rejected" | "withdrawn";

interface AdminJob {
  id: string;
  title: string;
  company: string;
  type: JobType;
  location: string | null;
  salaryText: string | null;
  description: string | null;
  tags: string[];
  isRemote: boolean;
  closesOn: string | null;   // ISO date
  isActive: boolean;
  applicantCount: number;    // count of job_applications for this job
}
interface NewJob {
  title: string;
  company?: string | null;   // super-admin sets; employer route ignores
  type: JobType;
  location?: string | null;
  salaryText?: string | null;
  description?: string | null;
  tags?: string[];
  isRemote?: boolean;
  closesOn?: string | null;
}
interface UpdateJob {         // all optional (partial update)
  title?: string;
  company?: string | null;
  type?: JobType;
  location?: string | null;
  salaryText?: string | null;
  description?: string | null;
  tags?: string[];
  isRemote?: boolean;
  closesOn?: string | null;
  isActive?: boolean;
}
interface JobApplicant {
  id: string;                // job_applications.id
  studentId: string;
  studentName: string;
  studentEmail: string;
  cvDocumentId: string | null;
  status: JobAppStatus;
  appliedAt: string;
}
interface UpdateJobAppStatus { status: JobAppStatus; }

// bursaries
type BursaryField = "engineering" | "it_science" | "commerce" | "health" | "education" | "law" | "arts" | "other";
type BursaryAppStatus = "draft" | "submitted" | "under_review" | "approved" | "rejected";

interface AdminBursary {
  id: string;
  name: string;
  provider: string;
  field: BursaryField;
  amountText: string | null;
  covers: string[];
  minAps: number | null;
  description: string | null;
  closesOn: string | null;   // ISO date
  isActive: boolean;
  applicantCount: number;
}
interface NewBursary {
  name: string;
  provider: string;
  field: BursaryField;
  amountText?: string | null;
  covers?: string[];
  minAps?: number | null;
  description?: string | null;
  closesOn?: string | null;
}
interface UpdateBursary {     // all optional
  name?: string;
  provider?: string;
  field?: BursaryField;
  amountText?: string | null;
  covers?: string[];
  minAps?: number | null;
  description?: string | null;
  closesOn?: string | null;
  isActive?: boolean;
}
interface BursaryApplicant {
  id: string;                // bursary_applications.id
  studentId: string;
  studentName: string;
  studentEmail: string;
  status: BursaryAppStatus;
  submittedAt: string;
}
interface UpdateBursaryAppStatus { status: BursaryAppStatus; }

// employer
interface EmployerProfile {
  id: string;                // = profiles.id
  companyName: string;
  website: string | null;
  logoUrl: string | null;
  isVerified: boolean;
}
interface UpdateEmployerProfile {
  companyName?: string;
  website?: string | null;
  logoUrl?: string | null;
}
```

---

## Database migration (run in Supabase)

See `supabase/migrations/20260814000000_employer_role.sql`. Summary:

1. `ALTER TYPE user_role ADD VALUE 'employer'` — **must be committed on its own**
   (Postgres forbids using a new enum value in the same transaction it was added).
   Run step 1 first, then run the rest.
2. `public.employers` table (profile-linked, like `students`).
3. RLS: employers manage their own row; a new `job_apps: employer view/update`
   policy lets an employer read + update applications to jobs they posted.
   (`jobs: admin write` already permits `posted_by = auth.uid()`, so employers can
   already insert/update/delete their own jobs — no change needed there.)

---

# Implementation guide — exactly what the backend does

Everything on these screens comes from the API. Below is the precise behaviour
each endpoint must implement. DB columns are snake_case; **serialize responses as
camelCase** (`salary_text → salaryText`, `closes_on → closesOn`, `full_name →
studentName`, …). Emit `date` columns as `yyyy-MM-dd` and `timestamptz` as ISO-8601.

## 0. Cross-cutting rules

- **Every route requires a valid Bearer JWT.** Reject with 401 if missing/expired.
- **Role gate:**
  - `/api/admin/*` → caller's profile role must be `super_admin`, else **403**.
  - `/api/employer/*` → role must be `employer`, else **403**.
- **Data access:** run queries with the caller's JWT so Postgres RLS applies
  (the policies above already scope employers to their own jobs and admins to
  everything). **Notification inserts must use the service-role key** — RLS blocks
  a user from inserting a notification for another user (see §6).
- **Ownership on employer writes:** `PATCH/DELETE /api/employer/jobs/{id}` and the
  employer applicant routes must confirm `jobs.posted_by = caller`. If the job
  exists but isn't theirs → **404** (don't leak other employers' ids).
- **Error codes:** 400 validation, 403 wrong role, 404 not found / not owner,
  409 on unique violations (a student applying twice — `unique(job_id, student_id)`).

## 1. Super-admin — Jobs

- `GET /api/admin/jobs`
  ```sql
  select j.*, (select count(*) from job_applications ja where ja.job_id = j.id) as applicant_count
  from jobs j order by j.created_at desc;
  ```
  Map each row to `AdminJob` (include `applicantCount`).
- `POST /api/admin/jobs` — insert with `posted_by = caller`, `is_active = true`
  unless supplied; `tags` defaults to `{}`. Return the new `AdminJob`
  (`applicantCount = 0`).
- `PATCH /api/admin/jobs/{id}` — update only the fields present in the body
  (partial update). Return the updated `AdminJob`.
- `DELETE /api/admin/jobs/{id}` — `delete from jobs where id = @id`
  (FK cascade removes `job_applications` + `saved_jobs`). Return 204.
- `GET /api/admin/jobs/{id}/applicants`
  ```sql
  select ja.id, ja.student_id, p.full_name, p.email, ja.cv_document_id, ja.status, ja.applied_at
  from job_applications ja
  join profiles p on p.id = ja.student_id
  where ja.job_id = @id
  order by ja.applied_at desc;
  ```
  Map to `JobApplicant[]` (`studentName = full_name`, `studentEmail = email`).
- `PATCH /api/admin/job-applications/{id}` — set `status`; return the updated
  `JobApplicant`. **On success, notify the student** (§6, category `job`).

## 2. Super-admin — Bursaries

Same shape against `bursaries` / `bursary_applications`:
- `GET /api/admin/bursaries` — select bursaries + `applicant_count` sub-select
  from `bursary_applications`.
- `POST` — insert with `created_by = caller`, `covers` defaults `{}`.
- `PATCH` / `DELETE` — partial update / cascade delete.
- `GET /api/admin/bursaries/{id}/applicants` — join `bursary_applications` →
  `profiles`; return `BursaryApplicant[]` (`submittedAt = submitted_at`).
- `PATCH /api/admin/bursary-applications/{id}` — set `status`; **notify student**
  (§6, category `bursary`).

## 3. Employer (self-service)

- `GET /api/employer/profile` — `select * from employers where id = caller`.
  If the row doesn't exist yet, create a blank one (`company_name = profiles.full_name`)
  and return it, so the profile screen always loads.
- `PATCH /api/employer/profile` — update `company_name/website/logo_url` on the
  caller's row.
- `GET /api/employer/jobs` — same as admin list **but** `where posted_by = caller`.
- `POST /api/employer/jobs` — **ignore any client `company`**; set
  `company = (select company_name from employers where id = caller)` and
  `posted_by = caller`. Return `AdminJob`.
- `PATCH/DELETE /api/employer/jobs/{id}` — `where id = @id and posted_by = caller`.
- `GET /api/employer/jobs/{id}/applicants` — as admin, after asserting the job is
  the caller's. Return `JobApplicant[]`.
- `PATCH /api/employer/job-applications/{id}` — assert the parent job's
  `posted_by = caller`, set `status`, **notify student** (§6, category `job`).

## 4. Student-facing apply endpoints (already exist — add notifications)

These already work, but wire the triggers:
- `POST /api/Jobs/{id}/apply` — **body `{ cvDocumentId }`** (the id of a
  `documents` row with `type = 'cv'` owned by the student). The frontend now
  sends this and requires the student to have a CV before applying.
  - **400** if `cvDocumentId` is missing/not a `cv` document owned by the caller
    (or, if you prefer server-side enforcement, resolve the student's latest CV
    yourself and 400 when none exists).
  - Persist it to `job_applications.cv_document_id`.
  - After inserting `job_applications` (default `status = 'applied'`),
    **notify the job's `posted_by`**: "New applicant for *{job.title}*"
    (category `job`, `action_url` to the employer applicants screen).
  - **409** if the student already applied (`unique(job_id, student_id)`).
- `POST /api/Bursaries/{id}/apply` — after insert, **notify the bursary's
  `created_by`** (category `bursary`).

## 5. `/api/me` & employer onboarding

- `/api/me` must return `role: "employer"` for employer accounts (the frontend
  routes them to `/employer-dashboard`).
- **How an employer account is created:** super-admin creates it via
  `POST /api/admin/users` with `role = "employer"` **plus a `companyName`** — the
  backend must, in the same request, insert the matching `public.employers` row.
  (Mirror how creating a `university_admin` links a university.) A blank employers
  row is also lazily created by `GET /api/employer/profile` as a fallback.

## 6. Notifications — the event triggers

Insert with the **service-role key** into `public.notifications`
(`user_id, category, title, body, action_url`). Recommended triggers:

| Event | Recipient | category | Example title |
| --- | --- | --- | --- |
| Student applies to a job | job `posted_by` (employer/admin) | `job` | "New applicant: {student} → {title}" |
| Employer/admin changes a job app status | the student | `job` | "Update on your application to {title}" |
| Student applies to a bursary | bursary `created_by` | `bursary` | "New bursary application: {name}" |
| Admin changes a bursary app status | the student | `bursary` | "Your {name} bursary application is now {status}" |
| Application (university) status change | the student | `application` | (existing flow) |

`action_url` should deep-link to the relevant screen (e.g. `/job-hub`,
`/bursaries`, `/employer-applicants`). Respect `user_settings.notification_prefs`
for any email/SMS/push fan-out; the in-app row should always be written.

## 7. Response field map (quick reference)

| DTO field | DB column |
| --- | --- |
| `salaryText` | `jobs.salary_text` |
| `closesOn` | `jobs.closes_on` / `bursaries.closes_on` |
| `isRemote` / `isActive` | `jobs.is_remote` / `is_active` |
| `applicantCount` | computed count sub-select |
| `amountText` | `bursaries.amount_text` |
| `minAps` | `bursaries.min_aps` |
| `studentName` / `studentEmail` | `profiles.full_name` / `profiles.email` |
| `appliedAt` / `submittedAt` | `job_applications.applied_at` / `bursary_applications.submitted_at` |
| `cvDocumentId` | `job_applications.cv_document_id` |
| `companyName` / `logoUrl` / `isVerified` | `employers.company_name` / `logo_url` / `is_verified` |
