import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";

interface PremiumBlockModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PremiumBlockModal = ({ isOpen, onOpenChange }: PremiumBlockModalProps) => {
  const navigate = useNavigate();

  const handleActivatePremium = () => {
    onOpenChange(false);
    navigate('/premium');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border border-primary/30">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold text-gradient">
            Premium Necessário
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 text-center">
          <p className="text-lg text-white">
            Para publicar fotos e ser visto, ative seu Premium agora.
          </p>
          
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
            <p className="text-accent font-semibold">
              ✨ Destaque-se e conecte-se com milhares de pessoas
            </p>
          </div>
          
          <Button
            onClick={handleActivatePremium}
            className="w-full btn-premium text-lg py-3"
          >
            <Crown className="w-5 h-5 mr-2" />
            Ativar Premium
          </Button>
          
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-white"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};