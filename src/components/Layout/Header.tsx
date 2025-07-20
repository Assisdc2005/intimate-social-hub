import { Bell, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-primary backdrop-blur-md border-b border-white/10">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Avatar à esquerda */}
        <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center shadow-glow">
          <Heart className="w-5 h-5 text-white" />
        </div>
        
        {/* Logo central */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center font-bold text-white text-lg shadow-glow">
            S
          </div>
          <h1 className="text-xl font-display font-bold text-gradient">
            Sensual
          </h1>
        </div>
        
        {/* Notificações à direita */}
        <Button 
          variant="ghost" 
          size="icon"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110"
        >
          <Bell className="w-5 h-5 text-white" />
          {/* Badge de notificação */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full text-xs font-bold text-white flex items-center justify-center shadow-glow">
            3
          </span>
        </Button>
      </div>
    </header>
  );
};