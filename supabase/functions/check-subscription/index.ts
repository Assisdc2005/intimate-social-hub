
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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log('Checking subscription for user:', user.id);

    // Call the verification function to update expired subscriptions
    const { error } = await supabaseAdmin.rpc('verificar_status_premium');
    
    if (error) {
      console.error('Error calling verificar_status_premium:', error);
    }

    // Get user's current profile with subscription info
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select(`
        premium_status, 
        tipo_assinatura, 
        assinatura_id,
        assinaturas!fk_assinaturas_perfil (
          id,
          plano,
          data_inicio,
          data_fim,
          valor,
          periodo,
          status
        )
      `)
      .eq('user_id', user.id)
      .single();

    console.log('Profile data:', profile);

    // Verificar se há assinaturas ativas diretamente no banco
    const { data: activeSubscriptions } = await supabaseClient
      .from('assinaturas')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('data_fim', new Date().toISOString());

    console.log('Active subscriptions found:', activeSubscriptions);

    // Se há assinaturas ativas mas o profile não está premium, forçar atualização
    if (activeSubscriptions && activeSubscriptions.length > 0) {
      if (profile?.premium_status !== 'premium' || profile?.tipo_assinatura !== 'premium') {
        console.log('Forcing profile update to premium status');
        
        const { error: forceUpdateError } = await supabaseAdmin
          .from('profiles')
          .update({
            premium_status: 'premium',
            tipo_assinatura: 'premium',
            assinatura_id: activeSubscriptions[0].id
          })
          .eq('user_id', user.id);

        if (forceUpdateError) {
          console.error('Error forcing profile update:', forceUpdateError);
        } else {
          console.log('✅ Profile forcefully updated to premium');
        }
      }
    }

    const isPremium = profile?.premium_status === 'premium' && profile?.tipo_assinatura === 'premium';
    const subscription = profile?.assinaturas && Array.isArray(profile.assinaturas) 
      ? profile.assinaturas[0] 
      : profile?.assinaturas || null;

    console.log('Final result - Is premium:', isPremium, 'Subscription:', subscription);

    return new Response(JSON.stringify({
      isPremium,
      subscription
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
