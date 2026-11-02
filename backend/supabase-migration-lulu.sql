-- NOCIV Lulu files on zines. Safe to run twice. Nothing is deleted.
-- Lets Admin keep the two Lulu print files (inside pages and cover) on a zine.
alter table if exists public.zines add column if not exists lulu jsonb;

select case when exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'zines' and column_name = 'lulu')
  then 'ALL GOOD. Zines can keep Lulu files.' else 'STILL MISSING: zines.lulu' end as result;
