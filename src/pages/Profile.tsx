
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useFriendships } from '@/hooks/useFriendships';
import { toast } from "@/hooks/use-toast"
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { TruncatedText } from "@/components/ui/truncated-text";
import { 
  User, 
  Mail, 
  Lock, 
  HelpCircle, 
  CreditCard, 
  Crown, 
  ArrowLeft,
  Edit,
  KeyRound,
  Copy,
  Check,
  AlertTriangle,
  MapPin,
  Calendar,
  Briefcase,
  Heart,
  Users,
  Target,
  Camera,
  MessageCircle,
  Settings,
  LogOut
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { BlurredMedia } from "@/components/ui/blurred-media";
import { useTheme } from "@/components/ThemeProvider"
import { TestimonialsManagement } from "@/components/Profile/TestimonialsManagement";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UserPost {
  id: string;
  descricao?: string;
  midia_url?: string;
  tipo_midia: string;
  created_at: string;
  curtidas_count: number;
  comentarios_count: number;
}

export default function Profile() {
  const { user, updatePassword, signOut } = useAuth();
  const { profile, isPremium, loading: profileLoading } = useProfile();
  const {
    friends,
    friendRequests,
    sentRequests,
    respondToFriendRequest,
  } = useFriendships();
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [friendshipsModalOpen, setFriendshipsModalOpen] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;
      
      try {
        // Fetch from publicacoes table instead of posts
        const { data, error } = await supabase
          .from('publicacoes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
        } else {
          setUserPosts(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [user]);

  useEffect(() => {
    setIsDarkTheme(theme === "dark");
  }, [theme]);

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleThemeToggle = () => {
    const newTheme = isDarkTheme ? "light" : "dark";
    setTheme(newTheme);
    setIsDarkTheme(!isDarkTheme);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmNewPassword) {
      setPasswordMatch(false);
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    setPasswordMatch(true);

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A nova senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Senha alterada com sucesso!",
      });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Erro",
        description: "Erro ao alterar a senha.",
        variant: "destructive",
      });
    }
  };

  const generatePassword = () => {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    setGeneratedPassword(retVal);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Erro",
        description: "Erro ao sair da conta.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/');
      toast({
        title: "Conta desconectada",
        description: "Você saiu da sua conta",
      })
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir a conta.",
        variant: "destructive",
      });
    }
  };

  const handleSubscriptionManagement = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de assinatura",
        variant: "destructive",
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const age = profile?.birth_date ? calculateAge(profile.birth_date) : null;
  const friendsCount = friends.length;
  const pendingRequestsCount = friendRequests.length;

  const handleFriendRequestAction = async (requestId: string, action: 'aceito' | 'recusado') => {
    setProcessingRequestId(`${requestId}-${action}`);
    const response = await respondToFriendRequest(requestId, action);

    if (response?.error) {
      toast({
        title: 'Erro',
        description: response.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: action === 'aceito' ? 'Amizade confirmada' : 'Convite atualizado',
        description:
          action === 'aceito'
            ? 'Agora vocês são amigos e isso aparecerá no seu perfil.'
            : 'Convite recusado com sucesso.',
      });
    }

    setProcessingRequestId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">      
      {/* Back and Logout Buttons */}
      <div className="fixed top-4 left-4 z-50">
        <Button 
          onClick={() => navigate('/home')}
          variant="ghost" 
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-full"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
          <span className="hidden sm:inline text-sm">Voltar</span>
        </Button>
      </div>

      <div className="fixed top-4 right-4 z-50">
        <Button 
          onClick={handleSignOut}
          variant="ghost" 
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-full"
        >
          <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
          <span className="hidden sm:inline text-sm">Sair</span>
        </Button>
      </div>

      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          
          {/* Profile Header */}
          <Card className="bg-glass backdrop-blur-md border-primary/20">
            <CardContent className="p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-primary overflow-hidden">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.display_name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl sm:text-4xl">
                        {profile?.display_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}

                  {/* Friends counter */}
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
                    <Users className="h-4 w-4 text-primary" />
                    <button
                      type="button"
                      className="hover:text-white transition-colors"
                      onClick={() => navigate('/profile/about?tab=friends')}
                    >
                      Amigos: {friendsCount}
                    </button>
                  </div>
                  </div>
                  {isPremium && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                      <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-4 mb-4">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">{profile?.display_name}</h1>
                    {isPremium && (
                      <Badge className="bg-gradient-primary text-white px-3 py-1 text-xs sm:text-sm">
                        PREMIUM
                      </Badge>
                    )}
                  </div>

                  {/* Removed detailed personal info (email, gender, location, profession, orientation, relationship status, bio) as requested */}
                </div>

                {profile?.bio && (
                  <TruncatedText text={profile.bio} maxLength={190} className="mt-4 text-center sm:text-left" />
                )}

                <div className="flex flex-col sm:flex-row gap-3 mt-6 items-center">
                  <Button 
                    onClick={() => navigate('/profile/edit')}
                    className="bg-gradient-primary hover:opacity-90 text-white w-full sm:w-auto"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                  </Button>
                </div>
                {profile.interests.map((interest, index) => (
                  <Badge 
                    key={index}
                    className="bg-primary/20 text-primary border border-primary/30"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            
          </CardContent>
        </Card>

      {/* Tabs Navigation */}
      <div className="w-full">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-nowrap sm:flex-wrap gap-2 bg-white/5 rounded-xl p-2 border border-white/10 overflow-x-auto scrollbar-thin">
            <NavLink to="/profile/about" className={({isActive}) => `px-4 py-2 whitespace-nowrap rounded-lg text-sm ${isActive ? 'bg-primary text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>Sobre</NavLink>
            <NavLink to="/profile/testimonials" className={({isActive}) => `px-4 py-2 whitespace-nowrap rounded-lg text-sm ${isActive ? 'bg-primary text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>Depoimentos</NavLink>
            <NavLink to="/profile/posts" className={({isActive}) => `px-4 py-2 whitespace-nowrap rounded-lg text-sm ${isActive ? 'bg-primary text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>Publicações</NavLink>
            <NavLink to="/profile/settings" className={({isActive}) => `px-4 py-2 whitespace-nowrap rounded-lg text-sm ${isActive ? 'bg-primary text-white' : 'text-white/80 hover:text-white hover:bg-white/10'}`}>Configurações</NavLink>
          </div>
          <Button
            onClick={() => setFriendshipsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20"
          >
            <Users className="h-4 w-4" />
            Gerenciar Amizades
            {pendingRequestsCount > 0 && (
              <Badge className="bg-primary text-white">{pendingRequestsCount}</Badge>
            )}
          </Button>
        </div>
      </div>

      <Card className="bg-white/5 border border-white/10 mt-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-white/80 text-sm">Amizades aceitas</p>
              <p className="text-3xl font-bold text-white">{friendsCount}</p>
              <p className="text-xs text-white/60">Este número aparece publicamente no seu perfil, assim como os depoimentos.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub-route content */}
      <div className="mt-4">
        <Outlet />
      </div>
    </div>

    <AlertDialog open={friendshipsModalOpen} onOpenChange={setFriendshipsModalOpen}>
      <AlertDialogContent className="max-w-2xl bg-background/95 backdrop-blur border-white/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white flex items-center gap-2">
            <Users className="h-4 w-4" />
            Suas amizades e convites
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/70">
            Aprove ou recuse convites recebidos, confira envios e visualize suas conexões confirmadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <section>
            <h3 className="text-sm font-semibold text-white mb-3">Convites recebidos ({friendRequests.length})</h3>
            {friendRequests.length === 0 ? (
              <p className="text-white/60 text-sm">Nenhum convite pendente.</p>
            ) : (
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-3 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                        {request.sender_profile?.avatar_url ? (
                          <img src={request.sender_profile.avatar_url} alt={request.sender_profile.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                            {request.sender_profile?.display_name?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{request.sender_profile?.display_name || 'Usuário'}</p>
                        <p className="text-xs text-white/60">Quer se conectar com você</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={processingRequestId === `${request.id}-recusado`}
                        onClick={() => handleFriendRequestAction(request.id, 'recusado')}
                      >
                        {processingRequestId === `${request.id}-recusado` ? '...' : 'Recusar'}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-gradient-primary text-white"
                        disabled={processingRequestId === `${request.id}-aceito`}
                        onClick={() => handleFriendRequestAction(request.id, 'aceito')}
                      >
                        {processingRequestId === `${request.id}-aceito` ? '...' : 'Aceitar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-white mb-3">Convites enviados ({sentRequests.length})</h3>
            {sentRequests.length === 0 ? (
              <p className="text-white/60 text-sm">Você ainda não enviou convites.</p>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-3 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                        {request.receiver_profile?.avatar_url ? (
                          <img src={request.receiver_profile.avatar_url} alt={request.receiver_profile.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                            {request.receiver_profile?.display_name?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{request.receiver_profile?.display_name || 'Usuário'}</p>
                        <p className="text-xs text-white/60 capitalize">Status: {request.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-semibold text-white mb-3">Amizades aceitas ({friends.length})</h3>
            {friends.length === 0 ? (
              <p className="text-white/60 text-sm">Você ainda não possui amizades aceitas.</p>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={`${friend.user_id}-${friend.amigo_id}`} className="flex items-center justify-between gap-3 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden">
                        {friend.friend_profile?.avatar_url ? (
                          <img src={friend.friend_profile.avatar_url} alt={friend.friend_profile.display_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white text-sm font-semibold">
                            {friend.friend_profile?.display_name?.[0] || 'U'}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{friend.friend_profile?.display_name || 'Usuário'}</p>
                        <p className="text-xs text-white/60">Visível para todos no seu perfil</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">Fechar</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
    </div>
  );
}
