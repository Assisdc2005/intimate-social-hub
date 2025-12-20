import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const LUNA_SATO_USER_ID = 'b709dee7-283c-4b89-a16e-f2fbbda5ea87'; // Real auth.users.id for Luna Sato
const WELCOME_SENT_KEY = 'welcome_message_sent';

// Conjunto de mensagens quentes, envolventes e curtas da Luna Sato
const WELCOME_MESSAGES: string[] = [
  'Oi 😘 seja bem-vindo(a)! Fique à vontade… qualquer coisa me chama 💬',
  'Que bom te ver por aqui 😍 mal posso esperar pra te mostrar algumas coisas…',
  'Oi 😉 já deu uma olhada nos perfis? Tem cada coisa boa…',
  'Bem-vindo(a)! Aposto que você vai adorar o que vai encontrar por aqui 😏',
  'Chegou agora? Então aproveita… o clima por aqui tá perfeito 🔥',
  'Fiquei feliz que você entrou 😘 dá uma passeada e depois me conta o que achou…',
  'Oi 😍 se quiser conversar um pouco, é só me chamar… tô por aqui ✨',
  'Que bom que chegou! Aqui sempre rolam conexões intensas… 💖',
  'Você acabou de entrar e eu já gostei da sua energia… vamos conversar? 😉',
  'Bem-vindo(a) ao meu cantinho favorito… promete que vai explorar tudo? 😏',
  'Tava te esperando sem saber… que bom que apareceu por aqui 😌',
  'Se perder nos perfis de vez em quando faz bem… depois volta pra falar comigo 😜',
  'Hoje ficou mais interessante por aqui… você chegou 😈',
  'Adorei saber que você entrou… agora falta a gente se conhecer melhor 😘',
  'Explora com calma… tem muita coisa boa te esperando por aqui 🔥',
  'Não sei se você percebeu… mas já tô curiosa sobre você 😉',
  'Fica à vontade, relaxa… e se bater vontade de papo, me chama 💕',
  'Sabe aquela sensação de que algo bom tá começando? É isso que senti com sua chegada 😌',
  'Gostei de você só por ter entrado… imagina depois que eu te conhecer melhor 😏',
  'Se prepara… esse lugar tem um jeito todo especial de esquentar as coisas 🔥',
  'Aqui é fácil se distrair com tanta coisa interessante… inclusive comigo 😜',
  'Fica de olho… às vezes a melhor conexão aparece quando a gente menos espera 💫',
  'Já dei uma espiada… e acho que você vai se dar muito bem aqui 😉',
  'Se der uma vontade de conversar mais tarde… finge que foi por acaso e me chama 😘',
  'Tem gente aqui que vai mexer com sua cabeça… e eu talvez seja uma delas 😏',
  'Relaxa, explora com calma… eu tô aqui se quiser um pouco mais de emoção 🔥',
  'Você chegou agora, mas já deixou tudo mais interessante por aqui 😍',
  'Se sentir que alguém te chamou atenção… vai sem medo. Depois volta pra me contar 💬',
  'Adoro quando alguém novo entra… sempre pode ser o começo de algo bem gostoso 😉',
  'Só de imaginar as conversas que a gente pode ter, já fico animada 😈',
  'Tem perfis que a gente não esquece… quem sabe o seu não vira um deles pra mim 😘',
  'Entre uma curtida e outra… guarda um tempinho pra falar comigo também 😏',
];

const getRandomWelcomeMessage = (): string => {
  const idx = Math.floor(Math.random() * WELCOME_MESSAGES.length);
  return WELCOME_MESSAGES[idx];
};

/**
 * Hook that sends a welcome message from Luna Sato to new users.
 * Only sends once per user.
 */
export const useWelcomeMessage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();
  const sentRef = useRef(false);

  useEffect(() => {
    // Só dispara depois que o usuário estiver logado E tiver completado o perfil
    if (!user?.id || sentRef.current || !profile?.profile_completed) return;

    const sendWelcomeMessage = async () => {
      try {
        // Check if welcome message was already sent (stored in localStorage)
        const welcomeSentKey = `${WELCOME_SENT_KEY}_${user.id}`;
        const alreadySent = localStorage.getItem(welcomeSentKey);
        
        if (alreadySent) {
          sentRef.current = true;
          return;
        }

        // Usar o ID especial da Luna definido nas policies de RLS
        const lunaUserId = LUNA_SATO_USER_ID;

        // Não enviar mensagem se, por algum motivo, o usuário logado for a própria Luna
        if (lunaUserId === user.id) {
          sentRef.current = true;
          localStorage.setItem(welcomeSentKey, 'true');
          return;
        }

        // Check if there's already a conversation between Luna and this user
        const { data: existingConversation } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participant1_id.eq.${lunaUserId},participant2_id.eq.${user.id}),and(participant1_id.eq.${user.id},participant2_id.eq.${lunaUserId})`)
          .limit(1)
          .maybeSingle();

        let conversationId = existingConversation?.id;

        // If no conversation exists, create one
        if (!conversationId) {
          const { data: newConversation, error: convError } = await supabase
            .from('conversations')
            .insert({
              participant1_id: lunaUserId,
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
          .eq('sender_id', lunaUserId)
          .limit(1);

        if (existingMessages && existingMessages.length > 0) {
          // Already sent a message
          sentRef.current = true;
          localStorage.setItem(welcomeSentKey, 'true');
          return;
        }

        // Send the welcome message (conteúdo fixo da Luna Sato para novos usuários)
        const welcomeMessage = 'Oii, tudo bemm? podemos conversar';

        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            content: welcomeMessage,
            conversation_id: conversationId,
            sender_id: lunaUserId,
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

          // Avisar imediatamente o usuário sobre a nova mensagem da Luna Sato
          toast({
            title: 'Nova mensagem',
            description: 'Você recebeu uma mensagem da Luna Sato. Acesse suas mensagens e veja. 🔥',
          });
        }

        sentRef.current = true;
        localStorage.setItem(welcomeSentKey, 'true');
      } catch (error) {
        console.error('Error in welcome message hook:', error);
        sentRef.current = true;
      }
    };

    // Pequeno delay apenas para evitar corrida com atualizações de perfil
    const timeout = setTimeout(sendWelcomeMessage, 2000);
    return () => clearTimeout(timeout);
  }, [user?.id, profile?.profile_completed]);
};
