import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ChevronLeft } from "lucide-react";

export default function DeleteAccountPage() {
  const userEmail = "labsatena@gmail.com";
  const emailSubject = "Solicitação de Exclusão de Conta e Dados - Rachinha.com";
  const emailBody = "Olá, gostaria de solicitar a exclusão permanente da minha conta e de todos os meus dados associados à plataforma Rachinha.com. Por favor, confirme o recebimento desta solicitação e me informe sobre os próximos passos.\n\nObrigado.";

  const mailtoLink = `mailto:${userEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

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
              <Button variant="ghost">
                <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para o início
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-2xl flex justify-center items-center">
        <Card className="w-full bg-zinc-900 border-zinc-800">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-white">
              Exclusão de Conta e Dados
            </CardTitle>
            <CardDescription>
              Processo para solicitar a remoção permanente de suas informações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-yellow-900/50 border border-yellow-700 text-yellow-300 flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 mt-1 shrink-0" />
                <div>
                    <h3 className="font-bold">Atenção: Ação Irreversível</h3>
                    <p className="text-sm mt-1">
                        Ao solicitar a exclusão, todos os seus dados serão permanentemente removidos, incluindo seu perfil, turmas, histórico de rachas e mensagens. Você não poderá recuperar sua conta após a conclusão do processo.
                    </p>
                </div>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-2">O que será excluído?</h3>
              <ul className="list-disc space-y-1 pl-6 text-sm text-zinc-400">
                <li>Suas informações de perfil (nome, e-mail, foto, etc.).</li>
                <li>Sua participação em todas as turmas.</li>
                <li>Seu histórico de rachas e presenças.</li>
                <li>Todas as suas mensagens nos chats das turmas.</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-2">Como solicitar</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Para iniciar o processo de exclusão, clique no botão abaixo. Isso abrirá seu aplicativo de e-mail com uma mensagem pré-formatada para nossa equipe de suporte. Envie o e-mail para confirmar sua solicitação.
              </p>
            </div>

            <a href={mailtoLink}>
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-base py-6">
                Solicitar Exclusão da Minha Conta
              </Button>
            </a>

            <p className="text-xs text-zinc-500 text-center">
              Nossa equipe processará sua solicitação e confirmará a exclusão por e-mail dentro de alguns dias úteis.
            </p>
          </CardContent>
        </Card>
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