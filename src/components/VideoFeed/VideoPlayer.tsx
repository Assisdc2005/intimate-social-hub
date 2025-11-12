import { useState } from 'react';
import { Play, Pause, Heart, MessageCircle, User, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface VideoPlayerProps {
  video: {
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
  };
}

export const VideoPlayer = ({ video }: VideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    
    // Update view count
    if (!isPlaying) {
      supabase
        .from('video_posts')
        .update({ views_count: video.views_count + 1 })
        .eq('id', video.id)
        .then(() => {
          console.log('View count updated');
        });
    }
  };

  const handleLike = async () => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para curtir vídeos",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.user_id) return;

    try {
      if (isLiked) {
        // Remove like
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video.id)
          .eq('user_id', profile.user_id);
        
        setIsLiked(false);
      } else {
        // Add like
        await supabase
          .from('video_likes')
          .insert({
            video_id: video.id,
            user_id: profile.user_id
          });

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: video.user_id,
            from_user_id: profile.user_id,
            type: 'curtida',
            content: 'curtiu seu vídeo'
          });
        
        setIsLiked(true);
        
        toast({
          title: "Vídeo curtido!",
          description: "Sua curtida foi registrada",
        });
      }
    } catch (error) {
      console.error('Error liking video:', error);
      toast({
        title: "Erro",
        description: "Erro ao curtir vídeo",
        variant: "destructive",
      });
    }
  };

  const handleComment = () => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para comentar",
        variant: "destructive",
      });
      return;
    }
    
    // Implementation for commenting would go here
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de comentários em breve!",
    });
  };

  const handleProfileClick = () => {
    navigate(`/profile/view/${video.user_id}`);
  };

  return (
    <div className="relative bg-card/50 backdrop-blur-md rounded-2xl overflow-hidden border border-primary/20 hover:border-primary/40 transition-all duration-300 group">
      {/* Video Container */}
      <div className="relative aspect-video bg-black rounded-t-2xl overflow-hidden">
        {isPlaying ? (
          <video
            src={video.video_url}
            className="w-full h-full object-cover"
            controls
            autoPlay
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
          />
        ) : (
          <>
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title || 'Video thumbnail'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-secondary flex items-center justify-center">
                <Play className="w-16 h-16 text-white/50" />
              </div>
            )}
            
            {/* Play Button Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={handlePlay}
                size="icon"
                className="w-16 h-16 rounded-full bg-black/50 hover:bg-black/70 text-white border-2 border-white/30 backdrop-blur-sm"
              >
                <Play className="w-8 h-8 ml-1" />
              </Button>
            </div>
          </>
        )}

        {/* View Count Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-black/50 text-white backdrop-blur-sm">
            {video.views_count} views
          </Badge>
        </div>
      </div>

      {/* Video Info */}
      <div className="p-4 space-y-3">
        {/* Title */}
        {video.title && (
          <h3 className="font-semibold text-white line-clamp-2">
            {video.title}
          </h3>
        )}

        {/* Author Info */}
        <div 
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleProfileClick}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-secondary overflow-hidden">
            {video.profiles?.avatar_url ? (
              <img
                src={video.profiles.avatar_url}
                alt={video.profiles.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {video.profiles?.display_name || 'Usuário'}
              </span>
              {video.profiles?.tipo_assinatura === 'premium' && (
                <Crown className="w-4 h-4 text-accent" />
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(video.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <p className="text-sm text-gray-300 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleLike}
              variant="ghost"
              size="sm"
              className={`flex items-center gap-2 ${
                isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{video.likes_count}</span>
            </Button>

            <Button
              onClick={handleComment}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 text-gray-400 hover:text-primary"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Comentar</span>
            </Button>
          </div>

          {!isPremium && (
            <Badge className="bg-gradient-primary text-white text-xs">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};