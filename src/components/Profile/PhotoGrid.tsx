import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PhotoGridProps {
  userId: string;
  className?: string;
}

export const PhotoGrid = ({ userId, className = "" }: PhotoGridProps) => {
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    fetchUserPhotos();
  }, [userId]);

  const fetchUserPhotos = async () => {
    try {
      const { data } = await supabase
        .from('publicacoes')
        .select('midia_url, tipo_midia')
        .eq('user_id', userId)
        .eq('tipo_midia', 'imagem')
        .not('midia_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(3);

      const photoUrls = data?.map(item => item.midia_url).filter(Boolean) || [];
      setPhotos(photoUrls);
    } catch (error) {
      console.error('Error fetching user photos:', error);
    }
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <div className={`grid grid-cols-3 gap-1 ${className}`}>
      {photos.slice(0, 3).map((photo, index) => (
        <div key={index} className="aspect-square bg-white/10 rounded-lg overflow-hidden">
          <img src={photo} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
};