import { useState, useEffect } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Heart, MessageCircle, UserPlus, Calendar, Camera, Crown, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlurredMedia } from "@/components/ui/blurred-media";
import { TruncatedText } from "@/components/ui/truncated-text";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useFriendships } from "@/hooks/useFriendships";
import { useTestimonials } from "@/hooks/useTestimonials";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { TestimonialsSection } from "@/components/Testimonials/TestimonialsSection";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserProfileData {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  birth_date?: string;
  gender?: string;
  sexual_orientation?: string;
  city?: string;
  state?: string;
  profession?: string;
  height?: number;
  weight?: number;
  relationship_status?: string;
  interests?: string[];
  subscription_type?: string;
}

interface UserPost {
  id: string;
  descricao?: string;
  midia_url?: string;
  tipo_midia: string;
  created_at: string;
  curtidas_count: number;
  comentarios_count: number;
}

export const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile: currentUser, isPremium } = useProfile();
  const { toast } = useToast();
  const { sendFriendRequest, isFriend, hasPendingRequest, friends, refreshFriendships } = useFriendships();

  const { testimonials, createTestimonial } = useTestimonials(userId);
  const { getOnlineStatusBadge } = useOnlineStatus();

  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [friendsListOpen, setFriendsListOpen] = useState(false);
  const [userFriends, setUserFriends] = useState<any[]>([]);
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (profileError) throw profileError;

        // Fetch user posts from publicacoes table
        const { data: postsData, error: postsError } = await supabase
          .from('publicacoes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsError) throw postsError;

        setUserProfile(profileData);
        setUserPosts(postsData || []);

        // Record profile visit if not viewing own profile
        if (currentUser?.user_id && currentUser.user_id !== userId) {
          await supabase
            .from('profile_visits')
            .insert({
              visited_user_id: userId,
              visitor_user_id: currentUser.user_id
            });

          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              from_user_id: currentUser.user_id,
              type: 'visita',
              content: 'visitou seu perfil'
            });
        }

        // Load friends of this user (so both users can see friend list)
        const { data: friendsData } = await supabase
          .from('amigos')
          .select(`
            amigo_id,
            profiles!amigos_amigo_id_fkey(display_name, avatar_url)
          `)
          .eq('user_id', userId);

        setUserFriends((friendsData as any) || []);

        // Simulate online status (this could be enhanced with real-time data)
        setIsOnline(Math.random() > 0.3);

      } catch (error) {
        console.error('Error fetching user data:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar perfil do usuário",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser?.user_id]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleMessage = async () => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para enviar mensagens",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant1_id.eq.${currentUser?.user_id},participant2_id.eq.${userId}),and(participant1_id.eq.${userId},participant2_id.eq.${currentUser?.user_id})`)
        .maybeSingle();

      if (!existingConversation) {
        // Create new conversation
        await supabase
          .from('conversations')
          .insert({
            participant1_id: currentUser?.user_id,
            participant2_id: userId
          });
      }

      navigate('/messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
  };

  const handleAddFriend = async () => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para adicionar amigos",
        variant: "destructive",
      });
      return;
    }

    if (!userId) return;

    const result = await sendFriendRequest(userId);
    if (result.success) {
      toast({
        title: "Solicitação enviada!",
        description: "Solicitação de amizade enviada com sucesso",
      });
      setRequestSent(true);
      refreshFriendships();
    } else {
      toast({
        title: "Erro",
        description: result.error || "Erro ao enviar solicitação",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (postId: string) => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para curtir posts",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('curtidas_publicacoes')
        .insert({ publicacao_id: postId, user_id: currentUser?.user_id });

      if (!error) {
        toast({
          title: "Post curtido!",
          description: "Você curtiu este post",
        });

        // Update local state
        setUserPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, curtidas_count: post.curtidas_count + 1 }
            : post
        ));

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            from_user_id: currentUser?.user_id,
            type: 'curtida',
            content: 'curtiu sua publicação'
          });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Carregando perfil...</div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Usuário não encontrado</div>
      </div>
    );
  }

  const age = userProfile.birth_date ? calculateAge(userProfile.birth_date) : null;
  const isCurrentFriend = userId ? isFriend(userId) : false;
  const hasPending = userId ? hasPendingRequest(userId) : false;
  const friendsCount = userFriends.length;
  const hasSentOrPending = requestSent || hasPending;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-gradient">Perfil de {userProfile.display_name}</h1>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-secondary overflow-hidden">
                {userProfile.avatar_url ? (
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                    {userProfile.display_name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              {userProfile.subscription_type === 'premium' && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
              )}
              {isOnline && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gradient">{userProfile.display_name}</h2>
                {userProfile.subscription_type === 'premium' && (
                  <Badge className="bg-gradient-primary text-white">PREMIUM</Badge>
                )}
                {isOnline && (
                  <Badge className="bg-green-500 text-white">Online</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {age && userProfile.gender && (
                  <p>{userProfile.gender}, {age} anos</p>
                )}
                {userProfile.sexual_orientation && (
                  <p>Orientação: {userProfile.sexual_orientation}</p>
                )}
                {(userProfile.city || userProfile.state) && (
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {userProfile.city}{userProfile.city && userProfile.state && ', '}{userProfile.state}
                  </p>
                )}
                {userProfile.profession && (
                  <p>Profissão: {userProfile.profession}</p>
                )}
                {userProfile.relationship_status && (
                  <p>Status: {userProfile.relationship_status}</p>
                )}
              </div>

              {userProfile.bio && (
                <TruncatedText text={userProfile.bio} maxLength={190} className="mt-4" />
              )}
              {/* Friends counter */}
              <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={() => friendsCount > 0 && setFriendsListOpen(true)}
                  className="flex items-center gap-1 hover:text-white transition-colors disabled:opacity-50"
                  disabled={friendsCount === 0}
                >
                  <Users className="w-4 h-4" />
                  <span>Amigos: {friendsCount}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interests */}
          {userProfile.interests && userProfile.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gradient mb-3">Interesses</h3>
              <div className="flex flex-wrap gap-2">
                {userProfile.interests.map((interest, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gradient-secondary text-white"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {currentUser?.user_id !== userId && (
            <div className="flex gap-3">
              <Button
                onClick={handleAddFriend}
                className="flex-1 bg-white/10 border border-white/20 text-white hover:bg-white/20"
                variant="outline"
                disabled={isCurrentFriend || hasSentOrPending}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {isCurrentFriend ? 'Amigos' : hasSentOrPending ? 'Convite enviado' : 'Adicionar'}
              </Button>

              <Button
                onClick={handleMessage}
                className="flex-1 bg-gradient-primary hover:opacity-90 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Mensagem
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Testimonials Section */}
      <TestimonialsSection profileUserId={userId || ''} />

      {/* Friends list modal */}
      <AlertDialog open={friendsListOpen} onOpenChange={setFriendsListOpen}>
        <AlertDialogContent className="bg-background/95 backdrop-blur border-white/20 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Users className="w-4 h-4" /> Amigos de {userProfile.display_name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Lista de amigos conectados com este perfil.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto mt-2">
            {userFriends.map((friend) => (
              <div key={friend.amigo_id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-secondary overflow-hidden">
                    {friend.profiles?.avatar_url ? (
                      <img
                        src={friend.profiles.avatar_url}
                        alt={friend.profiles.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                        {friend.profiles?.display_name?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-white">{friend.profiles?.display_name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-primary hover:text-primary/80"
                  onClick={() => {
                    setFriendsListOpen(false);
                    navigate(`/profile/view/${friend.amigo_id}`);
                  }}
                >
                  Abrir perfil
                </Button>
              </div>
            ))}
            {userFriends.length === 0 && (
              <p className="text-sm text-gray-400">Nenhum amigo ainda.</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
              Fechar
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};