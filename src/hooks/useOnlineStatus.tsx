import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useOnlineStatus = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user?.id) {
      updateOnlineStatus(isOnline ? 'online' : 'offline');
    }
  }, [user?.id, isOnline]);

  // Update online status when component mounts/unmounts
  useEffect(() => {
    if (user?.id) {
      updateOnlineStatus('online');

      // Update status to offline when user leaves
      const handleBeforeUnload = () => {
        updateOnlineStatus('offline');
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        updateOnlineStatus('offline');
      };
    }
  }, [user?.id]);

  // Update last_seen periodically while online
  useEffect(() => {
    if (user?.id && isOnline) {
      const interval = setInterval(() => {
        updateLastSeen();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [user?.id, isOnline]);

  const updateOnlineStatus = async (status: 'online' | 'offline' | 'ausente') => {
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ 
          status_online: status,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating online status:', error);
    }
  };

  const updateLastSeen = async () => {
    if (!user?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ last_seen: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error updating last seen:', error);
    }
  };

  const getLastSeenText = (lastSeen?: string) => {
    if (!lastSeen) return 'Nunca visto';

    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `Há ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    
    return lastSeenDate.toLocaleDateString('pt-BR');
  };

  const getOnlineStatusBadge = (status?: string, lastSeen?: string) => {
    switch (status) {
      case 'online':
        return { text: 'Online agora', color: 'bg-green-500' };
      case 'ausente':
        return { text: 'Ausente', color: 'bg-yellow-500' };
      default:
        return { 
          text: getLastSeenText(lastSeen), 
          color: 'bg-gray-500' 
        };
    }
  };

  return {
    isOnline,
    updateOnlineStatus,
    updateLastSeen,
    getLastSeenText,
    getOnlineStatusBadge
  };
};