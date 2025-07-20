import { useState, useEffect } from "react";
import { Camera, Heart, MessageCircle, MapPin, Clock, Plus, Play, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const HomeTab = () => {
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', media_url: '' });

  useEffect(() => {
    const fetchData = async () => {
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

        // Fetch recent notifications for activity feed
        const { data: notificationsData } = await supabase
          .from('notifications')
          .select(`
            *,
            profiles!notifications_from_user_id_fkey (display_name, avatar_url)
          `)
          .eq('user_id', profile?.user_id)
          .order('created_at', { ascending: false })
          .limit(3);

        // Fetch feed posts for Top Sensuais Online
        const { data: feedPostsData } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (display_name, avatar_url, city, state)
          `)
          .order('created_at', { ascending: false })
          .limit(5);

        setPosts(postsData || []);
        setTopUsers(usersData || []);
        setActivities(notificationsData || []);
        setFeedPosts(feedPostsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.user_id) {
      fetchData();
    }
  }, [profile?.user_id]);

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
        .insert({ post_id: postId, user_id: profile?.user_id });

      if (!error) {
        toast({
          title: "Post curtido!",
          description: "Você curtiu este post",
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

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

  const handleCreatePost = async () => {
    if (!newPost.content.trim() && !newPost.media_url) {
      toast({
        title: "Erro",
        description: "Adicione um conteúdo ou mídia",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: profile?.user_id,
          content: newPost.content,
          media_type: newPost.media_url ? 'imagem' : 'texto',
          media_url: newPost.media_url
        });

      if (error) throw error;

      toast({
        title: "Publicação criada!",
        description: "Sua publicação foi criada com sucesso",
      });

      setNewPost({ content: '', media_url: '' });
      setShowCreatePost(false);
      
      // Refresh feed posts
      const { data: feedPostsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (display_name, avatar_url, city, state)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setFeedPosts(feedPostsData || []);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar publicação",
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = async (userId: string) => {
    try {
      await supabase
        .from('profile_visits')
        .insert({
          visited_user_id: userId,
          visitor_user_id: profile?.user_id
        });

      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          from_user_id: profile?.user_id,
          type: 'visita',
          content: 'visitou seu perfil'
        });
    } catch (error) {
      console.error('Error recording visit:', error);
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

        {/* Criar Publicação Button */}
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogTrigger asChild>
            <Button className="w-full bg-gradient-primary hover:opacity-90 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg mt-4">
              <Plus className="h-5 w-5 mr-2" />
              Criar Publicação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background/95 backdrop-blur border-white/20">
            <DialogHeader>
              <DialogTitle className="text-gradient">Criar Nova Publicação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="O que você está pensando? (máx. 250 caracteres)"
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                rows={4}
                maxLength={250}
              />
              <Input
                placeholder="URL da imagem/vídeo (opcional)"
                value={newPost.media_url}
                onChange={(e) => setNewPost({...newPost, media_url: e.target.value})}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              />
              <div className="text-xs text-gray-400">
                Formatos aceitos: .jpg, .png, .mp4
              </div>
              <Button onClick={handleCreatePost} className="w-full bg-gradient-primary hover:opacity-90">
                Publicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
            <div key={user.id} className="flex items-center justify-between p-3 rounded-xl glass hover:bg-white/10 transition-all duration-300">
              <div className="flex items-center gap-3">
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
                <div>
                  <p className="font-medium">{user.display_name}</p>
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
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20"
                  onClick={() => handleMessage()}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sessão Últimas Fotos */}
      <div className="card-premium">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gradient">Últimas Fotos</h3>
          </div>
          <Button variant="ghost" className="text-accent hover:text-accent/80">
            Mais fotos →
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {posts.map((post) => (
            <div key={post.id} className="relative group cursor-pointer">
              <div className="aspect-[3/4] rounded-2xl bg-gradient-secondary overflow-hidden">
                <img 
                  src={post.media_url || "/placeholder.svg"}
                  alt={post.profiles?.display_name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Overlay com informações */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="font-medium text-white">{post.profiles?.display_name}</p>
                    <p className="text-xs text-white/80 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {post.profiles?.city}, {post.profiles?.state}
                    </p>
                  </div>
                </div>
                
                {/* Botões de ação */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Button 
                    size="sm" 
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 border-0"
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart className="w-4 h-4 text-white" />
                  </Button>
                  <Button 
                    size="sm" 
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 border-0"
                    onClick={handleMessage}
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {posts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma foto encontrada</p>
          </div>
        )}
      </div>

      {/* Top Sensuais Online Feed */}
      <div className="card-premium">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gradient">Top Sensuais Online</h3>
        </div>
        
        <div className="space-y-6">
          {feedPosts.map((post) => (
            <div key={post.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              {/* Post Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-secondary overflow-hidden">
                  {post.profiles?.avatar_url ? (
                    <img src={post.profiles.avatar_url} alt={post.profiles.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold">
                      {post.profiles?.display_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{post.profiles?.display_name}</p>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <p className="text-white mb-4">{post.content}</p>
              )}

              {/* Post Media */}
              {post.media_url && (
                <div className="relative mb-4 rounded-xl overflow-hidden">
                  <img 
                    src={post.media_url} 
                    alt="Post content" 
                    className="w-full max-h-96 object-cover"
                  />
                  {post.media_type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/50 rounded-full p-3">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleLike(post.id)}
                  className="text-gray-400 hover:text-accent hover:bg-white/10"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Curtir
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Comentar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewProfile(post.user_id)}
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <User className="w-4 h-4 mr-2" />
                  Ver Perfil
                </Button>
              </div>
            </div>
          ))}
        </div>

        {feedPosts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma publicação encontrada</p>
          </div>
        )}
      </div>

      {/* Feed de Atividades Recentes */}
      <div className="card-premium">
        <h3 className="text-lg font-semibold text-gradient mb-4">Atividade Recente</h3>
        
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl glass">
              <div className="w-10 h-10 rounded-full bg-gradient-secondary overflow-hidden">
                {activity.profiles?.avatar_url ? (
                  <img src={activity.profiles.avatar_url} alt={activity.profiles.display_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold">
                    {activity.profiles?.display_name?.[0]}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-medium">{activity.profiles?.display_name}</span> {activity.content}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(activity.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              {activity.type === 'curtida' && <Heart className="w-5 h-5 text-accent" />}
              {activity.type === 'visita' && <div className="w-5 h-5 rounded-full bg-accent" />}
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              <p>Nenhuma atividade recente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};