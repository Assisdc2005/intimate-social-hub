
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { InstitutionalFooter } from "@/components/Layout/InstitutionalFooter";

export const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <div className="flex-1">
        {/* Header com botão voltar */}
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

        {/* Conteúdo principal */}
        <main className="max-w-4xl mx-auto px-6 py-8">
          <div className="glass rounded-2xl p-8 space-y-6">
            <h1 className="text-3xl font-bold text-gradient text-center">
              Sobre o Sensual
            </h1>
            
            <div className="space-y-4 text-foreground">
              <p className="text-lg leading-relaxed">
                O Sensual é uma plataforma moderna e segura desenvolvida para adultos que buscam 
                conexões autênticas e experiências significativas em um ambiente digital protegido.
              </p>
              
              <p className="leading-relaxed">
                Nossa missão é proporcionar um espaço onde pessoas maiores de 18 anos possam 
                se expressar livremente, compartilhar experiências e construir relacionamentos 
                genuínos, sempre respeitando os limites e preferências de cada usuário.
              </p>
              
              <h2 className="text-xl font-semibold text-gradient mt-6">
                Nossos Valores
              </h2>
              
              <ul className="space-y-2 list-disc list-inside">
                <li>Segurança e privacidade em primeiro lugar</li>
                <li>Respeito mútuo entre todos os usuários</li>
                <li>Transparência em nossas políticas e práticas</li>
                <li>Inovação constante para melhorar a experiência</li>
                <li>Suporte dedicado e responsivo</li>
              </ul>
              
              <p className="leading-relaxed mt-6">
                Utilizamos as mais avançadas tecnologias de segurança para proteger seus dados 
                e garantir que sua experiência seja sempre segura e privada.
              </p>
            </div>
          </div>
        </main>
      </div>

      <InstitutionalFooter />
    </div>
  );
};
