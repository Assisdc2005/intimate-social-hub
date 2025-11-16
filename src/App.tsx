  
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
const Index = React.lazy(() => import("./pages/Index"));
const Profile = React.lazy(() => import("./pages/Profile"));
const AboutTab = React.lazy(() => import("./pages/profile-tabs/AboutTab"));
const TestimonialsTab = React.lazy(() => import("./pages/profile-tabs/TestimonialsTab"));
const PostsTab = React.lazy(() => import("./pages/profile-tabs/PostsTab"));
const SettingsTab = React.lazy(() => import("./pages/profile-tabs/SettingsTab"));
const UserProfile = React.lazy(() => import("./pages/UserProfile").then(m => ({ default: (m as any).default ?? (m as any).UserProfile })));
const LandingPage = React.lazy(() => import("./pages/LandingPage").then(m => ({ default: (m as any).default ?? (m as any).LandingPage })));
const NotFound = React.lazy(() => import("./pages/NotFound").then(m => ({ default: (m as any).default ?? (m as any).NotFound })));
const Login = React.lazy(() => import("./pages/Login").then(m => ({ default: (m as any).default ?? (m as any).Login })));
const Signup = React.lazy(() => import("./pages/Signup").then(m => ({ default: (m as any).default ?? (m as any).Signup })));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword").then(m => ({ default: (m as any).default ?? (m as any).ResetPassword })));
const CompleteProfile = React.lazy(() => import("./pages/CompleteProfile").then(m => ({ default: (m as any).default ?? (m as any).CompleteProfile })));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard").then(m => ({ default: (m as any).default ?? (m as any).AdminDashboard })));
import { useAuth, AuthProvider } from "./hooks/useAuth";
import { FakeOnlineProvider } from "./hooks/useFakeOnline";
import { useProfile, ProfileProvider } from "./hooks/useProfile";
const About = React.lazy(() => import("./pages/About").then(m => ({ default: (m as any).default ?? (m as any).About })));
const Terms = React.lazy(() => import("./pages/Terms").then(m => ({ default: (m as any).default ?? (m as any).Terms })));
const Privacy = React.lazy(() => import("./pages/Privacy").then(m => ({ default: (m as any).default ?? (m as any).Privacy })));
const Refund = React.lazy(() => import("./pages/Refund").then(m => ({ default: (m as any).default ?? (m as any).Refund })));
const Help = React.lazy(() => import("./pages/Help").then(m => ({ default: (m as any).default ?? (m as any).Help })));
const Consent = React.lazy(() => import("./pages/Consent").then(m => ({ default: (m as any).default ?? (m as any).Consent })));

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

  // Helper: compute age and restrict under 18 from accessing /complete-profile
  const isUnder18 = React.useMemo(() => {
    const dob = profile?.birth_date;
    // Se não houver data de nascimento ainda, não bloqueia.
    // Isso permite que o usuário acesse /complete-profile justamente para preencher esses dados.
    if (!dob) return false;
    const b = new Date(dob);
    // Se a data for inválida por algum motivo, também não bloqueia aqui.
    if (isNaN(b.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - b.getFullYear();
    const m = today.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < b.getDate())) age--;
    return age < 18;
  }, [profile?.birth_date]);

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-white text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div className="min-h-screen bg-gradient-hero flex items-center justify-center"><div className="text-white text-lg">Carregando...</div></div>}>
      <Routes>
      {/* Rota raiz - Landing Page para todos os visitantes */}
      <Route 
        path="/" 
        element={<LandingPage />}
      />
      
      {/* Páginas de autenticação - sempre acessíveis */}
      <Route 
        path="/login" 
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <Login />
          )
        } 
      />
      
      <Route 
        path="/signup" 
        element={
          user ? (
            <Navigate to="/home" replace />
          ) : (
            <Signup />
          )
        } 
      />
      
      {/* Redirect antigo /auth para /login */}
      <Route path="/auth" element={<Navigate to="/login" replace />} />
      
      {/* Página de reset de senha - sempre acessível */}
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Página de completar perfil - APENAS para usuários logados com perfil incompleto */}
      <Route 
        path="/complete-profile" 
        element={
          user ? (
            profile?.profile_completed ? (
              <Navigate to="/home" replace />
            ) : isUnder18 ? (
              <Navigate to="/" replace />
            ) : (
              <CompleteProfile />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
      
      {/* Todas as rotas protegidas - redirecionam para /login se não autenticado */}
      <Route 
        path="/home" 
        element={
          user ? (
            <Index />
          ) : (
            <Navigate to="/login" replace />
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
            <Navigate to="/login" replace />
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
            <Navigate to="/login" replace />
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
            <Navigate to="/login" replace />
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
            <Navigate to="/login" replace />
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
            <Navigate to="/login" replace />
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
            <Navigate to="/login" replace />
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
      
      {/* Rota administrativa - apenas para admins */}
      <Route path="/adm" element={<AdminDashboard />} />
      
      <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
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
            <FakeOnlineProvider>
              <AuthenticatedApp />
            </FakeOnlineProvider>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
