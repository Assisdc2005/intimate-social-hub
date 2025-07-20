
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

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          messages:messages(
            id,
            content,
            sender_id,
            created_at
          )
        `)
        .or(`participant1_id.eq.${profile.user_id},participant2_id.eq.${profile.user_id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      // Buscar informações dos outros usuários
      const conversationsWithUsers = await Promise.all(
        (data || []).map(async (conv) => {
          const otherUserId = conv.participant1_id === profile.user_id 
            ? conv.participant2_id 
            : conv.participant1_id;

          const { data: otherUser } = await supabase
            .from('profiles')
            .select('display_name, avatar_url, city, state')
            .eq('user_id', otherUserId)
            .single();

          // Última mensagem (ordenar por created_at)
          const lastMessage = conv.messages?.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: 0 // Implementar contagem de não lidas depois
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
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
