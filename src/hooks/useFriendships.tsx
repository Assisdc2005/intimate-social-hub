import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FriendshipRequest {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  status: 'pendente' | 'aceito' | 'recusado';
  created_at: string;
  sender_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  receiver_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface Friend {
  id: string;
  user_id: string;
  amigo_id: string;
  created_at: string;
  friend_profile?: {
    display_name: string;
    avatar_url?: string;
    status_online?: string;
    last_seen?: string;
  };
}

export const useFriendships = () => {
  const { user } = useAuth();
  const [friendRequests, setFriendRequests] = useState<FriendshipRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendshipRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchFriendships();
      setupRealtimeSubscriptions();
    }
  }, [user?.id]);

  const fetchFriendships = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Fetch incoming friend requests
      const { data: requestsData } = await supabase
        .from('solicitacoes_amizade')
        .select(`
          *,
          profiles!solicitacoes_amizade_remetente_id_fkey(display_name, avatar_url)
        `)
        .eq('destinatario_id', user.id)
        .eq('status', 'pendente');

      // Fetch sent requests
      const { data: sentData } = await supabase
        .from('solicitacoes_amizade')
        .select(`
          *,
          profiles!solicitacoes_amizade_destinatario_id_fkey(display_name, avatar_url)
        `)
        .eq('remetente_id', user.id);

      // Fetch confirmed friends
      const { data: friendsData } = await supabase
        .from('amigos')
        .select(`
          *,
          profiles!amigos_amigo_id_fkey(display_name, avatar_url, status_online, last_seen)
        `)
        .eq('user_id', user.id);

      setFriendRequests((requestsData as any) || []);
      setSentRequests((sentData as any) || []);
      setFriends((friendsData as any) || []);
    } catch (error) {
      console.error('Error fetching friendships:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    if (!user?.id) return;

    // Listen for new friend requests
    const requestsChannel = supabase
      .channel('friendship-requests')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'solicitacoes_amizade',
        filter: `destinatario_id=eq.${user.id}`
      }, () => {
        fetchFriendships();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'solicitacoes_amizade',
        filter: `remetente_id=eq.${user.id}`
      }, () => {
        fetchFriendships();
      })
      .subscribe();

    // Listen for new friends
    const friendsChannel = supabase
      .channel('friends')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'amigos',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchFriendships();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(requestsChannel);
      supabase.removeChannel(friendsChannel);
    };
  };

  const sendFriendRequest = async (destinatarioId: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' };

    try {
      const { error } = await supabase
        .from('solicitacoes_amizade')
        .insert({
          remetente_id: user.id,
          destinatario_id: destinatarioId,
          status: 'pendente'
        });

      if (error) {
        if (error.code === '23505') {
          return { error: 'Solicitação já enviada' };
        }
        throw error;
      }

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: destinatarioId,
          from_user_id: user.id,
          type: 'novo_amigo',
          content: 'enviou uma solicitação de amizade'
        });

      return { success: true };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { error: 'Erro ao enviar solicitação' };
    }
  };

  const respondToFriendRequest = async (requestId: string, action: 'aceito' | 'recusado') => {
    if (!user?.id) return { error: 'Usuário não autenticado' };

    try {
      // Update request status
      const { data: updatedRequest, error: updateError } = await supabase
        .from('solicitacoes_amizade')
        .update({ status: action })
        .eq('id', requestId)
        .eq('destinatario_id', user.id)
        .select('remetente_id')
        .single();

      if (updateError) throw updateError;

      if (action === 'aceito') {
        // Create friendship records for both users
        const { error: friendError } = await supabase
          .from('amigos')
          .insert([
            {
              user_id: user.id,
              amigo_id: updatedRequest.remetente_id
            },
            {
              user_id: updatedRequest.remetente_id,
              amigo_id: user.id
            }
          ]);

        if (friendError) throw friendError;

        // Notify sender about acceptance
        await supabase
          .from('notifications')
          .insert({
            user_id: updatedRequest.remetente_id,
            from_user_id: user.id,
            type: 'novo_amigo',
            content: 'aceitou sua solicitação de amizade'
          });
      }

      return { success: true };
    } catch (error) {
      console.error('Error responding to friend request:', error);
      return { error: 'Erro ao responder solicitação' };
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!user?.id) return { error: 'Usuário não autenticado' };

    try {
      // Remove friendship records for both users
      await supabase
        .from('amigos')
        .delete()
        .or(`and(user_id.eq.${user.id},amigo_id.eq.${friendId}),and(user_id.eq.${friendId},amigo_id.eq.${user.id})`);

      return { success: true };
    } catch (error) {
      console.error('Error removing friend:', error);
      return { error: 'Erro ao remover amigo' };
    }
  };

  const isFriend = (userId: string) => {
    return friends.some(friend => friend.amigo_id === userId);
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some(request => 
      request.destinatario_id === userId && request.status === 'pendente'
    );
  };

  return {
    friendRequests,
    sentRequests,
    friends,
    loading,
    sendFriendRequest,
    respondToFriendRequest,
    removeFriend,
    isFriend,
    hasPendingRequest,
    refreshFriendships: fetchFriendships
  };
};