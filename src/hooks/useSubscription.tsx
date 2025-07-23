
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
  const { profile, refreshProfile } = useProfile();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Checking subscription for user:', user.id);
      
      // Primeiro atualizar o perfil para garantir dados mais recentes
      await refreshProfile();
      
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
      } else {
        console.log('Subscription check result:', data);
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (priceId: string) => {
    try {
      console.log('Creating checkout for price:', priceId);
      
      // Determinar o período baseado no price_id
      let periodo = 'mensal';
      if (priceId === 'price_1Rn2ekD3X7OLOCgdTVptrYmK') {
        periodo = 'semanal';
      } else if (priceId === 'price_1Rn2hQD3X7OLOCgddzwdYC6X') {
        periodo = 'quinzenal';
      } else if (priceId === 'price_1Rn2hZD3X7OLOCgd3HzBOW1i') {
        periodo = 'mensal';
      }

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId,
          periodo // Incluir o período no metadata
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      console.log('Checkout session created, opening URL:', data.url);
      // Abrir checkout em nova aba
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  // Usar o valor isPremium do useProfile que é baseado no tipo_assinatura
  const isPremium = profile?.tipo_assinatura === 'premium';

  return {
    isPremium,
    subscription,
    loading,
    checkSubscription,
    createCheckout
  };
};
