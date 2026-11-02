// Supabase Edge Function: order-emails
//
// WHAT THIS DOES
// The one place every order email comes from.
//   1. A new order lands: it emails YOU (what sold, how it ships), once.
//   2. Every time you move an order to a new step in Admin (Processing, Label made,
//      On the way, Delivered, Ready for pickup, and so on) it emails the CUSTOMER
//      a short note with the "where we at" tracker link. Which steps send is set in
//      Admin, Recent Orders, Customer emails. Each step sends at most once.
//   3. Made to order orders get a "your order is made" note when you mark it ready.
//   4. Admin's "Send me a test" button calls this with test:true. Tests only ever
//      go to YOUR email (NOTIFY_EMAIL), never to a customer.
//
// The database calls this by itself (a trigger on the orders table, installed by
// supabase-migration-order-tracking.sql). The call carries only an order id, and
// the order is always re-read from the database, so nobody can make it email a
// stranger or say something you did not write.
//
// DEPLOY: Supabase Dashboard, Edge Functions, new function named exactly
//   order-emails , paste this file, turn OFF "Verify JWT", Deploy.
//   (Or: supabase functions deploy order-emails --no-verify-jwt)
// SECRETS: RESEND_API_KEY, NOTIFY_EMAIL (already set for the old order email)
//   CUSTOMER_FROM   For example  NOCIV <orders@nociv.co>  Must be an address on a
//                   domain you verified in Resend (resend.com, Domains). Without it
//                   customers get NO emails (the tracker page still works) and
//                   Admin shows "no sender address set" on the order.
//   SITE_URL        Optional. Defaults to https://nociv.co

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || '';
const FROM = Deno.env.get('CUSTOMER_FROM') || Deno.env.get('PICKUP_FROM') || '';
const SITE = (Deno.env.get('SITE_URL') || 'https://nociv.co').replace(/\/$/, '');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const ALL_STATUSES = ['new', 'processing', 'label_printed', 'shipped', 'delivered', 'ready_pickup', 'picked_up', 'cancelled'];
const SHIP_STEPS: [string, string][] = [['new', 'Order placed'], ['processing', 'Getting it ready'], ['label_printed', 'Label made'], ['shipped', 'On the way'], ['delivered', 'Delivered']];
const PICKUP_STEPS: [string, string][] = [['new', 'Order placed'], ['processing', 'Getting it ready'], ['ready_pickup', 'Ready for pickup'], ['picked_up', 'Picked up']];

const esc = (s: unknown) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n: unknown) => (n === null || n === undefined || n === '') ? null : '$' + Number(n).toFixed(2);

const REST = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };
async function dbOrder(id: unknown): Promise<any | null> {
  const key = String(id ?? '');
  if (!/^\d{1,18}$/.test(key) || !SUPABASE_URL || !SERVICE_KEY) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${key}&select=*`, { headers: REST });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch { return null; }
}
async function patch(id: unknown, filter: string, body: Record<string, unknown>): Promise<any[]> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/orders?id=eq.${encodeURIComponent(String(id))}${filter}`, {
      method: 'PATCH', headers: { ...REST, 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(body),
    });
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}
async function setting(key: string): Promise<string> {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/app_settings?key=eq.${key}&select=value`, { headers: REST });
    const rows = await r.json();
    return Array.isArray(rows) && rows[0]?.value ? String(rows[0].value) : '';
  } catch { return ''; }
}
async function enabledSteps(): Promise<string[]> {
  try {
    const v = JSON.parse((await setting('order_email_statuses')) || 'null');
    if (Array.isArray(v)) return v.filter((s) => ALL_STATUSES.includes(s));
  } catch { /* fall through */ }
  return ALL_STATUSES;
}
const PICKUP_DEFAULT = "You chose local pickup in Phoenix. Saturday mornings: come through the NOCIV pop-up, the spot and time are posted on nociv.co. Reply to this email with the day that works for you and I will send the exact place and time.";
async function pickupNote(): Promise<string> { return ((await setting('pickup_instructions')).trim()) || PICKUP_DEFAULT; }

async function send(from: string, to: string, subject: string, text: string, html?: string, replyTo?: string): Promise<string | null> {
  if (!RESEND_API_KEY) return 'RESEND_API_KEY is not set';
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, ...(html ? { html } : {}), ...(replyTo ? { reply_to: replyTo } : {}) }),
    });
    if (!r.ok) return (await r.text()).slice(0, 300);
    return null;
  } catch (e) { return (e as Error).message; }
}

function itemLines(o: any): string {
  const items: any[] = Array.isArray(o.items) ? o.items : [];
  if (!items.length) return `- ${o.description || 'Your order'}${o.size ? ` (Size: ${o.size})` : ''}`;
  return items.map((i) => `- ${i.name}${i.size ? ` (Size: ${i.size})` : ''}${Number(i.quantity) > 1 ? ` x${i.quantity}` : ''}`).join('\n');
}
function dueText(o: any): string {
  if (!o.due_date) return '';
  return new Date(o.due_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

type Msg = { subject: string; headline: string; lines: string[]; showTracking?: boolean; pickup?: boolean };
async function messageFor(status: string, o: any): Promise<Msg> {
  const n = o.id;
  const mto = !!o.made_to_order;
  const due = dueText(o);
  const trk = o.tracking_number ? `${o.carrier ? o.carrier + ' ' : ''}tracking number: ${o.tracking_number}` : '';
  switch (status) {
    case 'new':
      return {
        subject: `Got your order #${n}`, headline: 'We got your order.',
        lines: [
          'Thank you. Here is what you got:', itemLines(o), '',
          o.shipping_method === 'pickup' ? await pickupNote()
            : (mto ? `It is made to order, so I make it after you buy it. I will have it made and shipped by ${due || 'the date on your tracker'}. I will email you at each step.`
              : 'I will start on it right away and email you at each step.'),
        ],
      };
    case 'processing':
      return {
        subject: mto ? `I am making your order #${n}` : `Your order #${n} is being packed`,
        headline: mto ? 'I am making your order now.' : 'I am getting your order ready.',
        lines: [mto ? `It is on the table right now.${due ? ` Due ${due}.` : ''}` : 'It is being packed up now. Next up is the shipping label.'],
      };
    case 'label_printed':
      return {
        subject: `Your shipping label is made, order #${n}`, headline: 'Your shipping label is made.',
        lines: ['Your order is packed and labeled. It goes out with the carrier next.', trk ? `Your ${trk}. It starts moving once the carrier scans it.` : ''],
        showTracking: true,
      };
    case 'shipped':
      return {
        subject: `Your order #${n} is on the way`, headline: 'Your order is on the way.',
        lines: [trk ? `Your ${trk}.` : 'It is with the carrier now.', o.tracking_url ? `Track it with the carrier: ${o.tracking_url}` : ''],
        showTracking: true,
      };
    case 'delivered':
      return {
        subject: `Your order #${n} was delivered`, headline: 'Your order was delivered.',
        lines: ['If anything is off, just reply to this email and I will make it right.', 'If you love it, tell one person where you got it. That is the whole marketing plan.'],
      };
    case 'ready_pickup':
      return { subject: `Your order #${n} is ready for pickup`, headline: 'Your order is ready for pickup.', lines: [await pickupNote()], pickup: true };
    case 'picked_up':
      return { subject: `Thanks for picking up order #${n}`, headline: 'Thanks for picking up.', lines: ['Tell one person where you got it. That is the whole marketing plan.'] };
    case 'cancelled':
      return { subject: `Your order #${n} was cancelled`, headline: 'Your order was cancelled.', lines: ['If you were charged, the refund goes back to your card and usually shows up in a few business days. Reply to this email with any questions.'] };
    case 'made':
      return { subject: `Your order #${n} is made`, headline: 'Your order is made.', lines: ['Good news. It is done and I am packing it up to ship to you now.'] };
  }
  return { subject: `Update on order #${n}`, headline: 'Update on your order.', lines: [] };
}

function render(o: any, status: string, m: Msg): { text: string; html: string } {
  const link = `${SITE}/order.html?t=${o.tracking_token}`;
  const steps = o.shipping_method === 'pickup' ? PICKUP_STEPS : SHIP_STEPS;
  const idx = Math.max(0, steps.findIndex(([s]) => s === status));
  const text = [m.headline, '', ...m.lines.filter((l) => l !== undefined), '', `See where your order is: ${link}`, '', 'Reply to this email if you have any questions.', '', 'NOCIV.CO', 'Nothing Of Civilization'].join('\n');
  const bar = status === 'cancelled' || status === 'made' ? '' :
    `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:18px 0 6px;table-layout:fixed"><tr>${steps.map(([s, label], i) => {
      const done = i < idx, now = i === idx;
      const bg = now ? '#c8412f' : (done ? '#1a1a1a' : '#d9d3c4');
      return `<td style="padding:0 2px;text-align:center;vertical-align:top"><div style="height:8px;background:${bg};border-radius:4px"></div><div style="font:700 11px/1.3 Helvetica,Arial,sans-serif;color:${now ? '#c8412f' : (done ? '#1a1a1a' : '#8a857a')};margin-top:6px;text-transform:uppercase;letter-spacing:.04em">${esc(label)}</div></td>`;
    }).join('')}</tr></table>`;
  const body = m.lines.filter(Boolean).map((l) => l === '' ? '' : `<p style="margin:0 0 12px;font:16px/1.5 Helvetica,Arial,sans-serif;color:#1a1a1a;white-space:pre-line">${esc(l).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#c8412f">$1</a>')}</p>`).join('');
  const html = `<div style="background:#e9e6df;padding:24px 12px"><div style="max-width:520px;margin:0 auto;background:#fff;border:2px solid #1a1a1a;padding:22px">
<div style="font:900 13px Helvetica,Arial,sans-serif;letter-spacing:.14em;background:#1a1a1a;color:#fff;display:inline-block;padding:4px 10px">NOCIV</div>
<h1 style="font:900 26px/1.15 Helvetica,Arial,sans-serif;margin:16px 0 4px;color:#1a1a1a">${esc(m.headline)}</h1>
<div style="font:13px Helvetica,Arial,sans-serif;color:#6b665c">Order #${esc(o.id)}</div>${bar}
<div style="margin-top:16px">${body}</div>
<p style="margin:20px 0"><a href="${link}" style="display:inline-block;background:#c8412f;color:#fff;text-decoration:none;font:900 14px Helvetica,Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:14px 22px">See where your order is</a></p>
<p style="margin:0;font:13px/1.5 Helvetica,Arial,sans-serif;color:#6b665c">Reply to this email if you have any questions.<br>NOCIV.CO, Nothing Of Civilization</p></div></div>`;
  return { text, html };
}

async function userOk(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') || '';
  if (!auth.toLowerCase().startsWith('bearer ') || !SUPABASE_URL) return false;
  try {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: SERVICE_KEY, Authorization: auth } });
    return r.ok;
  } catch { return false; }
}

async function ownerEmail(o: any): Promise<string | null> {
  if (!NOTIFY_EMAIL) return 'NOTIFY_EMAIL is not set';
  const items: any[] = Array.isArray(o.items) ? o.items : [];
  const count = items.reduce((n, i) => n + (Number(i.quantity) || 1), 0) || 1;
  const headline = items.length > 1 ? `${count} items` : (items[0]?.name || o.description || 'An order');
  const amount = money(o.amount_paid) || 'an unknown amount';
  const method = o.shipping_method === 'pickup' ? 'LOCAL PICKUP. Email them to set a time.'
    : (o.source === 'in_person' ? 'Handed over in person' : `Ship it${o.shipping_paid ? ` (they paid ${money(o.shipping_paid)} shipping)` : ''}`);
  const mto = o.made_to_order ? `\nMADE TO ORDER. ${o.due_date ? 'Make it and ship it by ' + dueText(o) + '.' : 'Check the made to order queue.'}\n` : '';
  const text = `A new order just came in.\n\n${itemLines(o)}\n${mto}\nTotal paid: ${amount}\nHow it gets to them: ${method}\nSource: ${o.source === 'in_person' ? 'In-Person (Tap to Pay)' : 'Online checkout'}\nCustomer email: ${o.customer_email || 'no email on file'}\n\nOpen Admin, Recent Orders, and tap the button on the order to move it along. Your customer gets a note at each step.`;
  return await send('NOCIV Orders <onboarding@resend.dev>', NOTIFY_EMAIL,
    `New order: ${headline}, ${amount}${o.shipping_method === 'pickup' ? ', PICKUP' : ''}${o.made_to_order ? ', MADE TO ORDER' : ''}`, text, undefined, o.customer_email || undefined);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json();
    const order = await dbOrder(body.order_id ?? body.record?.id);
    if (!order) return json({ error: 'order not found' }, 404);

    // TEST: show or send one step's email to YOU only. Needs you logged in to Admin.
    if (body.test || body.preview) {
      if (!(await userOk(req))) return json({ error: 'Log in to Admin first.' }, 401);
      const status = String(body.status || order.order_status);
      const m = await messageFor(status, order);
      const { text, html } = render(order, status, m);
      if (body.preview) return json({ subject: m.subject, text, sender_set: !!FROM });
      if (!NOTIFY_EMAIL) return json({ error: 'NOTIFY_EMAIL is not set.' }, 400);
      const err = await send(FROM || 'NOCIV Orders <onboarding@resend.dev>', NOTIFY_EMAIL, `[TEST to you only] ${m.subject}`, text, html);
      return json({ sent: !err, error: err, sender_set: !!FROM, sent_to: NOTIFY_EMAIL });
    }

    const out: Record<string, unknown> = {};

    // 1. You hear about a new order once.
    if (!order.owner_notified_at) {
      const claimed = await patch(order.id, '&owner_notified_at=is.null', { owner_notified_at: new Date().toISOString() });
      if (claimed.length) { const e = await ownerEmail(order); out.owner = e ? 'failed: ' + e : 'sent'; if (e) await patch(order.id, '', { owner_notified_at: null }); }
    }

    // 2. The customer hears about each step once.
    const status = order.order_status as string;
    if (order.emailed_status !== status) {
      const enabled = await enabledSteps();
      if (order.source === 'in_person' || !order.customer_email || !enabled.includes(status)) {
        await patch(order.id, '', { emailed_status: status });
        out.customer = 'not needed';
      } else if (!FROM) {
        await patch(order.id, '', { email_error: 'No sender address set, so the customer was not emailed. Add the CUSTOMER_FROM secret (see Admin, Recent Orders, Customer emails).' });
        out.customer = 'no sender address';
      } else {
        const prev = order.emailed_status ?? null;
        const claim = prev === null ? '&emailed_status=is.null' : `&emailed_status=eq.${encodeURIComponent(prev)}`;
        const got = await patch(order.id, claim, { emailed_status: status });
        if (got.length) {
          const m = await messageFor(status, order);
          const { text, html } = render(order, status, m);
          const err = await send(FROM, order.customer_email, m.subject, text, html, NOTIFY_EMAIL || undefined);
          if (err) { await patch(order.id, '', { emailed_status: prev, email_error: 'Customer email failed: ' + err }); out.customer = 'failed: ' + err; }
          else { await patch(order.id, '', { email_error: null }); out.customer = 'sent'; }
        } else out.customer = 'already handled';
      }
    }

    // 3. Made to order: "your order is made".
    if (order.made_to_order && order.make_status === 'ready' && !order.ready_notified_at && order.customer_email && FROM && order.source !== 'in_person') {
      const claimed = await patch(order.id, '&ready_notified_at=is.null', { ready_notified_at: new Date().toISOString() });
      if (claimed.length) {
        const m = await messageFor('made', order); const { text, html } = render(order, 'made', m);
        const err = await send(FROM, order.customer_email, m.subject, text, html, NOTIFY_EMAIL || undefined);
        if (err) { await patch(order.id, '', { ready_notified_at: null, email_error: 'Made email failed: ' + err }); out.made = 'failed: ' + err; } else out.made = 'sent';
      }
    }
    return json(out);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
});
