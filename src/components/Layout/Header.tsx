import { Bell, Heart, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { NotificationButton } from "@/components/Layout/NotificationButton";
import { useState, useRef, useEffect } from "react";

type ProfileMenuAction = "profile" | "/profile/edit" | "/premium" | "/profile/settings" | "/logout";

type ProfileMenuItem =
  | { type: "divider" }
  | { type: "action"; label: string; action: ProfileMenuAction };

const profileMenuItems: ProfileMenuItem[] = [
  { type: "action", label: "👤 Meu Perfil", action: "profile" },
  { type: "divider" },
  { type: "action", label: "✏️ Editar perfil", action: "/profile/edit" },
  { type: "action", label: "⭐ Plano Premium", action: "/premium" },
  { type: "divider" },
  { type: "action", label: "⚙️ Configurações", action: "/profile/settings" },
  { type: "divider" },
  { type: "action", label: "🚪 Sair da conta", action: "/logout" },
];

export const Header = () => {
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleButtonClick = () => {
    if (!profile?.user_id) {
      navigate('/profile');
      return;
    }
    setIsMenuOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMenuItemClick = (item: ProfileMenuItem) => {
    if (item.type === "divider") return;
    switch (item.action) {
      case "profile":
        navigate(`/profile/view/${profile?.user_id}`);
        break;
      case "/logout":
        signOut();
        break;
      default:
        navigate(item.action);
        break;
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass backdrop-blur-xl border-b border-primary/20 shadow-[var(--shadow-glass)]">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        {/* Avatar/Perfil à esquerda */}
        <div className="relative" ref={menuRef}>
          <Button
            onClick={handleButtonClick}
            variant="ghost"
            size="icon"
            className="w-10 h-10 rounded-full bg-gradient-secondary hover:scale-110 transition-all duration-300 shadow-[var(--shadow-glow)] p-0 overflow-hidden relative z-10"
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full rounded-full object-cover"
                key={profile.avatar_url}
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </Button>
          {profile?.user_id && isMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-black/70 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl text-white text-sm space-y-2 p-3 z-20">
              {profileMenuItems.map((item, index) =>
                item.type === "divider" ? (
                  <div key={`divider-${index}`} className="border-t border-white/20 my-2" />
                ) : (
                  <button
                    key={item.label}
                    onClick={() => handleMenuItemClick(item)}
                    className="text-left w-full px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {item.label}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Logo central */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-white text-lg shadow-[var(--shadow-glow)]">
            S
          </div>
          <h1 className="text-xl font-bold text-gradient">
            Sensual
          </h1>
        </div>
        
        {/* Indicador Live Cam + Notificações à direita */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-purple-600/80 text-white text-[10px] font-semibold shadow-[0_0_12px_rgba(147,51,234,0.7)] uppercase tracking-wide hover:bg-purple-500/90 transition-colors"
            onClick={() => navigate('/live')}
          >
            <span className="w-2 h-2 rounded-full bg-white/90" />
            <span>Live cam</span>
          </button>
          <NotificationButton />
        </div>
      </div>
    </header>
  );
};