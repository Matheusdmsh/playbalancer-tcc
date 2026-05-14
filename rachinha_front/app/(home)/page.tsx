"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { ArrowRight, Mail, Users, Calendar, ShieldCheck, CheckCircle } from "lucide-react";
import { postBetaTester } from "@/services/beta_testers";

export default function AndroidBetaPage() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await postBetaTester(email);
      toast({
        title: "Inscrição recebida!",
        description: "Seu e-mail foi adicionado à lista de espera do beta. Fique de olho na sua caixa de entrada!",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Erro ao inscrever",
        description: "Não foi possível adicionar seu e-mail. Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 sticky top-0 z-50 bg-black/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
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
              <span className="text-xl font-bold">
                rachinha<span className="text-green-500">.com</span>
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-white">
                  Entrar
                </Button>
              </Link>
              <Link href="/login" className="hidden md:block">
                <Button className="bg-green-500 hover:bg-green-600">Criar Conta</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-yellow-500/10 z-0"></div>
        <div className="container mx-auto px-4 relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                    O seu racha, finalmente no seu bolso.
                </h1>
                <p className="text-lg text-zinc-400 mt-6">
                    Chega de planilhas e grupos de WhatsApp confusos. O app do Rachinha.com para Android está chegando para simplificar a organização das suas partidas.
                </p>
                <form onSubmit={handleSubmit} className="mt-8">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                            <Input
                                type="email"
                                placeholder="Seu e-mail da Google Play"
                                className="pl-10 h-12 bg-zinc-900 border-zinc-700 focus:ring-green-500"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" size="lg" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                            Quero acesso beta
                        </Button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2 text-left">
                        Inscreva-se para ser o primeiro a testar.
                    </p>
                </form>
            </div>
            <div className="flex justify-center items-center">
              <div className="relative h-72 w-72 md:h-[660px] md:w-[600px]">
              <Image
                src="/assets/futebol.jpg"
                alt="Amigos comemorando"
                layout="fill"
                objectFit="cover"
                className="rounded-lg z-10 animate-pulse animate-infinite animate-duration-[5000ms]"
              />
              </div>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que esperar pelo app?</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                Leve a organização do seu jogo para o próximo nível com funcionalidades pensadas para o boleiro de verdade.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                        <Users className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Turmas Organizadas</h3>
                    <p className="text-zinc-400">
                        Crie grupos fixos, convide jogadores e mantenha todos conectados em um chat exclusivo.
                    </p>
                </div>
                 <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                        <Calendar className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Agenda Inteligente</h3>
                    <p className="text-zinc-400">
                        Marque rachas pontuais ou recorrentes e confirme a presença da galera com um toque.
                    </p>
                </div>
                 <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                        <ShieldCheck className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Caixa Transparente</h3>
                    <p className="text-zinc-400">
                        Controle as finanças da turma, registre pagamentos e despesas sem dor de cabeça.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Visual Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center items-center">
              <div className="relative h-72 w-72 md:h-[660px] md:w-[600px]">
              <Image
                src="/assets/run.jpg"
                alt="Amigos comemorando"
                layout="fill"
                objectFit="cover"
                className="rounded-lg z-10"
              />
              </div>
            </div>
            <div className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                    Feito por quem joga, para quem organiza.
                </h2>
                <p className="text-lg text-zinc-400 mt-6">
                    Sabemos que organizar um racha vai além de marcar a data. É gerenciar pagamentos, separar times, lidar com imprevistos. Nosso app foi desenhado para resolver esses problemas, para que você se preocupe apenas em jogar.
                </p>
                <ul className="mt-6 space-y-4">
                    <li className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-500"/>
                        <span>Lista de presença automática</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-500"/>
                        <span>Sorteio de times equilibrado</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <CheckCircle className="h-6 w-6 text-green-500"/>
                        <span>Chat integrado por racha e por turma</span>
                    </li>
                </ul>
            </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4 text-center">
           <h2 className="text-3xl md:text-4xl font-bold mb-4">Não fique de fora da convocação!</h2>
           <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
            Garanta seu lugar no nosso time de testadores beta. As vagas são limitadas!
           </p>
           <form onSubmit={handleSubmit} className="mt-8 max-w-lg mx-auto">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                        <Input
                            type="email"
                            placeholder="Seu e-mail da Google Play"
                            className="pl-10 h-12 bg-zinc-900 border-zinc-700 focus:ring-green-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" size="lg" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                        Inscrever-se no Beta
                    </Button>
                </div>
            </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12">
        <div className="container mx-auto px-4 text-center">
            <p className="text-zinc-500 text-sm">
              © {new Date().getFullYear()} Rachinha.com. Todos os direitos reservados.
            </p>
        </div>
      </footer>
    </div>
  );
}