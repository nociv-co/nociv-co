// Supabase Edge Function: refund-order
//
// WHAT THIS DOES
// The "Refund" button on an order in Admin calls this. It refunds the customer's card
// in Stripe (all of it, or an amount you type), then records the refund on the order.
// A full refund also moves the order to Cancelled, so the customer is told and the
// order leaves your Needs you list.
//
// ONLY YOU CAN USE IT. It checks that the login sent with the request is your admin
// email (nociv.co@gmail.com, or the ADMIN_EMAIL secret if you set one). Any other login
// gets a 403 and Stripe is never called.
//
// SAFE AGAINST DOUBLE TAPS. The refund carries an idempotency key built from the order,
// what was already refunded and the amount, so tapping twice never refunds twice.
//
// DEPLOY: Supabase Dashboard, Edge Functions, "refund-order", paste, Deploy.
// Leave "Verify JWT" ON.
// SECRETS (already set for checkout): STRIPE_SECRET_KEY (must be sk_live_ for real
//   refunds), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Optional: ADMIN_EMAIL.
// SQL: supabase-migration-admin-extras.sql (refund columns). The refund still works
//   without it, it just cannot remember the refund on the order.

import Stripe from "npm:stripe@17";
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_EMAIL = (Deno.env.get("ADMIN_EMAIL") || "nociv.co@gmail.com").toLowerCase();
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Who is asking? Only the admin.
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: who } = token ? await supabase.auth.getUser(token) : { data: { user: null } };
    if (!who?.user || (who.user.email || "").toLowerCase() !== ADMIN_EMAIL) {
      return json({ error: "Only the admin can refund." }, 403);
    }

    // 2. Which order, how much
    const body = await req.json().catch(() => ({}));
    const orderId = body.order_id;
    if (!orderId) return json({ error: "order_id is required." }, 400);
    const { data: order, error: orderErr } = await supabase.from("orders").select("*").eq("id", orderId).single();
    if (orderErr || !order) return json({ error: "Order not found." }, 404);
    if (!order.stripe_payment_intent_id) {
      return json({ error: "This order has no Stripe payment on it, so there is nothing to refund here." }, 400);
    }

    // 3. Ask Stripe what was really paid and already refunded (never trust the page for money)
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
    const pi = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id);
    const paid = pi.amount_received ?? 0;
    let already = 0;
    if (pi.latest_charge) {
      const ch = await stripe.charges.retrieve(typeof pi.latest_charge === "string" ? pi.latest_charge : pi.latest_charge.id);
      already = ch.amount_refunded ?? 0;
    }
    const remaining = paid - already;
    if (remaining <= 0) return json({ error: "This payment is already fully refunded." }, 400);

    let cents = remaining;
    if (body.amount !== undefined && body.amount !== null && body.amount !== "") {
      cents = Math.round(Number(body.amount) * 100);
      if (!Number.isFinite(cents) || cents <= 0) return json({ error: "Type an amount above zero, like 5.00." }, 400);
      if (cents > remaining) return json({ error: `You can refund at most $${(remaining / 100).toFixed(2)} on this payment.` }, 400);
    }

    // 4. Refund
    const refund = await stripe.refunds.create(
      {
        payment_intent: pi.id,
        amount: cents,
        reason: "requested_by_customer",
        metadata: { order_id: String(order.id), source: "nociv-admin" },
      },
      { idempotencyKey: `nociv-refund-${order.id}-${already}-${cents}` },
    );

    // 5. Remember it on the order. Never let a bookkeeping problem hide a refund that worked.
    const total = (already + cents) / 100;
    const full = already + cents >= paid;
    const { error: e1 } = await supabase.from("orders")
      .update({ refunded_amount: total, refund_id: refund.id, refunded_at: new Date().toISOString() }).eq("id", order.id);
    if (e1) console.error("Refund worked but could not be saved on the order:", e1);
    if (full && order.order_status !== "cancelled") {
      const { error: e2 } = await supabase.from("orders").update({ order_status: "cancelled" }).eq("id", order.id);
      if (e2) console.error("Refund worked but could not cancel the order:", e2);
    }

    return json({ ok: true, refund_id: refund.id, refunded: cents / 100, total_refunded: total, full, status: refund.status, saved: !e1 });
  } catch (err) {
    console.error("refund-order failed:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});
