  
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { ResetPassword } from "./pages/ResetPassword";
import { CompleteProfile } from "./pages/CompleteProfile";
import Profile from "./pages/Profile";
import AboutTab from "./pages/profile-tabs/AboutTab";
import TestimonialsTab from "./pages/profile-tabs/TestimonialsTab";
import PostsTab from "./pages/profile-tabs/PostsTab";
import SettingsTab from "./pages/profile-tabs/SettingsTab";
import { UserProfile } from "./pages/UserProfile";
import { LandingPage } from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { useProfile, ProfileProvider } from "./hooks/useProfile";
import { AuthProvider } from "./hooks/useAuth";
import { About } from "./pages/About";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";
import { Refund } from "./pages/Refund";
import { Help } from "./pages/Help";
import Consent from "./pages/Consent";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  // Ensure scroll resets to top on every route change
  // This addresses UX requirement without altering layout or theme
  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  // Home wrapper: shows Home immediately, then redirects to Complete Profile after 10s if needed
  const HomeWithDelay = () => {
    const navigate = useNavigate();
    React.useEffect(() => {
      if (user && !profile?.profile_completed) {
        const t = window.setTimeout(() => {
          navigate("/complete-profile", { replace: true });
        }, 10000);
        return () => window.clearTimeout(t);
      }
    }, [user, profile?.profile_completed, navigate]);
    return <Index />;
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rota raiz - Landing Page para todos os visitantes */}
      <Route 
        path="/" 
        element={<LandingPage />}
      />
      
      {/* Página de autenticação - sempre acessível */}
      <Route 
        path="/auth" 
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <Auth />
          )
        } 
      />
      
      {/* Página de reset de senha - sempre acessível */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Página de completar perfil - APENAS para usuários logados com perfil incompleto */}
      <Route 
        path="/complete-profile" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Navigate to="/home" replace />
            ) : (
              <CompleteProfile />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      {/* Todas as rotas protegidas - redirecionam para /auth se não autenticado */}
      <Route 
        path="/home" 
        element={
          user ? (
            <HomeWithDelay />
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      <Route 
        path="/profile" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Profile />
            ) : (
              <Navigate to="/complete-profile" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        }
      >
        <Route index element={<Navigate to="about" replace />} />
        <Route path="about" element={<AboutTab />} />
        <Route path="testimonials" element={<TestimonialsTab />} />
        <Route path="posts" element={<PostsTab />} />
        <Route path="settings" element={<SettingsTab />} />
      </Route>
      
      <Route 
        path="/discover" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Index />
            ) : (
              <Navigate to="/complete-profile" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      <Route 
        path="/messages" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Index />
            ) : (
              <Navigate to="/complete-profile" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      <Route 
        path="/premium" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Index />
            ) : (
              <Navigate to="/complete-profile" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      <Route 
        path="/profile/edit" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Index />
            ) : (
              <Navigate to="/complete-profile" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />
      
      <Route 
        path="/profile/view/:userId" 
        element={
          user ? (
            profile?.profile_completed ? (
              <UserProfile />
            ) : (
              <Navigate to="/complete-profile" replace />
            )
          ) : (
            <Navigate to="/auth" replace />
          )
        } 
      />

      {/* Rotas institucionais - acessíveis para todos */}
      <Route path="/about" element={<About />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/refund" element={<Refund />} />
      <Route path="/help" element={<Help />} />
      <Route path="/consent" element={<Consent />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <AuthenticatedApp />
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
