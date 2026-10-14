# Varsity Hub — Backend Requirements by User Role & Dashboard

Companion to `backend-csharp-guide.md`. That guide covers the plumbing, security model, and the
**student** feature set in depth. This file specifies what the backend must provide for the **other
four portals** — Counsellor, Parent, University Admin, and Super Admin — so every dashboard has real
data behind it.

The database schema (`supabase/migrations/20260724000000_init.sql`) already models all five roles and
their relationships; this doc turns those into concrete endpoints, queries, and authorization rules.

---

## 0. The five roles & how the backend tells them apart

| Role (`profiles.role`) | Portal / shell | Home route | Accent |
|---|---|---|---|
| `student` | `StudentShell` | `/dashboard` | primary |
| `counsellor` | `CounsellorShell` | `/counsellor-dashboard` | indigo |
| `parent` | `ParentShell` | `/parent-dashboard` | emerald |
| `university_admin` | `UniversityAdminShell` | `/uni-admin-dashboard` | blue |
| `super_admin` | `SuperAdminShell` | `/admin-dashboard` | fuchsia |

**How role is resolved on every request:**
1. The Supabase JWT carries the user id (`sub`). Add a Supabase **Access Token Hook** to copy
   `profiles.role` into a `user_role` claim so `[Authorize(Policy=...)]` works without a DB hit.
2. RLS is the real guard — the `SECURITY DEFINER` helpers (`is_super_admin()`,
   `is_university_admin(uni)`, `is_parent_of(sid)`, `is_counsellor_of(sid)`, `can_view_student(sid)`)
   enforce scope even if a controller forgets a check.

**Authorization policies (add to Part I §4):**
```csharp
o.AddPolicy("Student",     p => p.RequireClaim("user_role", "student"));
o.AddPolicy("Counsellor",  p => p.RequireClaim("user_role", "counsellor", "super_admin"));
o.AddPolicy("Parent",      p => p.RequireClaim("user_role", "parent", "super_admin"));
o.AddPolicy("UniAdmin",    p => p.RequireClaim("user_role", "university_admin", "super_admin"));
o.AddPolicy("Admin",       p => p.RequireClaim("user_role", "super_admin"));
```

---

## 1. Student portal (recap)

Covered in `backend-csharp-guide.md` §11 + Part II. Routes: `/dashboard`, `/profile`,
`/academic-results`, `/applications`, `/application-form`, `/application-fee`, `/programme-search`,
`/universities`, `/career-guidance`, `/documents`, `/messages`, `/notifications`, and the six hubs
(`/job-hub`, `/bursaries`, `/marketplace`, `/events`, `/accommodation`, `/interview-practice`).

---

## 2. Counsellor portal

A school counsellor manages a caseload of learners. Scope everything through
`counsellor_students` / `is_counsellor_of(student_id)` — a counsellor sees **only their linked
learners**, never the whole student body.

Routes: `/counsellor-dashboard`, `/counsellor-learners`, `/counsellor-aps-results`,
`/counsellor-recommendations`, `/counsellor-career`, `/counsellor-applications`,
`/counsellor-missing-docs`, `/counsellor-reports`, `/counsellor-notifications`.

### Endpoints

| Route needs | Endpoint | Notes |
|---|---|---|
| Dashboard KPIs | `GET /api/counsellor/summary` | # learners, avg APS, applications in progress, missing-doc count |
| Learners list | `GET /api/counsellor/learners` | paginated; search by name |
| Learner profile | `GET /api/counsellor/learners/{id}` | full profile + APS + results (gated by `is_counsellor_of`) |
| APS & results | `GET /api/counsellor/learners/{id}/results` | subjects + computed APS |
| Applications (caseload) | `GET /api/counsellor/applications?status=` | all applications across their learners |
| Missing documents | `GET /api/counsellor/missing-docs` | learners with `pending_documents` applications |
| Recommendations | `GET/POST /api/counsellor/learners/{id}/recommendations` | writes `career_recommendations` |
| Career guidance | `GET /api/counsellor/learners/{id}/eligible-programmes` | reuses the eligibility query (guide §18) |
| Reports | `GET /api/counsellor/reports` | aggregates over the caseload |
| Notifications | `GET /api/notifications` (shared) | filtered to this user |

### Key queries (authorization-scoped)

```sql
-- Dashboard summary (runs AsUser → RLS restricts to their learners)
select
  count(distinct cs.student_id)                                   as learners,
  round(avg(sa.aps))                                              as avg_aps,
  count(a.id) filter (where a.status not in ('approved','rejected')) as in_progress,
  count(a.id) filter (where a.status = 'pending_documents')       as missing_docs
from public.counsellor_students cs
left join public.student_aps sa on sa.student_id = cs.student_id
left join public.applications a on a.student_id = cs.student_id
where cs.counsellor_id = auth.uid();
```

```sql
-- Missing-docs list
select st.id, p.full_name, a.university_id, a.status
from public.counsellor_students cs
join public.students st on st.id = cs.student_id
join public.profiles p on p.id = st.id
join public.applications a on a.student_id = st.id and a.status = 'pending_documents'
where cs.counsellor_id = auth.uid();
```

Recommendations write to `career_recommendations` (RLS: `counsellor_id = auth.uid()`).

---

## 3. Parent portal

A parent/guardian follows their own children's journey — **read-mostly**. Scope through
`parent_students` / `is_parent_of(student_id)`.

Routes: `/parent-dashboard`, `/parent-student-profile`, `/parent-applications`,
`/parent-programmes`, `/parent-deadlines`, `/parent-notifications`, `/parent-help`.

### Endpoints

| Route needs | Endpoint | Notes |
|---|---|---|
| Dashboard | `GET /api/parent/summary` | per-child snapshot (applications, deadlines, unread) |
| Children list | `GET /api/parent/children` | from `parent_students` |
| Student profile | `GET /api/parent/children/{id}` | profile + APS (read-only) |
| Applications | `GET /api/parent/children/{id}/applications` | status tracking |
| Programme choices | `GET /api/parent/children/{id}/programmes` | programmes the child applied to |
| Deadlines | `GET /api/parent/children/{id}/deadlines` | programme deadlines + bookmarked bursary closings |
| Notifications | `GET /api/notifications` (shared) | |
| Help | static content / `GET /api/help` | |

### Key query — combined deadlines

```sql
-- Upcoming deadlines for a child (programme application deadlines + bookmarked bursaries)
select 'programme' as kind, p.name as title, p.application_deadline as due
from public.applications a
join public.programmes p on p.id = a.programme_id
where a.student_id = @childId and p.application_deadline >= current_date
union all
select 'bursary', b.name, b.closes_on
from public.bursary_bookmarks bb
join public.bursaries b on b.id = bb.bursary_id
where bb.student_id = @childId and b.closes_on >= current_date
order by due;
```

RLS: every parent endpoint runs `AsUser`; `can_view_student(childId)` (which includes
`is_parent_of`) guarantees a parent can't read a child that isn't theirs. **Parents get no write
endpoints** except their own settings/notifications.

---

## 4. University Admin portal

Processes admissions **for their own institution(s) only**. Scope through `university_admins` /
`is_university_admin(university_id)`. A UJ admin never sees Wits applications.

Routes: `/uni-admin-dashboard`, `/uni-admin-applications`, `/uni-admin-application-details`,
`/uni-admin-documents`, `/uni-admin-programme-apps`, `/uni-admin-status`, `/uni-admin-reports`,
`/uni-admin-notifications`.

### Endpoints

| Route needs | Endpoint | Notes |
|---|---|---|
| Dashboard KPIs | `GET /api/uni-admin/summary` | total apps, by status, new today, doc-pending |
| Applications | `GET /api/uni-admin/applications?status=&programmeId=` | scoped to their university |
| Application detail | `GET /api/uni-admin/applications/{id}` | applicant profile, results/APS, documents |
| Update status | `PATCH /api/uni-admin/applications/{id}/status` | approve / reject / waitlist / request docs |
| Documents review | `GET /api/uni-admin/documents?applicationId=` + `PATCH .../verify` | mark verified |
| By programme | `GET /api/uni-admin/programme-apps` | counts + lists grouped by programme |
| Programmes/faculties | `GET/POST/PATCH /api/uni-admin/programmes` | manage own university's catalogue |
| Reports | `GET /api/uni-admin/reports` | intake funnel, acceptance rate, by programme |
| Notifications | `GET /api/notifications` (shared) | |

### Status update (the core action)

```csharp
// PATCH /api/uni-admin/applications/{id}/status
public Task UpdateStatusAsync(Guid appId, string status, string? note) =>
    db.AsUserAsync(me.UserId!, me.Email, async (c, tx) =>
    {
        // RLS "applications: student or uni admin update" allows this only for
        // an application whose university_id the caller administers.
        var rows = await c.ExecuteAsync(new CommandDefinition("""
            update public.applications
            set status = @status::application_status,
                notes = coalesce(@note, notes),
                decision_at = case when @status in ('approved','rejected','waitlisted')
                                   then now() else decision_at end
            where id = @appId
        """, new { appId, status, note }, tx));
        if (rows == 0) throw new UnauthorizedAccessException(); // not their university
        return 0;
    });
```

Fire a notification to the student and write an `audit_logs` row (guide §28) on every decision.

### Scoped list query

```sql
select a.id, p.full_name as applicant, pr.name as programme, a.status, a.submitted_at,
       (select aps from public.student_aps where student_id = a.student_id) as aps
from public.applications a
join public.university_admins ua on ua.university_id = a.university_id and ua.profile_id = auth.uid()
join public.profiles p on p.id = a.student_id
join public.programmes pr on pr.id = a.programme_id
where (@status is null or a.status = @status::application_status)
order by a.submitted_at desc nulls last;
```

---

## 5. Super Admin portal

Full platform control. Governed by `is_super_admin()` (bypasses the per-university/per-learner
scoping). All writes should emit `audit_logs`.

Routes: `/admin-dashboard`, `/admin-users`, `/admin-universities`, `/admin-programmes`,
`/admin-aps-rules`, `/admin-applications`, `/admin-reports`, `/admin-notifications`,
`/admin-settings`, `/admin-audit-logs`.

### Endpoints

| Route needs | Endpoint | Notes |
|---|---|---|
| Dashboard KPIs | `GET /api/admin/summary` | users by role, total applications, universities, revenue (fees) |
| User management | `GET /api/admin/users`, `PATCH /api/admin/users/{id}/role`, `POST .../deactivate` | change roles, link uni-admins/parents/counsellors |
| Universities CRUD | `GET/POST/PATCH/DELETE /api/admin/universities` | + assign `university_admins` |
| Programmes CRUD | `GET/POST/PATCH/DELETE /api/admin/programmes` | + `programme_requirements` |
| APS rules | `GET/POST/PATCH /api/admin/aps-rules` | edit `aps_rules.config` (global or per-university) |
| All applications | `GET /api/admin/applications` | unscoped, filterable |
| Reports & analytics | `GET /api/admin/reports` | cross-platform metrics |
| System settings | `GET/PUT /api/admin/settings` | **needs a new table — see §7** |
| Audit logs | `GET /api/admin/audit-logs?entity=&actor=` | reads `audit_logs` |
| Notifications | broadcast + own | `POST /api/admin/notifications/broadcast` |

### Role management (the delicate one)

```csharp
// PATCH /api/admin/users/{id}/role  — super admin only
public Task SetRoleAsync(Guid userId, string role) =>
    db.AsServiceAsync(async (c, tx) =>   // service path: also maintain role-specific rows
    {
        await c.ExecuteAsync("update public.profiles set role = @role::user_role where id = @userId",
            new { userId, role }, tx);
        if (role == "student")
            await c.ExecuteAsync("insert into public.students(id) values(@userId) on conflict do nothing",
                new { userId }, tx);
        // Link tables (university_admins / parent_students / counsellor_students) are managed
        // by dedicated endpoints — changing role does not auto-populate them.
        return 0;
    });
```

Assigning a university admin: `POST /api/admin/universities/{uid}/admins { profileId }` → inserts
into `university_admins`. Linking parents/counsellors to students: `POST /api/admin/links`.

---

## 6. Cross-cutting requirements

- **Dashboard summary endpoints** — every portal needs a single aggregation call for its landing
  page (`/api/{role}/summary`). Keep them as dedicated read queries, not N round-trips.
- **Notifications** — one shared `notifications` table; `GET /api/notifications` returns the
  caller's rows (RLS `user_id = auth.uid()`). Server/domain events insert on the service path.
  Super-admin broadcast fans out one row per target user.
- **Reports/analytics** — counsellor (caseload), uni-admin (their intake), admin (platform) all read
  aggregates. Compute with SQL `count/avg ... filter (where ...)`; cache if heavy.
- **Audit** — counsellor recommendations, uni-admin decisions, and every admin mutation write
  `audit_logs` (guide §28). Only super admin can read them.
- **Pagination** — all list endpoints use the `PagedResult<T>` shape (guide §23).

---

## 7. Schema additions this doc requires

The role dashboards need two things not in the initial migration. Add as a follow-up migration:

```sql
-- 7a. Platform settings for /admin-settings (single-row or key/value)
create table public.app_settings (
  key         text primary key,
  value       jsonb not null default '{}'::jsonb,
  updated_by  uuid references public.profiles(id) on delete set null,
  updated_at  timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "app_settings: admin read"  on public.app_settings
  for select using (public.is_super_admin());
create policy "app_settings: admin write" on public.app_settings
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- 7b. (Optional) materialized/plain views for heavy report aggregates, e.g. application funnel
create view public.application_funnel with (security_invoker = true) as
  select university_id, status, count(*) as n
  from public.applications group by university_id, status;
```

Everything else the four portals need is already covered by the base schema and its RLS policies.

---

## 8. Authorization matrix (who can do what)

| Action | Student | Counsellor | Parent | Uni Admin | Super Admin |
|---|---|---|---|---|---|
| Read own profile/results | ✅ | — | — | — | ✅ |
| Read a learner's profile/results | — | ✅ (linked) | ✅ (own child) | ✅ (if applied to their uni) | ✅ |
| Create/submit application | ✅ | — | — | — | ✅ |
| Change application status | — | — | — | ✅ (their uni) | ✅ |
| Verify documents | — | — | — | ✅ (their uni) | ✅ |
| Write career recommendation | — | ✅ (linked) | — | — | ✅ |
| Manage programmes/faculties | — | — | — | ✅ (their uni) | ✅ |
| Manage universities | — | — | — | — | ✅ |
| Edit APS rules | — | — | — | ✅ (their uni) | ✅ (global) |
| Manage users / roles | — | — | — | — | ✅ |
| Read audit logs | — | — | — | — | ✅ |
| Edit system settings | — | — | — | — | ✅ |

Every "✅ (scoped)" cell is enforced by the matching RLS helper — the C# authorization policies are a
fast first gate, but the database is the guarantee.

---

## What's now covered

`backend-csharp-guide.md` (Part I + II) covers the shared plumbing, security, student features, AI,
reminders, and production concerns. **This file** adds the per-role dashboard endpoints, scoped
queries, the role-management flow, the authorization matrix, and the two schema additions
(`app_settings`, report views) the non-student portals need. Together they specify the full backend
for all five user types.
