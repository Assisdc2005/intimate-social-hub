import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Crown, Trash2, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SettingsTab = () => {
  const { isPremium, profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setIsDarkTheme(theme === 'dark');
  }, [theme]);

  const handleThemeToggle = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark';
    setTheme(newTheme);
    setIsDarkTheme(!isDarkTheme);
  };

  const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
  const daysLeft = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  const handleUpgrade = () => {
    navigate('/plans');
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      const { data, error } = await supabase.functions.invoke('delete-account', { body: {} });
      if (error) throw error;
      await signOut();
      window.location.href = '/';
    } catch (e: any) {
      console.error('Erro ao excluir conta:', e);
      toast({
        title: 'Não foi possível excluir a conta',
        description: 'Verifique se a função delete-account está implantada no Supabase.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const handleSubscriptionManagement = async () => {
    try {
      setOpeningPortal(true);
      const { data, error } = await supabase.functions.invoke('customer-portal', { body: {} });
      if (error || !data?.url) {
        throw error || new Error('Portal indisponível');
      }
      window.open(data.url, '_blank');
    } catch (e: any) {
      console.error('Error opening customer portal:', e);
      toast({
        title: 'Não foi possível abrir o portal',
        description: 'Verifique se a função customer-portal está implantada no Supabase e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setOpeningPortal(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardHeader>
          <CardTitle className="text-white">Configurações da Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da assinatura */}
          <div className="p-4 bg-gradient-primary/20 rounded-lg border border-primary/30 space-y-3">
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <div>
                <p className="text-white font-medium">
                  Status da Assinatura: {isPremium ? 'Premium 🔥' : 'Conta Gratuita'}
                </p>
                {isPremium && (
                  <p className="text-sm text-gray-300">
                    {expiresAt
                      ? daysLeft !== null && daysLeft >= 0
                        ? `Expira em ${daysLeft} dia${daysLeft === 1 ? '' : 's'} (${expiresAt.toLocaleDateString('pt-BR')})`
                        : `Expirada em ${expiresAt.toLocaleDateString('pt-BR')}`
                      : 'Ativo'}
                  </p>
                )}
              </div>
            </div>

            {!isPremium ? (
              <>
                <ul className="list-disc list-inside text-gray-200 text-sm space-y-1">
                  <li>1 publicação máxima</li>
                  <li>Envio limitado de mensagens</li>
                  <li>Curtidas restritas</li>
                  <li>Visualização parcial de perfis</li>
                </ul>
                <Button onClick={handleUpgrade} className="bg-gradient-primary text-white">
                  Atualizar para Premium
                </Button>
              </>
            ) : (
              <>
                <ul className="list-disc list-inside text-gray-200 text-sm space-y-1">
                  <li>Publicações ilimitadas</li>
                  <li>Mensagens e curtidas sem restrição</li>
                  <li>Destaque nos resultados de busca</li>
                  <li>Visualização completa de perfis</li>
                </ul>
                <Button
                  onClick={handleSubscriptionManagement}
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/20"
                  disabled={openingPortal}
                >
                  {openingPortal ? 'Abrindo...' : 'Gerenciar Assinatura'}
                </Button>
              </>
            )}
          </div>

          {/* Ações de conta */}
          <div className="space-y-3">
            <Button
              onClick={() => signOut()}
              variant="secondary"
              className="w-full bg-white/10 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>

            <Button
              onClick={() => setConfirmOpen(true)}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir minha conta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir minha conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados, publicações e mensagens serão permanentemente apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsTab;
