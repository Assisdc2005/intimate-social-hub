
import { useState, useEffect } from "react";
import { Camera, Heart, MessageCircle, MapPin, Clock, Plus, Play, User, Send, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { PublicFeed } from "@/components/Feed/PublicFeed";

export const HomeTab = () => {
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());

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
    // Implementar criação de post
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de criação de posts em breve!",
    });
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
            {isPremium && (
              <Badge className="bg-gradient-primary text-white text-xs mt-1">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
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

      {/* Top Users Section */}
      <div className="card-premium">
        <h3 className="text-lg font-semibold text-gradient mb-4">Perfis em Destaque</h3>
        
        <div className="space-y-4">
          {topUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl glass">
              <div className="w-12 h-12 rounded-full bg-gradient-secondary overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {user.display_name[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-white">{user.display_name}</h4>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {user.city}, {user.state}
                </p>
                {user.subscription_type === 'premium' && (
                  <Badge className="bg-gradient-primary text-white text-xs mt-1">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <Button
                size="icon"
                onClick={() => handleLikeProfile(user.user_id)}
                disabled={likedProfiles.has(user.user_id)}
                className={`w-10 h-10 rounded-full ${
                  likedProfiles.has(user.user_id)
                    ? 'bg-gray-600 text-gray-400'
                    : 'bg-gradient-primary hover:opacity-90 text-white'
                }`}
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          {topUsers.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum perfil encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Feed de Publicações */}
      <div className="card-premium">
        <PublicFeed />
      </div>
    </div>
  );
};
