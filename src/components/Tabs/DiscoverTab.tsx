import { useState, useEffect } from "react";
import { Search, Filter, MapPin, Heart, MessageCircle, UserPlus, Plus, Play, Clock, User, Camera } from "lucide-react";
import { PhotoGrid } from "@/components/Profile/PhotoGrid";
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
    gender: 'all',
    city: '',
    relationship_status: 'all',
    subscription_type: 'all',
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const USERS_PER_PAGE = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch initial users
        await loadUsers(1, true);

        // Fetch posts with profiles
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (display_name, avatar_url, city, state)
          `)
          .order('created_at', { ascending: false })
          .limit(10);

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

  const loadUsers = async (page: number = 1, isInitialLoad: boolean = false) => {
    try {
      if (!isInitialLoad) setLoadingMore(true);
      
      const offset = (page - 1) * USERS_PER_PAGE;
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('profile_completed', true)
        .neq('user_id', profile?.user_id)
        .order('updated_at', { ascending: false })
        .range(offset, offset + USERS_PER_PAGE - 1);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
      }

      const newUsers = usersData || [];
      
      if (isInitialLoad || page === 1) {
        setUsers(newUsers);
        setFilteredUsers(newUsers);
        setCurrentPage(1);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
        setFilteredUsers(prev => [...prev, ...newUsers]);
      }
      
      setHasMoreUsers(newUsers.length === USERS_PER_PAGE);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      if (!isInitialLoad) setLoadingMore(false);
    }
  };

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
    if (filters.gender && filters.gender !== 'all') {
      filtered = filtered.filter(user => user.gender === filters.gender);
    }
    if (filters.city) {
      filtered = filtered.filter(user => user.city?.toLowerCase().includes(filters.city.toLowerCase()));
    }
    if (filters.relationship_status && filters.relationship_status !== 'all') {
      filtered = filtered.filter(user => user.relationship_status === filters.relationship_status);
    }
    if (filters.subscription_type && filters.subscription_type !== 'all') {
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

      // Navigate to user profile
      navigate(`/profile/${userId}`);
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
            <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value === 'all' ? '' : value})}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
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

            <Select value={filters.relationship_status} onValueChange={(value) => setFilters({...filters, relationship_status: value === 'all' ? '' : value})}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                <SelectItem value="casado">Casado(a)</SelectItem>
                <SelectItem value="relacionamento">Em relacionamento</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.subscription_type} onValueChange={(value) => setFilters({...filters, subscription_type: value === 'all' ? '' : value})}>
              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="gratuito">Gratuito</SelectItem>
              </SelectContent>
            </Select>
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
                <div 
                  className="relative cursor-pointer"
                  onClick={() => handleViewProfile(user.user_id)}
                >
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
                    <h3 
                      className="font-semibold text-white text-lg cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleViewProfile(user.user_id)}
                    >
                      {user.display_name}
                    </h3>
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

              {/* User Photos */}
              <div className="mb-4">
                <PhotoGrid userId={user.user_id} />
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
      {filteredUsers.length > 0 && hasMoreUsers && (
        <div className="text-center pt-4">
          <Button 
            onClick={() => {
              const nextPage = currentPage + 1;
              loadUsers(nextPage);
            }}
            disabled={loadingMore}
            className="w-full btn-secondary hover:scale-105 transition-transform duration-300"
          >
            {loadingMore ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Carregando mais perfis...
              </div>
            ) : (
              "Ver mais perfis"
            )}
          </Button>
        </div>
      )}
    </div>
  );
};