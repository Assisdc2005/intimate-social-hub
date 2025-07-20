
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { InstitutionalFooter } from "@/components/Layout/InstitutionalFooter";

export const Privacy = () => {
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
              Política de Privacidade
            </h1>
            
            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Coleta de Informações
                </h2>
                <p className="leading-relaxed">
                  Coletamos apenas as informações necessárias para fornecer nossos serviços, 
                  incluindo dados de perfil, preferências e informações de uso da plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Uso das Informações
                </h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Personalizar sua experiência na plataforma</li>
                  <li>Melhorar nossos serviços e funcionalidades</li>
                  <li>Garantir a segurança e integridade da plataforma</li>
                  <li>Comunicar atualizações importantes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Proteção de Dados
                </h2>
                <p className="leading-relaxed">
                  Utilizamos medidas de segurança avançadas para proteger suas informações pessoais. 
                  Seus dados são criptografados e armazenados em servidores seguros.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Compartilhamento de Dados
                </h2>
                <p className="leading-relaxed">
                  Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, 
                  exceto quando necessário para operação da plataforma ou exigido por lei.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Seus Direitos
                </h2>
                <p className="leading-relaxed">
                  Você tem o direito de acessar, corrigir ou excluir suas informações pessoais 
                  a qualquer momento. Entre em contato conosco para exercer esses direitos.
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
