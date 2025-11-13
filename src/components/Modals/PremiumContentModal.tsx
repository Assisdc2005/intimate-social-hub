import { Crown } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PremiumContentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PremiumContentModal = ({ isOpen, onOpenChange }: PremiumContentModalProps) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate('/premium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/20 via-background/95 to-accent/20 backdrop-blur-xl border-primary/40">
        <div className="text-center space-y-6 py-6">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto bg-gradient-primary rounded-full flex items-center justify-center shadow-glow animate-pulse">
            <Crown className="w-10 h-10 text-white" />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gradient">
              🔒 Conteúdo Exclusivo!
            </h2>
            <p className="text-foreground/90 text-lg">
              Torne-se Premium e veja todas as publicações sem restrições.
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white/5 rounded-xl p-4 space-y-2 text-left">
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <span className="text-green-400">✓</span>
              <span>Acesso ilimitado a todas as publicações</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <span className="text-green-400">✓</span>
              <span>Curtidas e comentários sem limites</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <span className="text-green-400">✓</span>
              <span>Chat liberado com todos os usuários</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <span className="text-green-400">✓</span>
              <span>Destaque VIP na plataforma</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleUpgrade}
            className="w-full bg-gradient-primary hover:opacity-90 text-white font-bold text-lg py-6 rounded-xl shadow-glow transition-all duration-300 hover:scale-105"
          >
            <Crown className="w-5 h-5 mr-2" />
            Assinar Premium Agora
          </Button>

          {/* Secondary text */}
          <p className="text-xs text-muted-foreground">
            A partir de R$ 14,90/semana
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
