import { Search, Filter, MapPin, Heart, MessageCircle, UserPlus, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TruncatedText } from "@/components/ui/truncated-text";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

export const DiscoverTab = () => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // Fetch data from database
  useEffect(() => {
    if (profile?.user_id) {
      fetchData();
      fetchUserLikes();
    }
  }, [profile?.user_id]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = users.filter(user =>
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users excluding current user
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', profile?.user_id)
        .limit(20);

      // Fetch posts with profile data
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            avatar_url,
            city
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      setUsers(usersData || []);
      setFilteredUsers(usersData || []);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!profile?.user_id) return;
    
    try {
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', profile.user_id);
      
      const likedPosts = new Set(likesData?.map(like => like.post_id) || []);
      setUserLikes(likedPosts);
    } catch (error) {
      console.error('Error fetching user likes:', error);
    }
  };

  const handleAddFriend = async (userId: string) => {
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

      if (!error) {
        toast({
          title: "Solicitação enviada!",
          description: "Sua solicitação de amizade foi enviada.",
        });

        // Send notification
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: userId,
              from_user_id: profile.user_id,
              type: 'novo_amigo',
              content: 'enviou uma solicitação de amizade'
            }
          ]);
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar solicitação de amizade.",
        variant: "destructive",
      });
    }
  };

  const handleMessage = async (userId: string) => {
    if (!checkPremiumFeature('enviar mensagens')) return;
    
    // TODO: Navigate to messages or create conversation
    toast({
      title: "Mensagem",
      description: "Funcionalidade de mensagens em desenvolvimento.",
    });
  };

  const handleLike = async (postId: string) => {
    if (!profile?.user_id) return;

    try {
      if (userLikes.has(postId)) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', profile.user_id);

        if (!error) {
          setUserLikes(prev => {
            const newSet = new Set(prev);
            newSet.delete(postId);
            return newSet;
          });
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              post_id: postId,
              user_id: profile.user_id
            }
          ]);

        if (!error) {
          setUserLikes(prev => new Set([...prev, postId]));
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleViewProfile = async (userId: string) => {
    try {
      // Record profile visit
      await supabase
        .from('profile_visits')
        .insert([
          {
            visitor_user_id: profile?.user_id,
            visited_user_id: userId
          }
        ]);

      // Send notification
      await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            from_user_id: profile?.user_id,
            type: 'visita',
            content: 'visitou seu perfil'
          }
        ]);
    } catch (error) {
      console.error('Error recording profile visit:', error);
    }
  };

  const checkPremiumFeature = (action: string) => {
    if (profile?.tipo_assinatura !== 'premium') {
      toast({
        title: "Recurso Premium",
        description: `Para ${action}, você precisa ser um membro premium.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filters = [
    { id: 'gender', label: 'Gênero', options: ['Feminino', 'Masculino', 'Não-binário'] },
    { id: 'age', label: 'Idade', options: ['18-25', '26-35', '36-45', '46+'] },
    { id: 'status', label: 'Status', options: ['Solteiro(a)', 'Casado(a)', 'Relacionamento aberto'] },
    { id: 'interests', label: 'Interesses', options: ['Arte', 'Música', 'Esportes', 'Viagem', 'Culinária'] },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header com busca */}
      <div className="glass rounded-2xl p-4">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input/50 border-white/20 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={`border-white/20 ${showFilters ? 'bg-primary/20 border-primary/40' : 'bg-white/10 hover:bg-white/20'}`}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="space-y-3 pt-4 border-t border-white/10 animate-slide-up">
            <div className="flex items-center gap-2 mb-3">
              <Sliders className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Filtros Avançados</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {filters.map((filter) => (
                <div key={filter.id} className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">{filter.label}</label>
                  <select className="w-full p-2 rounded-lg bg-input/50 border border-white/20 text-sm text-foreground">
                    <option value="">Todos</option>
                    {filter.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 pt-3">
              <Button size="sm" className="btn-premium flex-1">
                Aplicar Filtros
              </Button>
              <Button size="sm" variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20">
                Limpar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contador de resultados */}
      <div className="flex items-center justify-between px-2">
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} pessoas encontradas
        </p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-green-400">Online agora</span>
        </div>
      </div>

      {/* Lista de usuários */}
      <div className="space-y-4">
        {filteredUsers.length > 0 ? filteredUsers.map((user) => (
          <div 
            key={user.id} 
            className="card-premium hover:scale-[1.02] transition-all duration-300 cursor-pointer"
            onClick={() => handleViewProfile(user.user_id)}
          >
            <div className="flex gap-4">
              {/* Avatar */}
              <div className="relative">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-20 h-20 rounded-2xl object-cover shadow-glow"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-secondary flex items-center justify-center text-white font-bold text-xl shadow-glow">
                    {user.display_name?.[0] || 'U'}
                  </div>
                )}
                
                {/* Indicadores */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
                {user.tipo_assinatura === 'premium' && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center shadow-glow">
                    <span className="text-xs font-bold text-white">👑</span>
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{user.display_name}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {user.city || 'Brasil'}
                    </p>
                    {user.bio && (
                      <TruncatedText text={user.bio} maxLength={190} className="mt-1" />
                    )}
                  </div>
                  
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                    Online
                  </span>
                </div>

                {/* Interesses */}
                {user.interests && user.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {user.interests.slice(0, 3).map((interest: string) => (
                      <span key={interest} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}

                {/* Botões de ação */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 border-white/20 bg-white/10 hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddFriend(user.user_id);
                    }}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1 btn-premium"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessage(user.user_id);
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-accent/40 bg-accent/10 hover:bg-accent/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      checkPremiumFeature('curtir perfis');
                    }}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center py-8">
            <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum usuário encontrado</p>
          </div>
        )}
      </div>

      {/* Botão para carregar mais */}
      <div className="flex justify-center pt-4">
        <Button variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20">
          Carregar mais perfis
        </Button>
      </div>
    </div>
  );
};
