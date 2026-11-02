-- NOCIV order tracking. Safe to run twice.
-- Gives every order a "where we at" status (like a Domino's tracker), a private
-- tracking link for the customer, a history of every step, and fixes Admin so it
-- is allowed to change orders. Also turns on the order email trigger.

create extension if not exists pg_net with schema extensions;

-- one time backfill guard: only the first run touches old orders
do $$
declare first_run boolean;
begin
  first_run := not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'order_status');

  alter table orders add column if not exists order_status text not null default 'new';
  alter table orders add column if not exists status_history jsonb not null default '[]'::jsonb;
  alter table orders add column if not exists tracking_token uuid not null default gen_random_uuid();
  alter table orders add column if not exists tracking_url text;
  alter table orders add column if not exists emailed_status text;
  alter table orders add column if not exists email_error text;
  alter table orders add column if not exists owner_notified_at timestamptz;

  if first_run then
    update orders set order_status = 'delivered' where source = 'in_person';
    update orders set emailed_status = order_status, owner_notified_at = coalesce(created_at, now());
    update orders set status_history = jsonb_build_array(jsonb_build_object('status', order_status, 'at', coalesce(created_at, now())))
      where status_history = '[]'::jsonb;
  end if;
end $$;

create unique index if not exists orders_tracking_token_key on orders (tracking_token);

alter table orders drop constraint if exists orders_order_status_check;
alter table orders add constraint orders_order_status_check check (order_status in
  ('new','processing','label_printed','shipped','delivered','ready_pickup','picked_up','cancelled'));

-- Only YOUR admin login can change orders (not just any logged in account).
-- If you ever change your admin email, change it here too and run this again.
drop policy if exists "Admin can update orders" on orders;
create policy "Admin can update orders" on orders for update to authenticated
  using ((auth.jwt() ->> 'email') = 'nociv.co@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'nociv.co@gmail.com');

-- Keep the history honest: every status change is stamped, no matter who made it
create or replace function orders_track() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.source = 'in_person' then new.order_status := 'delivered'; end if;
    if coalesce(new.status_history, '[]'::jsonb) = '[]'::jsonb then
      new.status_history := jsonb_build_array(jsonb_build_object('status', new.order_status, 'at', now()));
    end if;
    return new;
  end if;
  if new.make_status is distinct from old.make_status then
    if new.make_status = 'making' and new.order_status = 'new' then new.order_status := 'processing'; end if;
    if new.make_status = 'cancelled' then new.order_status := 'cancelled'; end if;
  end if;
  if new.order_status is distinct from old.order_status then
    new.status_history := coalesce(old.status_history, '[]'::jsonb) || jsonb_build_array(jsonb_build_object('status', new.order_status, 'at', now()));
  end if;
  return new;
end $$;

drop trigger if exists orders_track_ins on orders;
create trigger orders_track_ins before insert on orders for each row execute function orders_track();
drop trigger if exists orders_track_upd on orders;
create trigger orders_track_upd before update on orders for each row execute function orders_track();

-- Tell the order-emails function whenever an order lands or its status changes.
-- It re-reads the order from the database, so this call carries nothing but an id.
create or replace function orders_notify() returns trigger language plpgsql security definer set search_path = public, extensions as $$
begin
  begin
    perform net.http_post(
      url := 'https://vscombrgcdtrfndqyugb.supabase.co/functions/v1/order-emails',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := jsonb_build_object('order_id', new.id, 'event', tg_op),
      timeout_milliseconds := 8000
    );
  exception when others then
    null; -- an email problem must never block an order
  end;
  return null;
end $$;

-- Trigger helpers are not for the public to call
revoke execute on function orders_track() from public, anon, authenticated;
revoke execute on function orders_notify() from public, anon, authenticated;

drop trigger if exists orders_notify_ins on orders;
create trigger orders_notify_ins after insert on orders for each row execute function orders_notify();
drop trigger if exists orders_notify_upd on orders;
create trigger orders_notify_upd after update on orders for each row
  when (old.order_status is distinct from new.order_status or old.make_status is distinct from new.make_status)
  execute function orders_notify();

-- The customer's page. Anyone with the private link can see ONE order, and only
-- what they need: no email, no street address.
create or replace function get_order_tracking(p_token uuid) returns jsonb
language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'order_number', o.id,
    'status', o.order_status,
    'history', o.status_history,
    'placed_at', o.created_at,
    'method', coalesce(o.shipping_method, 'ship'),
    'source', o.source,
    'items', (select coalesce(jsonb_agg(jsonb_build_object('name', i->>'name', 'size', i->>'size', 'quantity', coalesce(nullif(i->>'quantity','')::int, 1))), '[]'::jsonb)
              from jsonb_array_elements(case when jsonb_typeof(o.items) = 'array' then o.items else '[]'::jsonb end) i),
    'description', o.description,
    'made_to_order', coalesce(o.made_to_order, false),
    'make_status', o.make_status,
    'due_date', o.due_date,
    'carrier', o.carrier,
    'tracking_number', o.tracking_number,
    'tracking_url', o.tracking_url,
    'first_name', split_part(coalesce(o.ship_name, ''), ' ', 1),
    'city', o.ship_city,
    'state', o.ship_state,
    'pickup_note', case when o.shipping_method = 'pickup' then (select value::text from app_settings where key = 'pickup_instructions') end
  ) from orders o where o.tracking_token = p_token;
$$;
grant execute on function get_order_tracking(uuid) to anon, authenticated;

-- "Where is my order" lookup: order number plus the email used at checkout
create or replace function find_order_token(p_email text, p_number bigint) returns uuid
language sql security definer set search_path = public stable as $$
  select tracking_token from orders where id = p_number and lower(trim(customer_email)) = lower(trim(p_email)) limit 1;
$$;
grant execute on function find_order_token(text, bigint) to anon, authenticated;

-- Which steps email the customer (you can change this in Admin, Recent Orders)
insert into app_settings (key, value)
values ('order_email_statuses', '["new","processing","label_printed","shipped","delivered","ready_pickup","picked_up","cancelled"]')
on conflict (key) do nothing;
