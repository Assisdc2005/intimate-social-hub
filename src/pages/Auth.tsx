import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Github, Google } from "lucide-react";
import { InstitutionalFooter } from "@/components/Layout/InstitutionalFooter";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp, signInWithGoogle, signInWithGithub } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      try {
        await signIn(email, password);
        // navigate('/home'); // Redirected in App.tsx based on auth state
      } catch (error: any) {
        alert(error.message);
      }
    } else {
      try {
        await signUp(email, password);
        // navigate('/complete-profile'); // Redirected in App.tsx based on auth state
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // navigate('/home'); // Redirected in App.tsx based on auth state
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      await signInWithGithub();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-white text-lg shadow-glow">
              S
            </div>
            <h1 className="text-xl font-bold text-gradient">Sensual</h1>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Voltar
          </Button>
        </div>
      </header>

      <main className="container grid items-center justify-center px-4 py-24">
        <div className="mx-auto flex w-full max-w-md flex-col space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold">
              {isLogin ? "Entrar na sua conta" : "Criar uma conta"}
            </h1>
            <p className="text-muted-foreground text-sm">
              Ou continue com
            </p>
            <div className="flex justify-center space-x-2">
              <Button
                size="icon"
                variant="outline"
                onClick={handleGoogleSignIn}
              >
                <Google className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                onClick={handleGitHubSignIn}
              >
                <Github className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou faça com seu email
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seuemail@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit">{isLogin ? "Entrar" : "Criar conta"}</Button>
          </form>
          <p className="px-8 text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            <button
              className="underline underline-offset-4 hover:text-primary"
              type="button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Criar uma conta" : "Entrar"}
            </button>
          </p>
        </div>
      </main>
      
      <InstitutionalFooter />
    </div>
  );
};
