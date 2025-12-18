import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

const MESSAGE_LIMIT_FREE = 1;

/**
 * Hook to track message sending limits for non-premium users.
 * - Premium users have unlimited messages
 * - Free users can send only 1 message total
 * - System messages (from Luna Sato) don't count toward the limit
 */
export const useMessageLimit = () => {
  const { profile, isPremium } = useProfile();
  const [sentMessagesCount, setSentMessagesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lunaUserId, setLunaUserId] = useState<string | null>(null);

  // Fetch Luna Sato's user_id to exclude system messages
  useEffect(() => {
    const fetchLunaId = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('display_name', '%Luna Sato%')
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setLunaUserId(data.user_id);
      }
    };
    fetchLunaId();
  }, []);

  // Count sent messages by the current user
  const countSentMessages = useCallback(async () => {
    if (!profile?.user_id) {
      setLoading(false);
      return;
    }

    try {
      // Count all messages sent by this user
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', profile.user_id);

      if (error) {
        console.error('Error counting messages:', error);
        setSentMessagesCount(0);
      } else {
        setSentMessagesCount(count || 0);
      }
    } catch (error) {
      console.error('Error:', error);
      setSentMessagesCount(0);
    } finally {
      setLoading(false);
    }
  }, [profile?.user_id]);

  useEffect(() => {
    countSentMessages();
  }, [countSentMessages]);

  // Subscribe to new messages sent by the user
  useEffect(() => {
    if (!profile?.user_id) return;

    const channel = supabase
      .channel('message-count')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${profile.user_id}`,
        },
        () => {
          // Refresh count when user sends a message
          countSentMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id, countSentMessages]);

  // Check if the user can send a message
  const canSendMessage = isPremium || sentMessagesCount < MESSAGE_LIMIT_FREE;
  
  // Check if limit has been reached
  const hasReachedLimit = !isPremium && sentMessagesCount >= MESSAGE_LIMIT_FREE;

  // Remaining messages for free users
  const remainingMessages = isPremium 
    ? Infinity 
    : Math.max(0, MESSAGE_LIMIT_FREE - sentMessagesCount);

  // Refresh count (useful after sending a message)
  const refreshCount = useCallback(() => {
    countSentMessages();
  }, [countSentMessages]);

  return {
    canSendMessage,
    hasReachedLimit,
    sentMessagesCount,
    remainingMessages,
    loading,
    isPremium,
    refreshCount,
    lunaUserId,
  };
};
