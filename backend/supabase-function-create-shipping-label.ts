// Supabase Edge Function: shipping-label  (file name in the project: create-shipping-label)
//
// WHAT THIS DOES
// The "Create Shipping Label" button on an order in Admin calls this. It takes the
// address saved on that order, asks Shippo for the cheapest real rate, buys the
// label, saves the label link, tracking number, carrier and carrier tracking link
// on the order, and moves the order to "Label made" so your customer gets their
// "your shipping label is made" email and the tracker bar moves.
//
// DEPLOY: Supabase Dashboard, Edge Functions, "shipping-label", paste, Deploy.
// Leave "Verify JWT" ON. Admin now sends your login with the request.
// SECRETS (already set): SHIPPO_API_KEY, SHIP_FROM_NAME, SHIP_FROM_STREET1,
//   SHIP_FROM_CITY, SHIP_FROM_STATE, SHIP_FROM_ZIP, SHIP_FROM_COUNTRY, SHIP_FROM_PHONE

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SHIPPO_API_KEY = Deno.env.get('SHIPPO_API_KEY')!;
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { order_id, weight_oz, length_in, width_in, height_in } = await req.json();
    if (!order_id) throw new Error('order_id is required');

    const { data: order, error: orderErr } = await supabase.from('orders').select('*').eq('id', order_id).single();
    if (orderErr || !order) throw new Error('Order not found.');

    if (!order.ship_name || !order.ship_address1 || !order.ship_city || !order.ship_state || !order.ship_zip) {
      throw new Error('This order is missing a shipping address. Fill in and save the address fields first.');
    }

    const addressFrom = {
      name: Deno.env.get('SHIP_FROM_NAME'),
      street1: Deno.env.get('SHIP_FROM_STREET1'),
      city: Deno.env.get('SHIP_FROM_CITY'),
      state: Deno.env.get('SHIP_FROM_STATE'),
      zip: Deno.env.get('SHIP_FROM_ZIP'),
      country: Deno.env.get('SHIP_FROM_COUNTRY') || 'US',
      phone: Deno.env.get('SHIP_FROM_PHONE'),
    };
    const addressTo = {
      name: order.ship_name,
      street1: order.ship_address1,
      street2: order.ship_address2 || '',
      city: order.ship_city,
      state: order.ship_state,
      zip: order.ship_zip,
      country: order.ship_country || 'US',
      email: order.customer_email || undefined,
    };
    const parcel = {
      length: String(length_in || 10), width: String(width_in || 8), height: String(height_in || 2),
      distance_unit: 'in', weight: String(weight_oz || 8), mass_unit: 'oz',
    };

    const shipmentRes = await fetch('https://api.goshippo.com/shipments/', {
      method: 'POST',
      headers: { Authorization: `ShippoToken ${SHIPPO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ address_from: addressFrom, address_to: addressTo, parcels: [parcel], async: false }),
    });
    const shipment = await shipmentRes.json();
    if (!shipment.rates || shipment.rates.length === 0) {
      throw new Error(shipment.messages?.[0]?.text || 'Shippo could not find a shipping rate for this address. Double check the address is correct.');
    }
    const cheapest = shipment.rates.reduce((a: any, b: any) => (parseFloat(a.amount) < parseFloat(b.amount) ? a : b));

    const txRes = await fetch('https://api.goshippo.com/transactions/', {
      method: 'POST',
      headers: { Authorization: `ShippoToken ${SHIPPO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rate: cheapest.object_id, label_file_type: 'PDF', async: false }),
    });
    const tx = await txRes.json();
    if (tx.status !== 'SUCCESS') {
      const msg = tx.messages?.[0]?.text || 'Shippo could not create the label.';
      await supabase.from('orders').update({ label_error: msg }).eq('id', order_id);
      throw new Error(msg);
    }

    const update: Record<string, unknown> = {
      label_url: tx.label_url,
      tracking_number: tx.tracking_number,
      tracking_url: tx.tracking_url_provider || null,
      carrier: cheapest.provider,
      package_weight_oz: weight_oz || null,
      label_error: null,
    };
    // Move the tracker to "Label made", but never backwards (not if it already shipped or was cancelled).
    if (order.order_status === 'new' || order.order_status === 'processing') update.order_status = 'label_printed';
    await supabase.from('orders').update(update).eq('id', order_id);

    return new Response(JSON.stringify({
      label_url: tx.label_url, tracking_number: tx.tracking_number, carrier: cheapest.provider, rate_amount: cheapest.amount,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
