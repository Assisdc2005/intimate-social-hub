import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import { Auth } from "./pages/Auth";
import { CompleteProfile } from "./pages/CompleteProfile";
import { Profile } from "./pages/Profile";
import { Landing } from "./pages/Landing";
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
            <Landing />
          )
        } 
      />
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
            <Navigate to="/" replace />
          )
        } 
      />
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/home" replace /> : <Auth />} 
      />
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
            <Navigate to="/" replace />
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
            <Navigate to="/" replace />
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
            <Navigate to="/" replace />
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
            <Navigate to="/" replace />
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
            <Navigate to="/" replace />
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
            <Navigate to="/" replace />
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
