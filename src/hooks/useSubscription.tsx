
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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
  plano?: string; // Adicionado campo plano
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setIsPremium(false);
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      console.log('Checking subscription for user:', user.id);
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
      } else {
        console.log('Subscription check result:', data);
        setIsPremium(data.isPremium);
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
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      console.log('Checkout session created, opening URL:', data.url);
      // Open checkout in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  return {
    isPremium,
    subscription,
    loading,
    checkSubscription,
    createCheckout
  };
};
