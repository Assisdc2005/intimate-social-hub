
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface Subscription {
  id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  stripe_price_id: string;
  status: string;
  data_inicio: string;
  data_fim: string;
  valor: number;
  periodo: string;
  plano?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { profile, refreshProfile, isPremium } = useProfile();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking subscription for user:', user.id);
      
      // Buscar dados da assinatura diretamente no banco (sem refreshProfile para evitar loops)
      const { data: subscriptionData, error } = await supabase
        .from('assinaturas')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking subscription:', error);
      } else if (subscriptionData) {
        console.log('✅ Subscription data found:', subscriptionData);
        setSubscription(subscriptionData);
      } else {
        console.log('ℹ️ No active subscription found');
        setSubscription(null);
      }
    } catch (error) {
      console.error('❌ Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (planId: string) => {
    try {
      console.log('🛒 Creating checkout for plan:', planId);
      
      // Verificar se o usuário está autenticado
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      console.log('💰 Creating checkout with plan:', planId);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: planId, // Manter compatibilidade
          periodo: planId  // Novo campo
        }
      });

      if (error) {
        console.error('❌ Checkout error:', error);
        throw new Error(error.message || 'Erro ao criar checkout');
      }

      if (!data || !data.url) {
        throw new Error('URL de checkout não recebida');
      }

      console.log('✅ Checkout session created, opening URL:', data.url);
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('❌ Error creating checkout:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user?.id]); // Usar user.id em vez de user completo para evitar loops

  // Usar o valor isPremium do useProfile (baseado exclusivamente em tipo_assinatura)
  return {
    isPremium, // Do useProfile
    subscription,
    loading,
    createCheckout
  };
};
