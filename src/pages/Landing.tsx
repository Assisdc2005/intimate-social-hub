import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import landingImage from "@/assets/landing-couple.jpg";

export const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 min-h-screen">
        <div className="grid lg:grid-cols-2 gap-8 min-h-screen items-center">
          {/* Left Column - Image */}
          <div className="hidden lg:block">
            <div className="relative">
              <img 
                src={landingImage}
                alt="Casal elegante"
                className="w-full h-[600px] object-cover rounded-2xl shadow-elegant"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="flex flex-col justify-center lg:pl-12">
            <div className="text-center lg:text-left">
              {/* Logo */}
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
                  <Heart className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-text bg-clip-text text-transparent">
                  Sensual
                </h1>
              </div>

              {/* Heading */}
              <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Conexões
                <span className="block bg-gradient-text bg-clip-text text-transparent">
                  Autênticas
                </span>
              </h2>

              {/* Subtitle */}
              <p className="text-xl text-gray-300 mb-8 max-w-md mx-auto lg:mx-0">
                Descubra pessoas especiais que compartilham dos seus interesses e valores. 
                Conexões reais em um ambiente elegante e seguro.
              </p>

              {/* Features */}
              <div className="space-y-3 mb-10 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-gray-300">Perfis verificados e autênticos</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-gray-300">Chat privado e seguro</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-gray-300">Algoritmo inteligente de compatibilidade</span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4">
                <Button 
                  onClick={() => navigate('/auth?mode=signup')}
                  className="w-full lg:w-auto bg-gradient-primary hover:opacity-90 text-white font-semibold px-8 py-3 text-lg shadow-glow transition-all duration-300 hover:shadow-glow-hover"
                >
                  Criar Conta Grátis
                </Button>
                
                <div className="text-center lg:text-left">
                  <span className="text-gray-400">Já tem uma conta? </span>
                  <button 
                    onClick={() => navigate('/auth?mode=login')}
                    className="text-primary hover:text-primary-light transition-colors font-medium"
                  >
                    Entrar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Image */}
          <div className="lg:hidden order-first">
            <div className="relative max-w-sm mx-auto">
              <img 
                src={landingImage}
                alt="Casal elegante"
                className="w-full h-64 object-cover rounded-2xl shadow-elegant"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};