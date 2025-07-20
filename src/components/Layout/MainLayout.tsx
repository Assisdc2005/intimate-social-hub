import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { HomeTab } from "../Tabs/HomeTabWithDB";
import { DiscoverTab } from "../Tabs/DiscoverTabWithDB";
import { MessagesTabComplete } from "../Tabs/MessagesTabComplete";
import { PremiumTab } from "../Tabs/PremiumTab";
import { ProfileTab } from "../Tabs/ProfileTab";
import { EditProfileTab } from "../Tabs/EditProfileTab";

export const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'discover':
        return <DiscoverTab />;
      case 'messages':
        return <MessagesTabComplete />;
      case 'premium':
        return <PremiumTab />;
      case 'profile':
        return <ProfileTab />;
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
    <div className="min-h-screen bg-gradient-hero">
      <Header />
      
      {/* Content area with proper spacing for fixed header and bottom nav */}
      <main className="pt-20 pb-20 min-h-screen">
        <div className="max-w-md mx-auto px-4">
          {renderActiveTab()}
        </div>
      </main>
      
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
};