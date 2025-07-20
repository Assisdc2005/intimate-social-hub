
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
    );

    console.log('Webhook event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('Checkout completed:', session.id);
        
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          const customer = await stripe.customers.retrieve(session.customer);
          
          if (typeof customer === 'string') {
            console.error('Customer is a string, expected object');
            break;
          }

          // Get metadata from session
          const metadata = session.metadata;
          console.log('Session metadata:', metadata);

          if (!metadata || !metadata.user_id) {
            console.error('No user_id in metadata');
            break;
          }

          // Calculate end date based on period
          let dataFim = new Date();
          let periodo = 'mensal'; // default
          
          if (metadata.periodo) {
            periodo = metadata.periodo;
            switch (metadata.periodo) {
              case 'semanal':
                dataFim.setDate(dataFim.getDate() + 7);
                break;
              case 'quinzenal':
                dataFim.setDate(dataFim.getDate() + 15);
                break;
              case 'mensal':
                dataFim.setMonth(dataFim.getMonth() + 1);
                break;
            }
          } else {
            // Fallback: determine period from price
            const priceId = subscription.items.data[0].price.id;
            if (priceId === 'price_1Rn2ekD3X7OLOCgdTVptrYmK') {
              periodo = 'semanal';
              dataFim.setDate(dataFim.getDate() + 7);
            } else if (priceId === 'price_1Rn2hQD3X7OLOCgddzwdYC6X') {
              periodo = 'quinzenal';
              dataFim.setDate(dataFim.getDate() + 15);
            } else if (priceId === 'price_1Rn2hZD3X7OLOCgd3HzBOW1i') {
              periodo = 'mensal';
              dataFim.setMonth(dataFim.getMonth() + 1);
            }
          }

          console.log('Creating subscription for user:', metadata.user_id);

          // Get user profile
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('user_id', metadata.user_id)
            .single();

          if (profileError || !profile) {
            console.error('Error getting profile:', profileError);
            break;
          }

          console.log('Found profile:', profile.id);

          // Get price info for value
          const priceId = subscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const valor = (price.unit_amount || 0) / 100; // Convert from cents to currency

          // Insert subscription record
          const { data: newSubscription, error: subscriptionError } = await supabaseAdmin
            .from('assinaturas')
            .insert({
              perfil_id: profile.id,
              user_id: metadata.user_id,
              plano: periodo,
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              stripe_price_id: priceId,
              status: 'active',
              data_fim: dataFim.toISOString(),
              valor: valor,
              periodo: periodo,
            })
            .select()
            .single();

          if (subscriptionError) {
            console.error('Error inserting subscription:', subscriptionError);
            break;
          }

          console.log('Subscription created:', newSubscription.id);

          // IMPORTANTE: Atualizar profile com status premium OBRIGATORIAMENTE
          const { error: profileUpdateError } = await supabaseAdmin
            .from('profiles')
            .update({ 
              premium_status: 'premium',
              tipo_assinatura: 'premium', // Garantir que seja 'premium' e não 'gratuito'
              assinatura_id: newSubscription.id
            })
            .eq('id', profile.id);

          if (profileUpdateError) {
            console.error('ERRO CRÍTICO - Falha ao atualizar profile para premium:', profileUpdateError);
            // Tentar novamente uma vez
            const { error: retryError } = await supabaseAdmin
              .from('profiles')
              .update({ 
                premium_status: 'premium',
                tipo_assinatura: 'premium',
                assinatura_id: newSubscription.id
              })
              .eq('user_id', metadata.user_id); // Usar user_id como fallback
            
            if (retryError) {
              console.error('ERRO CRÍTICO - Segunda tentativa falhou:', retryError);
            } else {
              console.log('Profile atualizado para premium na segunda tentativa');
            }
          } else {
            console.log('✅ Profile atualizado para premium com sucesso:', metadata.user_id);
            
            // Verificar se realmente foi atualizado
            const { data: verifyProfile } = await supabaseAdmin
              .from('profiles')
              .select('premium_status, tipo_assinatura')
              .eq('id', profile.id)
              .single();
              
            console.log('Verificação do profile após update:', verifyProfile);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log('Subscription canceled:', subscription.id);
        
        // Update subscription status
        const { error: updateError } = await supabaseAdmin
          .from('assinaturas')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('Error updating subscription:', updateError);
        }

        // Get subscription and update profile
        const { data: subscriptionData } = await supabaseAdmin
          .from('assinaturas')
          .select('perfil_id, user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single();

        if (subscriptionData) {
          // Update profile to remove premium status
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ 
              premium_status: 'nao_premium',
              tipo_assinatura: 'gratuito',
              assinatura_id: null
            })
            .eq('id', subscriptionData.perfil_id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          } else {
            console.log('Profile updated to non-premium for user:', subscriptionData.user_id);
          }
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }
});
