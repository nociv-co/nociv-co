-- Storage meter and unused file finder for Admin. Safe to run twice.
-- A file is "unused" when no row in any public table mentions its name.
create or replace function public.storage_report()
returns json
language plpgsql
security definer
set search_path = public, storage
as $$
declare
  alltext text;
  result json;
begin
  if coalesce(auth.jwt() ->> 'email', '') <> 'nociv.co@gmail.com' then
    raise exception 'admin only';
  end if;
  select string_agg(query_to_xml(format('select * from %I.%I', table_schema, table_name), true, false, '')::text, ' ')
    into alltext
    from information_schema.tables
   where table_schema = 'public' and table_type = 'BASE TABLE';
  select json_build_object(
    'used_mb', round(coalesce(sum((o.metadata->>'size')::bigint), 0) / 1048576.0, 1),
    'unused', coalesce(json_agg(json_build_object('bucket', o.bucket_id, 'name', o.name, 'mb', round((o.metadata->>'size')::bigint / 1048576.0, 1)))
               filter (where position(o.name in coalesce(alltext, '')) = 0), '[]'::json)
  ) into result
  from storage.objects o
  where o.bucket_id in ('zine-files', 'album-photos', 'product-images', 'promo-materials');
  return result;
end;
$$;
revoke all on function public.storage_report() from public, anon;
grant execute on function public.storage_report() to authenticated;
