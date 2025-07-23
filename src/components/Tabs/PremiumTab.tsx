
import { Crown, Check, Star, Zap, Eye, MessageCircle, Heart, Filter, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export const PremiumTab = () => {
  const { profile, isPremium, refreshProfile } = useProfile();
  const { subscription, loading, checkSubscription, createCheckout } = useSubscription();
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
        await checkSubscription();
      }, 2000);
      
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
  }, [searchParams, toast, refreshProfile, checkSubscription]);

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

  // Planos atualizados com price IDs corretos ou método de criação dinâmica
  const plans = [
    {
      id: 'semanal',
      name: 'Semanal',
      price: 'R$ 15,00',
      period: '/semana',
      description: 'Ideal para experimentar',
      highlight: false,
      amount: 1500 // em centavos
    },
    {
      id: 'quinzenal',
      name: 'Quinzenal',
      price: 'R$ 20,00',
      period: '/15 dias',
      description: 'Boa relação custo-benefício',
      highlight: true,
      amount: 2000 // em centavos
    },
    {
      id: 'mensal',
      name: 'Mensal',
      price: 'R$ 30,00',
      period: '/mês',
      description: 'Máximo aproveitamento',
      highlight: false,
      amount: 3000 // em centavos
    }
  ];

  const handleSubscribe = async (planId: string) => {
    try {
      console.log('🛒 Starting subscription process for plan:', planId);
      
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      toast({
        title: "Processando...",
        description: "Criando sessão de pagamento...",
      });

      await createCheckout(plan.id);
      
    } catch (error) {
      console.error('❌ Error in handleSubscribe:', error);
      
      let errorMessage = "Não foi possível iniciar o pagamento. Tente novamente.";
      
      if (error instanceof Error) {
        if (error.message.includes('resource_missing')) {
          errorMessage = "Erro na configuração do sistema de pagamento. Contate o suporte.";
        } else if (error.message.includes('User not authenticated')) {
          errorMessage = "Você precisa estar logado para assinar um plano.";
        } else if (error.message.includes('network')) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente.";
        }
      }
      
      toast({
        title: "Erro no pagamento",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleRefreshStatus = async () => {
    console.log('Manually refreshing premium status...');
    await refreshProfile();
    await checkSubscription();
    
    toast({
      title: "Status atualizado",
      description: "O status da sua assinatura foi verificado.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white text-lg">Carregando...</div>
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
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-primary px-4 py-1 rounded-full text-sm font-bold text-white shadow-glow">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gradient">{plan.price}</div>
                    <div className="text-sm text-muted-foreground">{plan.period}</div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleSubscribe(plan.id)}
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
            onClick={() => handleSubscribe('quinzenal')} // Quinzenal (mais popular)
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
