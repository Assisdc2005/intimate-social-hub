
import { Crown, Check, Star, Zap, Eye, MessageCircle, Heart, Filter, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";


export const PremiumTab = () => {
  const { profile, isPremium, refreshProfile } = useProfile();
  const { subscription, loading, createCheckout } = useSubscription();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for success/cancel parameters
    if (searchParams.get('success') === 'true') {
      toast({
        title: "Pagamento realizado!",
        description: "Sua assinatura Premium foi ativada com sucesso.",
      });
      
      // Força refresh do perfil para pegar o status atualizado
      setTimeout(async () => {
        console.log('Refreshing profile after successful payment...');
        await refreshProfile();
      }, 1000);
      
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/premium');
    } else if (searchParams.get('canceled') === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "O processo de pagamento foi cancelado.",
        variant: "destructive",
      });
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/premium');
    }
  }, [searchParams, toast, refreshProfile]);

  // Debug do status premium
  useEffect(() => {
    if (profile) {
      console.log('PremiumTab - Profile loaded:', {
        tipo_assinatura: profile.tipo_assinatura,
        isPremium: isPremium
      });
    }
  }, [profile, isPremium]);

  const premiumFeatures = [
    {
      icon: Heart,
      title: "Curtidas Ilimitadas",
      description: "Curta quantos perfis quiser sem restrições"
    },
    {
      icon: Eye,
      title: "Ver Quem Te Curtiu",
      description: "Descubra quem demonstrou interesse em você"
    },
    {
      icon: MessageCircle,
      title: "Mensagens Ilimitadas",
      description: "Converse sem limites com todos os usuários"
    },
    {
      icon: Filter,
      title: "Filtros Avançados",
      description: "Use filtros exclusivos para encontrar o match perfeito"
    },
    {
      icon: Star,
      title: "Destaque no Ranking",
      description: "Apareça em destaque nas buscas e rankings"
    },
    {
      icon: Zap,
      title: "Acesso Prioritário",
      description: "Funcionalidades exclusivas e suporte premium"
    }
  ];

  const plans = [
    {
      id: 'semanal',
      name: 'Semanal',
      price: 'R$ 14,90',
      originalPrice: null,
      period: '/semana',
      description: 'Experimente a plataforma por menos de R$ 15,00.',
      highlight: false,
      badge: null,
      caktoLink: 'https://pay.cakto.com.br/3a9q7wi_492897'
    },
    {
      id: 'quinzenal',
      name: 'Quinzenal',
      price: 'R$ 19,90',
      originalPrice: 'R$ 40,00',
      period: '/15 dias',
      description: 'Metade do preço por tempo limitado!',
      highlight: false,
      badge: null,
      caktoLink: 'https://pay.cakto.com.br/333ki7u_492920'
    },
    {
      id: 'mensal',
      name: 'Mensal',
      price: 'R$ 29,90',
      originalPrice: 'R$ 50,00',
      period: '/mês',
      description: 'Aproveite o desconto de R$ 20,00 e tenha acesso ilimitado o mês inteiro.',
      highlight: true,
      badge: 'Mais Assinado',
      caktoLink: 'https://pay.cakto.com.br/uh3imfg_492928'
    }
  ];

  const handleSubscribe = async (caktoLink: string, planName: string) => {
    try {
      const planId = planName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      toast({
        title: "Preparando checkout...",
        description: `Criando sessão de pagamento para o plano ${planName}.`,
      });
      
      console.log('Creating Cakto checkout:', { caktoLink, planId });
      
      const { data, error } = await supabase.functions.invoke('create-cakto-checkout', {
        body: { 
          periodo: planId,
          caktoLink: caktoLink
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        throw new Error(error.message || 'Erro ao criar checkout');
      }

      if (!data || !data.url) {
        throw new Error('URL de checkout não recebida');
      }

      console.log('✅ Checkout session created, opening URL:', data.url);
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao criar checkout",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  const handleRefreshStatus = async () => {
    console.log('Manually refreshing premium status...');
    await refreshProfile();
    
    toast({
      title: "Status atualizado",
      description: "O status da sua assinatura foi verificado.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="glass rounded-3xl p-6 h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Debug Panel - Apenas para desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <div className="glass rounded-2xl p-4 border border-yellow-500/20">
          <h3 className="text-yellow-400 font-semibold mb-2">Debug Info</h3>
          <div className="text-sm space-y-1">
            <div>tipo_assinatura: {profile?.tipo_assinatura || 'loading...'}</div>
            <div>isPremium: {isPremium ? 'true' : 'false'}</div>
          </div>
          <Button onClick={handleRefreshStatus} size="sm" className="mt-2">
            Verificar Status
          </Button>
        </div>
      )}

      {/* Aviso de Escassez */}
      {!isPremium && (
        <div className="bg-red-600/20 border border-red-500/50 rounded-xl p-4 text-center animate-pulse">
          <div className="text-red-400 font-bold text-lg mb-1">⚠️ Quantidade limitada (50 primeiros)</div>
          <p className="text-red-300 text-sm">Aproveite enquanto há vagas disponíveis!</p>
        </div>
      )}

      {/* Header Premium */}
      <div className="glass rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-3xl" />
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient mb-2">
            {isPremium ? 'Você é Premium!' : 'Sensual Premium'}
          </h1>
          <p className="text-lg text-foreground/90 mb-4">
            {isPremium 
              ? 'Aproveite todos os recursos exclusivos' 
              : 'Desbloqueie todo o potencial da plataforma'
            }
          </p>
          <div className="flex items-center justify-center gap-2 text-accent">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-semibold">Experiência VIP Completa</span>
            <Star className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

      {/* Status da Assinatura */}
      {isPremium && (
        <div className="card-premium">
          <h2 className="text-xl font-semibold text-gradient mb-4 text-center">
            Status da Assinatura
          </h2>
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-6 h-6 text-green-400" />
                <span className="text-lg font-semibold text-green-400">Plano Ativo</span>
              </div>
              {subscription && (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    Plano: <span className="font-semibold capitalize">{subscription.plano || subscription.periodo}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Valor: <span className="font-semibold">R$ {subscription.valor}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Válido até: <span className="font-semibold">
                      {new Date(subscription.data_fim).toLocaleDateString('pt-BR')}
                    </span>
                  </p>
                </>
              )}
              {profile?.subscription_expires_at && !subscription && (
                <p className="text-sm text-muted-foreground">
                  Válido até: <span className="font-semibold">
                    {new Date(profile.subscription_expires_at).toLocaleDateString('pt-BR')}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Funcionalidades Premium */}
      <div className="card-premium">
        <h2 className="text-xl font-semibold text-gradient mb-4 text-center">
          Benefícios Exclusivos
        </h2>
        
        <div className="grid gap-4">
          {premiumFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl glass hover:bg-white/10 transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Planos de Assinatura - Only show for non-premium users */}
      {!isPremium && (
        <div className="card-premium">
          <h2 className="text-xl font-semibold text-gradient mb-6 text-center">
            Escolha Seu Plano
          </h2>
          
          <div className="space-y-4">
            {plans.map((plan) => (
              <div 
                key={plan.id} 
                className={`
                  relative p-6 rounded-2xl border transition-all duration-300
                  ${plan.highlight 
                    ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10 shadow-glow' 
                    : 'border-white/20 glass hover:border-primary/30'
                  }
                `}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-primary px-4 py-1 rounded-full text-sm font-bold text-white shadow-glow">
                      {plan.badge}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    {plan.originalPrice && (
                      <div className="text-sm text-muted-foreground line-through mb-1">{plan.originalPrice}</div>
                    )}
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent animate-pulse">
                      {plan.price}
                    </div>
                    <div className="text-sm text-muted-foreground">{plan.period}</div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleSubscribe(plan.caktoLink, plan.name)}
                  className={`
                    w-full py-3 font-semibold transition-all duration-300
                    ${plan.highlight 
                      ? 'btn-premium shadow-glow' 
                      : 'btn-secondary'
                    }
                  `}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Assinar {plan.name}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparação Gratuito vs Premium */}
      <div className="card-premium">
        <h2 className="text-xl font-semibold text-gradient mb-4 text-center">
          Gratuito vs Premium
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Gratuito */}
          <div className="space-y-3">
            <h3 className="font-semibold text-muted-foreground text-center">Gratuito</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">Ver perfis</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-muted rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground">5 curtidas/dia</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-red-400 text-xs">✕</span>
                </div>
                <span className="text-muted-foreground">Sem chat</span>
              </div>
            </div>
          </div>
          
          {/* Premium */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gradient text-center">Premium</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>Curtidas ilimitadas</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>Chat liberado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span>Destaque VIP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem de Suporte Premium */}
      <div className="card-premium border-accent/30">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto shadow-glow">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Processamento de Pagamento</h2>
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-6">
            <p className="text-lg font-medium text-white mb-2">
              ⚡ Após pagamento do Premium, o acesso será concedido em minutos.
            </p>
            <p className="text-sm text-muted-foreground">
              Se não for liberado, mande mensagem para:{" "}
              <a 
                href="mailto:suporte@sensualconnect.com.br" 
                className="text-accent hover:text-accent/80 font-semibold underline"
              >
                suporte@sensualconnect.com.br
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action Final - Only show for non-premium users */}
      {!isPremium && (
        <div className="glass rounded-2xl p-6 text-center border border-accent/20">
          <h3 className="text-lg font-semibold text-gradient mb-2">
            Pronto para se destacar?
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Junte-se a milhares de usuários Premium e encontre conexões únicas
          </p>
          <Button 
            onClick={() => handleSubscribe('https://pay.cakto.com.br/333ki7u_492920', 'Quinzenal')}
            className="btn-premium w-full text-lg py-4"
          >
            <Crown className="w-5 h-5 mr-2" />
            Começar Agora
          </Button>
        </div>
      )}
    </div>
  );
};
