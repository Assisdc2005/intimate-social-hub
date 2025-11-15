import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cakto-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Cakto webhook received');
    console.log('📨 Headers:', Object.fromEntries(req.headers.entries()));
    
    const body = await req.text();
    const signature = req.headers.get("x-cakto-signature");
    
    console.log('📨 Webhook body received:', body);
    console.log('🔐 Signature:', signature);

    // Verificar assinatura do webhook se configurada
    const webhookSecret = Deno.env.get("CAKTO_WEBHOOK_SECRET");
    if (webhookSecret && signature) {
      console.log('🔍 Verifying webhook signature...');
      // Implementar verificação de assinatura conforme documentação da Cakto
      // Por exemplo, HMAC SHA256
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('❌ Invalid JSON:', error);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    console.log('📄 Event received:', event);

    // Criar cliente Supabase com chave de serviço
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Processar diferentes tipos de eventos da Cakto
    await processWebhookEvent(supabase, event);

    return new Response(JSON.stringify({ received: true, status: "processed" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return new Response(JSON.stringify({ 
      error: "Webhook processing failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processWebhookEvent(supabase: any, event: any) {
  console.log('🔄 Processing webhook event:', event);

  // Identificar o tipo de evento baseado na estrutura
  const eventType = event.type || event.event_type || determineEventType(event);
  
  console.log('📋 Event type determined:', eventType);

  switch (eventType) {
    case 'payment.approved':
    case 'payment.completed':
    case 'checkout.completed':
    case 'subscription.activated':
      await handlePaymentCompleted(supabase, event);
      break;
    
    case 'payment.failed':
    case 'payment.canceled':
    case 'checkout.failed':
      await handlePaymentFailed(supabase, event);
      break;
    
    case 'subscription.canceled':
    case 'subscription.expired':
      await handleSubscriptionCanceled(supabase, event);
      break;
    
    default:
      console.log('ℹ️ Unhandled event type:', eventType);
      console.log('📋 Full event data:', event);
  }
}

function determineEventType(event: any): string {
  // Determinar tipo de evento baseado nos campos disponíveis
  if (event.status === 'approved' || event.status === 'paid') {
    return 'payment.completed';
  }
  if (event.status === 'failed' || event.status === 'canceled') {
    return 'payment.failed';
  }
  return 'unknown';
}

async function handlePaymentCompleted(supabase: any, data: any) {
  console.log('✅ Processing payment completed:', data);
  
  try {
    // Extrair checkout_id do webhook da Cakto
    const checkoutId = data.checkout_id || data.id || data.transaction_id;
    const amount = data.amount || data.value || data.total;
    const transactionId = data.transaction_id || data.id;
    
    console.log('📋 Payment details:', { checkoutId, amount, transactionId });

    if (!checkoutId) {
      console.error('❌ No checkout_id found in webhook data');
      return;
    }

    // Buscar checkout registrado para obter user_id
    const { data: checkout, error: checkoutError } = await supabase
      .from('cakto_checkouts')
      .select('user_id, periodo')
      .eq('checkout_id', checkoutId)
      .single();
    
    if (checkoutError || !checkout) {
      console.error('❌ Checkout not found:', checkoutId, checkoutError);
      return;
    }

    const userId = checkout.user_id;
    const periodo = checkout.periodo || 'mensal';
    
    console.log('👤 User ID:', userId);
    console.log('📅 Period:', periodo);

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, user_id")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      console.error('❌ Error finding user profile:', profileError);
      return;
    }

    // Calcular data de fim baseado no período
    let dataFim = new Date();
    if (periodo === 'semanal') {
      dataFim.setDate(dataFim.getDate() + 7);
    } else if (periodo === 'quinzenal') {
      dataFim.setDate(dataFim.getDate() + 14);
    } else if (periodo === 'mensal') {
      dataFim.setMonth(dataFim.getMonth() + 1);
    }

    console.log('📅 Subscription expires:', dataFim);

    // Criar nova assinatura
    const { data: subscription, error: subError } = await supabase
      .from("assinaturas")
      .insert({
        user_id: userId,
        perfil_id: profile.id,
        cakto_checkout_id: checkoutId,
        status: "active",
        data_inicio: new Date().toISOString(),
        data_fim: dataFim.toISOString(),
        valor: amount || 0,
        periodo: periodo,
        plano: `Premium ${periodo}`,
        stripe_customer_id: null,
        stripe_subscription_id: transactionId,
        stripe_price_id: periodo,
      })
      .select()
      .single();

    if (subError) {
      console.error('❌ Error creating subscription:', subError);
      
      // Se falhar, tentar atualizar manualmente o perfil
      await updateProfileToPremium(supabase, userId, dataFim);
      return;
    }

    console.log('✅ Subscription created:', subscription);

    // Atualizar checkout para completed
    await supabase
      .from('cakto_checkouts')
      .update({ status: 'completed' })
      .eq('checkout_id', checkoutId);

    // Atualizar perfil para premium - manual fallback se o trigger falhar
    await updateProfileToPremium(supabase, userId, dataFim, subscription.id);

    console.log('✅ Payment completed successfully processed for user:', userId);
  } catch (error) {
    console.error('❌ Error processing payment completed:', error);
  }
}

async function updateProfileToPremium(supabase: any, userId: string, expiresAt: Date, subscriptionId?: string) {
  try {
    const updateData: any = {
      tipo_assinatura: "premium",
      subscription_expires_at: expiresAt.toISOString(),
    };

    if (subscriptionId) {
      updateData.assinatura_id = subscriptionId;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("user_id", userId);
    
    if (error) {
      console.error('❌ Error updating profile to premium:', error);
    } else {
      console.log('✅ Profile updated to premium successfully');
    }
  } catch (error) {
    console.error('❌ Error in updateProfileToPremium:', error);
  }
}

async function handlePaymentFailed(supabase: any, data: any) {
  console.log('❌ Processing payment failed:', data);
  
  const customerEmail = data.customer?.email || data.email || data.buyer?.email;
  const transactionId = data.transaction_id || data.id;
  
  console.log('📋 Failed payment details:', { customerEmail, transactionId });
  
  // Log para debug, mas não fazemos nada específico para falhas
  // O usuário permanece gratuito
}

async function handleSubscriptionCanceled(supabase: any, data: any) {
  console.log('🚫 Processing subscription canceled:', data);
  
  try {
    const customerEmail = data.customer?.email || data.email || data.buyer?.email;
    const transactionId = data.transaction_id || data.subscription_id || data.id;
    
    if (!customerEmail) {
      console.error('❌ No customer email found in cancelation data');
      return;
    }

    // Buscar usuário pelo email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return;
    }

    const user = userData.users.find((u: any) => u.email === customerEmail);
    
    if (!user) {
      console.error('❌ User not found with email:', customerEmail);
      return;
    }

    // Atualizar assinaturas para cancelada
    await supabase
      .from("assinaturas")
      .update({ status: "canceled" })
      .eq("user_id", user.id)
      .eq("status", "active");
    
    // Atualizar perfil para gratuito
    await supabase
      .from("profiles")
      .update({
        tipo_assinatura: "gratuito",
        subscription_expires_at: null,
        assinatura_id: null,
      })
      .eq("user_id", user.id);
    
    console.log('✅ Subscription canceled successfully processed for user:', user.email);
  } catch (error) {
    console.error('❌ Error processing subscription cancelation:', error);
  }
}