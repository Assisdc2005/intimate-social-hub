import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Consent = () => {
  const navigate = useNavigate();
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
          <Button variant="ghost" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}>
            Voltar
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-gradient mb-4">Termos de Uso e Consentimento – Sensual Nexus Connect</h1>
        <div className="space-y-6 text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Sobre o Site</h2>
            <p>O Sensual Nexus Connect é uma plataforma digital de encontros adultos criada para conectar pessoas maiores de 18 anos de forma segura, respeitosa e consensual. Nosso objetivo é oferecer um espaço moderno e privado para flertes, conversas e encontros reais entre adultos. O site não promove, incentiva nem intermedeia prostituição, pornografia comercial ou qualquer atividade ilegal. Todo conteúdo publicado é de responsabilidade exclusiva dos usuários, devendo respeitar as leis brasileiras, os direitos de imagem e a privacidade de terceiros.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Termos de Uso</h2>
            <h3 className="font-medium mb-1">2.1 Aceitação</h3>
            <p>Ao criar uma conta ou utilizar o Sensual Nexus Connect, o usuário declara que: É maior de 18 anos; Leu e concorda integralmente com estes Termos e Políticas; Fornece consentimento livre, informado e inequívoco para o tratamento de seus dados pessoais conforme a Lei nº 13.709/2018 (LGPD). Se você não concordar com qualquer cláusula, não deverá prosseguir com o cadastro nem utilizar os serviços.</p>
            <h3 className="font-medium mt-3 mb-1">2.2 Cadastro e Responsabilidade do Usuário</h3>
            <p>O usuário deve fornecer informações verdadeiras e atualizadas. É proibido criar conta com dados falsos, de terceiros ou de menores de idade. Cada usuário é responsável pelo conteúdo que publica, incluindo fotos, descrições e mensagens.</p>
            <p>O usuário compromete-se a: Respeitar o consentimento e os limites de outros membros; Não publicar material que envolva menores, incite ódio, discriminação, violência ou que viole direitos de imagem; Não compartilhar conteúdo explícito sem consentimento. A plataforma poderá suspender, bloquear ou excluir contas que violem estes termos sem aviso prévio.</p>
            <h3 className="font-medium mt-3 mb-1">2.3 Conduta e Interação</h3>
            <p>O Sensual Nexus Connect é um ambiente para adultos e exige comportamento ético e respeitoso. Ações como assédio, coerção, ameaças, chantagens ou compartilhamento indevido de conteúdo resultarão em banimento imediato.</p>
            <h3 className="font-medium mt-3 mb-1">2.4 Responsabilidade da Plataforma</h3>
            <p>O Sensual Nexus Connect atua como intermediário digital para conexões entre adultos. Não se responsabiliza por encontros presenciais, conversas privadas ou interações fora do ambiente do site. O usuário deve agir com cautela e bom senso, especialmente ao compartilhar informações pessoais ou combinar encontros.</p>
            <h3 className="font-medium mt-3 mb-1">2.5 Alterações</h3>
            <p>Estes Termos podem ser atualizados periodicamente. O uso contínuo da plataforma após modificações implica aceitação automática da nova versão.</p>
            <h3 className="font-medium mt-3 mb-1">2.6 Jurisdição</h3>
            <p>Fica eleito o foro da Comarca de Cuiabá – MT, com renúncia de qualquer outro, por mais privilegiado que seja, para resolver eventuais conflitos decorrentes destes Termos.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Política de Privacidade (LGPD)</h2>
            <h3 className="font-medium mb-1">3.1 Coleta de Dados</h3>
            <p>Ao utilizar o site, coletamos dados necessários para o funcionamento da plataforma, como: Nome, e-mail, idade, localização aproximada, foto e preferências de perfil; Dados técnicos (IP, navegador, dispositivo, cookies); Informações fornecidas voluntariamente nas postagens e mensagens.</p>
            <h3 className="font-medium mt-3 mb-1">3.2 Finalidade do Tratamento</h3>
            <p>Os dados são usados para: Criar e gerenciar sua conta; Exibir perfis compatíveis e recomendações personalizadas; Enviar notificações e comunicações de interesse; Garantir segurança, autenticação e prevenção de fraudes; Cumprir obrigações legais.</p>
            <h3 className="font-medium mt-3 mb-1">3.3 Base Legal</h3>
            <p>O tratamento é realizado com base no consentimento do titular, conforme a LGPD, podendo ser revogado a qualquer momento.</p>
            <h3 className="font-medium mt-3 mb-1">3.4 Compartilhamento</h3>
            <p>Os dados não são vendidos nem cedidos a terceiros. O compartilhamento ocorre apenas com parceiros tecnológicos essenciais (como Supabase, provedores de login e hospedagem), que seguem padrões de segurança compatíveis com a legislação brasileira.</p>
            <h3 className="font-medium mt-3 mb-1">3.5 Direitos do Titular</h3>
            <p>O usuário tem direito a: Confirmar a existência de tratamento; Solicitar acesso, correção, exclusão ou anonimização de dados; Revogar o consentimento; Solicitar portabilidade ou bloqueio de informações. Solicitações devem ser enviadas para: privacidade@sensualnexus.com.br</p>
            <h3 className="font-medium mt-3 mb-1">3.6 Retenção e Exclusão</h3>
            <p>Os dados são mantidos apenas pelo tempo necessário às finalidades descritas. Após exclusão da conta, os dados são apagados em até 30 dias. Logs técnicos podem ser mantidos por até 6 meses, conforme o Marco Civil da Internet.</p>
            <h3 className="font-medium mt-3 mb-1">3.7 Segurança da Informação</h3>
            <p>Adotamos medidas de segurança compatíveis com o estado da técnica: Criptografia e autenticação segura; Controle de acesso e auditorias; Sigilo e confidencialidade contratual com equipe e parceiros. Em caso de incidente de segurança, os usuários e a Autoridade Nacional de Proteção de Dados (ANPD) serão notificados conforme o art. 48 da LGPD.</p>
            <h3 className="font-medium mt-3 mb-1">3.8 Encarregado pelo Tratamento (DPO)</h3>
            <p>Nome: Matheus Assis — E-mail: privacidade@sensualnexus.com.br — Função: Atender solicitações dos usuários e comunicar-se com a ANPD.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Política de Reembolso</h2>
            <h3 className="font-medium mb-1">4.1 Assinaturas Premium</h3>
            <p>Ao adquirir o Plano Premium, o usuário tem acesso imediato a benefícios exclusivos (mensagens ilimitadas, maior visibilidade, filtros avançados etc.). Por se tratar de serviço digital de acesso instantâneo, o valor pago não é reembolsável após o uso do plano.</p>
            <h3 className="font-medium mt-3 mb-1">4.2 Direito de Arrependimento</h3>
            <p>De acordo com o Art. 49 do Código de Defesa do Consumidor, o usuário pode solicitar reembolso total em até 7 dias corridos após a compra, desde que não tenha utilizado os benefícios Premium. Após o uso efetivo, não haverá restituição de valores.</p>
            <h3 className="font-medium mt-3 mb-1">4.3 Cancelamento e Renovação</h3>
            <p>O usuário pode cancelar a renovação automática a qualquer momento. O acesso Premium continuará disponível até o fim do período já pago. Solicitações devem ser enviadas para: financeiro@sensualnexus.com.br</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Disposições Finais e Aceite</h2>
            <p>Ao clicar em “Criar conta”, o usuário confirma que: Leu e compreendeu todos os termos acima; Concorda com o tratamento de seus dados conforme a LGPD; Está ciente das regras de conduta, responsabilidade e reembolso; Declara ser maior de 18 anos.</p>
          </section>
        </div>
      </main>

      <footer className="py-8" />
    </div>
  );
};

export default Consent;
