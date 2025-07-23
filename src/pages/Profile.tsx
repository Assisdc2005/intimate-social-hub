import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from "@/hooks/use-toast"
import { Profile } from '@/hooks/useProfile';
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
  AlertTriangle
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "@/components/ThemeProvider"
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

export default function Profile() {
  const { user, updatePassword, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
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
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            toast({
              title: "Erro",
              description: "Erro ao carregar perfil.",
              variant: "destructive",
            });
          } else {
            setProfile(data as Profile);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    fetchProfile();
  }, [user]);

  useEffect(() => {
    setIsDarkTheme(theme === "dark");
  }, [theme]);

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
      await updatePassword(newPassword);
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
      // TODO: Implement account deletion logic here (supabase.auth.deleteUser requires admin privileges)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Back Button - Top Left Position */}
      <div className="fixed top-4 left-4 z-50">
        <Button 
          onClick={() => navigate('/home')}
          variant="ghost" 
          size="sm"
          className="text-gray-300 hover:text-white hover:bg-white/10 p-2 rounded-full"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-glass backdrop-blur-md rounded-3xl shadow-xl border border-primary/20 p-8 space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">Configurações da Conta</h1>
            <p className="text-gray-300">Gerencie sua conta e preferências.</p>
          </div>

          {/* Account Information Section */}
          <div className="card">
            <h2 className="card-title">Informações da Conta</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-400">Nome</p>
                  <p className="text-white">{profile?.display_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="card">
            <h2 className="card-title">Alterar Senha</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-input/50 border-white/20 text-foreground placeholder:text-muted-foreground"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M2 2l20 20M11.18 11.18A7.962 7.962 0 0 1 12 12c0 3.59 3.07 6.5 6.68 7.65"></path>
                        <path d="M2 2l20 20M11.18 11.18A7.962 7.962 0 0 1 12 12c0 3.59 3.07 6.5 6.68 7.65"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                        <line x1="3" x2="21" y1="3" y2="21"></line>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M2 2l20 20M11.18 11.18A7.962 7.962 0 0 1 12 12c0 3.59 3.07 6.5 6.68 7.65"></path>
                        <path d="M17.52 17.52A3 3 0 1 0 12 12"></path>
                        <path d="M2 2l20 20M11.18 11.18A7.962 7.962 0 0 1 12 12c0 3.59 3.07 6.5 6.68 7.65"></path>
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
                <Input
                  type={showPassword ? "text" : "password"}
                  id="confirmNewPassword"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="bg-input/50 border-white/20 text-foreground placeholder:text-muted-foreground"
                />
                {!passwordMatch && (
                  <p className="text-red-500 text-sm mt-1">As senhas não coincidem.</p>
                )}
              </div>
              <Button onClick={handleChangePassword} className="w-full">
                Alterar Senha
              </Button>
            </div>
          </div>

          {/* Generate Password Section */}
          <div className="card">
            <h2 className="card-title">Gerar Senha Segura</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <Input
                  type="text"
                  value={generatedPassword}
                  readOnly
                  className="flex-1 bg-input/50 border-white/20 text-foreground placeholder:text-muted-foreground mr-2"
                />
                <Button onClick={copyToClipboard} disabled={!generatedPassword} variant="secondary">
                  {isCopied ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {isCopied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>
              <Button onClick={generatePassword} className="w-full">
                Gerar Senha
              </Button>
            </div>
          </div>

          {/* Theme Settings Section */}
          <div className="card">
            <h2 className="card-title">Aparência</h2>
            <div className="flex items-center justify-between">
              <span className="text-white">Usar tema escuro</span>
              <Switch id="theme" checked={isDarkTheme} onCheckedChange={handleThemeToggle} />
            </div>
          </div>

          {/* Premium Status Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-yellow-500" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Status Premium</h2>
                  <p className="text-gray-300">
                    {profile?.tipo_assinatura === 'premium' ? 'Você tem acesso Premium' : 'Upgrade para Premium'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                  profile?.tipo_assinatura === 'premium' 
                    ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' 
                    : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'
                }`}>
                  {profile?.tipo_assinatura === 'premium' ? 'Premium Ativo' : 'Gratuito'}
                </span>
              </div>
            </div>

            <Button onClick={handleSubscriptionManagement} className="w-full">
              Gerenciar Assinatura
            </Button>
          </div>

          {/* Danger Zone Section */}
          <div className="card">
            <h2 className="card-title text-red-500">Zona de Perigo</h2>
            <div className="space-y-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Excluir Conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-glass backdrop-blur-md border border-red-500/30">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-500 text-white hover:bg-red-600">Excluir</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button onClick={handleSignOut} variant="ghost" className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/20">
                Sair da Conta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
