
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from "@/hooks/use-toast"
import { useNavigate } from 'react-router-dom';
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
  LogOut,
  X
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
import { PublicacaoCarrossel } from "@/components/Feed/PublicacaoCarrossel";
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
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
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
      navigate('/login');
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
      navigate('/login');
      toast({
        title: "Sucesso",
        description: "Conta excluída com sucesso!",
      });
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

  const handleDeleteUserPost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta publicação?')) {
      return;
    }

    try {
      // First delete associated media from publicacao_midias
      await supabase
        .from('publicacao_midias')
        .delete()
        .eq('publicacao_id', postId);

      // Then delete the publication
      const { error } = await supabase
        .from('publicacoes')
        .delete()
        .eq('id', postId)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Update local state
      setUserPosts(prev => prev.filter(pub => pub.id !== postId));

      toast({
        title: "Publicação excluída",
        description: "Sua publicação foi excluída com sucesso",
      });
    } catch (error) {
      console.error('Erro ao excluir publicação:', error);
      toast({
        title: "Erro",
        description: "Erro ao excluir publicação",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">      
      {/* Back Button */}
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-gray-300 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <span>{user?.email}</span>
                    </div>
                    
                    {age && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>{age} anos</span>
                      </div>
                    )}
                    
                    {profile?.gender && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="capitalize">{profile.gender}</span>
                      </div>
                    )}
                    
                    {(profile?.city || profile?.state) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{profile.city}{profile.city && profile.state && ', '}{profile.state}</span>
                      </div>
                    )}
                    
                    {profile?.profession && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <span>{profile.profession}</span>
                      </div>
                    )}
                    
                    {profile?.sexual_orientation && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-primary" />
                        <span className="capitalize">{profile.sexual_orientation}</span>
                      </div>
                    )}
                    
                    {profile?.relationship_status && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="capitalize">{profile.relationship_status}</span>
                      </div>
                    )}
                    
                    {profile?.looking_for && (
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-primary" />
                        <span>{profile.looking_for}</span>
                      </div>
                    )}
                  </div>

                  {profile?.bio && (
                    <p className="text-gray-300 mt-4 leading-relaxed text-sm sm:text-base text-center sm:text-left">{profile.bio}</p>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Profile Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            
            {/* Physical Info */}
            {(profile?.height || profile?.weight || profile?.body_type || profile?.ethnicity) && (
              <Card className="bg-glass backdrop-blur-md border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Informações Físicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 sm:p-6">
                  {profile?.height && (
                    <div>
                      <p className="text-xs sm:text-sm text-gray-400">Altura</p>
                      <p className="text-white text-sm sm:text-base">{profile.height} cm</p>
                    </div>
                  )}
                  {profile?.weight && (
                    <div>
                      <p className="text-sm text-gray-400">Peso</p>
                      <p className="text-white">{profile.weight} kg</p>
                    </div>
                  )}
                  {profile?.body_type && (
                    <div>
                      <p className="text-sm text-gray-400">Tipo Físico</p>
                      <p className="text-white capitalize">{profile.body_type}</p>
                    </div>
                  )}
                  {profile?.ethnicity && (
                    <div>
                      <p className="text-sm text-gray-400">Etnia</p>
                      <p className="text-white capitalize">{profile.ethnicity}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Lifestyle Info */}
            {(profile?.smokes !== undefined || profile?.drinks !== undefined) && (
              <Card className="bg-glass backdrop-blur-md border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">Estilo de Vida</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile?.smokes !== undefined && (
                    <div>
                      <p className="text-sm text-gray-400">Fuma</p>
                      <p className="text-white">{profile.smokes ? 'Sim' : 'Não'}</p>
                    </div>
                  )}
                  {profile?.drinks !== undefined && (
                    <div>
                      <p className="text-sm text-gray-400">Bebe</p>
                      <p className="text-white">{profile.drinks ? 'Sim' : 'Não'}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Interests */}
          {profile?.interests && profile.interests.length > 0 && (
            <Card className="bg-glass backdrop-blur-md border-primary/20">
              <CardHeader>
                <CardTitle className="text-white">Interesses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
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
          )}

          {/* Testimonials Management */}
          <TestimonialsManagement />

          {/* Posts Section */}
          <Card className="bg-glass backdrop-blur-md border-primary/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Minhas Publicações ({userPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Você ainda não fez nenhuma publicação</p>
                  <Button 
                    onClick={() => navigate('/home')}
                    className="mt-4 bg-gradient-primary hover:opacity-90 text-white"
                  >
                    Fazer primeira publicação
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {userPosts.map((post) => (
                    <Card key={post.id} className="bg-white/5 border-white/10">
                      <CardContent className="p-3 sm:p-4 relative">
                        {/* Botão de excluir */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteUserPost(post.id)}
                          className="absolute top-2 right-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1 h-6 w-6"
                          title="Excluir publicação"
                        >
                          <X className="h-3 w-3" />
                        </Button>

                        {/* Mídia única */}
                        {post.midia_url && post.tipo_midia !== 'multipla' && (
                          <div className="aspect-square rounded-lg overflow-hidden mb-3">
                            <BlurredMedia
                              src={post.midia_url}
                              alt="Post"
                              type={post.tipo_midia === 'video' ? 'video' : 'image'}
                              isPremium={isPremium}
                              className="w-full h-full"
                            />
                          </div>
                        )}

                        {/* Múltiplas mídias */}
                        {post.tipo_midia === 'multipla' && (
                          <div className="mb-3">
                            <PublicacaoCarrossel publicacaoId={post.id} isPremium={isPremium} />
                          </div>
                        )}
                        
                        {post.descricao && (
                          <p className="text-white mb-3 text-xs sm:text-sm line-clamp-3">{post.descricao}</p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-1">
                              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
                              {post.curtidas_count}
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              {post.comentarios_count}
                            </div>
                          </div>
                          <span className="text-xs">
                            {new Date(post.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-glass backdrop-blur-md border-primary/20">
            <CardHeader>
              <CardTitle className="text-white">Configurações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Premium Status */}
              <div className="flex items-center justify-between p-4 bg-gradient-primary/20 rounded-lg border border-primary/30">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-white font-medium">Status da Assinatura</p>
                    <p className="text-sm text-gray-300">
                      {isPremium ? 'Premium Ativo' : 'Conta Gratuita'}
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleSubscriptionManagement}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/20"
                >
                  Gerenciar
                </Button>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-white">Tema escuro</span>
                <Switch checked={isDarkTheme} onCheckedChange={handleThemeToggle} />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/profile/edit')}
                  variant="outline" 
                  className="w-full border-primary/30 text-primary hover:bg-primary/20"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
                
                <Button 
                  onClick={handleSignOut}
                  variant="ghost" 
                  className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Conta
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
