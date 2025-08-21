import { useState, useEffect } from "react";
import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

export const PromotionalPopup = () => {
  const { isPremium } = useProfile();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [closedCount, setClosedCount] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    {
      title: "🔥 Oportunidade Única!",
      description: "Você está perdendo conexões reais agora! Premium de R$40,00 por apenas R$19,90. Garante já antes que acabe!",
      urgent: false
    },
    {
      title: "👉 Última chance!",
      description: "Premium hoje por apenas R$19,90!",
      urgent: true
    }
  ];

  useEffect(() => {
    if (isPremium) return;

    // Primeiro popup após 5 segundos
    const initialTimer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(initialTimer);
  }, [isPremium]);

  useEffect(() => {
    if (isPremium || !isVisible) return;

    let timer: NodeJS.Timeout;

    if (currentMessage === 1) {
      // Popup urgente desaparece automaticamente após 10 segundos
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, currentMessage, isPremium]);

  useEffect(() => {
    if (isPremium) return;

    // Repetir popup a cada 4 minutos se não fechou ou não assinou
    const intervalTimer = setInterval(() => {
      if (!isVisible && closedCount < 3) {
        setIsVisible(true);
      }
    }, 240000); // 4 minutos

    return () => clearInterval(intervalTimer);
  }, [isVisible, closedCount, isPremium]);

  const handleClose = () => {
    const newClosedCount = closedCount + 1;
    setClosedCount(newClosedCount);
    setIsVisible(false);

    // Se fechou 3 vezes, mostrar versão agressiva
    if (newClosedCount >= 3) {
      setCurrentMessage(1);
      // Mostrar novamente após 1 segundo
      setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    }
  };

  const handleActivatePremium = () => {
    setIsVisible(false);
    navigate('/premium');
  };

  if (isPremium || !isVisible) return null;

  const message = messages[currentMessage];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className={`
        relative max-w-md w-full glass rounded-2xl p-6 border-2 shadow-2xl
        ${message.urgent 
          ? 'border-red-500/50 bg-red-900/20 animate-pulse' 
          : 'border-primary/50 bg-primary/10'
        }
      `}>
        {/* Botão fechar - apenas no primeiro popup */}
        {currentMessage === 0 && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="text-center space-y-4">
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-glow
            ${message.urgent ? 'bg-red-600' : 'bg-gradient-primary'}
          `}>
            <Crown className="w-8 h-8 text-white" />
          </div>
          
          <h2 className={`
            text-xl font-bold
            ${message.urgent ? 'text-red-400' : 'text-gradient'}
          `}>
            {message.title}
          </h2>
          
          <p className={`
            text-lg leading-relaxed
            ${message.urgent ? 'text-red-300' : 'text-white'}
          `}>
            {message.description}
          </p>
          
          <div className="space-y-3">
            <Button
              onClick={handleActivatePremium}
              className={`
                w-full text-lg py-3 font-bold
                ${message.urgent 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'btn-premium'
                }
              `}
            >
              <Crown className="w-5 h-5 mr-2" />
              {message.urgent ? 'Última Chance - R$19,90' : 'Garantir Oferta - R$19,90'}
            </Button>
            
            {currentMessage === 0 && (
              <button
                onClick={handleClose}
                className="w-full text-sm text-white/60 hover:text-white/80 transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};