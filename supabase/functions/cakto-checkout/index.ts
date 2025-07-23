import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CaktoCheckoutRequest {
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  planId: string;
  periodo: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, description, customerEmail, customerName, planId, periodo }: CaktoCheckoutRequest = await req.json();
    
    console.log('💰 Creating Cakto checkout session for plan:', periodo);

    // Verificar se as variáveis de ambiente estão definidas
    const caktoApiKey = Deno.env.get("CAKTO_API_KEY");
    const caktoBaseUrl = Deno.env.get("CAKTO_BASE_URL") || "https://api.cakto.com.br/v1";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!caktoApiKey) {
      console.error("❌ CAKTO_API_KEY not configured");
      throw new Error("Configuração de pagamento não encontrada");
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Supabase environment variables not configured");
      throw new Error("Configuração do banco de dados não encontrada");
    }

    // Criar cliente Supabase para autenticação
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Obter usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Usuário não autenticado");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("❌ User authentication failed:", userError);
      throw new Error("Falha na autenticação do usuário");
    }

    const user = userData.user;
    console.log('🔍 User authenticated:', user.id, user.email);

    // Preparar dados do checkout para Cakto
    const checkoutData = {
      amount: amount * 100, // Converter para centavos
      currency: "BRL",
      description: description,
      customer: {
        email: customerEmail || user.email,
        name: customerName || user.user_metadata?.name || "Cliente",
      },
      metadata: {
        user_id: user.id,
        plan_id: planId,
        periodo: periodo,
      },
      success_url: `${req.headers.get("origin")}/premium?success=true`,
      cancel_url: `${req.headers.get("origin")}/premium?canceled=true`,
      webhook_url: `${req.headers.get("origin")}/functions/v1/cakto-webhook`,
    };

    console.log('📋 Checkout data prepared:', checkoutData);

    // Fazer requisição para API da Cakto
    const caktoResponse = await fetch(`${caktoBaseUrl}/checkout`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${caktoApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkoutData),
    });

    if (!caktoResponse.ok) {
      const errorData = await caktoResponse.text();
      console.error("❌ Cakto API error:", errorData);
      throw new Error("Erro ao criar checkout na Cakto");
    }

    const caktoResult = await caktoResponse.json();
    console.log('✅ Cakto checkout created:', caktoResult);

    // Salvar dados do checkout no Supabase para rastreamento
    const supabaseService = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    await supabaseService.from("cakto_checkouts").insert({
      user_id: user.id,
      checkout_id: caktoResult.id || caktoResult.checkout_id,
      amount: amount,
      periodo: periodo,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ 
      checkout_url: caktoResult.checkout_url || caktoResult.url,
      checkout_id: caktoResult.id || caktoResult.checkout_id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error creating Cakto checkout:', error);
    
    let errorMessage = "Erro interno do servidor";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});