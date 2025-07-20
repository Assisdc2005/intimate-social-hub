import { useState, useEffect, useRef } from "react";
import { MessageCircle, Search, Send, Phone, Video, ArrowLeft, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at?: string;
}

export const MessagesTabComplete = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar conversas
  const loadConversations = async () => {
    if (!profile?.user_id) return;

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

          // Última mensagem
          const lastMessage = conv.messages?.[0];

          return {
            ...conv,
            other_user: otherUser,
            last_message: lastMessage,
            unread_count: 0 // Implementar contagem de não lidas
          };
        })
      );

      setConversations(conversationsWithUsers);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  // Carregar mensagens da conversa
  const loadMessages = async (conversationId: string) => {
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
    }
  };

  // Enviar mensagem
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !profile?.user_id) return;

    // Check if user is premium - fixed logic
    if (profile.subscription_type !== 'premium' || !isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o plano premium para enviar mensagens",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: profile.user_id,
          content: newMessage.trim()
        });

      if (error) throw error;

      // Atualizar última mensagem da conversa
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage("");
      await loadMessages(selectedConversation.id);
      await loadConversations();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Selecionar conversa
  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    await loadMessages(conversation.id);
  };

  // Formatar data
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR');
    }
  };

  // Agrupar mensagens por data
  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };

  useEffect(() => {
    if (profile?.user_id) {
      loadConversations();
    }
  }, [profile]);

  // Vista mobile - lista de conversas
  if (!selectedConversation) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Header */}
        <Card className="glass backdrop-blur-xl border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gradient">Mensagens</h2>
                <p className="text-sm text-muted-foreground">
                  {conversations.length} conversas
                </p>
              </div>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass border-primary/30 h-10 rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Aviso Premium - only show for non-premium users */}
        {profile && profile.subscription_type !== 'premium' && (
          <Card className="glass backdrop-blur-xl border-accent/20">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gradient mb-2">
                Chat Premium Bloqueado
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upgrade para Premium para enviar mensagens ilimitadas
              </p>
              <Button className="bg-gradient-primary hover:opacity-90 text-white">
                <Crown className="w-4 h-4 mr-2" />
                Tornar-se Premium
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de Conversas */}
        <div className="space-y-2">
          {conversations.length === 0 ? (
            <Card className="glass backdrop-blur-xl border-primary/20">
              <CardContent className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nenhuma conversa ainda</h3>
                <p className="text-sm text-muted-foreground">
                  Suas conversas aparecerão aqui quando você conectar com alguém
                </p>
              </CardContent>
            </Card>
          ) : (
            conversations
              .filter(conv => 
                conv.other_user?.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((conversation) => (
                <Card 
                  key={conversation.id}
                  className="glass backdrop-blur-xl border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
                  onClick={() => selectConversation(conversation)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold text-lg shadow-[var(--shadow-glow)]">
                          {conversation.other_user?.avatar_url ? (
                            <img 
                              src={conversation.other_user.avatar_url} 
                              alt="Avatar" 
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            conversation.other_user?.display_name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {conversation.other_user?.display_name}
                          </h3>
                          <span className="text-xs text-muted-foreground">
                            {conversation.last_message && formatMessageDate(conversation.last_message.created_at)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate mb-1">
                          {conversation.last_message?.content || "Iniciar conversa"}
                        </p>
                        
                        {(conversation.other_user?.city || conversation.other_user?.state) && (
                          <p className="text-xs text-muted-foreground/70">
                            {conversation.other_user.city}
                            {conversation.other_user.city && conversation.other_user.state && ', '}
                            {conversation.other_user.state}
                          </p>
                        )}
                      </div>

                      {/* Badge não lidas */}
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge className="bg-accent text-white">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>
      </div>
    );
  }

  // Vista de chat individual
  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      {/* Header do Chat */}
      <Card className="glass backdrop-blur-xl border-primary/20 flex-shrink-0">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="w-10 h-10 rounded-full hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold shadow-[var(--shadow-glow)]">
              {selectedConversation.other_user?.avatar_url ? (
                <img 
                  src={selectedConversation.other_user.avatar_url} 
                  alt="Avatar" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                selectedConversation.other_user?.display_name?.[0]?.toUpperCase()
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {selectedConversation.other_user?.display_name}
              </h3>
              <p className="text-xs text-green-400">Online</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-primary/10">
                <Phone className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-primary/10">
                <Video className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(messageGroups).map(([date, dayMessages]) => (
          <div key={date}>
            {/* Separador de data */}
            <div className="flex items-center justify-center mb-4">
              <div className="glass rounded-full px-3 py-1">
                <span className="text-xs text-muted-foreground">
                  {new Date(date).toLocaleDateString('pt-BR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {/* Mensagens do dia */}
            <div className="space-y-2">
              {dayMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === profile?.user_id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${
                    message.sender_id === profile?.user_id
                      ? 'bg-gradient-primary text-white rounded-l-2xl rounded-tr-2xl'
                      : 'glass border-primary/20 text-foreground rounded-r-2xl rounded-tl-2xl'
                  } p-3 shadow-[var(--shadow-soft)]`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender_id === profile?.user_id 
                        ? 'text-white/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {message.sender_id === profile?.user_id && (
                        <span className="ml-1">✓</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem */}
      <Card className="glass backdrop-blur-xl border-primary/20 flex-shrink-0">
        <CardContent className="p-4">
          {profile?.subscription_type !== 'premium' ? (
            <div className="flex items-center justify-center p-4 text-center">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Upgrade para Premium para enviar mensagens
                </span>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-white">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <Input
                placeholder="Digite uma mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                className="flex-1 glass border-primary/30 h-12 rounded-xl"
                disabled={sending}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="w-12 h-12 rounded-xl bg-gradient-primary hover:opacity-90 text-white p-0"
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};