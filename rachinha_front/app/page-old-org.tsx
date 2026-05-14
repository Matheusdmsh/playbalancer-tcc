import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Calendar, ChevronRight, MessageCircle, ShieldCheck, Users, ClipboardList } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800">
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
                <Button className="bg-green-500 hover:bg-green-600">Cadastre-se</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-yellow-500/10 z-0"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-4xl mx-auto">
            A gestão do seu racha, finalmente simples e eficiente.
          </h1>
          <p className="text-lg text-zinc-400 mt-6 max-w-2xl mx-auto">
            Crie turmas, organize rachas, convide jogadores, separe times e gerencie o caixa. Tudo em um só lugar, sem
            complicação.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                Quero organizar meu racha
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="text-sm text-zinc-500 mt-4">Em breve disponível para iOS e Android.</p>
          <div className="flex justify-center gap-4 mt-8">
            {/* <Link href="https://play.google.com/store" target="_blank" rel="noopener noreferrer"> */}
              <Button
                size="lg"
                className="bg-white text-black hover:bg-zinc-100 flex items-center gap-2 px-6"
                disabled
              >
                <Image
                  src="/assets/playstore.svg"
                  alt="Google Play"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                Google Play
              </Button>
            {/* </Link> */}
            <Button
              size="lg"
              className="bg-white text-black flex items-center gap-2 px-6 opacity-60 cursor-not-allowed"
              disabled
            >
              <Image
                src="/assets/applestore.svg"
                alt="Apple Store"
                width={24}
                height={24}
                className="mr-2"
              />
              App Store
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo que o organizador precisa</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Ferramentas pensadas para acabar com a dor de cabeça na hora de organizar o futebol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Criação de Turmas</h3>
                <p className="text-zinc-400">
                  Monte suas turmas fixas de jogadores e mantenha todos organizados em um só lugar.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Agendamento de Rachas</h3>
                <p className="text-zinc-400">
                  Crie e agende os rachas para suas turmas com data, hora e local definidos.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                  <ClipboardList className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Lista de Presença Automática</h3>
                <p className="text-zinc-400">
                  Envie convites e tenha uma lista de presença automática para cada racha, sem precisar chamar um por um.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Separação de Times</h3>
                <p className="text-zinc-400">
                  O app equilibra e separa os times para você, acabando com as panelinhas.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                  <MessageCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Chat Integrado</h3>
                <p className="text-zinc-400">
                  Converse com a galera em um chat exclusivo para a turma e também em um chat para cada racha.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 text-center">
              <CardContent className="pt-8">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4 mx-auto">
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Gestão de Caixa</h3>
                <p className="text-zinc-400">
                  Controle as finanças da turma de forma transparente, registre pagamentos e despesas.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-green-500/20 to-yellow-500/20 rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Diga adeus à desorganização.</h2>
              <p className="text-zinc-400 mb-8">
                Cadastre-se para ser um dos primeiros a usar o Rachinha.com e transforme a gestão dos seus rachas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                    Começar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
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
  )
}