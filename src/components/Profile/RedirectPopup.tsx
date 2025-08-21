import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface RedirectPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RedirectPopup = ({ isOpen, onClose }: RedirectPopupProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            onClose();
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass backdrop-blur-xl border-primary/20 max-w-sm">
        <div className="text-center py-8">
          <div className="flex justify-center mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          
          <h3 className="text-xl font-semibold text-white mb-2">
            Perfil completado!
          </h3>
          
          <p className="text-gray-300 mb-4">
            Você será redirecionado para sua página inicial em instantes. Aguarde alguns segundos.
          </p>
          
          {/* Barra de progresso */}
          <div className="w-full bg-white/20 rounded-full h-2 mb-2">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-xs text-gray-400">
            {progress}% completo
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};