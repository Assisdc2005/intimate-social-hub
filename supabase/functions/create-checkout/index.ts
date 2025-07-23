
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { priceId, periodo } = await req.json();
    
    if (!priceId) {
      throw new Error("Price ID is required");
    }

    console.log('💰 Creating checkout session for price:', priceId);

    // Verificar se as variáveis de ambiente estão definidas
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase environment variables are not configured");
    }

    // Criar cliente Supabase para autenticação
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Obter usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    console.log('🔍 User authenticated:', user.id, user.email);

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verificar se o cliente já existe no Stripe
    let customerId = null;
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log('✅ Existing customer found:', customerId);
    } else {
      // Criar novo cliente
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
      console.log('✅ New customer created:', customerId);
    }

    // Determinar valores baseado no preço
    let lineItems = [];
    let sessionMetadata = {
      user_id: user.id,
      periodo: periodo || 'mensal'
    };

    if (priceId === 'price_1Rn2ekD3X7OLOCgdTVptrYmK') {
      // Semanal
      lineItems = [{
        price: priceId,
        quantity: 1,
      }];
      sessionMetadata.periodo = 'semanal';
    } else if (priceId === 'price_1Rn2hQD3X7OLOCgddzwdYC6X') {
      // Quinzenal
      lineItems = [{
        price: priceId,
        quantity: 1,
      }];
      sessionMetadata.periodo = 'quinzenal';
    } else if (priceId === 'price_1Rn2hZD3X7OLOCgd3HzBOW1i') {
      // Mensal
      lineItems = [{
        price: priceId,
        quantity: 1,
      }];
      sessionMetadata.periodo = 'mensal';
    } else {
      throw new Error("Invalid price ID");
    }

    console.log('💰 Creating checkout session with metadata:', sessionMetadata);

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${req.headers.get("origin")}/premium?success=true`,
      cancel_url: `${req.headers.get("origin")}/premium?canceled=true`,
      metadata: sessionMetadata,
    });

    console.log('✅ Checkout session created:', session.id);
    console.log('✅ Session URL:', session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error creating checkout:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
