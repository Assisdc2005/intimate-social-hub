
import { useState, useEffect, useRef } from "react";
import { MessageCircle, Search, Send, ArrowLeft, Crown, Lock, Smile, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const { profile, isPremium } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Usar os hooks customizados
  const { conversations, loading: conversationsLoading } = useConversations();
  const { messages, sending, sendMessage, markMessagesAsRead } = useMessages(selectedConversation?.id || null);

  // Remove auto-scroll behavior to maintain user position

  // Enviar mensagem usando o hook
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !profile?.user_id) return;

    // Check if user is premium
    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o plano premium para enviar mensagens",
        variant: "destructive",
      });
      return;
    }

    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage("");
    }
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Permitir re-selecionar o mesmo arquivo depois
    e.target.value = "";

    if (!file || !selectedConversation || !profile?.user_id) return;

    if (!isPremium) {
      toast({
        title: "Recurso Premium",
        description: "Assine o plano premium para enviar mídias no chat",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(true);

      const fileExt = file.name.split(".").pop();
      // Usar pasta do próprio usuário para respeitar políticas de RLS do bucket
      const fileName = `${profile.user_id}/chat/${selectedConversation.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("publicacoes")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("publicacoes")
        .getPublicUrl(fileName);

      const success = await sendMessage(publicUrl);
      if (!success) {
        throw new Error("Falha ao enviar mensagem de imagem");
      }

      toast({
        title: "Imagem enviada",
        description: "Sua imagem foi enviada com sucesso",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao enviar imagem no chat:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Selecionar conversa
  const selectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark messages as read when opening conversation
    setTimeout(() => markMessagesAsRead(), 100);
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
        {profile && !isPremium && (
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
              <Button className="bg-gradient-primary hover:opacity-90 text-white" onClick={() => navigate('/premium')}>
                <Crown className="w-4 h-4 mr-2" />
                Tornar-se Premium
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de Conversas */}
        <div className="space-y-2">
          {conversationsLoading ? (
            <Card className="glass backdrop-blur-xl border-primary/20">
              <CardContent className="p-8 text-center">
                <div className="text-white">Carregando conversas...</div>
              </CardContent>
            </Card>
          ) : conversations.length === 0 ? (
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
                         {/* Online status indicator */}
                         <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
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
      {/* Header do Chat - sticky/top */}
      <Card className="glass backdrop-blur-xl border-primary/20 flex-shrink-0 sticky top-0 z-20">
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
            
            <div 
              className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold shadow-[var(--shadow-glow)] cursor-pointer"
              onClick={() => setShowProfileModal(true)}
            >
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
              <h3 
                className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => setShowProfileModal(true)}
              >
                {selectedConversation.other_user?.display_name}
              </h3>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <p className="text-xs text-green-400 font-medium">Online</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth pb-32">
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
              {dayMessages.map((message) => {
                const isImageMessage =
                  /^https?:\/\//.test(message.content) &&
                  /(\.png|\.jpe?g|\.gif|\.webp)$/i.test(message.content.split("?")[0]);

                return (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === profile?.user_id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] animate-scale-in ${
                    message.sender_id === profile?.user_id
                      ? 'bg-gradient-to-r from-primary to-accent text-white rounded-l-2xl rounded-tr-2xl shadow-[0_4px_15px_rgba(139,69,255,0.3)]'
                      : 'bg-white/10 backdrop-blur-sm border border-white/20 text-foreground rounded-r-2xl rounded-tl-2xl shadow-[0_4px_15px_rgba(255,255,255,0.1)]'
                  } p-2 hover:shadow-lg transition-all duration-300`}>
                    {isImageMessage ? (
                      <img
                        src={message.content}
                        alt="Imagem da conversa"
                        className="rounded-2xl max-h-64 w-auto object-cover"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed px-2 py-2">{message.content}</p>
                    )}
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
              );
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input de mensagem fixo com botões */}
      <div className="fixed bottom-[60px] left-0 right-0 z-30 bg-background/95 backdrop-blur-xl border-t border-primary/20 p-4">
        <div className="max-w-md mx-auto">
          {!isPremium ? (
            <div className="flex items-center justify-center p-4 text-center">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Upgrade para Premium para enviar mensagens
                </span>
                <Button size="sm" className="bg-gradient-primary hover:opacity-90 text-white" onClick={() => navigate('/premium')}>
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-xl"
                onClick={() => toast({ title: 'Emojis', description: 'Seletor de emojis em breve', variant: 'default' })}
              >
                <Smile className="w-5 h-5" />
              </Button>
              <Input
                placeholder="Digite uma mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 glass border-primary/30 h-12 rounded-xl"
                disabled={sending}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelected}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-xl"
                onClick={() => !uploadingImage && fileInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </Button>
              <Button
                onClick={handleSendMessage}
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
        </div>
      </div>

      {/* Modal de Perfil - sem sair da conversa */}
      <AlertDialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedConversation.other_user?.display_name}</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-secondary flex items-center justify-center text-white font-bold">
                  {selectedConversation.other_user?.avatar_url ? (
                    <img src={selectedConversation.other_user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    selectedConversation.other_user?.display_name?.[0]?.toUpperCase()
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedConversation.other_user?.city || selectedConversation.other_user?.state ? (
                    <span>
                      {selectedConversation.other_user?.city}
                      {selectedConversation.other_user?.city && selectedConversation.other_user?.state && ", "}
                      {selectedConversation.other_user?.state}
                    </span>
                  ) : (
                    <span>Sem informações adicionais</span>
                  )}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              const otherUserId = selectedConversation.participant1_id === profile?.user_id 
                ? selectedConversation.participant2_id 
                : selectedConversation.participant1_id;
              navigate(`/profile/${otherUserId}`);
            }}>Ver perfil completo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
