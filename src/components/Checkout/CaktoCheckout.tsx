import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CreditCard } from 'lucide-react';

interface CaktoCheckoutProps {
  planId: string;
  amount: number;
  periodo: string;
  description: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const CaktoCheckout: React.FC<CaktoCheckoutProps> = ({
  planId,
  amount,
  periodo,
  description,
  onSuccess,
  onError
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer uma assinatura",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log('🛒 Iniciando checkout Cakto para plano:', planId);

      const { data, error } = await supabase.functions.invoke('cakto-checkout', {
        body: {
          amount,
          description,
          customerEmail: user.email,
          customerName: user.user_metadata?.name || 'Cliente',
          planId,
          periodo,
        }
      });

      if (error) {
        console.error('❌ Erro no checkout:', error);
        throw new Error(error.message || 'Erro ao criar checkout');
      }

      if (!data || !data.checkout_url) {
        throw new Error('URL de checkout não recebida');
      }

      console.log('✅ Checkout criado, redirecionando para:', data.checkout_url);
      
      // Redirecionar para a página de checkout da Cakto
      window.location.href = data.checkout_url;
      
      onSuccess?.();
    } catch (error) {
      console.error('❌ Erro no checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Não foi possível iniciar o pagamento. Tente novamente.';
      
      toast({
        title: "Erro no pagamento",
        description: errorMessage,
        variant: "destructive",
      });
      
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-4 w-4" />
          Assinar {periodo} - R$ {amount.toFixed(2)}
        </>
      )}
    </Button>
  );
};