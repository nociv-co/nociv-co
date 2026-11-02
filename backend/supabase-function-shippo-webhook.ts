// Supabase Edge Function: shippo-webhook
//
// WHAT THIS DOES
// Shippo tells this function when the carrier scans your package. First scan
// moves the order to "On the way" (customer gets the shipped email with the
// tracking link). Delivered moves it to "Delivered" (customer gets the delivered
// email). It only ever moves an order forward, and it ignores anything it does not
// recognize.
//
// DEPLOY: Supabase Dashboard, Edge Functions, new function "shippo-webhook",
//   paste, turn OFF "Verify JWT", Deploy.
// SECRET: SHIPPO_WEBHOOK_KEY  any long random text you make up (a password)
// THEN in Shippo (apps.goshippo.com, Settings, API, Webhooks), add a webhook:
//   Event: Track updated      Live mode
//   URL:   https://vscombrgcdtrfndqyugb.supabase.co/functions/v1/shippo-webhook?key=YOUR_SHIPPO_WEBHOOK_KEY

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const WEBHOOK_KEY = Deno.env.get('SHIPPO_WEBHOOK_KEY') || '';
const REST = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' };

const RANK: Record<string, number> = { new: 0, processing: 1, label_printed: 2, shipped: 3, delivered: 4 };

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (!WEBHOOK_KEY || url.searchParams.get('key') !== WEBHOOK_KEY) return new Response('no', { status: 401 });
  try {
    const body = await req.json();
    const d = body.data || {};
    const tn = String(d.tracking_number || '');
    const st = String(d.tracking_status?.status || '').toUpperCase();
    if (!tn) return new Response('ok');
    const target = st === 'TRANSIT' ? 'shipped' : st === 'DELIVERED' ? 'delivered' : null;
    if (!target) return new Response('ok');

    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?tracking_number=eq.${encodeURIComponent(tn)}&select=id,order_status`, { headers: REST });
    const rows = await r.json();
    if (!Array.isArray(rows) || !rows[0]) return new Response('ok');
    const o = rows[0];
    if (o.order_status === 'cancelled' || (RANK[o.order_status] ?? 9) >= RANK[target]) return new Response('ok');
    await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${o.id}`, { method: 'PATCH', headers: { ...REST, Prefer: 'return=minimal' }, body: JSON.stringify({ order_status: target }) });
    return new Response('ok');
  } catch (_e) {
    return new Response('ok'); // never make Shippo retry forever
  }
});
