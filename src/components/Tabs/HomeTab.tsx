import { useState, useEffect } from "react";
import { Plus, MessageCircle, Share2, TrendingUp, Zap, Crown, Play, Filter, MapPin, Clock, Camera, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OnlineProfiles } from "@/components/Profile/OnlineProfiles";
import { useFakeOnline } from "@/hooks/useFakeOnline";
import { PublicFeed } from "@/components/Feed/PublicFeed";
import { CreatePostModal } from "@/components/Modals/CreatePostModal";
import { PremiumBlockModal } from "@/components/Modals/PremiumBlockModal";
import { useNavigate } from "react-router-dom";

export const HomeTab = () => {
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isOnlineOrFake, registerCandidates } = useFakeOnline();
  const [posts, setPosts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedProfiles, setLikedProfiles] = useState<Set<string>>(new Set());
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showPremiumBlockModal, setShowPremiumBlockModal] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      fetchData();
    }
  }, [profile]);

  // Auto-refresh the list periodically to keep it dynamic and never empty
  useEffect(() => {
    if (!profile?.user_id) return;
    const interval = window.setInterval(() => {
      fetchData();
    }, 60000); // refresh every 60s
    return () => window.clearInterval(interval);
  }, [profile?.user_id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch latest posts (select only necessary columns)
      const postsPromise = supabase
        .from('publicacoes')
        .select('id, user_id, conteudo, midia_url, tipo_midia, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Base profiles query builders (select minimal fields)
      const LIMIT_POOL = 20; // fetch a pool to randomize from
      const FEMALE_GENDER_FILTER = 'fem%'; // handle 'feminino' variations
      const commonFilters = (query: any) =>
        query
          .select('user_id, display_name, avatar_url, city, state, gender, status_online, last_seen, tipo_assinatura')
          .eq('profile_completed', true)
          .neq('user_id', profile?.user_id)
          .limit(LIMIT_POOL);

      // Run independent queries in parallel
      const femalesQuery = commonFilters(supabase.from('profiles')).ilike('gender', FEMALE_GENDER_FILTER);
      const othersQuery = commonFilters(supabase.from('profiles')).not('gender', 'ilike', FEMALE_GENDER_FILTER);
      const [
        { data: postsData },
        { data: femalesPool },
        { data: othersPool }
      ] = await Promise.all([
        postsPromise,
        femalesQuery,
        othersQuery
      ]);

      // Fetch related profiles for posts in parallel only if needed
      const userIds = [...new Set((postsData || []).map((p: any) => p.user_id))];
      let postsWithProfiles = postsData || [];
      if (userIds.length) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds);
        postsWithProfiles = (postsData || []).map((p: any) => ({
          ...p,
          profiles: profilesData?.find((pr: any) => pr.user_id === p.user_id)
        }));
      }

      // Fetch top users with rules:
      // - only profiles with at least one photo (photos not null OR avatar_url present)
      // - prefer female; if less than 5, fill with others
      // - randomize order to vary between accesses
      // - limit to 5

      // Helper to check has photo (strict): photos array length > 0 OR avatar_url non-empty
      const hasPhoto = (p: any) => {
        const hasPhotosArr = Array.isArray(p?.photos) && p.photos.length > 0;
        const hasAvatar = typeof p?.avatar_url === 'string' && p.avatar_url.trim() !== '';
        return hasPhotosArr || hasAvatar;
      };

      // Online heuristics: status_online true OR last_seen within 5 minutes
      const isOnline = (p: any) => {
        if (p?.status_online === true) return true;
        if (!p?.last_seen) return false;
        const FIVE_MIN = 5 * 60 * 1000;
        const last = new Date(p.last_seen).getTime();
        return Date.now() - last <= FIVE_MIN;
      };

      // Deduplicate by user_id and keep only with photo
      const dedupeById = (arr: any[]) => {
        const seen = new Set<string>();
        const out: any[] = [];
        for (const item of arr || []) {
          if (!item?.user_id) continue;
          if (seen.has(item.user_id)) continue;
          if (!hasPhoto(item)) continue;
          seen.add(item.user_id);
          out.push(item);
        }
        return out;
      };

      // Prioritize online (real or fake) first within each group
      const sortByOnline = (arr: any[]) => [...arr].sort((a, b) => Number(isOnlineOrFake(b)) - Number(isOnlineOrFake(a)));

      const females = sortByOnline(dedupeById(femalesPool || []));
      const others = sortByOnline(dedupeById(othersPool || []).filter(
        (p) => !females.find((f) => f.user_id === p.user_id)
      ));

      // Randomize helpers
      const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5);

      const selected: any[] = [];
      selected.push(...shuffle([...females]).slice(0, 5));
      if (selected.length < 5) {
        const remaining = 5 - selected.length;
        selected.push(...shuffle([...others]).slice(0, remaining));
      }

      // If still less than 5 (database has few matches), fetch a broader pool to fill (still prefer with photo)
      if (selected.length < 5) {
        const remaining = 5 - selected.length;
        const { data: fallbackPool } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, city, state, gender, status_online, last_seen, tipo_assinatura')
          .eq('profile_completed', true)
          .neq('user_id', profile?.user_id)
          .limit(LIMIT_POOL);

        const fallback = sortByOnline(dedupeById(fallbackPool || []).filter(
          (p) => !selected.find((s) => s.user_id === p.user_id)
        ));
        selected.push(...shuffle(fallback).slice(0, remaining));
      }

      // Final safeguard: if still less than 5, allow filling with any completed profiles (even without photo)
      if (selected.length < 5) {
        const remaining = 5 - selected.length;
        const { data: broadPool } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, city, state, gender, status_online, last_seen, tipo_assinatura')
          .eq('profile_completed', true)
          .neq('user_id', profile?.user_id)
          .limit(LIMIT_POOL);
        const broad = sortByOnline(dedupeById(broadPool || []).filter(
          (p) => !selected.find((s) => s.user_id === p.user_id)
        ));
        selected.push(...shuffle(broad).slice(0, remaining));
      }

      // Ensure exactly 5 and simulate online presence for display purposes
      // Prioritize online first, then randomize within each group
      const onlineArr = selected.filter((u) => isOnlineOrFake(u));
      const offlineArr = selected.filter((u) => !isOnlineOrFake(u));
      const ordered = [...shuffle(onlineArr), ...shuffle(offlineArr)];
      const selectedFive = ordered.slice(0, 5).map((u) => ({
        ...u,
        simulated_online: isOnlineOrFake(u),
      }));

      setPosts(postsWithProfiles);
      if (selectedFive.length > 0) {
        setTopUsers(selectedFive);
      }

      // Register visible candidates to the fake-online rotation system
      const candidates = [...(femalesPool || []), ...(othersPool || [])].map((u: any) => ({
        user_id: u.user_id,
        isRealOnline: isOnline(u),
      }));
      if (candidates.length) registerCandidates(candidates);
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
              +9 Online próximo à você!
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
                onClick={() => navigate(`/profile/view/${user.user_id}`)}
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
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-4xl">
                        {user.display_name[0]?.toUpperCase()}
                      </div>
                    )}
                    
                    {/* Online Badge (real or fake) */}
                    {isOnlineOrFake(user) && (
                      <div className="absolute top-2 left-2 flex items-center gap-1 bg-green-500/90 backdrop-blur-sm px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-xs font-semibold">LIVE</span>
                      </div>
                    )}

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
    </div>
  );
};
