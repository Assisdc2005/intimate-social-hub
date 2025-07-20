
import { useState, useEffect } from "react";
import { Camera, Heart, MessageCircle, MapPin, Clock, Plus, Play, User, Send, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    const fetchData = async () => {
      if (!profile?.user_id) return;
      
      try {
        // Fetch recent posts with user profiles
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (display_name, avatar_url, city, state)
          `)
          .eq('media_type', 'imagem')
          .order('created_at', { ascending: false })
          .limit(4);

        // Fetch top premium users who are recently active
        const { data: usersData } = await supabase
          .from('profiles')
          .select('*')
          .eq('subscription_type', 'premium')
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

    fetchData();
  }, [profile?.user_id]);

  const handleMessage = () => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para enviar mensagens",
        variant: "destructive",
      });
      return;
    }
    // Navigate to messages
  };

  const handleViewProfile = async (userId: string) => {
    try {
      // Check if profile exists and is accessible
      const { data: targetProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !targetProfile) {
        toast({
          title: "Perfil indisponível",
          description: "Este perfil não está disponível no momento",
          variant: "destructive",
        });
        return;
      }

      // Record profile visit if not viewing own profile
      if (profile?.user_id && profile.user_id !== userId) {
        await supabase
          .from('profile_visits')
          .insert({
            visited_user_id: userId,
            visitor_user_id: profile.user_id
          });

        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            from_user_id: profile.user_id,
            type: 'visita',
            content: 'visitou seu perfil'
          });
      }

      // Navigate to user profile
      navigate(`/profile/${userId}`);
    } catch (error) {
      console.error('Error accessing profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao acessar perfil",
        variant: "destructive",
      });
    }
  };

  const handleLikeProfile = async (userId: string) => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para curtir perfis",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.user_id) return;

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', profile.user_id)
        .eq('post_id', userId) // Using post_id field to store profile likes
        .maybeSingle();

      if (existingLike) {
        // Remove like
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);

        setLikedProfiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });

        toast({
          title: "Curtida removida",
          description: "Você descurtiu este perfil",
        });
      } else {
        // Add like
        await supabase
          .from('likes')
          .insert({
            user_id: profile.user_id,
            post_id: userId // Using post_id field to store profile likes
          });

        setLikedProfiles(prev => new Set(prev).add(userId));

        // Create real-time notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            from_user_id: profile.user_id,
            type: 'curtida',
            content: 'curtiu seu perfil'
          });

        toast({
          title: "Perfil curtido!",
          description: "Você curtiu este perfil",
        });
      }
    } catch (error) {
      console.error('Error liking profile:', error);
      toast({
        title: "Erro",
        description: "Erro ao curtir perfil",
        variant: "destructive",
      });
    }
  };

  const handleTopUserInteraction = (userId: string, action: string) => {
    if (action === 'like') {
      handleLikeProfile(userId);
    } else if (action === 'message') {
      handleMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Bloco Inicial - Hero Section */}
      <div className="glass rounded-3xl p-6 text-center space-y-4">
        <h2 className="text-2xl font-display font-bold text-gradient">
          Encontre pessoas Casadas e Solteiras
        </h2>
        <p className="text-lg text-foreground/90">
          na maior rede social adulta do Brasil.
        </p>
        <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4" />
          {topUsers.length * 1000} mil de pessoas reais perto de você
        </p>
        
        <Button 
          className="btn-premium w-full text-lg py-4 mt-4"
          onClick={() => navigate('/discover')}
        >
          Descobrir Perfis
        </Button>
      </div>

      {/* Feed Público */}
      <div className="card-premium">
        <PublicFeed />
      </div>

      {/* Ranking Top Sensuais Online */}
      <div className="card-premium">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gradient">Top Sensuais Online</h3>
        </div>
        
        <div className="space-y-3">
          {topUsers.map((user, index) => (
            <div 
              key={user.id} 
              className="flex items-center justify-between p-3 rounded-xl glass hover:bg-white/10 transition-all duration-300 cursor-pointer group"
              onClick={() => handleViewProfile(user.user_id)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-secondary overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {user.display_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                </div>
                <div className="flex-1">
                  <p className="font-medium group-hover:text-primary transition-colors">{user.display_name}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {user.city}, {user.state}
                  </p>
                  <span className="text-xs text-primary font-semibold">PREMIUM</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-accent">#{index + 1}</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className={`w-8 h-8 rounded-full transition-all duration-200 ${
                    likedProfiles.has(user.user_id) 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-red-500' 
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTopUserInteraction(user.user_id, 'like');
                  }}
                >
                  <Heart className={`w-4 h-4 transition-all duration-200 ${
                    likedProfiles.has(user.user_id) ? 'fill-current' : ''
                  }`} />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTopUserInteraction(user.user_id, 'message');
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
