import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { InstitutionalFooter } from "@/components/Layout/InstitutionalFooter";
import { Checkbox } from "@/components/ui/checkbox";

export const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [acceptedConsent, setAcceptedConsent] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!acceptedConsent) {
        toast({
          title: "Aceite necessário",
          description: "Você deve aceitar os Termos de Uso e Consentimento para criar a conta.",
          variant: "destructive",
        });
        return;
      }
      const { error } = await signUp(email, password, displayName);
      if (error) {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
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
              Criar uma conta
            </h1>
            <p className="text-muted-foreground text-sm">
              Preencha seus dados para começar
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
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Senha (mínimo 6 caracteres)"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox id="consent" checked={acceptedConsent} onCheckedChange={(v) => setAcceptedConsent(!!v)} />
              <label htmlFor="consent" className="leading-snug cursor-pointer">
                Li e aceito os {" "}
                <Link to="/consent" className="underline underline-offset-4 hover:text-primary">
                  Termos de Uso e Consentimento – Sensual Nexus Connect
                </Link>
              </label>
            </div>
            
            <Button type="submit" className="btn-premium">Criar conta</Button>
          </form>
          <p className="px-8 text-center text-sm text-muted-foreground">
            Já tem uma conta?
            <Link
              to="/login"
              className="underline underline-offset-4 hover:text-primary ml-1"
            >
              Entrar
            </Link>
          </p>
        </div>
      </main>
      
      <InstitutionalFooter />
    </div>
  );
};
