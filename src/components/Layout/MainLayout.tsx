
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { InstitutionalFooter } from "./InstitutionalFooter";
import { HomeTab } from "../Tabs/HomeTab";
import { DiscoverTab } from "../Tabs/DiscoverTab";
import { MessagesTabComplete } from "../Tabs/MessagesTabComplete";
import { PremiumTab } from "../Tabs/PremiumTab";
import { ProfileTab } from "../Tabs/ProfileTab";
import { EditProfileTab } from "../Tabs/EditProfileTab";
import { PromotionalPopup } from "../Modals/PromotionalPopup";
import { useProfile } from "@/hooks/useProfile";

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const isVisitor = !profile?.user_id;
  
  // Set active tab based on current route
  const getActiveTabFromPath = () => {
    const path = location.pathname;
    if (path === '/discover') return 'discover';
    if (path === '/messages') return 'messages';
    if (path === '/premium') return 'premium';
    if (path === '/profile') return 'profile';
    if (path === '/profile/edit') return 'edit';
    return 'home';
  };
  
  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
  
  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  const renderActiveTab = () => {
    const visitorGateContent = (
      <div className="glass rounded-2xl border border-primary/20 px-6 py-8 text-center space-y-4">
        <p className="text-lg font-semibold text-white">
          Você precisa criar uma conta para acessar esta aba e marcar encontros.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 rounded-lg bg-gradient-primary text-white text-sm font-semibold"
          >
            Criar conta
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg border border-white/30 text-white text-sm font-semibold"
          >
            Entrar
          </button>
        </div>
        <p className="text-xs text-foreground/70">
          A navegação continua funcionando. Faça login para liberar o conteúdo completo.
        </p>
      </div>
    );

    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'discover':
        return isVisitor ? visitorGateContent : <DiscoverTab />;
      case 'messages':
        return isVisitor ? visitorGateContent : <MessagesTabComplete />;
      case 'premium':
        return isVisitor ? visitorGateContent : <PremiumTab />;
      case 'profile':
        return isVisitor ? visitorGateContent : <ProfileTab />;
      case 'edit':
        return <EditProfileTab />;
      default:
        return <HomeTab />;
    }
  };

  const handleTabChange = (tab: string) => {
    // Map tab names to routes
    const routes = {
      home: '/home',
      discover: '/discover',
      messages: '/messages',
      premium: '/premium',
      profile: '/profile'
    };
    
    const route = routes[tab as keyof typeof routes] || '/home';
    navigate(route);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <Header />
      
      {/* Content area with proper spacing for fixed header and bottom nav */}
      <main className="pt-20 pb-20 flex-1">
        <div className="max-w-md mx-auto px-4">
          {renderActiveTab()}
        </div>
      </main>
      
      {/* Footer */}
      <InstitutionalFooter />
      
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {/* Popup promocional */}
      <PromotionalPopup />
    </div>
  );
};
