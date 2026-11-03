-- NOCIV pop-up drop alerts (customers opt in from the shop app). Safe to run twice.
-- Stores ONLY the phone's alert address (a web push endpoint and two keys). No name, no email,
-- no tracking. Customers can turn it off any time and the row is deleted.

create table if not exists public.push_subscriptions (
  id bigserial primary key,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  topic text not null default 'popup',
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

-- Nobody can read or write the table directly except your admin login (read only, for the count).
drop policy if exists "Admin can read push subscriptions" on public.push_subscriptions;
create policy "Admin can read push subscriptions" on public.push_subscriptions
  for select to authenticated
  using ((auth.jwt() ->> 'email') = 'nociv.co@gmail.com');

-- Customers opt in and out through these two functions only.
create or replace function public.subscribe_push(p_endpoint text, p_p256dh text, p_auth text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_endpoint is null or p_endpoint !~ '^https://' or length(p_endpoint) > 1000
     or p_p256dh is null or length(p_p256dh) > 200 or p_auth is null or length(p_auth) > 100 then
    raise exception 'bad subscription';
  end if;
  insert into public.push_subscriptions (endpoint, p256dh, auth)
  values (p_endpoint, p_p256dh, p_auth)
  on conflict (endpoint) do update set p256dh = excluded.p256dh, auth = excluded.auth;
end $$;

create or replace function public.unsubscribe_push(p_endpoint text)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.push_subscriptions where endpoint = p_endpoint;
end $$;

revoke all on function public.subscribe_push(text, text, text) from public;
revoke all on function public.unsubscribe_push(text) from public;
grant execute on function public.subscribe_push(text, text, text) to anon, authenticated;
grant execute on function public.unsubscribe_push(text) to anon, authenticated;

-- The signing keys for alerts live in this table. No policies and no grants, so only the
-- send-push function (service role) can read the private key. The key pair itself is inserted
-- once by Claude and is NOT in this file.
create table if not exists public.push_keys (
  id int primary key default 1 check (id = 1),
  public_key text not null,
  private_key text not null
);
alter table public.push_keys enable row level security;
revoke all on public.push_keys from anon, authenticated;

create or replace function public.push_public_key()
returns text language sql security definer set search_path = public stable as $$
  select public_key from public.push_keys where id = 1
$$;
revoke all on function public.push_public_key() from public;
grant execute on function public.push_public_key() to anon, authenticated;
