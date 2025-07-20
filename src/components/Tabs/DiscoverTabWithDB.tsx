import { useState, useEffect } from "react";
import { Search, Filter, MapPin, Heart, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

export const DiscoverTab = () => {
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    city: '',
    relationship_status: '',
    subscription_type: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('profile_completed', true)
          .neq('user_id', profile?.user_id)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Error fetching users:', error);
        } else {
          setUsers(data || []);
          setFilteredUsers(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile?.user_id) {
      fetchUsers();
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

      toast({
        title: "Conversa iniciada!",
        description: "Acesse a aba Mensagens para conversar",
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
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
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="glass rounded-2xl p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-300"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 mt-4">
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

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="glass rounded-2xl p-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-secondary overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                      {user.display_name?.[0]}
                    </div>
                  )}
                </div>
                {user.subscription_type === 'premium' && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white truncate">{user.display_name}</h3>
                  {user.subscription_type === 'premium' && (
                    <span className="text-xs bg-gradient-primary px-2 py-1 rounded-full text-white font-semibold">
                      PREMIUM
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-gray-300 text-sm mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{user.city}, {user.state}</span>
                </div>
                
                <p className="text-gray-400 text-sm mt-1">{user.profession}</p>
                
                {user.interests && user.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.interests.slice(0, 3).map((interest, index) => (
                      <span key={index} className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-300">
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewProfile(user.user_id)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Ver Perfil
                </Button>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAddFriend(user.user_id)}
                    className="bg-gradient-primary hover:opacity-90 text-white"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleMessage(user.user_id)}
                    className="bg-gradient-secondary hover:opacity-90 text-white"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
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