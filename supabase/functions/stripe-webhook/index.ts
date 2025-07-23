
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

    console.log('🔔 Webhook event received:', event.type);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        console.log('💳 Checkout session completed:', session.id);
        
        if (session.mode === 'subscription') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          console.log('📋 Subscription retrieved:', subscription.id);

          // Obter customer do Stripe
          const customer = await stripe.customers.retrieve(session.customer);
          if (typeof customer === 'string') {
            console.error('❌ Customer is a string, expected object');
            break;
          }

          console.log('👤 Customer email:', customer.email);

          // Obter metadata da session
          const metadata = session.metadata;
          console.log('📝 Session metadata:', metadata);

          if (!metadata || !metadata.user_id) {
            console.error('❌ No user_id in metadata');
            break;
          }

          // Calcular data de fim da assinatura
          const subscriptionEnd = new Date(subscription.current_period_end * 1000);
          console.log('📅 Subscription end date:', subscriptionEnd);

          // Determinar período da assinatura
          let periodo = 'mensal';
          if (metadata.periodo) {
            periodo = metadata.periodo;
          } else {
            // Fallback baseado no price_id
            const priceId = subscription.items.data[0].price.id;
            if (priceId === 'price_1Rn2ekD3X7OLOCgdTVptrYmK') {
              periodo = 'semanal';
            } else if (priceId === 'price_1Rn2hQD3X7OLOCgddzwdYC6X') {
              periodo = 'quinzenal';
            } else if (priceId === 'price_1Rn2hZD3X7OLOCgd3HzBOW1i') {
              periodo = 'mensal';
            }
          }

          console.log('⏱️ Subscription period:', periodo);

          // Buscar perfil do usuário no Supabase
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, user_id, display_name')
            .eq('user_id', metadata.user_id)
            .single();

          if (profileError || !profile) {
            console.error('❌ Error finding profile:', profileError);
            
            // Tentar buscar por email como fallback
            if (customer.email) {
              console.log('🔍 Trying to find user by email:', customer.email);
              const { data: userByEmail } = await supabaseAdmin.auth.admin.getUserByEmail(customer.email);
              
              if (userByEmail.user) {
                console.log('✅ Found user by email:', userByEmail.user.id);
                
                const { data: profileByEmail } = await supabaseAdmin
                  .from('profiles')
                  .select('id, user_id, display_name')
                  .eq('user_id', userByEmail.user.id)
                  .single();
                
                if (profileByEmail) {
                  console.log('✅ Found profile by email lookup');
                  // Atualizar metadata para usar o user_id correto
                  metadata.user_id = userByEmail.user.id;
                  profile.id = profileByEmail.id;
                  profile.user_id = profileByEmail.user_id;
                } else {
                  console.error('❌ No profile found even with email lookup');
                  break;
                }
              } else {
                console.error('❌ No user found by email');
                break;
              }
            } else {
              console.error('❌ No customer email available');
              break;
            }
          }

          // Obter informações do preço para o valor
          const priceId = subscription.items.data[0].price.id;
          const price = await stripe.prices.retrieve(priceId);
          const valor = (price.unit_amount || 0) / 100;

          console.log('💰 Subscription value:', valor);

          // Inserir registro na tabela assinaturas COM perfil_id preenchido
          const { data: newSubscription, error: subscriptionError } = await supabaseAdmin
            .from('assinaturas')
            .insert({
              user_id: metadata.user_id,
              perfil_id: profile.id, // CRÍTICO: incluir perfil_id para o trigger funcionar
              stripe_customer_id: session.customer,
              stripe_subscription_id: session.subscription,
              stripe_price_id: priceId,
              status: 'active',
              data_inicio: new Date().toISOString(),
              data_fim: subscriptionEnd.toISOString(),
              valor: valor,
              periodo: periodo,
              plano: periodo,
            })
            .select()
            .single();

          if (subscriptionError) {
            console.error('❌ Error inserting subscription:', subscriptionError);
            break;
          }

          console.log('✅ Subscription created with perfil_id:', newSubscription.id, 'perfil_id:', newSubscription.perfil_id);
          
          // O trigger agora atualizará automaticamente o perfil para premium
          console.log('🔄 Trigger will automatically update profile to premium');

          // Verificar se a atualização foi bem-sucedida
          const { data: verifyProfile, error: verifyError } = await supabaseAdmin
            .from('profiles')
            .select('tipo_assinatura, subscription_expires_at, assinatura_id')
            .eq('id', profile.id)
            .single();
            
          if (verifyError) {
            console.error('❌ Error verifying profile update:', verifyError);
          } else {
            console.log('🔍 Profile verification result:', verifyProfile);
            
            if (verifyProfile.tipo_assinatura === 'premium') {
              console.log('✅ SUCCESS - Profile is now premium via trigger!');
            } else {
              console.error('❌ FAILURE - Profile is still not premium:', verifyProfile.tipo_assinatura);
            }
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        console.log('💳 Invoice payment succeeded:', invoice.id);
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const customer = await stripe.customers.retrieve(invoice.customer);
          
          if (typeof customer === 'string') {
            console.error('❌ Customer is a string, expected object');
            break;
          }

          console.log('👤 Customer email for invoice:', customer.email);

          // Buscar usuário por email
          if (customer.email) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserByEmail(customer.email);
            
            if (userData.user) {
              console.log('✅ Found user for invoice payment:', userData.user.id);
              
              // Buscar perfil do usuário
              const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('user_id', userData.user.id)
                .single();

              if (profile) {
                // Atualizar assinatura existente ou criar nova
                const subscriptionEnd = new Date(subscription.current_period_end * 1000);
                
                const { error: updateError } = await supabaseAdmin
                  .from('assinaturas')
                  .update({ 
                    data_fim: subscriptionEnd.toISOString(),
                    status: 'active'
                  })
                  .eq('stripe_subscription_id', invoice.subscription);

                if (updateError) {
                  console.error('❌ Error updating subscription for invoice payment:', updateError);
                } else {
                  console.log('✅ Subscription updated for invoice payment');
                }
              }
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        console.log('🚫 Subscription canceled:', subscription.id);
        
        // Atualizar status da assinatura para canceled
        const { error: updateError } = await supabaseAdmin
          .from('assinaturas')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        if (updateError) {
          console.error('❌ Error updating subscription status:', updateError);
        } else {
          console.log('✅ Subscription status updated to canceled - trigger will update profile');
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }
});
