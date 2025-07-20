import { useState } from "react";
import { Header } from "./Header";
import { BottomNavigation } from "./BottomNavigation";
import { HomeTab } from "../Tabs/HomeTabWithDB";
import { DiscoverTab } from "../Tabs/DiscoverTabWithDB";
import { MessagesTab } from "../Tabs/MessagesTab";
import { PremiumTab } from "../Tabs/PremiumTab";
import { ProfileTab } from "../Tabs/ProfileTab";

export const MainLayout = () => {
  const [activeTab, setActiveTab] = useState('home');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'discover':
        return <DiscoverTab />;
      case 'messages':
        return <MessagesTab />;
      case 'premium':
        return <PremiumTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <HomeTab />;
    }
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
      
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};