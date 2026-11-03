// Supabase Edge Function: send-push
//
// WHAT THIS DOES
// The "Send drop alert" button in Admin calls this. It sends one notification to every
// phone that opted in to pop-up shop alerts in the shop app. Phones that have turned
// alerts off or deleted the app are removed from the list automatically.
//
// ONLY YOU CAN USE IT. The login must be your admin email (nociv.co@gmail.com, or the
// ADMIN_EMAIL secret). Anyone else gets a 403 and nothing is sent. JWT verification stays
// off at the gateway so the browser's CORS check can pass, the login is checked here.
//
// DEPLOY: Supabase Dashboard, Edge Functions, "send-push", paste, Deploy, Verify JWT OFF.
// KEYS: made automatically and stored in the push_keys table (see the SQL). Optional secret:
//   VAPID_SUBJECT. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are added by Supabase.
// SQL: supabase-migration-push-alerts.sql

import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_EMAIL = (Deno.env.get("ADMIN_EMAIL") || "nociv.co@gmail.com").toLowerCase();
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Only the admin
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: who } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
    if (!who?.user || (who.user.email || "").toLowerCase() !== ADMIN_EMAIL) return json({ error: "Only the admin can send alerts." }, 403);

    const body = await req.json().catch(() => ({}));

    // Signing keys live in the push_keys table. They are made once, here, the first time you ask.
    let pub: string | undefined, priv: string | undefined;
    {
      const { data: k, error: ke } = await supabase.from("push_keys").select("public_key, private_key").eq("id", 1).maybeSingle();
      if (ke) return json({ error: "Run supabase-migration-push-alerts.sql first. " + ke.message }, 500);
      pub = k?.public_key; priv = k?.private_key;
      if (!pub || !priv) {
        const made = webpush.generateVAPIDKeys();
        const { error: we } = await supabase.from("push_keys").upsert({ id: 1, public_key: made.publicKey, private_key: made.privateKey });
        if (we) return json({ error: we.message }, 500);
        pub = made.publicKey; priv = made.privateKey;
      }
    }

    // "init" just makes sure the keys exist and reports how many phones are signed up.
    if (body.init) {
      const { count } = await supabase.from("push_subscriptions").select("id", { count: "exact", head: true }).eq("topic", "popup");
      return json({ ok: true, ready: true, subscribers: count || 0 });
    }

    // 2. The message
    const title = String(body.title || "").trim().slice(0, 60);
    const text = String(body.body || "").trim().slice(0, 160);
    let url = String(body.url || "/").trim();
    if (!title || !text) return json({ error: "Type a title and a message." }, 400);
    if (!/^\/[^\s]*$/.test(url)) url = "/"; // only pages on this site
    const only = typeof body.only_endpoint === "string" ? body.only_endpoint : null; // used for the test send

    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") || "mailto:nociv.co@gmail.com", pub, priv);

    // 3. Everyone who opted in
    let q = supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("topic", "popup").limit(5000);
    if (only) q = q.eq("endpoint", only);
    const { data: subs, error } = await q;
    if (error) return json({ error: error.message }, 500);
    if (!subs?.length) return json({ ok: true, sent: 0, failed: 0, removed: 0, note: "Nobody has opted in yet." });

    const payload = JSON.stringify({ title, body: text, url });
    let sent = 0, failed = 0; const dead: number[] = [];
    for (let i = 0; i < subs.length; i += 50) {
      const batch = subs.slice(i, i + 50);
      const results = await Promise.allSettled(batch.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 })));
      results.forEach((r, k) => {
        if (r.status === "fulfilled") sent++;
        else {
          failed++;
          const code = (r.reason && (r.reason as { statusCode?: number }).statusCode) || 0;
          if (code === 404 || code === 410) dead.push(batch[k].id);
        }
      });
    }
    if (dead.length) await supabase.from("push_subscriptions").delete().in("id", dead);
    return json({ ok: true, sent, failed, removed: dead.length });
  } catch (err) {
    console.error("send-push failed:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
