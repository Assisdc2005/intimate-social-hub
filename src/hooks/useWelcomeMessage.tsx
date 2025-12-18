import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const LUNA_SATO_USER_ID = 'luna-sato-bot'; // Special ID for Luna Sato
const WELCOME_SENT_KEY = 'welcome_message_sent';

/**
 * Hook that sends a welcome message from Luna Sato to new users.
 * Only sends once per user.
 */
export const useWelcomeMessage = () => {
  const { user } = useAuth();
  const sentRef = useRef(false);

  useEffect(() => {
    if (!user?.id || sentRef.current) return;

    const sendWelcomeMessage = async () => {
      try {
        // Check if welcome message was already sent (stored in localStorage)
        const welcomeSentKey = `${WELCOME_SENT_KEY}_${user.id}`;
        const alreadySent = localStorage.getItem(welcomeSentKey);
        
        if (alreadySent) {
          sentRef.current = true;
          return;
        }

        // Find Luna Sato's profile (search by display_name)
        const { data: lunaProfile } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .ilike('display_name', '%Luna Sato%')
          .limit(1)
          .single();

        if (!lunaProfile) {
          console.log('Luna Sato profile not found');
          sentRef.current = true;
          localStorage.setItem(welcomeSentKey, 'true');
          return;
        }

        // Don't send message to Luna Sato herself
        if (lunaProfile.user_id === user.id) {
          sentRef.current = true;
          localStorage.setItem(welcomeSentKey, 'true');
          return;
        }

        // Check if there's already a conversation between Luna and this user
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participant1_id.eq.${lunaProfile.user_id},participant2_id.eq.${user.id}),and(participant1_id.eq.${user.id},participant2_id.eq.${lunaProfile.user_id})`)
          .limit(1)
          .maybeSingle();

        let conversationId = existingConversation?.id;

        // If no conversation exists, create one
        if (!conversationId) {
          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              participant1_id: lunaProfile.user_id,
              participant2_id: user.id,
              last_message_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (convError || !newConversation) {
            console.error('Error creating conversation:', convError);
            sentRef.current = true;
            localStorage.setItem(welcomeSentKey, 'true');
            return;
          }

          conversationId = newConversation.id;
        }

        // Check if Luna already sent a message in this conversation
        const { data: existingMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('sender_id', lunaProfile.user_id)
          .limit(1);

        if (existingMessages && existingMessages.length > 0) {
          // Already sent a message
          sentRef.current = true;
          localStorage.setItem(welcomeSentKey, 'true');
          return;
        }

        // Send the welcome message
        const welcomeMessage = `Oi 😊
Vi seu perfil agora… gostei.
Tudo bem?`;

        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            content: welcomeMessage,
            conversation_id: conversationId,
            sender_id: lunaProfile.user_id,
          });

        if (msgError) {
          console.error('Error sending welcome message:', msgError);
        } else {
          console.log('Welcome message from Luna Sato sent successfully');
          // Update conversation last_message_at
          await supabase
            .from('conversations')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', conversationId);
        }

        sentRef.current = true;
        localStorage.setItem(welcomeSentKey, 'true');
      } catch (error) {
        console.error('Error in welcome message hook:', error);
        sentRef.current = true;
      }
    };

    // Small delay to ensure profile is loaded
    const timeout = setTimeout(sendWelcomeMessage, 2000);
    return () => clearTimeout(timeout);
  }, [user?.id]);
};
