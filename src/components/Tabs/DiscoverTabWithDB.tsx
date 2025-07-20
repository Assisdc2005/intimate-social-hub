import { useState, useEffect } from "react";
import { Search, Filter, MapPin, Heart, MessageCircle, UserPlus, Plus, Play, Clock, User, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const DiscoverTab = () => {
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', media_type: 'texto', media_url: '' });
  const [filters, setFilters] = useState({
    gender: '',
    city: '',
    relationship_status: '',
    subscription_type: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .eq('profile_completed', true)
          .neq('user_id', profile?.user_id)
          .order('updated_at', { ascending: false });

        // Fetch posts with profiles
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (display_name, avatar_url, city, state)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else {
          setUsers(usersData || []);
          setFilteredUsers(usersData || []);
        }

        if (postsError) {
          console.error('Error fetching posts:', postsError);
        } else {
          setPosts(postsData || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.user_id) {
      fetchData();
    }
  }, [profile?.user_id]);

  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.profession?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    if (filters.gender) {
      filtered = filtered.filter(user => user.gender === filters.gender);
    }
    if (filters.city) {
      filtered = filtered.filter(user => user.city?.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.relationship_status) {
      filtered = filtered.filter(user => user.relationship_status === filters.relationship_status);
    }
    if (filters.subscription_type) {
      filtered = filtered.filter(user => user.subscription_type === filters.subscription_type);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filters, users]);

  const handleAddFriend = async (userId: string) => {
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
          requester_id: profile?.user_id,
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
            from_user_id: profile?.user_id,
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

  const handleMessage = async (userId: string) => {
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o Premium para enviar mensagens",
        variant: "destructive",
      });
      return;
    }

    // Logic to start conversation
    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant1_id.eq.${profile?.user_id},participant2_id.eq.${userId}),and(participant1_id.eq.${userId},participant2_id.eq.${profile?.user_id})`)
        .single();

      if (!existingConversation) {
        // Create new conversation
        await supabase
          .from('conversations')
          .insert({
            participant1_id: profile?.user_id,
            participant2_id: userId
          });
      }

      navigate('/messages');
    } catch (error) {
      console.error('Error starting conversation:', error);
    }
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

      setNewPost({ content: '', media_type: 'texto', media_url: '' });
      setShowCreatePost(false);
      
      // Refresh posts
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (display_name, avatar_url, city, state)
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar publicação",
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

  const handleViewProfile = async (userId: string) => {
    // Record profile visit
    try {
      await supabase
        .from('profile_visits')
        .insert({
          visited_user_id: userId,
          visitor_user_id: profile?.user_id
        });

      // Create notification
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
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-display font-bold text-gradient">Descobrir</h1>
        <p className="text-lg text-foreground/80">Encontre pessoas incríveis perto de você</p>
      </div>

      {/* Filters Bar */}
      <div className="glass rounded-2xl p-4">
        <div className="flex gap-3 mb-4">
          <Button
            className="bg-gradient-primary hover:opacity-90 text-white rounded-full flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3">
            <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value})}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="nao_binario">Não-binário</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Cidade"
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />

            <Select value={filters.relationship_status} onValueChange={(value) => setFilters({...filters, relationship_status: value})}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="relacionamento">Em relacionamento</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.subscription_type} onValueChange={(value) => setFilters({...filters, subscription_type: value})}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="gratuito">Gratuito</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Create Post Button */}
      <div className="text-center">
        <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 text-white rounded-full px-8 py-3 text-lg font-semibold shadow-lg">
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
                placeholder="O que você está pensando?"
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
                rows={4}
              />
              <Input
                placeholder="URL da imagem (opcional)"
                value={newPost.media_url}
                onChange={(e) => setNewPost({...newPost, media_url: e.target.value})}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-300"
              />
              <Button onClick={handleCreatePost} className="w-full bg-gradient-primary hover:opacity-90">
                Publicar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          {posts.map((post) => (
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

        {posts.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma publicação encontrada</p>
          </div>
        )}
      </div>

      {/* Users Cards Grid */}
      <div className="card-premium">
        <h3 className="text-xl font-semibold text-gradient mb-6">Perfis Recomendados</h3>
        
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              {/* User Header */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-secondary overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                        {user.display_name?.[0]}
                      </div>
                    )}
                  </div>
                  {user.subscription_type === 'premium' && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">★</span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white text-lg">{user.display_name}</h3>
                    {user.subscription_type === 'premium' && (
                      <span className="text-xs bg-gradient-primary px-2 py-1 rounded-full text-white font-semibold">
                        PREMIUM
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-300">
                    {user.gender}, {user.birth_date ? new Date().getFullYear() - new Date(user.birth_date).getFullYear() : ''} anos • {user.sexual_orientation}
                  </p>
                  
                  <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{user.city}, {user.state}</span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <p className="text-gray-300 mb-4">{user.bio}</p>
              )}

              {/* Sample Photos/Videos */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="aspect-square bg-gradient-secondary rounded-lg overflow-hidden relative">
                    {user.avatar_url && index === 1 ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center">
                        <Camera className="w-6 h-6 text-white/50" />
                      </div>
                    )}
                    {index === 3 && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAddFriend(user.user_id)}
                  className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => handleMessage(user.user_id)}
                  className="flex-1 bg-gradient-primary hover:opacity-90 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum usuário encontrado</p>
        </div>
      )}

      {/* Load More Button */}
      {filteredUsers.length > 0 && (
        <div className="text-center pt-4">
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            Carregar Mais
          </Button>
        </div>
      )}
    </div>
  );
};