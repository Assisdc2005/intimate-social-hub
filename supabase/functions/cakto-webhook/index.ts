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
    console.log('🔔 Cakto webhook received');
    
    const body = await req.text();
    const signature = req.headers.get("x-cakto-signature");
    
    console.log('📨 Webhook body received:', body);
    console.log('🔐 Signature:', signature);

    // Verificar assinatura do webhook (implementar conforme documentação da Cakto)
    const webhookSecret = Deno.env.get("CAKTO_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      // Aqui você implementaria a verificação da assinatura conforme a documentação da Cakto
      // Exemplo: verificar HMAC SHA256
      console.log('🔍 Verifying webhook signature...');
    }

    const event = JSON.parse(body);
    console.log('📄 Event type:', event.type);
    console.log('📄 Event data:', event.data);

    // Criar cliente Supabase com chave de serviço
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    switch (event.type) {
      case "checkout.payment_approved":
      case "payment.completed":
        await handlePaymentCompleted(supabase, event.data);
        break;
      
      case "checkout.payment_failed":
      case "payment.failed":
        await handlePaymentFailed(supabase, event.data);
        break;
      
      case "subscription.canceled":
        await handleSubscriptionCanceled(supabase, event.data);
        break;
      
      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ error: "Webhook processing failed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handlePaymentCompleted(supabase: any, data: any) {
  console.log('✅ Processing payment completed:', data);
  
  try {
    const checkoutId = data.checkout_id || data.id;
    const userId = data.metadata?.user_id;
    const periodo = data.metadata?.periodo;
    
    if (!userId) {
      console.error('❌ No user_id in webhook data');
      return;
    }

    // Atualizar status do checkout
    await supabase
      .from("cakto_checkouts")
      .update({ status: "completed" })
      .eq("checkout_id", checkoutId);

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error('❌ Error finding user profile:', profileError);
      return;
    }

    // Calcular data de expiração baseada no período
    const now = new Date();
    let expiresAt = new Date();
    
    switch (periodo) {
      case "semanal":
        expiresAt.setDate(now.getDate() + 7);
        break;
      case "quinzenal":
        expiresAt.setDate(now.getDate() + 14);
        break;
      case "mensal":
        expiresAt.setMonth(now.getMonth() + 1);
        break;
      default:
        expiresAt.setDate(now.getDate() + 7); // Default semanal
    }

    // Criar nova assinatura
    const { data: subscription, error: subError } = await supabase
      .from("assinaturas")
      .insert({
        user_id: userId,
        perfil_id: profile.id,
        cakto_checkout_id: checkoutId,
        status: "active",
        data_inicio: now.toISOString(),
        data_fim: expiresAt.toISOString(),
        valor: data.amount ? data.amount / 100 : 0, // Converter de centavos
        periodo: periodo,
        plano: `Premium ${periodo}`,
      })
      .select()
      .single();

    if (subError) {
      console.error('❌ Error creating subscription:', subError);
      return;
    }

    // Atualizar perfil para premium - manual fallback se o trigger falhar
    try {
      await supabase
        .from("profiles")
        .update({
          tipo_assinatura: "premium",
          subscription_expires_at: expiresAt.toISOString(),
          assinatura_id: subscription.id,
        })
        .eq("id", userId);
      
      console.log('✅ Profile updated to premium manually');
    } catch (updateError) {
      console.error('⚠️ Manual profile update failed, relying on trigger:', updateError);
    }

    console.log('✅ Payment completed successfully processed');
  } catch (error) {
    console.error('❌ Error processing payment completed:', error);
  }
}

async function handlePaymentFailed(supabase: any, data: any) {
  console.log('❌ Processing payment failed:', data);
  
  const checkoutId = data.checkout_id || data.id;
  
  await supabase
    .from("cakto_checkouts")
    .update({ status: "failed" })
    .eq("checkout_id", checkoutId);
}

async function handleSubscriptionCanceled(supabase: any, data: any) {
  console.log('🚫 Processing subscription canceled:', data);
  
  try {
    const subscriptionId = data.subscription_id || data.id;
    const userId = data.metadata?.user_id;
    
    if (userId) {
      // Atualizar assinatura para cancelada
      await supabase
        .from("assinaturas")
        .update({ status: "canceled" })
        .eq("cakto_checkout_id", subscriptionId);
      
      // Atualizar perfil para gratuito
      await supabase
        .from("profiles")
        .update({
          tipo_assinatura: "gratuito",
          subscription_expires_at: null,
          assinatura_id: null,
        })
        .eq("id", userId);
      
      console.log('✅ Subscription canceled successfully processed');
    }
  } catch (error) {
    console.error('❌ Error processing subscription cancelation:', error);
  }
}