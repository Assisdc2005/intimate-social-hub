import { Home, Search, MessageCircle, Crown, User } from "lucide-react";
import { useState } from "react";
import { useConversations } from "@/hooks/useConversations";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNavigation = ({ activeTab, onTabChange }: BottomNavigationProps) => {
  const { conversations } = useConversations();
  
  // Calculate total unread messages
  const totalUnreadMessages = conversations.reduce((total, conv) => total + (conv.unread_count || 0), 0);

  const tabs = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'discover', icon: Search, label: 'Descobrir' },
    { id: 'messages', icon: MessageCircle, label: 'Mensagens', badge: totalUnreadMessages > 0 ? totalUnreadMessages : undefined },
    { id: 'premium', icon: Crown, label: 'Premium' },
    { id: 'profile', icon: User, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-secondary backdrop-blur-lg border-t border-white/10">
      <div className="max-w-md mx-auto px-2 py-2">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex flex-col items-center justify-center p-2 rounded-2xl min-w-[60px] h-14 transition-all duration-300
                  ${isActive 
                    ? 'bg-white/20 text-white shadow-glow scale-105' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'mb-1' : 'mb-0.5'}`} />
                <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                  {tab.label}
                </span>
                
                {/* Badge para mensagens */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full text-xs font-bold text-white flex items-center justify-center shadow-glow">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
                
                {/* Indicador ativo */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-accent rounded-full shadow-glow" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};