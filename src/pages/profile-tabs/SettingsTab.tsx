import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Crown, Trash2, LogOut, Mail, Lock, Bell, HelpCircle, Info, History, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
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
  const { user, signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [currentPasswordForEmail, setCurrentPasswordForEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [currentPasswordForPassword, setCurrentPasswordForPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [notificationPrefs, setNotificationPrefs] = useState({
    messages: true,
    likes: true,
    comments: true,
    matches: true,
  });

  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSending, setContactSending] = useState(false);

  const [subscriptionHistory, setSubscriptionHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    setIsDarkTheme(theme === 'dark');
  }, [theme]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = localStorage.getItem(`notification_prefs_${user.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        setNotificationPrefs((prev) => ({
          messages: typeof parsed.messages === 'boolean' ? parsed.messages : prev.messages,
          likes: typeof parsed.likes === 'boolean' ? parsed.likes : prev.likes,
          comments: typeof parsed.comments === 'boolean' ? parsed.comments : prev.comments,
          matches: typeof parsed.matches === 'boolean' ? parsed.matches : prev.matches,
        }));
      }
    } catch (e) {
      console.error('Error loading notification preferences:', e);
    }
  }, [user?.id]);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.id) return;
      setHistoryLoading(true);
      try {
        const { data, error } = await supabase
          .from('assinaturas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Erro ao carregar histórico de assinaturas:', error);
        } else {
          setSubscriptionHistory(data || []);
        }
      } catch (e) {
        console.error('Erro ao carregar histórico de assinaturas:', e);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [user?.id]);

  const handleThemeToggle = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark';
    setTheme(newTheme);
    setIsDarkTheme(!isDarkTheme);
  };

  const saveNotificationPrefs = (next: typeof notificationPrefs) => {
    setNotificationPrefs(next);
    if (!user?.id) return;
    try {
      localStorage.setItem(`notification_prefs_${user.id}`, JSON.stringify(next));
    } catch (e) {
      console.error('Error saving notification preferences:', e);
    }
  };

  const handleChangeEmail = async () => {
    if (!user?.email) {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar seu e-mail atual.',
        variant: 'destructive',
      });
      return;
    }

    if (!newEmail.trim() || !currentPasswordForEmail) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha o novo e-mail e sua senha atual.',
        variant: 'destructive',
      });
      return;
    }

    setEmailLoading(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPasswordForEmail,
      });
      if (reauthError) throw reauthError;

      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;

      toast({
        title: 'Verifique seu e-mail',
        description: 'Enviamos um link de confirmação para o novo endereço de e-mail.',
      });

      setCurrentPasswordForEmail("");
      setNewEmail("");
    } catch (e: any) {
      console.error('Erro ao alterar e-mail:', e);
      toast({
        title: 'Erro ao alterar e-mail',
        description: e?.message || 'Verifique sua senha atual e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) {
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar seu e-mail de login.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentPasswordForPassword || !newPassword || !confirmNewPassword) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha a senha atual, a nova senha e a confirmação.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({
        title: 'Senhas diferentes',
        description: 'A confirmação da nova senha não corresponde.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A nova senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPasswordForPassword,
      });
      if (reauthError) throw reauthError;

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: 'Senha atualizada',
        description: 'Sua senha foi alterada com sucesso.',
      });

      setCurrentPasswordForPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: any) {
      console.error('Erro ao alterar senha:', e);
      toast({
        title: 'Erro ao alterar senha',
        description: e?.message || 'Verifique sua senha atual e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendContact = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha o assunto e a descrição da mensagem.',
        variant: 'destructive',
      });
      return;
    }

    setContactSending(true);
    try {
      const subject = encodeURIComponent(contactSubject.trim());
      const bodyLines = [
        contactMessage.trim(),
        '',
        `---`,
        `ID do usuário: ${user?.id || 'não autenticado'}`,
        `E-mail do usuário: ${user?.email || 'não informado'}`,
      ];
      const body = encodeURIComponent(bodyLines.join('\n'));

      const mailtoUrl = `mailto:suporte@sensualconnect.com.br?subject=${subject}&body=${body}`;
      const opened = window.open(mailtoUrl, '_blank');

      if (opened) {
        toast({
          title: 'Abrindo seu e-mail',
          description: 'Preenchemos a mensagem para você enviar ao suporte.',
        });

        setContactSubject("");
        setContactMessage("");
      } else {
        toast({
          title: 'Não foi possível abrir o e-mail',
          description: 'Verifique se seu navegador permite abrir o cliente de e-mail padrão.',
          variant: 'destructive',
        });
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem de suporte:', e);
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    } finally {
      setContactSending(false);
    }
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
      navigate('/');
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

  const handleSignOutClick = async () => {
    try {
      await signOut();
      // Forçar recarregamento completo para garantir que todo estado seja limpo
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Erro ao sair da conta',
        description: 'Tente novamente em instantes.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Preferências: e-mail, senha, tema, notificações */}
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardHeader className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-full hover:bg-white/10 text-gray-200"
              onClick={() => navigate('/profile')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-white flex-1 text-center md:text-left flex items-center gap-2 justify-center md:justify-start">
              Preferências
            </CardTitle>
            <div className="w-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-white">Alterar e-mail de login</span>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                Seu e-mail atual: <span className="font-mono">{user?.email || 'não disponível'}</span>
              </p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-200">Novo e-mail</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-white/5 border-primary/30 text-white h-9 text-sm"
                    placeholder="seu-novo-email@exemplo.com"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-200">Senha atual</Label>
                  <Input
                    type="password"
                    value={currentPasswordForEmail}
                    onChange={(e) => setCurrentPasswordForEmail(e.target.value)}
                    className="bg-white/5 border-primary/30 text-white h-9 text-sm"
                    placeholder="Digite sua senha atual"
                  />
                </div>
                <Button
                  size="sm"
                  className="mt-1 bg-gradient-primary text-white"
                  onClick={handleChangeEmail}
                  disabled={emailLoading}
                >
                  {emailLoading ? 'Salvando...' : 'Atualizar e-mail'}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-white">Alterar senha</span>
              </div>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-200">Senha atual</Label>
                  <Input
                    type="password"
                    value={currentPasswordForPassword}
                    onChange={(e) => setCurrentPasswordForPassword(e.target.value)}
                    className="bg-white/5 border-primary/30 text-white h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-200">Nova senha</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/5 border-primary/30 text-white h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-200">Confirmar nova senha</Label>
                  <Input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="bg-white/5 border-primary/30 text-white h-9 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  className="mt-1 bg-gradient-primary text-white"
                  onClick={handleChangePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading ? 'Salvando...' : 'Atualizar senha'}
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-white">Notificações</span>
                </div>
                <span className="text-[11px] text-gray-300">(app)</span>
              </div>
              <div className="space-y-2 text-xs text-gray-200">
                <div className="flex items-center justify-between gap-3">
                  <span>Mensagens recebidas</span>
                  <Switch
                    checked={notificationPrefs.messages}
                    onCheckedChange={(val) =>
                      saveNotificationPrefs({ ...notificationPrefs, messages: val })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Curtidas nas publicações</span>
                  <Switch
                    checked={notificationPrefs.likes}
                    onCheckedChange={(val) =>
                      saveNotificationPrefs({ ...notificationPrefs, likes: val })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Comentários nas publicações</span>
                  <Switch
                    checked={notificationPrefs.comments}
                    onCheckedChange={(val) =>
                      saveNotificationPrefs({ ...notificationPrefs, comments: val })
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Novos matches/conexões</span>
                  <Switch
                    checked={notificationPrefs.matches}
                    onCheckedChange={(val) =>
                      saveNotificationPrefs({ ...notificationPrefs, matches: val })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-white">Tema do aplicativo</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-200">Modo escuro</span>
                <Switch checked={isDarkTheme} onCheckedChange={handleThemeToggle} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assinatura / Pagamentos */}
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Assinatura e pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
                  {openingPortal ? 'Abrindo...' : 'Gerenciar / cancelar assinatura'}
                </Button>
              </>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-white">Histórico de pagamentos</span>
            </div>
            {historyLoading ? (
              <p className="text-xs text-gray-300">Carregando histórico...</p>
            ) : subscriptionHistory.length === 0 ? (
              <p className="text-xs text-gray-300">Nenhum pagamento encontrado para esta conta.</p>
            ) : (
              <div className="space-y-2 text-xs text-gray-200">
                {subscriptionHistory.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-white/10 rounded-lg px-3 py-2"
                  >
                    <div>
                      <p className="text-white text-xs font-medium">
                        {sub.plano || 'Plano'} • {sub.periodo || 'período'}
                      </p>
                      <p className="text-[11px] text-gray-300">
                        Início: {sub.data_inicio ? new Date(sub.data_inicio).toLocaleDateString('pt-BR') : '-'}
                        {"  "}• Fim: {sub.data_fim ? new Date(sub.data_fim).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div className="text-right text-[11px] text-gray-200">
                      <p>R$ {sub.valor?.toFixed ? sub.valor.toFixed(2) : sub.valor}</p>
                      <p className="uppercase tracking-wide">{sub.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-4 space-y-2">
            <p className="text-[11px] text-gray-400">
              O cancelamento da assinatura é feito com segurança pelo portal de cobrança. Use o botão
              "Gerenciar / cancelar assinatura" acima para acessar.
            </p>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <p className="text-xs text-gray-300 font-medium">Ações da conta</p>
            <div className="space-y-3">
              <Button
                onClick={handleSignOutClick}
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
          </div>
        </CardContent>
      </Card>

      {/* Suporte / Ajuda */}
      <Card className="bg-glass backdrop-blur-md border-primary/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Suporte e ajuda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm text-gray-200">
              <p className="font-medium">FAQ e informações</p>
              <p className="text-xs text-gray-300 mb-2">
                Acesse respostas rápidas sobre cadastro, premium, mensagens e segurança.
              </p>
              <div className="flex flex-col gap-2 text-xs">
                <Link to="/help" className="text-primary hover:underline">Central de ajuda</Link>
                <Link to="/terms" className="text-primary hover:underline">Termos de uso</Link>
                <Link to="/privacy" className="text-primary hover:underline">Política de privacidade</Link>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm text-gray-200">Contato com suporte</p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-gray-200">Assunto</Label>
                  <Input
                    value={contactSubject}
                    onChange={(e) => setContactSubject(e.target.value)}
                    className="bg-white/5 border-primary/30 text-white h-9 text-sm"
                    placeholder="Ex: Problema com assinatura, bug, sugestão..."
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-200">Descrição</Label>
                  <Textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    className="bg-white/5 border-primary/30 text-white text-sm min-h-[90px]"
                    placeholder="Descreva o que aconteceu com o máximo de detalhes possível."
                  />
                </div>
                <Button
                  size="sm"
                  className="bg-gradient-primary text-white"
                  onClick={handleSendContact}
                  disabled={contactSending}
                >
                  {contactSending ? 'Enviando...' : 'Enviar mensagem'}
                </Button>
                <p className="text-[11px] text-gray-400">
                  Anexos ainda não estão disponíveis diretamente pelo app. Se necessário, nossa equipe
                  poderá solicitar mais detalhes por e-mail.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm text-gray-200">
              <p className="font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Status do sistema
              </p>
              <p className="text-xs text-gray-300">
                Uptime: <span className="text-emerald-300 font-medium">Online</span>
              </p>
              <p className="text-xs text-gray-300">
                Últimas atualizações: melhorias contínuas na experiência, segurança e desempenho.
              </p>
              <p className="text-xs text-gray-400">
                Caso perceba qualquer instabilidade, envie uma mensagem via formulário de suporte acima.
              </p>
            </div>
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
