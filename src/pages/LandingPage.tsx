import { useState } from 'react';
import { ArrowRight, Shield, Users, Crown, Heart, Star, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import landingHeroBg from '@/assets/landing-hero-bg.jpg';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  const handleGetStarted = () => {
    navigate('/auth');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={landingHeroBg}
            alt="Sensual couple"
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setIsLoaded(true)}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-background/80"></div>
        </div>

        {/* Glass overlay container */}
        <div className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center">
          <div className="glass rounded-3xl p-8 md:p-12 backdrop-blur-2xl border border-white/20 animate-fade-in">
            {/* Brand Badge */}
            <Badge className="mb-6 bg-gradient-primary text-white px-6 py-2 text-sm font-medium">
              <Heart className="w-4 h-4 mr-2" />
              Sensual Nexus Connect
            </Badge>

            {/* Main Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="text-gradient block mb-2">
                Encontros Casuais,
              </span>
              <span className="text-white">
                Desejos Reais
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed max-w-2xl mx-auto">
              Conecte-se com pessoas dispostas a viver
              <span className="text-accent font-semibold"> experiências intensas</span>.
            </p>

            {/* CTA Button */}
            <Button
              onClick={handleGetStarted}
              className="btn-premium text-lg px-8 py-4 h-auto mb-6 group"
            >
              Quero Conhecer Agora
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>4.8/5 estrelas</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                <span>50k+ usuários ativos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 bg-gradient-to-b from-background to-card">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gradient mb-4">
              Por que escolher nosso site?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A plataforma mais confiável para encontros casuais e experiências autênticas
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* Feature 1 */}
            <div className="card-premium text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-primary rounded-2xl flex items-center justify-center group-hover:shadow-[var(--shadow-glow)] transition-all duration-300">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                100% Sigiloso e Seguro
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Seus dados e conversas protegidos com criptografia de ponta. 
                Discrição total garantida.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card-premium text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-secondary rounded-2xl flex items-center justify-center group-hover:shadow-[var(--shadow-glow)] transition-all duration-300">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Mais de 1,065 encontros reais
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Milhares de conexões autênticas já foram criadas. 
                Sua próxima experiência está aqui.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card-premium text-center group hover:scale-105 transition-all duration-300">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-accent to-primary rounded-2xl flex items-center justify-center group-hover:shadow-[var(--shadow-glow)] transition-all duration-300">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Fotos, vídeos e experiências premium
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Acesso exclusivo a conteúdo premium e recursos avançados 
                para encontros mais intensos.
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">50k+</div>
              <div className="text-sm text-muted-foreground">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">1.2k+</div>
              <div className="text-sm text-muted-foreground">Encontros Hoje</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Satisfação</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Suporte</div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <div className="card-premium max-w-2xl mx-auto">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Pronto para começar sua aventura?
              </h3>
              <p className="text-muted-foreground mb-6">
                Cadastre-se gratuitamente e descubra um mundo de possibilidades sensuais.
              </p>
              <Button
                onClick={handleGetStarted}
                className="btn-premium text-lg px-8 py-4 h-auto group"
              >
                Criar Conta Grátis
                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-background to-transparent">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleLogin}
            className="w-full btn-premium text-lg py-4 h-auto shadow-[var(--shadow-premium)]"
          >
            <Heart className="mr-2 w-5 h-5" />
            Entrar Agora
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-card/50 backdrop-blur-md border-t border-primary/20 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h4 className="font-bold text-gradient text-lg mb-1">Sensual Nexus Connect</h4>
              <p className="text-sm text-muted-foreground">
                A plataforma de encontros mais quente do Brasil
              </p>
            </div>
            
            <div className="flex gap-6 text-sm text-muted-foreground">
              <button 
                onClick={() => navigate('/terms')} 
                className="hover:text-primary transition-colors"
              >
                Termos de Uso
              </button>
              <button 
                onClick={() => navigate('/privacy')} 
                className="hover:text-primary transition-colors"
              >
                Política de Privacidade
              </button>
              <button 
                onClick={() => navigate('/help')} 
                className="hover:text-primary transition-colors"
              >
                Ajuda
              </button>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-muted-foreground">
            <p>© 2024 Sensual Nexus Connect. Todos os direitos reservados.</p>
            <p className="mt-1">Para maiores de 18 anos. Use com responsabilidade.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};