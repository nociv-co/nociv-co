-- Admin lock. Safe to run twice.
-- Before: any logged in account counted as admin. After: only nociv.co@gmail.com does.
-- Adds one RESTRICTIVE rule per table for logged in accounts. Visitors (not logged in) are not affected,
-- so the shop, forms, directory and boards keep working. garment_projects and user_measurements are
-- left alone (they belong to each person's own account).
create or replace function public.is_admin() returns boolean
language sql stable set search_path = public as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'nociv.co@gmail.com';
$$;

do $$
declare t text;
begin
  foreach t in array array['album_comments','album_photos','app_settings','board_posts','camera_roll','camera_roll_comments',
    'checkout_carts','contact_messages','daily_goals','design_clients','design_files','design_invoices','design_payments',
    'design_projects','design_time','directory_listings','directory_submissions','disciplines','discount_codes','expenses',
    'external_sales','orders','pin_print_log','popup_status','product_variants','product_votes','products','promo_materials',
    'share_posts','signups','stall_posts','suggestion_posts','time_entries','vendor_opportunities','zines']
  loop
    if to_regclass('public.' || t) is not null then
      execute format('drop policy if exists "Only the admin account" on public.%I', t);
      execute format('create policy "Only the admin account" on public.%I as restrictive for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
    end if;
  end loop;
end $$;

-- Opportunity Board: nobody can edit posts directly. The interest button uses board_interest(), which still works.
do $$
declare p record;
begin
  for p in select policyname from pg_policies where schemaname = 'public' and tablename = 'board_posts' and cmd = 'UPDATE' loop
    execute format('drop policy if exists %I on public.board_posts', p.policyname);
  end loop;
end $$;

-- Uploaded files: only the admin account can add, change or delete. Public viewing of photos is not affected.
drop policy if exists "Only the admin account uploads" on storage.objects;
create policy "Only the admin account uploads" on storage.objects as restrictive for insert to authenticated with check (public.is_admin());
drop policy if exists "Only the admin account changes files" on storage.objects;
create policy "Only the admin account changes files" on storage.objects as restrictive for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Only the admin account deletes files" on storage.objects;
create policy "Only the admin account deletes files" on storage.objects as restrictive for delete to authenticated using (public.is_admin());
