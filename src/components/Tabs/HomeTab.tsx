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
import { PremiumBlockModal } from "@/components/Modals/PremiumBlockModal";
import { useNavigate, useLocation } from "react-router-dom";
import { CompleteProfileModal } from "@/components/Modals/CompleteProfileModal";

export const HomeTab = () => {
  const { profile, isPremium, refreshProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const afterComplete = (location.state as any)?.afterComplete as string | undefined;
  const [posts, setPosts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showPremiumBlockModal, setShowPremiumBlockModal] = useState(false);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      fetchData();
    }
  }, [profile]);

  // If redirected from /profile, open immediately; otherwise use 7s delay
  useEffect(() => {
    if (!profile || profile.profile_completed) return;
    if (afterComplete) {
      setShowCompleteProfile(true);
      // clear state to avoid reopening on subsequent renders
      navigate('/home', { replace: true, state: undefined });
      return;
    }
    const timer = setTimeout(() => setShowCompleteProfile(true), 7000);
    return () => clearTimeout(timer);
  }, [profile?.profile_completed, afterComplete]);

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
      setShowPremiumBlockModal(true);
    } else {
      setShowCreatePostModal(true);
    }
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
      <div className="relative overflow-hidden rounded-2xl glass">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-20"></div>
        <div className="relative p-6 text-center">
          <Crown className="w-10 h-10 mx-auto text-primary mb-2" />
          <h1 className="text-xl font-bold text-gradient mb-1">
            Encontre quem te quer!
          </h1>
          <p className="text-foreground/80 text-sm mb-3">
            Veja quem já mandou convite — mas só membros Premium podem responder.
          </p>
          
          {!isPremium && (
            <Button
              onClick={() => navigate('/premium')}
              className="bg-gradient-primary hover:opacity-90 text-white font-semibold px-5 py-2 rounded-xl text-sm shadow-[var(--shadow-glow)] transition-all duration-300 hover:scale-105"
            >
              <Crown className="w-4 h-4 mr-2" />
              Ser premium!
            </Button>
          )}
        </div>
      </div>

      {/* Online Now Section - Horizontal Scroll */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Online Agora</h2>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
              {topUsers.length} pessoas
            </Badge>
          </div>
        </div>

        {/* Horizontal Scrollable Cards */}
        <div className="relative -mx-4 px-4">
          <div 
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {topUsers.map((user) => (
              <div
                key={user.user_id}
                onClick={() => navigate(`/profile/${user.user_id}`)}
                className="flex-shrink-0 w-[160px] snap-start cursor-pointer group"
              >
                <div className="relative rounded-2xl overflow-hidden bg-gradient-card border border-primary/20 transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:shadow-[var(--shadow-glow)]">
                  {/* Avatar/Image */}
                  <div className="relative h-[200px] overflow-hidden bg-gradient-secondary">
                    {user.avatar_url ? (
                      <img 
                        src={user.avatar_url} 
                        alt={user.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl">
                        {user.display_name[0]?.toUpperCase()}
                      </div>
                    )}
                    
                    {/* Online Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-white text-xs font-semibold">LIVE</span>
                    </div>

                    {/* Premium Crown */}
                    {user.tipo_assinatura === 'premium' && (
                      <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm p-1.5 rounded-full">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-1">
                    <h3 className="font-semibold text-foreground text-sm truncate">
                      {user.display_name}
                    </h3>
                    {(user.city || user.state) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">
                          {user.city}{user.city && user.state && ', '}{user.state}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Ver Mais Card */}
            <div
              onClick={() => navigate('/discover')}
              className="flex-shrink-0 w-[160px] snap-start cursor-pointer group"
            >
              <div className="h-full rounded-2xl overflow-hidden bg-gradient-card border-2 border-dashed border-primary/40 transition-all duration-300 hover:scale-105 hover:border-primary hover:shadow-[var(--shadow-glow)] flex flex-col items-center justify-center p-6 min-h-[250px]">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-center mb-1">Ver Mais</h3>
                <p className="text-xs text-muted-foreground text-center">
                  Descubra outros perfis
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Posts Section - Vertical Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            
          </div>
          
        </div>

        {/* Vertical Feed */}
        <div className="space-y-4">
          <PublicFeed />
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={showCreatePostModal}
        onOpenChange={setShowCreatePostModal}
        onPostCreated={handlePostCreated}
      />

      {/* Premium Block Modal */}
      <PremiumBlockModal 
        isOpen={showPremiumBlockModal}
        onOpenChange={setShowPremiumBlockModal}
      />

      {/* Complete Profile Modal */}
      <CompleteProfileModal
        isOpen={showCompleteProfile}
        onOpenChange={setShowCompleteProfile}
        onCompleted={() => {
          setShowCompleteProfile(false);
          refreshProfile();
          if (afterComplete) {
            navigate(afterComplete, { replace: true, state: undefined });
          }
        }}
      />
    </div>
  );
};
