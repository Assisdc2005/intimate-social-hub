import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Heart, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import elegantCouple from '@/assets/elegant-couple.jpg';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Erro no login",
            description: "Email ou senha inválidos",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login realizado!",
            description: "Bem-vindo(a) de volta",
          });
          navigate('/');
        }
      } else {
        if (password !== confirmPassword) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem",
            variant: "destructive",
          });
          return;
        }
        
        if (!acceptTerms) {
          toast({
            title: "Erro",
            description: "Você deve aceitar os termos de uso",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast({
            title: "Erro no cadastro",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta",
          });
          navigate('/complete-profile');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Lado Esquerdo - Imagem Elegante */}
        <div className="relative hidden lg:block">
          <div className="relative overflow-hidden rounded-3xl shadow-[var(--shadow-premium)]">
            <img 
              src={elegantCouple} 
              alt="Casal elegante"
              className="w-full h-[600px] object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Sensual</h2>
                  <p className="text-white/80">Conexões Autênticas</p>
                </div>
              </div>
              <div className="glass rounded-2xl p-4 backdrop-blur-xl">
                <p className="text-white/90 text-sm leading-relaxed">
                  Encontre conexões genuínas em uma plataforma premium dedicada a relacionamentos autênticos e elegantes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md glass backdrop-blur-xl border-primary/20 shadow-[var(--shadow-premium)]">
            <CardHeader className="text-center space-y-6">
              {/* Logo Mobile */}
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
                  <Heart className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gradient">Sensual</h1>
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-foreground">
                  {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {isLogin ? 'Entre na sua conta para continuar' : 'Junte-se à nossa comunidade premium'}
                </p>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nome de exibição</label>
                    <Input
                      type="text"
                      placeholder="Como você gostaria de ser chamado?"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="glass border-primary/30 text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="glass border-primary/30 text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Senha</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha segura"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="glass border-primary/30 text-foreground placeholder:text-muted-foreground h-12 rounded-xl pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirmar senha</label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="glass border-primary/30 text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
                    />
                  </div>
                )}
                
                {!isLogin && (
                  <div className="flex items-start space-x-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 rounded border-primary/30 text-primary focus:ring-primary"
                    />
                    <label htmlFor="terms" className="text-sm text-foreground leading-relaxed">
                      Aceito os{' '}
                      <a href="/termos" className="text-primary hover:underline font-medium">
                        termos de uso
                      </a>{' '}
                      e{' '}
                      <a href="/privacidade" className="text-primary hover:underline font-medium">
                        política de privacidade
                      </a>
                    </label>
                  </div>
                )}
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-gradient-primary hover:opacity-90 text-white font-semibold rounded-xl shadow-[var(--shadow-premium)] transition-all duration-300 hover:scale-[1.02] flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {isLogin ? 'Entrar agora' : 'Criar conta premium'}
                    </>
                  )}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground">ou</span>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:text-primary/80 font-medium transition-colors underline-offset-4 hover:underline"
                >
                  {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre agora'}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};