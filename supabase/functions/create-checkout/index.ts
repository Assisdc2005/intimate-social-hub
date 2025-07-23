
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
    
    console.log('💰 Creating checkout session for plan:', periodo);

    // Verificar se as variáveis de ambiente estão definidas
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!stripeSecretKey) {
      console.error("❌ STRIPE_SECRET_KEY not configured");
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

    // Inicializar Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Verificar se o cliente já existe no Stripe
    let customerId = null;
    try {
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
    } catch (stripeError) {
      console.error('❌ Stripe customer error:', stripeError);
      throw new Error("Erro ao configurar dados do cliente");
    }

    // Determinar configuração do plano
    let planConfig = {
      amount: 1500, // padrão semanal
      currency: 'brl',
      interval: 'week' as const,
      intervalCount: 1,
      planName: 'Premium Semanal'
    };

    switch (periodo) {
      case 'semanal':
        planConfig = {
          amount: 1500,
          currency: 'brl',
          interval: 'week' as const,
          intervalCount: 1,
          planName: 'Premium Semanal'
        };
        break;
      case 'quinzenal':
        planConfig = {
          amount: 2000,
          currency: 'brl',
          interval: 'week' as const,
          intervalCount: 2,
          planName: 'Premium Quinzenal'
        };
        break;
      case 'mensal':
        planConfig = {
          amount: 3000,
          currency: 'brl',
          interval: 'month' as const,
          intervalCount: 1,
          planName: 'Premium Mensal'
        };
        break;
      default:
        throw new Error("Plano não reconhecido");
    }

    console.log('📋 Plan configuration:', planConfig);

    // Criar sessão de checkout com price dinâmico e metadata CRÍTICO
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: planConfig.planName,
              description: `Assinatura premium ${periodo}`,
            },
            unit_amount: planConfig.amount,
            recurring: {
              interval: planConfig.interval,
              interval_count: planConfig.intervalCount,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.get("origin")}/premium?success=true`,
      cancel_url: `${req.headers.get("origin")}/premium?canceled=true`,
      metadata: {
        user_id: user.id, // CRÍTICO: incluir user_id no metadata
        periodo: periodo,
        plan_name: planConfig.planName,
      },
    });

    console.log('✅ Checkout session created:', session.id);
    console.log('✅ Session URL:', session.url);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('❌ Error creating checkout:', error);
    
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
