-- =============================================================================
-- Varsity Hub · University-specific bursaries
-- -----------------------------------------------------------------------------
-- Bursaries were national-only (no university link). This lets a university
-- admin post bursaries offered by / at their own institution.
--   * university_id = null  -> national bursary (super-admin managed, unchanged)
--   * university_id = <uni> -> university-specific, managed by that uni's admin
-- =============================================================================

alter table public.bursaries
  add column if not exists university_id uuid references public.universities(id) on delete cascade;

create index if not exists bursaries_university_id_idx on public.bursaries (university_id);

-- A university admin may create/update/delete bursaries for THEIR university.
-- (The existing "bursaries: admin write" policy still covers super admins, and
--  policies are OR-ed, so this only adds capability — it removes nothing.)
create policy "bursaries: uni-admin write" on public.bursaries
  for all
  using (university_id is not null and public.is_university_admin(university_id))
  with check (university_id is not null and public.is_university_admin(university_id));

-- A university admin may read + progress applicants to their own bursaries.
create policy "bursary_apps: uni-admin view" on public.bursary_applications
  for select using (exists (
    select 1 from public.bursaries b
    where b.id = bursary_id
      and b.university_id is not null
      and public.is_university_admin(b.university_id)));

create policy "bursary_apps: uni-admin update" on public.bursary_applications
  for update using (exists (
    select 1 from public.bursaries b
    where b.id = bursary_id
      and b.university_id is not null
      and public.is_university_admin(b.university_id)))
  with check (exists (
    select 1 from public.bursaries b
    where b.id = bursary_id
      and b.university_id is not null
      and public.is_university_admin(b.university_id)));
