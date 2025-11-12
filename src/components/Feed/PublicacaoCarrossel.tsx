import { useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { BlurredMedia } from '@/components/ui/blurred-media';
import UserPhotoCard from '@/components/media/UserPhotoCard';

import { supabase } from '@/integrations/supabase/client';

interface PublicacaoMedia {
  id: string;
  midia_url: string;
  tipo_midia: string;
  ordem: number;
}

interface PublicacaoCarrosselProps {
  publicacaoId: string;
  isPremium: boolean;
  fallbackMidia?: { url: string; tipo: 'image' | 'video' };
}

export const PublicacaoCarrossel = ({ publicacaoId, isPremium, fallbackMidia }: PublicacaoCarrosselProps) => {
  const [midias, setMidias] = useState<PublicacaoMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMidias = async () => {
      try {
        const { data, error } = await supabase
          .from('publicacao_midias')
          .select('*')
          .eq('publicacao_id', publicacaoId)
          .order('ordem', { ascending: true });

        if (error) throw error;
        setMidias(data || []);
      } catch (error) {
        console.error('Erro ao buscar mídias:', error);
      } finally {
        setLoading(false);
      }
    };

    if (publicacaoId) {
      fetchMidias();
    }
  }, [publicacaoId]);

  if (loading) {
    return (
      <div className="w-full px-4 mb-4">
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-black/20 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!midias.length) {
    if (fallbackMidia) {
      return (
        <div className="w-full px-4 mb-4">
          <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-black/20">
            {fallbackMidia.tipo === 'video' ? (
              <BlurredMedia
                src={fallbackMidia.url}
                alt="Publicação"
                type="video"
                isPremium={isPremium}
                controls={true}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserPhotoCard src={fallbackMidia.url} alt="Publicação" className="w-full h-full" />
            )}
          </div>
        </div>
      );
    }
    return null;
  }

  if (midias.length === 1) {
    // Para uma única mídia, exibir diretamente
    const media = midias[0];
    return (
      <div className="w-full px-4 mb-4">
        <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-black/20">
          {media.tipo_midia === 'video' ? (
            <BlurredMedia
              src={media.midia_url}
              alt="Publicação"
              type="video"
              isPremium={isPremium}
              controls={true}
              className="w-full h-full object-cover"
            />
          ) : (
            <UserPhotoCard src={media.midia_url} alt="Publicação" className="w-full h-full" />
          )}
        </div>
      </div>
    );
  }

  // Para múltiplas mídias, usar carrossel
  return (
    <div className="w-full px-4 mb-4">
      <Carousel className="w-full">
        <CarouselContent>
          {midias.map((media) => (
            <CarouselItem key={media.id}>
              <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-black/20">
                {media.tipo_midia === 'video' ? (
                  <BlurredMedia
                    src={media.midia_url}
                    alt="Publicação"
                    type="video"
                    isPremium={isPremium}
                    controls={true}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserPhotoCard src={media.midia_url} alt="Publicação" className="w-full h-full" />
                )}
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {midias.length > 1 && (
          <>
            <CarouselPrevious className="left-2 bg-black/50 border-white/20 hover:bg-black/70 text-white" />
            <CarouselNext className="right-2 bg-black/50 border-white/20 hover:bg-black/70 text-white" />
          </>
        )}
      </Carousel>
      
      {/* Indicador de quantidade */}
      <div className="flex justify-center mt-2">
        <div className="bg-black/50 rounded-full px-3 py-1">
          <span className="text-white text-xs">
            {midias.length} {midias.length === 1 ? 'mídia' : 'mídias'}
          </span>
        </div>
      </div>
    </div>
  );
};