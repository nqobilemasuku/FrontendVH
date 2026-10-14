-- =============================================================================
-- Varsity Hub · Employer role + admin applicant visibility
-- -----------------------------------------------------------------------------
-- Adds the `employer` role, an employer profile table, and the RLS needed for
-- employers to manage their own jobs' applicants. Also lets super admins read
-- job/bursary applicants for the admin management screens.
--
-- IMPORTANT: run STEP 1 on its own and let it commit BEFORE running the rest.
-- Postgres does not allow a newly-added enum value to be used in the same
-- transaction that added it.
-- =============================================================================

-- ---- STEP 1 (run alone, then commit) ---------------------------------------
alter type user_role add value if not exists 'employer';

-- ---- STEP 2 (run after step 1 has committed) -------------------------------

-- Employer profile (profile-linked, mirrors public.students).
create table if not exists public.employers (
  id           uuid primary key references public.profiles(id) on delete cascade,
  company_name text not null,
  website      text,
  logo_url     text,
  is_verified  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.employers enable row level security;

-- An employer manages their own row; super admins can read/manage any.
create policy "employers: self read" on public.employers
  for select using (id = auth.uid() or public.is_super_admin());
create policy "employers: self write" on public.employers
  for all using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- jobs.posted_by write is already covered by "jobs: admin write"
-- (using: is_super_admin() OR posted_by = auth.uid()) — no change needed.

-- Employers may read + progress applications to jobs THEY posted.
create policy "job_apps: employer view" on public.job_applications
  for select using (exists (
    select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid()));
create policy "job_apps: employer update" on public.job_applications
  for update using (exists (
    select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid()))
  with check (exists (
    select 1 from public.jobs j where j.id = job_id and j.posted_by = auth.uid()));

-- Super admins may read + progress any applicant (admin management screens).
create policy "job_apps: admin view" on public.job_applications
  for select using (public.is_super_admin());
create policy "job_apps: admin update" on public.job_applications
  for update using (public.is_super_admin()) with check (public.is_super_admin());

create policy "bursary_apps: admin view" on public.bursary_applications
  for select using (public.is_super_admin());
create policy "bursary_apps: admin update" on public.bursary_applications
  for update using (public.is_super_admin()) with check (public.is_super_admin());
