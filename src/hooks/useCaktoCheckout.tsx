import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';

interface CaktoCheckout {
  id: string;
  user_id: string;
  checkout_id: string;
  amount: number;
  periodo: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useCaktoCheckout = () => {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [checkouts, setCheckouts] = useState<CaktoCheckout[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCheckouts = async () => {
    if (!user) {
      setCheckouts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cakto_checkouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching checkouts:', error);
      } else {
        setCheckouts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (
    planId: string,
    amount: number,
    description: string
  ) => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase.functions.invoke('cakto-checkout', {
      body: {
        amount,
        description,
        customerEmail: user.email,
        customerName: user.user_metadata?.name || 'Cliente',
        planId,
        periodo: planId,
      }
    });

    if (error) {
      throw new Error(error.message || 'Erro ao criar checkout');
    }

    return data;
  };

  const checkPaymentStatus = async (checkoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('cakto_checkouts')
        .select('status')
        .eq('checkout_id', checkoutId)
        .single();

      if (error) {
        console.error('Error checking payment status:', error);
        return null;
      }

      return data?.status;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchCheckouts();
  }, [user]);

  return {
    checkouts,
    loading,
    createCheckout,
    checkPaymentStatus,
    refreshCheckouts: fetchCheckouts,
  };
};