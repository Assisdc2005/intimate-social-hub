import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false }
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    const { periodo, caktoLink } = await req.json();

    console.log('Creating Cakto checkout:', { userId: user.id, periodo, caktoLink });

    // Extrair checkout_id do link da Cakto
    const checkoutId = caktoLink.split('/').pop()?.split('_')[1];

    if (!checkoutId) {
      throw new Error("Invalid Cakto link");
    }

    // Determinar valor do plano
    const valores: Record<string, number> = {
      'semanal': 14.90,
      'quinzenal': 19.90,
      'mensal': 29.90
    };

    // Registrar checkout na tabela cakto_checkouts
    const { error: checkoutError } = await supabase
      .from('cakto_checkouts')
      .insert({
        user_id: user.id,
        checkout_id: checkoutId,
        periodo: periodo,
        amount: valores[periodo] || 29.90,
        status: 'pending'
      });

    if (checkoutError) {
      console.error('Error creating checkout:', checkoutError);
      throw checkoutError;
    }

    console.log('✅ Checkout created successfully');

    // Retornar o link da Cakto para o frontend abrir
    return new Response(
      JSON.stringify({ 
        url: caktoLink,
        checkoutId: checkoutId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
