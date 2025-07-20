
import { ArrowLeft, MessageCircle, Mail, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { InstitutionalFooter } from "@/components/Layout/InstitutionalFooter";

export const Help = () => {
  const navigate = useNavigate();

  const handleEmailClick = () => {
    window.location.href = "mailto:suporte@sensualconnect.com.br";
  };

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
          <div className="glass rounded-2xl p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gradient text-center">
              Central de Ajuda
            </h1>
            
            {/* Perguntas Frequentes */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-gradient">
                Perguntas Frequentes
              </h2>
              
              <div className="space-y-4">
                <div className="bg-card/50 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    Como posso alterar minha foto de perfil?
                  </h3>
                  <p className="text-foreground text-sm">
                    Vá até seu perfil e clique no ícone da câmera sobre sua foto atual. 
                    Selecione uma nova imagem do seu dispositivo.
                  </p>
                </div>

                <div className="bg-card/50 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    O que inclui a assinatura Premium?
                  </h3>
                  <p className="text-foreground text-sm">
                    Com o Premium você pode curtir posts, comentar, enviar mensagens 
                    e acessar recursos exclusivos da plataforma.
                  </p>
                </div>

                <div className="bg-card/50 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    Como posso cancelar minha assinatura?
                  </h3>
                  <p className="text-foreground text-sm">
                    Entre em contato conosco pelo email de suporte. Oferecemos reembolso 
                    dentro de 7 dias da compra.
                  </p>
                </div>

                <div className="bg-card/50 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    Meus dados estão seguros?
                  </h3>
                  <p className="text-foreground text-sm">
                    Sim! Utilizamos criptografia avançada e seguimos as melhores práticas 
                    de segurança para proteger suas informações.
                  </p>
                </div>
              </div>
            </section>

            {/* Opções de Contato */}
            <section className="space-y-6">
              <h2 className="text-2xl font-semibold text-gradient">
                Precisa de Mais Ajuda?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleEmailClick}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 bg-card/30 hover:bg-card/50"
                >
                  <Mail className="w-8 h-8 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold">Email de Suporte</div>
                    <div className="text-sm text-muted-foreground">
                      suporte@sensualconnect.com.br
                    </div>
                  </div>
                </Button>

                <Button
                  onClick={() => navigate('/termos')}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 bg-card/30 hover:bg-card/50"
                >
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-center">
                    <div className="font-semibold">Documentos</div>
                    <div className="text-sm text-muted-foreground">
                      Termos e Políticas
                    </div>
                  </div>
                </Button>
              </div>
            </section>

            {/* Dicas de Segurança */}
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold text-gradient">
                Dicas de Segurança
              </h2>
              
              <div className="bg-card/30 rounded-lg p-6 space-y-3">
                <ul className="space-y-2 text-foreground">
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">Mantenha sua senha segura e não a compartilhe</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">Reporte qualquer comportamento inadequado</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">Não compartilhe informações pessoais sensíveis</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-primary">•</span>
                    <span className="text-sm">Use a plataforma com responsabilidade</span>
                  </li>
                </ul>
              </div>
            </section>
          </div>
        </main>
      </div>

      <InstitutionalFooter />
    </div>
  );
};
