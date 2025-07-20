import { MessageCircle, Search, Phone, Video, MoreVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const MessagesTab = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock data para conversas
  const conversations = [
    { 
      id: 1, 
      name: "Isabella", 
      lastMessage: "Oi! Como você está?", 
      time: "há 5 min", 
      unread: 2, 
      online: true,
      location: "São Paulo, SP"
    },
    { 
      id: 2, 
      name: "Gabriel", 
      lastMessage: "Que foto linda! 😍", 
      time: "há 1 hora", 
      unread: 0, 
      online: true,
      location: "Rio de Janeiro, RJ"
    },
    { 
      id: 3, 
      name: "Sophia", 
      lastMessage: "Obrigada pela curtida ❤️", 
      time: "há 3 horas", 
      unread: 1, 
      online: false,
      location: "Curitiba, PR"
    },
    { 
      id: 4, 
      name: "Ricardo", 
      lastMessage: "Vamos nos conhecer melhor?", 
      time: "ontem", 
      unread: 0, 
      online: false,
      location: "Salvador, BA"
    },
  ];

  const isPremium = false; // Mock - usuário não é premium

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header com busca */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-display font-bold text-gradient">Mensagens</h2>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-input/50 border-white/20 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Restrição para usuários não-premium */}
      {!isPremium && (
        <div className="glass rounded-2xl p-6 text-center border border-accent/20">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gradient mb-2">
            Desbloqueie o Chat Premium
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Converse sem limites com todas as pessoas da plataforma
          </p>
          <Button className="btn-premium w-full">
            Tornar-se Premium
          </Button>
        </div>
      )}

      {/* Lista de conversas */}
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="card-premium hover:scale-[1.02] transition-all duration-300 cursor-pointer">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold text-lg shadow-glow">
                  {conversation.name[0]}
                </div>
                
                {/* Status online */}
                {conversation.online && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                )}
              </div>

              {/* Informações da conversa */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold truncate">{conversation.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{conversation.time}</span>
                    {conversation.unread > 0 && (
                      <span className="w-5 h-5 bg-accent rounded-full text-xs font-bold text-white flex items-center justify-center">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground truncate mb-1">
                  {conversation.lastMessage}
                </p>
                
                <p className="text-xs text-muted-foreground/70">{conversation.location}</p>
              </div>

              {/* Botões de ação */}
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/10 hover:bg-white/20">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="w-8 h-8 p-0 bg-white/10 hover:bg-white/20">
                  <Video className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chat em desenvolvimento */}
      <div className="glass rounded-2xl p-6 text-center">
        <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <h3 className="font-semibold mb-2">Chat em Tempo Real</h3>
        <p className="text-sm text-muted-foreground">
          Sistema de mensagens em desenvolvimento. Em breve você poderá conversar em tempo real!
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-primary">{conversations.length}</div>
          <div className="text-xs text-muted-foreground">Conversas</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-accent">
            {conversations.reduce((sum, conv) => sum + conv.unread, 0)}
          </div>
          <div className="text-xs text-muted-foreground">Não lidas</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {conversations.filter(conv => conv.online).length}
          </div>
          <div className="text-xs text-muted-foreground">Online</div>
        </div>
      </div>
    </div>
  );
};