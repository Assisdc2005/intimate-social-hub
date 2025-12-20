import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface MessagePayload {
  new: {
    id: string;
    content: string;
    sender_id: string;
    conversation_id: string;
    created_at: string;
    read_at: string | null;
  };
}

/**
 * Hook that listens for new messages and shows toast notifications.
 * Toast is clickable and navigates to /messages.
 */
export const useMessageNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to new messages
    const channel = supabase
      .channel('message-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload: MessagePayload) => {
          const newMessage = payload.new;
          
          // Don't notify for own messages
          if (newMessage.sender_id === user.id) return;

          // Check if this message is for a conversation the user is part of
          const { data: conversation } = await supabase
            .from('conversations')
            .select('participant1_id, participant2_id')
            .eq('id', newMessage.conversation_id)
            .single();

          if (!conversation) return;

          // Verify user is a participant
          const isParticipant = 
            conversation.participant1_id === user.id || 
            conversation.participant2_id === user.id;

          if (!isParticipant) return;

          // Don't show notification if already on messages page
          if (location.pathname === '/messages') return;

          // Fetch sender profile to get name
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', newMessage.sender_id)
            .single();

          const senderName = senderProfile?.display_name || 'usuário';

          // Notificação em tempo real de nova mensagem
          // O layout e o avatar são controlados em `Toaster` via props extras.
          toast({
            title: `Você recebeu uma mensagem de @${senderName}`,
            description: newMessage.content.length > 50
              ? newMessage.content.substring(0, 50) + '...'
              : newMessage.content,
            duration: 5000,
            // Props extras consumidas por Toaster para montar o card bonito
            username: senderName,
            avatarUrl: senderProfile?.avatar_url,
            onClick: () => navigate('/messages'),
          } as any);
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user?.id, navigate, location.pathname]);
};
