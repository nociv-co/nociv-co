-- NOCIV admin extras. Safe to run twice.
-- 1. Refund bookkeeping on orders (the Refund button in Admin, Recent Orders).
-- 2. Lets only your admin login read unfinished checkouts, for the Needs you list.

alter table if exists public.orders
  add column if not exists refunded_amount numeric not null default 0,
  add column if not exists refund_id text,
  add column if not exists refunded_at timestamptz;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'checkout_carts') then
    execute 'drop policy if exists "Admin can read carts" on public.checkout_carts';
    execute 'create policy "Admin can read carts" on public.checkout_carts for select to authenticated using ((auth.jwt() ->> ''email'') = ''nociv.co@gmail.com'')';
  end if;
end $$;
