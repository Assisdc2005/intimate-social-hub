
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { InstitutionalFooter } from "@/components/Layout/InstitutionalFooter";

export const Refund = () => {
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
              Política de Reembolso
            </h1>
            
            <div className="space-y-6 text-foreground">
              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Direito ao Reembolso
                </h2>
                <p className="leading-relaxed">
                  Oferecemos reembolso integral para assinaturas Premium canceladas dentro de 7 dias 
                  da data de compra, desde que os serviços não tenham sido utilizados extensivamente.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Como Solicitar Reembolso
                </h2>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Entre em contato através do email: suporte@sensualconnect.com.br</li>
                  <li>Informe o motivo da solicitação de reembolso</li>
                  <li>Forneça seu ID de usuário e detalhes da transação</li>
                  <li>Aguarde nossa análise em até 3 dias úteis</li>
                </ol>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Prazo para Processamento
                </h2>
                <p className="leading-relaxed">
                  Após aprovação da solicitação, o reembolso será processado em até 5-10 dias úteis, 
                  dependendo do método de pagamento utilizado na compra original.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Casos Especiais
                </h2>
                <ul className="list-disc list-inside space-y-2">
                  <li>Problemas técnicos que impeçam o uso da plataforma</li>
                  <li>Cobrança duplicada ou incorreta</li>
                  <li>Cancelamento por violação de nossos termos (não elegível)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gradient mb-3">
                  Contato
                </h2>
                <p className="leading-relaxed">
                  Para dúvidas sobre nossa política de reembolso, entre em contato conosco através 
                  do email suporte@sensualconnect.com.br ou utilize nossa Central de Ajuda.
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
