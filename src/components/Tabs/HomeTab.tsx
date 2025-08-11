import { useState, useEffect } from "react";
import { Plus, Heart, MessageCircle, Share2, TrendingUp, Zap, Crown, Play, Filter, MapPin, Clock, Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OnlineProfiles } from "@/components/Profile/OnlineProfiles";
import { PublicFeed } from "@/components/Feed/PublicFeed";
import { CreatePostModal } from "@/components/Modals/CreatePostModal";
import { useNavigate } from "react-router-dom";

export const HomeTab = () => {
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

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
    setShowCreatePostModal(true);
  };

  const handlePostCreated = () => {
    // Refresh posts after creation
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      {/* Hero Banner - Persuasive CTA */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-90"></div>
        <div className="relative p-8 text-center">
          <div className="mb-4">
            <Crown className="w-12 h-12 mx-auto text-white mb-3" />
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
                className="bg-white text-primary hover:bg-white/90 font-bold px-6 py-3 rounded-xl text-base"
              >
                <Crown className="w-5 h-5 mr-2" />
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

      {/* Action Buttons */}
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
          {posts.length === 0 ? 'Fazer minha primeira publicação' : 'Criar Publicação'}
          {!isPremium && <Crown className="w-4 h-4 ml-2" />}
        </Button>
      </div>


      {/* Top Users Section - Moved to top */}
      <div className="card-premium">
        <OnlineProfiles />
      </div>

      {/* Feed de Publicações */}
      <div className="card-premium">
        <PublicFeed />
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={showCreatePostModal}
        onOpenChange={setShowCreatePostModal}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};