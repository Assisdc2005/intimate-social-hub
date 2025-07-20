import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Heart, MessageCircle, UserPlus, Calendar, Camera, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

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
  content: string;
  media_url?: string;
  media_type: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile: currentUser, isPremium } = useProfile();
  const { toast } = useToast();
  
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

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

        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
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

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: currentUser?.user_id,
          addressee_id: userId,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Solicitação já enviada",
            description: "Você já enviou uma solicitação para este usuário",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Solicitação enviada!",
          description: "Solicitação de amizade enviada com sucesso",
        });

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            from_user_id: currentUser?.user_id,
            type: 'novo_amigo',
            content: 'enviou uma solicitação de amizade'
          });
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação",
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
        .from('likes')
        .insert({ post_id: postId, user_id: currentUser?.user_id });

      if (!error) {
        toast({
          title: "Post curtido!",
          description: "Você curtiu este post",
        });

        // Update local state
        setUserPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, likes_count: post.likes_count + 1 }
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
                <p className="text-foreground mt-4 leading-relaxed">{userProfile.bio}</p>
              )}
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
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar
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

      {/* Posts Section */}
      <Card className="glass backdrop-blur-xl border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-gradient">
              Publicações ({userPosts.length})
            </h3>
          </div>

          {userPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma publicação ainda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userPosts.map((post) => (
                <Card key={post.id} className="bg-white/5 border-white/10">
                  <CardContent className="p-4">
                    {post.media_url && (
                      <div className="aspect-square rounded-lg overflow-hidden mb-3">
                        <img 
                          src={post.media_url} 
                          alt="Post"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {post.content && (
                      <p className="text-foreground mb-3">{post.content}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className="flex items-center gap-1 hover:text-red-400 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          {post.likes_count}
                        </button>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments_count}
                        </div>
                      </div>
                      <span>
                        {new Date(post.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};