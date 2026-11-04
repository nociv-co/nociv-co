-- Case Zero: free subdomain requests. Safe to run twice.
-- Public can only (1) ask if a name is taken and (2) send a request, both through the two functions below.
-- Only your admin login can read, approve, reject or delete requests.

create table if not exists public.casezero_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  value text not null,
  owner text not null,
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  constraint casezero_name_len check (char_length(name) between 3 and 40),
  constraint casezero_type_ok check (type in ('CNAME', 'A', 'URL')),
  constraint casezero_value_len check (char_length(value) between 4 and 300),
  constraint casezero_owner_len check (char_length(owner) between 3 and 100),
  constraint casezero_status_ok check (status in ('pending', 'approved', 'rejected', 'live'))
);

-- A name can only be wanted once, until it is rejected.
create unique index if not exists casezero_name_active
  on public.casezero_requests (lower(name)) where status in ('pending', 'approved', 'live');

alter table public.casezero_requests enable row level security;
revoke all on public.casezero_requests from anon;
grant select, update, delete on public.casezero_requests to authenticated;

drop policy if exists "Admin reads Case Zero" on public.casezero_requests;
create policy "Admin reads Case Zero" on public.casezero_requests
  for select to authenticated using ((auth.jwt() ->> 'email') = 'nociv.co@gmail.com');
drop policy if exists "Admin updates Case Zero" on public.casezero_requests;
create policy "Admin updates Case Zero" on public.casezero_requests
  for update to authenticated using ((auth.jwt() ->> 'email') = 'nociv.co@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'nociv.co@gmail.com');
drop policy if exists "Admin deletes Case Zero" on public.casezero_requests;
create policy "Admin deletes Case Zero" on public.casezero_requests
  for delete to authenticated using ((auth.jwt() ->> 'email') = 'nociv.co@gmail.com');

-- Is this name already wanted?
create or replace function public.casezero_name_taken(p_name text)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from public.casezero_requests
    where lower(name) = lower(coalesce(p_name, '')) and status in ('pending', 'approved', 'live'));
$$;
revoke all on function public.casezero_name_taken(text) from public;
grant execute on function public.casezero_name_taken(text) to anon, authenticated;

-- Send a request. The same rules as the page, checked again here because the page can be skipped.
-- Returns 'ok' or a short reason.
create or replace function public.casezero_request(p_name text, p_type text, p_value text, p_owner text)
returns text language plpgsql security definer set search_path = public as $$
declare
  n text := lower(trim(coalesce(p_name, '')));
  t text := upper(trim(coalesce(p_type, '')));
  v text := trim(coalesce(p_value, ''));
  o text := trim(coalesce(p_owner, ''));
  reserved text[] := array['www','mail','email','admin','api','ns','ns1','ns2','ns3','ftp','sftp','smtp','imap','pop','pop3','root','support','help','billing','login','signin','secure','security','account','accounts','payment','payments','pay','bank','status','blog','docs','cdn','assets','static','dev','test','staging','localhost','autodiscover','nociv','nocivco','base','shop','store','casezero','case-zero','abuse','postmaster','webmaster','hostmaster'];
  a text[];
begin
  if n !~ '^[a-z0-9-]{3,40}$' or n ~ '^-|-$' or n ~ '--' then return 'bad_name'; end if;
  if n = any(reserved) or n like '%nociv%' then return 'reserved'; end if;
  if t not in ('CNAME', 'A', 'URL') then return 'bad_type'; end if;
  if t = 'CNAME' and (v ~ '^\d{1,3}(\.\d{1,3}){3}$' or v !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$' or char_length(v) > 253) then return 'bad_value'; end if;
  if t = 'A' then
    if v !~ '^\d{1,3}(\.\d{1,3}){3}$' then return 'bad_value'; end if;
    a := string_to_array(v, '.');
    if a[1]::int > 255 or a[2]::int > 255 or a[3]::int > 255 or a[4]::int > 255 then return 'bad_value'; end if;
    if a[1]::int in (0, 10, 127) or a[1]::int >= 224 or (a[1]::int = 172 and a[2]::int between 16 and 31)
       or (a[1]::int = 192 and a[2]::int = 168) or (a[1]::int = 169 and a[2]::int = 254) then return 'bad_value'; end if;
  end if;
  if t = 'URL' and v !~ '^https://[^[:space:]]+$' then return 'bad_value'; end if;
  if char_length(o) < 3 or char_length(o) > 100 then return 'bad_owner'; end if;
  -- no flooding: 5 waiting requests per person at a time
  if (select count(*) from public.casezero_requests where lower(owner) = lower(o) and status = 'pending') >= 5 then return 'too_many'; end if;
  begin
    insert into public.casezero_requests (name, type, value, owner) values (n, t, v, o);
  exception when unique_violation then
    return 'taken';
  end;
  return 'ok';
end;
$$;
revoke all on function public.casezero_request(text, text, text, text) from public;
grant execute on function public.casezero_request(text, text, text, text) to anon, authenticated;
