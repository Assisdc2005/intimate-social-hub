import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { CompleteProfile } from "./pages/CompleteProfile";
import { Profile } from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { useProfile } from "./hooks/useProfile";
import { AuthProvider } from "./hooks/useAuth";

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
      <Route 
        path="/" 
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
        path="/auth" 
        element={user ? <Navigate to="/" replace /> : <Auth />} 
      />
      <Route 
        path="/complete-profile" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Navigate to="/" replace />
            ) : (
              <CompleteProfile />
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
