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
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postComments, setPostComments] = useState<any[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

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

        // Fetch feed posts for Top Sensuais Online with likes and comments
        const { data: feedPostsData } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (display_name, avatar_url, city, state)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch user's likes
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', profile?.user_id);

        setPosts(postsData || []);
        setTopUsers(usersData || []);
        setActivities(notificationsData || []);
        setFeedPosts(feedPostsData || []);
        setUserLikes(new Set(likesData?.map(like => like.post_id) || []));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscription for posts
    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          // Fetch the new post with profile data
          supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey (display_name, avatar_url, city, state)
            `)
            .eq('id', payload.new.id)
            .single()
            .then(({ data }) => {
              if (data) {
                setFeedPosts(prev => [data, ...prev]);
              }
            });
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        (payload) => {
          setFeedPosts(prev => prev.map(post => 
            post.id === payload.new.id ? { ...post, ...payload.new } : post
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  const handleLike = async (postId: string) => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Faça upgrade para o Premium e libere curtidas ilimitadas",
        variant: "destructive",
      });
      return;
    }

    try {
      const isLiked = userLikes.has(postId);
      
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', profile?.user_id);
        
        setUserLikes(prev => {
          const newSet = new Set(prev);
          newSet.delete(postId);
          return newSet;
        });
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: profile?.user_id });
        
        setUserLikes(prev => new Set([...prev, postId]));
      }

      // Update local state
      setFeedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1 }
          : post
      ));

    } catch (error) {
      console.error('Error toggling like:', error);
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
      
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar publicação",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Faça upgrade para o Premium e libere comentários ilimitados",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: profile?.user_id,
          content: newComment
        });

      if (error) throw error;

      setNewComment('');
      
      // Update local state
      setFeedPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));

      // If viewing post modal, refresh comments
      if (selectedPost?.id === postId) {
        fetchPostComments(postId);
      }

    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey (display_name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      setPostComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const openPostModal = (post: any) => {
    setSelectedPost(post);
    setShowPostModal(true);
    fetchPostComments(post.id);
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
              <div className="space-y-2">
                <label className="text-sm text-gray-300">Anexar Imagem/Vídeo (opcional)</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.mp4,.mov"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = URL.createObjectURL(file);
                      setNewPost({...newPost, media_url: url});
                    }
                  }}
                  className="block w-full text-sm text-gray-300
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-white
                    hover:file:bg-primary/80
                    file:cursor-pointer cursor-pointer"
                />
                <div className="text-xs text-gray-400">
                  Formatos aceitos: .jpg, .png, .mp4, .mov
                </div>
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
            <div key={post.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center gap-3 p-4">
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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-white">{post.profiles?.display_name}</p>
                    {post.profiles?.subscription_type === 'premium' && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="px-4 pb-3">
                  <p className="text-white">{post.content}</p>
                </div>
              )}

              {/* Post Media */}
              {post.media_url && (
                <div 
                  className="relative cursor-pointer"
                  onClick={() => openPostModal(post)}
                >
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
              <div className="p-4">
                <div className="flex items-center gap-4 mb-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLike(post.id)}
                    className={`text-gray-400 hover:text-red-500 hover:bg-white/10 ${
                      userLikes.has(post.id) ? 'text-red-500' : ''
                    }`}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${userLikes.has(post.id) ? 'fill-current' : ''}`} />
                    {post.likes_count || 0}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openPostModal(post)}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {post.comments_count || 0}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewProfile(post.user_id)}
                    className="text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <User className="w-5 h-5 mr-2" />
                    Ver Perfil
                  </Button>
                </div>

                {/* Comment Input */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-secondary overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                        {profile?.display_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <Input
                      placeholder={isPremium ? "Adicione um comentário..." : "Upgrade para Premium para comentar"}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={!isPremium}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(post.id)}
                      disabled={!isPremium || !newComment.trim()}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {!isPremium && (
                  <div className="mt-3 p-3 bg-gradient-primary/20 rounded-lg border border-primary/30">
                    <p className="text-sm text-primary">
                      ⭐ Faça upgrade para o Premium e libere curtidas e comentários ilimitados!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {feedPosts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Heart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma publicação encontrada</p>
          </div>
        )}
      </div>

      {/* Post Modal */}
      <Dialog open={showPostModal} onOpenChange={setShowPostModal}>
        <DialogContent className="max-w-4xl bg-background/95 backdrop-blur border-white/20 p-0">
          {selectedPost && (
            <div className="flex flex-col md:flex-row max-h-[80vh]">
              {/* Media Side */}
              <div className="flex-1 bg-black flex items-center justify-center">
                {selectedPost.media_url ? (
                  <img 
                    src={selectedPost.media_url} 
                    alt="Post content" 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-white text-lg">{selectedPost.content}</p>
                  </div>
                )}
              </div>

              {/* Comments Side */}
              <div className="w-full md:w-96 flex flex-col bg-background/90">
                {/* Header */}
                <div className="flex items-center gap-3 p-4 border-b border-white/20">
                  <div className="w-10 h-10 rounded-full bg-gradient-secondary overflow-hidden">
                    {selectedPost.profiles?.avatar_url ? (
                      <img src={selectedPost.profiles.avatar_url} alt={selectedPost.profiles.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold">
                        {selectedPost.profiles?.display_name?.[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{selectedPost.profiles?.display_name}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedPost.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Content */}
                {selectedPost.content && (
                  <div className="p-4 border-b border-white/20">
                    <p className="text-white">{selectedPost.content}</p>
                  </div>
                )}

                {/* Comments */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {postComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-secondary overflow-hidden">
                        {comment.profiles?.avatar_url ? (
                          <img src={comment.profiles.avatar_url} alt={comment.profiles.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                            {comment.profiles?.display_name?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white">
                          <span className="font-semibold">{comment.profiles?.display_name}</span>
                          {' '}
                          {comment.content}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(comment.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment */}
                <div className="p-4 border-t border-white/20">
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLike(selectedPost.id)}
                      className={`text-gray-400 hover:text-red-500 ${
                        userLikes.has(selectedPost.id) ? 'text-red-500' : ''
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${userLikes.has(selectedPost.id) ? 'fill-current' : ''}`} />
                    </Button>
                    <span className="text-sm text-gray-400">{selectedPost.likes_count || 0} curtidas</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      placeholder={isPremium ? "Adicione um comentário..." : "Upgrade para Premium para comentar"}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      disabled={!isPremium}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(selectedPost.id)}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAddComment(selectedPost.id)}
                      disabled={!isPremium || !newComment.trim()}
                      className="bg-gradient-primary hover:opacity-90"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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