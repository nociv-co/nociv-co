-- NOCIV security hardening, 2026-11-02. ALREADY RUN on the live database. Safe to run twice.
-- Trigger helper functions are not for the public to call, and fixed search paths.
revoke execute on function public.album_comment_guard() from public, anon, authenticated;
revoke execute on function public.camera_roll_comment_guard() from public, anon, authenticated;
revoke execute on function public.contact_message_guard() from public, anon, authenticated;
alter function public.discount_code_clean() set search_path = public;
alter function public.decrement_variant_stock(uuid) set search_path = public;
alter function public.decrement_variant_stock_by(uuid, integer) set search_path = public;
alter function public.decrement_product_stock_by(bigint, integer) set search_path = public;
