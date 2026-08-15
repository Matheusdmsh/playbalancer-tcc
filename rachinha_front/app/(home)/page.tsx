"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { ArrowRight, Mail, Users, Calendar, WalletCards, ShieldCheck, CheckCircle } from "lucide-react";
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
                    Organize seu esporte favorito. Viva o jogo.
                </h1>
                <p className="text-lg text-zinc-400 mt-6">
                    Menos tempo organizando. Mais tempo jogando. Deixe tudo mais simples com o Rachinha.com.
                </p>
            </div>
            <div className="flex justify-center items-center">
              <div className="relative h-72 w-72 md:h-[660px] md:w-[600px]">
              <Image
                src="/assets/futebol.jpg"
                alt="Amigos comemorando"
                layout="fill"
                objectFit="cover"
              />
              </div>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que seu racha precisa</h2>
                <p className="text-zinc-400 max-w-2xl mx-auto">
                Menos tempo organizando. Mais tempo jogando. Cuide da turma, dos jogos e das cotnas em um só lugar. 
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <Users className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Monte sua turma</h3>
                  <p className="text-zinc-400">
                      Convide jogadores, organize seus grupos e mantenha todo mundo alinhado.
                  </p>
              </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                      <Calendar className="h-10 w-10 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Marque o próximo jogo</h3>
                  <p className="text-zinc-400">
                      Crie jogos únicos ou recorrentes e confirme a presença dos jogadores com facilidade. 
                  </p>
              </div>

                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                        <WalletCards className="h-10 w-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Controle Financeiro</h3>
                    <p className="text-zinc-400">
                        Seja habilidoso, registre os pagamentos e despesas com facilidade e transparência.
                    </p>
                </div>
            </div>
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
