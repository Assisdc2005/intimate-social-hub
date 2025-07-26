
import { useState, useEffect } from "react";
import { Camera, Heart, MessageCircle, MapPin, Clock, Plus, Play, User, Send, Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PublicFeed } from "@/components/Feed/PublicFeed";
import { VideoFeed } from "@/components/VideoFeed/VideoFeed";
import { OnlineProfiles } from "@/components/Profile/OnlineProfiles";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export const HomeTab = () => {
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  const { isOnline, updateOnlineStatus } = useOnlineStatus();

  useEffect(() => {
    if (profile?.user_id) {
      fetchData();
    }
  }, [profile]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch latest posts
      const { data: postsData } = await supabase
        .from('publicacoes')
        .select(`
          *,
          profiles!publicacoes_user_id_fkey (display_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch top users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', profile?.user_id)
        .eq('profile_completed', true)
        .order('updated_at', { ascending: false })
        .limit(3);

      setPosts(postsData || []);
      setTopUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeProfile = async (userId: string) => {
    if (!profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert([
          {
            requester_id: profile.user_id,
            addressee_id: userId,
            status: 'pending'
          }
        ]);

      if (error) {
        console.error('Error creating connection:', error);
        toast({
          title: "Erro",
          description: "Erro ao enviar curtida",
          variant: "destructive",
        });
      } else {
        setLikedProfiles(prev => new Set([...prev, userId]));
        
        // Create notification
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: userId,
              from_user_id: profile.user_id,
              type: 'curtida',
              content: 'curtiu seu perfil'
            }
          ]);

        toast({
          title: "Curtida enviada!",
          description: "Sua curtida foi enviada com sucesso",
        });
      }
    } catch (error) {
      console.error('Error liking profile:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = () => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o plano premium para criar publicações",
        variant: "destructive",
      });
      return;
    }
    
    // Criar input de arquivo
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*';
    input.multiple = false;
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // Verificar tipo de arquivo
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        toast({
          title: "Arquivo inválido",
          description: "Selecione apenas imagens ou vídeos",
          variant: "destructive",
        });
        return;
      }
      
      // Verificar tamanho (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 50MB",
          variant: "destructive",
        });
        return;
      }
      
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile?.user_id}_${Date.now()}.${fileExt}`;
        const bucket = isImage ? 'publicacoes' : 'videos';
        
        // Upload do arquivo
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Obter URL pública
        const { data } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);
        
        // Criar publicação
        const { error: insertError } = await supabase
          .from('publicacoes')
          .insert([
            {
              user_id: profile?.user_id,
              conteudo: `Nova ${isVideo ? 'vídeo' : 'imagem'} postada`,
              tipo_midia: isVideo ? 'video' : 'imagem',
              url_midia: data.publicUrl
            }
          ]);
        
        if (insertError) {
          throw insertError;
        }
        
        toast({
          title: "Publicação criada!",
          description: `Sua ${isVideo ? 'vídeo' : 'imagem'} foi postada com sucesso`,
        });
        
        // Atualizar feed
        fetchData();
        
      } catch (error: any) {
        console.error('Erro ao criar publicação:', error);
        toast({
          title: "Erro",
          description: "Erro ao criar publicação. Tente novamente.",
          variant: "destructive",
        });
      }
    };
    
    input.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {/* Hero Banner - Persuasive CTA */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-90"></div>
        <div className="relative p-8 text-center">
          <div className="mb-4">
            <Sparkles className="w-12 h-12 mx-auto text-white mb-3" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Liberte seus desejos!
            </h1>
            <p className="text-white/90 text-lg">
              Assine Premium e marque encontros reais agora.
            </p>
          </div>
          
          {!isPremium && (
            <div className="flex justify-center">
              <Button
                onClick={() => navigate('/premium')}
                className="bg-white text-primary hover:bg-white/90 font-bold px-6 py-3 rounded-xl text-base sm:text-lg"
              >
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Quero ser Premium Agora
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Welcome Message */}
      <div className="card-premium">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-secondary overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                {profile?.display_name?.[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gradient">Olá, {profile?.display_name}!</h2>
            <p className="text-gray-300 text-sm">Bem-vindo(a) de volta ao Sensual Nexus Connect</p>
            <div className="flex items-center gap-2 mt-1">
              {isPremium && (
                <Badge className="bg-gradient-primary text-white text-xs">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
              <Badge className="bg-green-500 text-white text-xs">
                • Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Centralizados */}
      <div className="space-y-3">
        <Button
          onClick={() => navigate('/discover')}
          className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold h-12 rounded-xl"
        >
          <Heart className="w-5 h-5 mr-2" />
          Descobrir Perfis
        </Button>
        
        <Button
          onClick={handleCreatePost}
          className="w-full bg-gradient-secondary hover:opacity-90 text-white font-semibold h-12 rounded-xl"
        >
          <Plus className="w-5 h-5 mr-2" />
          Criar Publicação
          {!isPremium && <Crown className="w-4 h-4 ml-2" />}
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-premium text-center">
          <div className="text-2xl font-bold text-gradient">{posts.length}</div>
          <div className="text-xs text-gray-400">Publicações</div>
        </div>
        <div className="card-premium text-center">
          <div className="text-2xl font-bold text-gradient">{topUsers.length}</div>
          <div className="text-xs text-gray-400">Perfis Ativos</div>
        </div>
        <div className="card-premium text-center">
          <div className="text-2xl font-bold text-gradient">{likedProfiles.size}</div>
          <div className="text-xs text-gray-400">Curtidas</div>
        </div>
      </div>

      {/* Feed de Publicações */}
      <div className="card-premium">
        <PublicFeed />
      </div>

      {/* Video Feed Section */}
      <div className="card-premium">
        <VideoFeed />
      </div>

      {/* Top Users Section */}
      <div className="card-premium">
        <OnlineProfiles />
      </div>
    </div>
  );
};
