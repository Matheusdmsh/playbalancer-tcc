import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex items-center">
                <Image
                  src="/assets/logo.svg"
                  alt="Logo Rachinha.com"
                  width={32}
                  height={32}
                />
              </span>
              <span className="text-xl font-bold text-white">
                rachinha<span className="text-green-500">.com</span>
              </span>
            </Link>
            <Link href="/">
              <Button className="bg-green-500 hover:bg-green-600">
                Voltar para o início
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Política de Privacidade
          </h1>
          <p className="text-zinc-400 mt-2">
            Última atualização: 26 de Julho de 2024
          </p>
        </div>

        <div className="space-y-8 text-zinc-300">
          <section>
            <p className="text-lg">
              Bem-vindo à Política de Privacidade do{" "}
              <span className="font-bold text-white">Rachinha.com</span>. A
              sua privacidade e a segurança dos seus dados são de extrema
              importância para nós. Este documento descreve como coletamos,
              usamos, armazenamos e protegemos suas informações pessoais ao
              utilizar nossa plataforma. Ao se cadastrar e usar o
              Rachinha.com, você concorda com as práticas descritas nesta
              política.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              1. Informações que Coletamos
            </h2>
            <p className="mb-4">
              Para fornecer e aprimorar nossos serviços, coletamos os
              seguintes tipos de informações:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Informações de Cadastro:</strong> Ao criar uma conta,
                solicitamos dados como seu nome completo, nome de usuário,
                endereço de e-mail e senha.
              </li>
              <li>
                <strong>Informações de Perfil:</strong> Você pode optar por
                adicionar mais informações ao seu perfil, como número de
                telefone e uma foto, que será visível para outros membros dos
                seus grupos.
              </li>
              <li>
                <strong>Informações de Grupos e Rachas:</strong> Coletamos
                dados sobre os grupos ("turmas") que você cria ou participa,
                incluindo nome, modalidade esportiva e foto. Também
                armazenamos detalhes dos "rachas" (eventos esportivos) que
                você organiza ou participa, como data, horário, local e a
                lista de jogadores confirmados.
              </li>
              <li>
                <strong>Comunicações e Notificações:</strong> Armazenamos as
                mensagens trocadas no chat dos grupos para manter o histórico
                da conversa. Também gerenciamos as notificações enviadas, como
                convites para grupos e rachas, para garantir que você se
                mantenha informado.
              </li>
              <li>
                <strong>Informações de Autenticação Externa:</strong> Se você
                optar por se registrar ou fazer login usando um serviço de
                terceiros como o Google, teremos acesso a informações básicas
                do seu perfil (nome, e-mail e foto), conforme autorizado por
                você no momento da conexão.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              2. Como Usamos Suas Informações
            </h2>
            <p className="mb-4">
              Utilizamos as informações coletadas para as seguintes
              finalidades:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Fornecer e Gerenciar Nossos Serviços:</strong> Para
                permitir a criação da sua conta, organização de turmas,
                agendamento de rachas, gerenciamento de listas de presença e
                facilitar a comunicação entre os membros.
              </li>
              <li>
                <strong>Comunicação:</strong> Para enviar notificações
                importantes sobre seus rachas, convites, novas mensagens no
                chat e outras informações relevantes para o uso da plataforma.
              </li>
              <li>
                <strong>Segurança:</strong> Para verificar sua identidade,
                proteger sua conta contra acessos não autorizados e garantir a
                segurança geral da nossa plataforma.
              </li>
              <li>
                <strong>Suporte ao Cliente:</strong> Para responder às suas
                perguntas, solucionar problemas e oferecer o melhor suporte
                possível.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              3. Compartilhamento de Informações
            </h2>
            <p className="mb-4">
              Sua privacidade é nossa prioridade. Não vendemos suas
              informações pessoais. O compartilhamento de dados ocorre apenas
              nas seguintes circunstâncias:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Com Outros Usuários da Plataforma:</strong> Suas
                informações de perfil (nome, nome de usuário e foto) e seu
                status de presença são visíveis para outros membros dos grupos
                e rachas dos quais você participa. Isso é essencial para a
                organização dos eventos.
              </li>
              <li>
                <strong>Obrigações Legais:</strong> Poderemos compartilhar
                suas informações se formos obrigados por lei, processo legal
                ou solicitação governamental válida.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              4. Armazenamento e Segurança dos Dados
            </h2>
            <p>
              Adotamos medidas de segurança técnicas e administrativas para
              proteger suas informações pessoais contra acesso não autorizado,
              perda, alteração ou destruição. Seus dados de senha são
              armazenados de forma criptografada (hashed). As imagens de
              perfil e de grupos são enviadas e armazenadas em um serviço de
              storage seguro.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              5. Seus Direitos e Controle
            </h2>
            <p className="mb-4">
              Você tem total controle sobre suas informações pessoais e pode:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Acessar e Atualizar:</strong> Acessar e editar as
                informações do seu perfil a qualquer momento através da página
                "Perfil" em sua conta.
              </li>
              <li>
                <strong>Gerenciar Grupos:</strong> Como proprietário de uma
                turma, você pode editar as informações do grupo e gerenciar
                seus membros.
              </li>
              <li>
                <strong>Excluir sua Conta e Dados:</strong> Você pode
                solicitar a exclusão permanente da sua conta e de todos os
                dados associados. Para iniciar o processo, por favor, acesse
                nossa página de{" "}
                <Link href="/delete-account" className="text-green-500 hover:underline">
                  Solicitação de Exclusão de Conta
                </Link>
                .
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              6. Alterações a esta Política de Privacidade
            </h2>
            <p>
              Podemos atualizar esta política de privacidade periodicamente
              para refletir mudanças em nossas práticas ou por outras razões
              operacionais, legais ou regulatórias. Notificaremos você sobre
              quaisquer alterações publicando a nova política nesta página.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-zinc-700 pb-2">
              7. Contato
            </h2>
            <p>
              Se você tiver alguma dúvida ou preocupação sobre esta Política
              de Privacidade ou nossas práticas de dados, entre em contato
              conosco através do e-mail:{" "}
              <a href="mailto:labsatena@gmail.com">
                labsatena@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-zinc-500 text-sm">
          <p>
            © {new Date().getFullYear()} Rachinha.com. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}