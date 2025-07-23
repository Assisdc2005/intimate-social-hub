import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useCaktoCheckout } from '@/hooks/useCaktoCheckout';

export const PaymentConfirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshProfile } = useProfile();
  const { refreshCheckouts } = useCaktoCheckout();

  const status = searchParams.get('status');
  const checkoutId = searchParams.get('checkout_id');
  const message = searchParams.get('message');

  useEffect(() => {
    if (status === 'success') {
      // Refresh user data after successful payment
      setTimeout(async () => {
        await refreshProfile();
        await refreshCheckouts();
      }, 2000);

      toast({
        title: "Pagamento realizado com sucesso!",
        description: "Sua assinatura Premium foi ativada.",
      });
    } else if (status === 'error' || status === 'canceled') {
      toast({
        title: "Pagamento não realizado",
        description: message || "O pagamento foi cancelado ou ocorreu um erro.",
        variant: "destructive",
      });
    }
  }, [status, message, toast, refreshProfile, refreshCheckouts]);

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleGoToPremium = () => {
    navigate('/premium');
  };

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="glass rounded-3xl p-8 text-center">
          {status === 'success' ? (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gradient mb-4">
                Pagamento Confirmado!
              </h1>
              <p className="text-foreground/80 mb-6">
                Sua assinatura Premium foi ativada com sucesso. 
                Agora você tem acesso a todos os recursos exclusivos.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleGoHome}
                  className="w-full btn-premium"
                >
                  Começar a Usar
                </Button>
                <Button 
                  onClick={handleGoToPremium}
                  variant="outline"
                  className="w-full"
                >
                  Ver Status Premium
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gradient mb-4">
                {status === 'canceled' ? 'Pagamento Cancelado' : 'Erro no Pagamento'}
              </h1>
              <p className="text-foreground/80 mb-6">
                {message || (status === 'canceled' 
                  ? 'O pagamento foi cancelado. Você pode tentar novamente a qualquer momento.'
                  : 'Ocorreu um erro durante o processamento do pagamento. Tente novamente.'
                )}
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={handleGoToPremium}
                  className="w-full btn-premium"
                >
                  Tentar Novamente
                </Button>
                <Button 
                  onClick={handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Início
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};