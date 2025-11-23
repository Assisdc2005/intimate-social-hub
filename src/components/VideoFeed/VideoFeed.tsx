import { useState, useEffect } from 'react';
import { PlayCircle, Loader2 } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface VideoPost {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  user_id: string;
  likes_count: number;
  views_count: number;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url?: string; 
    tipo_assinatura?: string;
  };
}

export const VideoFeed = () => {
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();

  useEffect(() => {
    fetchVideos();
    setupRealtimeSubscription();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);

      const { data: videosData, error } = await supabase
        .from('video_posts')
        .select(`
          *,
          profiles(display_name, avatar_url, tipo_assinatura)
        `)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;

      setVideos((videosData as any) || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('video-posts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'video_posts'
      }, () => {
        fetchVideos();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <PlayCircle className="w-16 h-16 mx-auto mb-4 text-gray-400 opacity-50" />
        <h3 className="text-lg font-semibold text-gray-300 mb-2">
          Nenhum vídeo encontrado
        </h3>
        <p className="text-gray-400 text-sm">
          Seja o primeiro a postar um vídeo!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <PlayCircle className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-gradient">Últimos Vídeos Postados</h2>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <VideoPlayer key={video.id} video={video} />
        ))}
      </div>
    </div>
  );
};