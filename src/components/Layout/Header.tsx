import { Bell, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl border-b border-primary/20 shadow-[var(--shadow-glass)]">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Avatar/Perfil à esquerda */}
        <Button
          onClick={() => navigate('/profile')}
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full bg-gradient-secondary hover:scale-110 transition-all duration-300 shadow-[var(--shadow-glow)] p-0"
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </Button>
        
        {/* Logo central */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-white text-lg shadow-[var(--shadow-glow)]">
            S
          </div>
          <h1 className="text-xl font-bold text-gradient">
            Sensual
          </h1>
        </div>
        
        {/* Notificações à direita */}
        <Button 
          variant="ghost" 
          size="icon"
          className="w-10 h-10 rounded-full glass border border-primary/20 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
        >
          <Bell className="w-5 h-5 text-foreground" />
          {/* Badge de notificação */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full text-xs font-bold text-white flex items-center justify-center shadow-[var(--shadow-glow)]">
            3
          </span>
        </Button>
      </div>
    </header>
  );
};