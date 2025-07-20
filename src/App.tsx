
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { CompleteProfile } from "./pages/CompleteProfile";
import { Profile } from "./pages/Profile";
import { UserProfile } from "./pages/UserProfile";
import { Landing } from "./pages/Landing";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { AuthProvider } from "./hooks/useAuth";
import { About } from "./pages/About";
import { Terms } from "./pages/Terms";
import { Privacy } from "./pages/Privacy";
import { Refund } from "./pages/Refund";
import { Help } from "./pages/Help";

const queryClient = new QueryClient();

function AuthenticatedApp() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Rota raiz - SEMPRE redireciona para /auth se não autenticado */}
      <Route 
        path="/" 
        element={<Navigate to="/auth" replace />}
      />
      
      {/* Página de autenticação - sempre acessível */}
      <Route 
        path="/auth" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/complete-profile" replace />
            )
          ) : (
            <Auth />
          )
        } 
      />
      
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
      />
      
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
        path="/profile/:userId" 
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
      <Route path="/sobre" element={<About />} />
      <Route path="/termos" element={<Terms />} />
      <Route path="/privacidade" element={<Privacy />} />
      <Route path="/reembolso" element={<Refund />} />
      <Route path="/ajuda" element={<Help />} />
      
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
          <AuthenticatedApp />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
