
import { useState, useEffect } from "react";
import { Play, Heart, MessageCircle, Eye, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

export const VideoFeed = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  
  // Form state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    fetchVideos();
    if (profile?.user_id) {
      fetchUserLikes();
    }
  }, [profile?.user_id]);

  const fetchVideos = async () => {
    try {
      const { data: videosData } = await supabase
        .from('video_posts')
        .select(`
          *,
          profiles!video_posts_user_id_fkey (display_name, avatar_url, city, state)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      setVideos(videosData || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!profile?.user_id) return;

    try {
      const { data: likes } = await supabase
        .from('video_likes')
        .select('video_id')
        .eq('user_id', profile.user_id);

      if (likes) {
        setLikedVideos(new Set(likes.map(like => like.video_id)));
      }
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.user_id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para postar vídeos",
        variant: "destructive",
      });
      return;
    }

    if (!videoFile) {
      toast({
        title: "Erro",
        description: "Selecione um vídeo para upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Upload video to storage
      const fileName = `${profile.user_id}/${Date.now()}_${videoFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(uploadData.path);

      // Create video post record
      const { error: insertError } = await supabase
        .from('video_posts')
        .insert({
          user_id: profile.user_id,
          video_url: publicUrl,
          title: title || null,
          description: description || null,
        });

      if (insertError) throw insertError;

      toast({
        title: "Vídeo publicado!",
        description: "Seu vídeo foi publicado com sucesso",
      });

      // Reset form and close dialog
      setVideoFile(null);
      setTitle("");
      setDescription("");
      setIsDialogOpen(false);
      
      // Refresh videos
      fetchVideos();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Erro",
        description: "Erro ao publicar vídeo",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleLikeVideo = async (videoId: string) => {
    if (!profile?.user_id) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para curtir vídeos",
        variant: "destructive",
      });
      return;
    }

    try {
      const isLiked = likedVideos.has(videoId);

      if (isLiked) {
        // Remove like
        await supabase
          .from('video_likes')
          .delete()
          .eq('user_id', profile.user_id)
          .eq('video_id', videoId);

        setLikedVideos(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      } else {
        // Add like
        await supabase
          .from('video_likes')
          .insert({
            user_id: profile.user_id,
            video_id: videoId
          });

        setLikedVideos(prev => new Set(prev).add(videoId));
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Carregando vídeos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Play className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gradient">Últimos Vídeos</h3>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="btn-premium">
              <Plus className="w-4 h-4 mr-2" />
              Postar Vídeo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-gradient">Publicar Novo Vídeo</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleVideoUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Vídeo</label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="bg-white/5 border-white/10"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Título (opcional)</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite um título para o vídeo"
                  className="bg-white/5 border-white/10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Descrição (opcional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva seu vídeo"
                  className="bg-white/5 border-white/10"
                  rows={3}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full btn-premium"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Publicar Vídeo
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video) => (
          <div key={video.id} className="relative group cursor-pointer">
            <div className="aspect-video rounded-2xl bg-gradient-secondary overflow-hidden">
              <video 
                src={video.video_url}
                className="w-full h-full object-cover"
                controls={false}
                preload="metadata"
              />
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
              
              {/* Duration badge */}
              {video.duration && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {formatDuration(video.duration)}
                </div>
              )}
              
              {/* Video info overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-secondary overflow-hidden">
                      {video.profiles?.avatar_url ? (
                        <img src={video.profiles.avatar_url} alt={video.profiles.display_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                          {video.profiles?.display_name?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{video.profiles?.display_name}</p>
                      <p className="text-xs text-white/80">
                        {video.profiles?.city}, {video.profiles?.state}
                      </p>
                    </div>
                  </div>
                  
                  {video.title && (
                    <p className="font-medium text-white text-sm mb-1">{video.title}</p>
                  )}
                  
                  {video.description && (
                    <p className="text-xs text-white/90 line-clamp-2">{video.description}</p>
                  )}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button 
                  size="sm" 
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    likedVideos.has(video.id) 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500' 
                      : 'bg-black/50 hover:bg-black/70'
                  } border-0`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLikeVideo(video.id);
                  }}
                >
                  <Heart className={`w-4 h-4 transition-all duration-200 ${
                    likedVideos.has(video.id) ? 'fill-current' : ''
                  }`} />
                </Button>
                <Button 
                  size="sm" 
                  className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 border-0 text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Stats bar */}
            <div className="flex items-center justify-between mt-2 px-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {video.views_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {video.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {video.comments_count || 0}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(video.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {videos.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum vídeo encontrado</p>
          <p className="text-sm">Seja o primeiro a postar um vídeo!</p>
        </div>
      )}
    </div>
  );
};
