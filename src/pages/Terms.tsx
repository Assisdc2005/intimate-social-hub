
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { InstitutionalFooter } from "@/components/Layout/InstitutionalFooter";

export const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="flex-1">
        <header className="p-6">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="glass rounded-2xl p-8 space-y-6">
            <h1 className="text-3xl font-bold text-gradient text-center">
              Termos de Uso
            </h1>
            
            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  1. Aceitação dos Termos
                </h2>
                <p className="leading-relaxed">
                  Ao acessar e usar o Sensual, você concorda em cumprir estes Termos de Uso. 
                  Se você não concordar com qualquer parte destes termos, não deve usar nossa plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  2. Elegibilidade
                </h2>
                <p className="leading-relaxed">
                  Esta plataforma é destinada exclusivamente para pessoas com 18 anos ou mais. 
                  Ao se registrar, você confirma que possui a idade mínima exigida.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  3. Conduta do Usuário
                </h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Respeite outros usuários e suas preferências</li>
                  <li>Não compartilhe conteúdo ofensivo ou inadequado</li>
                  <li>Não utilize a plataforma para atividades ilegais</li>
                  <li>Mantenha suas informações de conta seguras</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  4. Privacidade e Dados
                </h2>
                <p className="leading-relaxed">
                  Sua privacidade é importante para nós. Consulte nossa Política de Privacidade 
                  para entender como coletamos, usamos e protegemos suas informações pessoais.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  5. Modificações
                </h2>
                <p className="leading-relaxed">
                  Reservamos o direito de modificar estes termos a qualquer momento. 
                  As alterações entrarão em vigor imediatamente após a publicação.
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>

      <InstitutionalFooter />
    </div>
  );
};
