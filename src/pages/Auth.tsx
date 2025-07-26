
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Github, Mail, Loader2 } from "lucide-react";
import { InstitutionalFooter } from "@/components/Layout/InstitutionalFooter";
import { supabase } from "@/integrations/supabase/client";

export const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      try {
        const { error } = await signIn(email, password);
        if (error) {
          alert(error.message);
        }
      } catch (error: any) {
        alert(error.message);
      }
    } else {
      try {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          alert(error.message);
        }
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Link enviado!",
          description: "Enviamos um link para redefinir sua senha no seu e-mail.",
        });
        setShowResetDialog(false);
        setResetEmail("");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
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
              Entre com seu email e senha
            </p>
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
            {!isLogin && (
              <div className="grid gap-2">
                <Label htmlFor="displayName">Nome de exibição</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Seu nome"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            )}
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
            
            {isLogin && (
              <div className="flex justify-end">
                <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-sm px-0 h-auto">
                      Esqueci minha senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="card-premium max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-gradient">Redefinir Senha</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="resetEmail">Email cadastrado</Label>
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="seuemail@exemplo.com"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-primary hover:opacity-90"
                        disabled={isResetLoading}
                      >
                        {isResetLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Enviar link de redefinição
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            
            <Button type="submit">{isLogin ? "Entrar" : "Criar conta"}</Button>
          </form>
          <p className="px-8 text-center text-sm text-muted-foreground">
            {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            <button
              className="underline underline-offset-4 hover:text-primary ml-1"
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
