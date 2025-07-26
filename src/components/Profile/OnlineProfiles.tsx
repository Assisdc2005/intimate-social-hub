import { useState, useEffect } from 'react';
import { Users, Crown, MapPin, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface OnlineProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  city?: string;
  state?: string;
  birth_date?: string;
  tipo_assinatura?: string;
  status_online?: string;
  last_seen?: string;
}

export const OnlineProfiles = () => {
  const [onlineProfiles, setOnlineProfiles] = useState<OnlineProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { getOnlineStatusBadge } = useOnlineStatus();

  useEffect(() => {
    fetchOnlineProfiles();
    setupRealtimeSubscription();
  }, [profile?.user_id]);

  const fetchOnlineProfiles = async () => {
    try {
      setLoading(true);

      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          display_name,
          avatar_url,
          city,
          state,
          birth_date,
          tipo_assinatura,
          status_online,
          last_seen
        `)
        .neq('user_id', profile?.user_id || '')
        .eq('profile_completed', true)
        .order('last_seen', { ascending: false })
        .limit(6);

      if (error) throw error;

      setOnlineProfiles(profilesData || []);
    } catch (error) {
      console.error('Error fetching online profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('profiles-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `user_id=neq.${profile?.user_id || ''}`
      }, () => {
        fetchOnlineProfiles();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const calculateAge = (birthDate?: string) => {
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

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-card/30">
              <div className="w-14 h-14 rounded-full bg-gray-600"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-600 rounded w-24"></div>
                <div className="h-3 bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold text-gradient">Top Sensuais Online</h2>
      </div>

      {/* Profiles List */}
      <div className="space-y-3">
        {onlineProfiles.map((profileUser) => {
          const age = calculateAge(profileUser.birth_date);
          const statusBadge = getOnlineStatusBadge(profileUser.status_online, profileUser.last_seen);
          
          return (
            <div
              key={profileUser.id}
              className="group p-4 rounded-xl glass hover:bg-white/10 transition-all duration-300 cursor-pointer"
              onClick={() => handleViewProfile(profileUser.user_id)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-secondary overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                    {profileUser.avatar_url ? (
                      <img
                        src={profileUser.avatar_url}
                        alt={profileUser.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                        {profileUser.display_name[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Online Status Indicator */}
                  {profileUser.status_online === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
                  )}
                  
                  {/* Premium Crown */}
                  {profileUser.tipo_assinatura === 'premium' && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
                      <Crown className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {profileUser.display_name}
                    </h3>
                    {age && (
                      <span className="text-sm text-gray-400">
                        {age}
                      </span>
                    )}
                  </div>
                  
                  {/* Location */}
                  {(profileUser.city || profileUser.state) && (
                    <div className="flex items-center gap-1 text-sm text-gray-400 mb-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">
                        {profileUser.city}{profileUser.city && profileUser.state && ', '}{profileUser.state}
                      </span>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <Badge 
                    className={`text-xs ${statusBadge.color} text-white`}
                    variant="secondary"
                  >
                    {statusBadge.text}
                  </Badge>
                </div>

                {/* View Button */}
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {onlineProfiles.length === 0 && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" />
          <p className="text-gray-400">Nenhum perfil online encontrado</p>
        </div>
      )}

      {/* View More Button */}
      {onlineProfiles.length > 0 && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/discover')}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            Ver Todos os Perfis
          </Button>
        </div>
      )}
    </div>
  );
};