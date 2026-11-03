// Supabase Edge Function: create-stripe-price
//
// Called from admin.html's "Create in Stripe" button. Takes a product name
// and a price, creates both the Stripe Product and the Stripe Price behind
// it, and hands back the Price ID.
//
// SECURITY: only the admin can call this. The login must belong to the admin email
// (nociv.co@gmail.com, or the ADMIN_EMAIL secret). Any other login gets a 403.
// (JWT verification stays off at the gateway so the browser's CORS check can pass,
// the login is checked right here instead.)
//
// Deploy:
//   supabase functions deploy create-stripe-price --no-verify-jwt
//
// Secrets: STRIPE_SECRET_KEY. SUPABASE_URL and SUPABASE_ANON_KEY are added by Supabase.

import Stripe from "npm:stripe@17";

const ADMIN_EMAIL = (Deno.env.get("ADMIN_EMAIL") || "nociv.co@gmail.com").toLowerCase();
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Must be the admin
    const auth = req.headers.get("Authorization") || "";
    if (!auth.toLowerCase().startsWith("bearer ")) return json({ error: "Log in to Admin first." }, 401);
    const who = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, {
      headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    });
    if (!who.ok) return json({ error: "Log in to Admin first." }, 401);
    const me = await who.json().catch(() => ({}));
    if (String(me?.email || "").toLowerCase() !== ADMIN_EMAIL) return json({ error: "Only the admin can do this." }, 403);

    // 2. Check the request
    const { name, price } = await req.json();
    if (!name || typeof name !== "string" || !name.trim()) return json({ error: "Missing product name." }, 400);
    const priceNum = parseFloat(price);
    if (!priceNum || priceNum <= 0) return json({ error: "Missing or invalid price." }, 400);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

    // One Stripe Product per listing, one Price attached to it. If the price changes later,
    // a brand new Price is made, old prices just sit unused in Stripe.
    const product = await stripe.products.create({ name: name.trim() });
    const stripePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(priceNum * 100),
      currency: "usd",
    });

    return json({ priceId: stripePrice.id, productId: product.id });
  } catch (err) {
    console.error("create-stripe-price error:", err);
    return json({ error: (err as Error).message || "Something went wrong." }, 500);
  }
});
