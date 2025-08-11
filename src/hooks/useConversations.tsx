
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";

interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  other_user?: {
    display_name: string;
    avatar_url?: string;
    city?: string;
    state?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count?: number;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { profile } = useProfile();

  const loadConversations = async () => {
    if (!profile?.user_id) return;

    try {
      setLoading(true);
      
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          *,
          participant1:profiles!conversations_participant1_id_fkey(user_id, display_name, avatar_url, city, state),
          participant2:profiles!conversations_participant2_id_fkey(user_id, display_name, avatar_url, city, state)
        `)
        .or(`participant1_id.eq.${profile.user_id},participant2_id.eq.${profile.user_id}`)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error loading conversations:', error);
        return;
      }

      // Process conversations to add other user info and last message
      const processedConversations = await Promise.all(
        (conversationsData || []).map(async (conv: any) => {
          const otherUser = conv.participant1.user_id === profile.user_id 
            ? conv.participant2 
            : conv.participant1;

          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count from conversation table
          const unreadCount = conv.participant1_id === profile.user_id 
            ? conv.participant1_unread_count || 0
            : conv.participant2_unread_count || 0;

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: unreadCount
          };
        })
      );

      setConversations(processedConversations);
    } catch (error) {
      console.error('Error in loadConversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.user_id) {
      loadConversations();
    }
  }, [profile?.user_id]);

  // Listener em tempo real para atualizações de conversas
  useEffect(() => {
    if (!profile?.user_id) return;

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `participant1_id=eq.${profile.user_id},participant2_id=eq.${profile.user_id}`
        },
        () => {
          console.log('Conversa atualizada, recarregando...');
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id]);

  return {
    conversations,
    loading,
    loadConversations
  };
};
