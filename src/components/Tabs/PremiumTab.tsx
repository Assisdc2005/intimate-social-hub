import { Crown, Check, Star, Zap, Eye, MessageCircle, Heart, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export const PremiumTab = () => {
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
      id: 'weekly',
      name: 'Semanal',
      price: 'R$ 15,00',
      period: '/semana',
      description: 'Ideal para experimentar',
      highlight: false
    },
    {
      id: 'biweekly',
      name: 'Quinzenal',
      price: 'R$ 20,00',
      period: '/15 dias',
      description: 'Boa relação custo-benefício',
      highlight: true
    },
    {
      id: 'monthly',
      name: 'Mensal',
      price: 'R$ 29,90',
      period: '/mês',
      description: 'Máximo aproveitamento',
      highlight: false
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Premium */}
      <div className="glass rounded-3xl p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-3xl" />
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gradient mb-2">
            Sensual Premium
          </h1>
          <p className="text-lg text-foreground/90 mb-4">
            Desbloqueie todo o potencial da plataforma
          </p>
          <div className="flex items-center justify-center gap-2 text-accent">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-semibold">Experiência VIP Completa</span>
            <Star className="w-5 h-5 fill-current" />
          </div>
        </div>
      </div>

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

      {/* Planos de Assinatura */}
      <div className="card-premium">
        <h2 className="text-xl font-semibold text-gradient mb-6 text-center">
          Escolha Seu Plano
        </h2>
        
        <div className="space-y-4">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`
                relative p-6 rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-[1.02]
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
                className={`
                  w-full py-3 font-semibold transition-all duration-300
                  ${plan.highlight 
                    ? 'btn-premium shadow-glow' 
                    : 'btn-secondary'
                  }
                `}
              >
                <Crown className="w-4 h-4 mr-2" />
                Assinar {plan.name}
              </Button>
            </div>
          ))}
        </div>
      </div>

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

      {/* Call to Action Final */}
      <div className="glass rounded-2xl p-6 text-center border border-accent/20">
        <h3 className="text-lg font-semibold text-gradient mb-2">
          Pronto para se destacar?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Junte-se a milhares de usuários Premium e encontre conexões únicas
        </p>
        <Button className="btn-premium w-full text-lg py-4">
          <Crown className="w-5 h-5 mr-2" />
          Começar Agora
        </Button>
      </div>
    </div>
  );
};