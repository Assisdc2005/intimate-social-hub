
import { Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InstitutionalFooter = () => {
  const navigate = useNavigate();

  const handleEmailClick = () => {
    window.location.href = "mailto:suporte@sensualconnect.com.br";
  };

  const footerLinks = [
    { label: "Sobre o Site", path: "/sobre" },
    { label: "Termos de Uso", path: "/termos" },
    { label: "Política de Privacidade", path: "/privacidade" },
    { label: "Política de Reembolso", path: "/reembolso" },
    { label: "Central de Ajuda", path: "/ajuda" },
  ];

  return (
    <footer className="bg-gradient-to-r from-background via-card to-background border-t border-primary/20 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo e Marca */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-white text-xl shadow-glow">
                S
              </div>
              <h2 className="text-2xl font-bold text-gradient">
                Sensual
              </h2>
            </div>
            
            {/* Direitos Autorais */}
            <div className="text-center md:text-left space-y-2">
              <p className="text-sm text-muted-foreground">
                © 2025 Sensual Nexus Connect. Todos os direitos reservados.
              </p>
              <p className="text-xs text-muted-foreground">
                Desenvolvido com responsabilidade e segurança para maiores de 18 anos.
              </p>
            </div>
          </div>

          {/* Seção Informações */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="text-lg font-bold text-foreground">Informações</h3>
            <nav className="flex flex-col space-y-2">
              {footerLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => navigate(link.path)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 text-center md:text-left"
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Seção Suporte & Segurança */}
          <div className="flex flex-col items-center md:items-start space-y-4">
            <h3 className="text-lg font-bold text-foreground">Suporte & Segurança</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span>Suporte e segurança:</span>
              </div>
              <button
                onClick={handleEmailClick}
                className="text-sm text-primary hover:text-accent transition-colors duration-200 underline"
              >
                suporte@sensualconnect.com.br
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
