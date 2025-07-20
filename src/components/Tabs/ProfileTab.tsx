import { User, Settings, LogOut, Edit, Crown, MapPin, Calendar, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ProfileTab = () => {
  const isPremium = false;
  
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header do Perfil */}
      <div className="card-premium text-center">
        <div className="relative inline-block mb-4">
          <div className="w-24 h-24 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold text-3xl shadow-glow">
            U
          </div>
          {isPremium && (
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-glow">
              <Crown className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-1">Usuário Demo</h2>
        <p className="text-muted-foreground mb-4 flex items-center justify-center gap-1">
          <MapPin className="w-4 h-4" />
          São Paulo, SP
        </p>
        
        <div className="flex justify-center gap-4 text-sm">
          <div className="text-center">
            <div className="font-bold text-lg text-primary">12</div>
            <div className="text-muted-foreground">Curtidas</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-accent">8</div>
            <div className="text-muted-foreground">Matches</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg text-secondary">24</div>
            <div className="text-muted-foreground">Visitas</div>
          </div>
        </div>
      </div>

      {/* Ações do Perfil */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20">
          <Edit className="w-4 h-4 mr-2" />
          Editar Perfil
        </Button>
        <Button variant="outline" className="border-white/20 bg-white/10 hover:bg-white/20">
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </Button>
      </div>

      {/* Status Premium */}
      {!isPremium && (
        <div className="glass rounded-2xl p-4 border border-accent/20">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-accent" />
            <div className="flex-1">
              <h3 className="font-semibold">Torne-se Premium</h3>
              <p className="text-sm text-muted-foreground">Desbloqueie recursos exclusivos</p>
            </div>
            <Button size="sm" className="btn-premium">
              Upgrade
            </Button>
          </div>
        </div>
      )}

      {/* Menu de Opções */}
      <div className="space-y-2">
        <Button variant="ghost" className="w-full justify-start text-left hover:bg-white/10">
          <Heart className="w-5 h-5 mr-3" />
          Quem curtiu meu perfil
        </Button>
        <Button variant="ghost" className="w-full justify-start text-left hover:bg-white/10">
          <User className="w-5 h-5 mr-3" />
          Quem visitou meu perfil
        </Button>
        <Button variant="ghost" className="w-full justify-start text-left hover:bg-white/10">
          <Settings className="w-5 h-5 mr-3" />
          Configurações da conta
        </Button>
      </div>

      {/* Logout */}
      <Button variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10">
        <LogOut className="w-4 h-4 mr-2" />
        Sair da conta
      </Button>
    </div>
  );
};