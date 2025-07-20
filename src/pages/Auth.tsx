import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

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
      <Card className="w-full max-w-md bg-glass backdrop-blur-md border-primary/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Heart className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-text bg-clip-text text-transparent">
              Sensual
            </h1>
          </div>
          <CardTitle className="text-white">
            {isLogin ? 'Entrar na sua conta' : 'Criar conta'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Input
                  type="text"
                  placeholder="Nome de exibição"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="bg-glass border-primary/30 text-white placeholder:text-gray-300"
                />
              </div>
            )}
            
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-glass border-primary/30 text-white placeholder:text-gray-300"
              />
            </div>
            
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-glass border-primary/30 text-white placeholder:text-gray-300 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            
            {!isLogin && (
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-glass border-primary/30 text-white placeholder:text-gray-300"
                />
              </div>
            )}
            
            {!isLogin && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="rounded border-primary/30"
                />
                <label htmlFor="terms" className="text-sm text-gray-300">
                  Aceito os{' '}
                  <a href="/termos" className="text-primary hover:underline">
                    termos de uso
                  </a>
                </label>
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold"
            >
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Entre'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};