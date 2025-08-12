import React, { useState } from 'react';
import { Crown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';

interface BlurredMediaProps {
  src: string;
  alt: string;
  className?: string;
  type: 'image' | 'video';
  isPremium: boolean;
  controls?: boolean;
}

export const BlurredMedia: React.FC<BlurredMediaProps> = ({
  src,
  alt,
  className = '',
  type,
  isPremium,
  controls = false
}) => {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const navigate = useNavigate();

  const handleMediaClick = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
    }
  };

  const handleUpgradeToPremium = () => {
    setShowPremiumModal(false);
    navigate('/premium');
  };

  if (type === 'video') {
    return (
      <>
        <div className={`relative ${className}`} onClick={handleMediaClick}>
          <video
            src={src}
            controls={isPremium ? controls : false}
            className={`w-full h-full object-cover ${!isPremium ? 'blur-lg filter cursor-pointer' : ''}`}
            muted={!isPremium}
          />
          {!isPremium && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer">
              <div className="text-center text-white">
                <Crown className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-semibold">Conteúdo Premium</p>
                <p className="text-xs opacity-75">Clique para ver</p>
              </div>
            </div>
          )}
        </div>

        <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
          <DialogContent className="bg-background/95 backdrop-blur border-white/20">
            <DialogHeader>
              <DialogTitle className="text-gradient text-center">
                <Crown className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
                Conteúdo Premium
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <p className="text-white">
                Assine o Premium para ver este conteúdo sem restrições.
              </p>
              <p className="text-gray-300 text-sm">
                Acesso ilimitado a fotos, vídeos e muito mais!
              </p>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowPremiumModal(false)}
                  variant="outline"
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleUpgradeToPremium}
                  className="flex-1 bg-gradient-primary hover:opacity-90 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Assinar Premium
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className={`relative ${className}`} onClick={handleMediaClick}>
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover ${!isPremium ? 'blur-lg filter cursor-pointer' : ''}`}
        />
        {!isPremium && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer">
            <div className="text-center text-white">
              <Crown className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm font-semibold">Conteúdo Premium</p>
              <p className="text-xs opacity-75">Clique para ver</p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="bg-background/95 backdrop-blur border-white/20">
          <DialogHeader>
            <DialogTitle className="text-gradient text-center">
              <Crown className="w-8 h-8 mx-auto mb-3 text-yellow-500" />
              Conteúdo Premium
            </DialogTitle>
          </DialogHeader>
          <div className="text-center space-y-4">
            <p className="text-white">
              Assine o Premium para ver este conteúdo sem restrições.
            </p>
            <p className="text-gray-300 text-sm">
              Acesso ilimitado a fotos, vídeos e muito mais!
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowPremiumModal(false)}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpgradeToPremium}
                className="flex-1 bg-gradient-primary hover:opacity-90 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Assinar Premium
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};