
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "./useProfile";
import { useToast } from "./use-toast";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at?: string;
  conversation_id: string;
}

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { profile } = useProfile();
  const { toast } = useToast();

  const loadMessages = async () => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || !conversationId || !profile?.user_id) return false;

    setSending(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          content,
          sender_id: profile?.user_id
        });

      if (error) throw error;

      // Update conversation's last message timestamp
      await supabase
        .from('conversations')
        .update({ 
          last_message_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Create notification for message recipient
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant1_id, participant2_id')
        .eq('id', conversationId)
        .single();

      if (conversation) {
        const recipientId = conversation.participant1_id === profile?.user_id 
          ? conversation.participant2_id 
          : conversation.participant1_id;

        await supabase
          .from('notifications')
          .insert({
            user_id: recipientId,
            from_user_id: profile?.user_id,
            type: 'mensagem',
            content: 'enviou uma nova mensagem'
          });
      }

      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem. Tente novamente.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!profile?.user_id || !conversationId) return;

    try {
      // Mark individual messages as read
      const { error: messageError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', profile.user_id)
        .is('read_at', null);

      if (messageError) {
        console.error('Error marking individual messages as read:', messageError);
        return;
      }

      // Note: Unread count management will be handled by triggers in the database
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Carregar mensagens quando conversationId muda
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [conversationId]);

  // Listener em tempo real para novas mensagens
  useEffect(() => {
    if (!conversationId) return;

    console.log('Configurando listener para conversa:', conversationId);

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Nova mensagem recebida:', payload);
          const newMessage = payload.new as Message;
          
          setMessages(currentMessages => {
            // Verificar se a mensagem já existe para evitar duplicatas
            const messageExists = currentMessages.some(msg => msg.id === newMessage.id);
            if (messageExists) {
              return currentMessages;
            }
            return [...currentMessages, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      console.log('Removendo listener para conversa:', conversationId);
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return {
    messages,
    loading,
    sending,
    sendMessage,
    loadMessages,
    markMessagesAsRead
  };
};
