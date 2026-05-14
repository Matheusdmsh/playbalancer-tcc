"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, ChevronRight, Users, Calendar, Search, Star, ArrowRight } from "lucide-react"
import { getToken } from "@/services/authService"

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (token) {
      router.replace("/home")
    } else {
      setIsLoading(false)
    }
  }, [router])

  if (isLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando...</div>;
  }

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

            <nav className="hidden md:flex items-center gap-8">
              <Link href="#como-funciona" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Como funciona
              </Link>
              <Link href="#para-jogadores" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Para jogadores
              </Link>
              <Link href="#para-proprietarios" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Para proprietários
              </Link>
              <Link href="#depoimentos" className="text-sm text-zinc-400 hover:text-white transition-colors">
                Depoimentos
              </Link>
            </nav>

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
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0">
                Novo jeito de jogar
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Encontre e reserve quadras esportivas em minutos
              </h1>
              <p className="text-lg text-zinc-400">
                Rachinha.com conecta jogadores a quadras disponíveis. Reserve online, jogue offline e divirta-se com seus
                amigos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                    Comece agora
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/anunciar">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-green-500 text-white hover:bg-green-500/20 w-full sm:w-auto"
                  >
                    Anuncie seu espaço
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-2">
                    {["/assets/Basketball.png", "/assets/Volleyball.png", "/assets/BeachTennis.png", "/assets/Handball.png"].map(
                    (src, i) => (
                      <Image
                      key={i}
                      src={src}
                      alt={`Usuário ${i + 1}`}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border-2 border-black object-cover bg-zinc-700"
                      />
                    )
                    )}
                </div>
                <p className="text-sm text-zinc-400">
                  <span className="text-white font-bold">+1000</span> usuários ativos na plataforma
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-yellow-500 rounded-lg blur opacity-30"></div>
              <div className="relative bg-zinc-900 rounded-lg overflow-hidden">
                <Image
                  src="/assets/home_partner.png?height=600&width=800"
                  alt="Quadra esportiva"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0 mb-4">Como funciona</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simples, rápido e prático</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Encontrar e reservar quadras nunca foi tão fácil. Siga estes passos simples e comece a jogar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Search className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Encontre</h3>
                <p className="text-zinc-400">
                  Busque quadras por localização, esporte, preço ou disponibilidade. Filtre de acordo com suas
                  preferências.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Reserve</h3>
                <p className="text-zinc-400">
                  Escolha o horário disponível, faça sua reserva e pague online com segurança. Receba confirmação
                  instantânea.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Jogue</h3>
                <p className="text-zinc-400">
                  Convide seus amigos, compareça no horário marcado e divirta-se. Avalie a quadra após a experiência.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Para jogadores */}
      <section id="para-jogadores" className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-yellow-500 rounded-lg blur opacity-30"></div>
                <div className="relative bg-zinc-900 rounded-lg overflow-hidden">
                  <Image
                    src="/assets/home_friends.png?height=600&width=800"
                    alt="Jogadores em quadra"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0">Para jogadores</Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Encontre a quadra perfeita para seu jogo</h2>
              <p className="text-zinc-400">
                Seja para um rachinha.com com amigos, um treino profissional ou uma partida casual, temos a quadra ideal
                para você.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Diversidade de esportes</p>
                    <p className="text-sm text-zinc-400">
                      Futebol, basquete, vôlei, tênis e muito mais. Escolha seu esporte favorito.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Reservas flexíveis</p>
                    <p className="text-sm text-zinc-400">
                      Reserve com antecedência ou encontre horários disponíveis para o mesmo dia.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Pagamento seguro</p>
                    <p className="text-sm text-zinc-400">
                      Pague online com segurança e receba confirmação instantânea da sua reserva.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Convide amigos</p>
                    <p className="text-sm text-zinc-400">
                      Compartilhe sua reserva e organize seu time diretamente pela plataforma.
                    </p>
                  </div>
                </li>
              </ul>
              <Link href="/login">
                <Button className="bg-green-500 hover:bg-green-600">
                  Encontrar quadras
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Para proprietários */}
      <section id="para-proprietarios" className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0">
                Para proprietários
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">Gerencie seu espaço esportivo com eficiência</h2>
              <p className="text-zinc-400">
                Aumente a ocupação das suas quadras, automatize reservas e gerencie seu negócio em um só lugar.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Aumente sua visibilidade</p>
                    <p className="text-sm text-zinc-400">
                      Apareça para milhares de jogadores que buscam quadras na sua região.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Automatize reservas</p>
                    <p className="text-sm text-zinc-400">
                      Esqueça as planilhas e agendas manuais. Gerencie tudo online e em tempo real.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Receba pagamentos online</p>
                    <p className="text-sm text-zinc-400">
                      Receba pagamentos antecipados e reduza cancelamentos de última hora.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Relatórios detalhados</p>
                    <p className="text-sm text-zinc-400">
                      Acompanhe o desempenho do seu negócio com relatórios e estatísticas.
                    </p>
                  </div>
                </li>
              </ul>
              <Link href="/anunciar">
                <Button className="bg-green-500 hover:bg-green-600">
                  Anunciar meu espaço
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div>
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-yellow-500 rounded-lg blur opacity-30"></div>
                <div className="relative bg-zinc-900 rounded-lg overflow-hidden">
                  <Image
                    src="/assets/home_owner.png?height=600&width=800"
                    alt="Gestão de quadras"
                    width={800}
                    height={600}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="py-20 bg-gradient-to-r from-green-500/10 to-yellow-500/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500 mb-2">+1000</p>
              <p className="text-zinc-400">Usuários ativos</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500 mb-2">+500</p>
              <p className="text-zinc-400">Quadras cadastradas</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500 mb-2">+5000</p>
              <p className="text-zinc-400">Reservas realizadas</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-green-500 mb-2">+20</p>
              <p className="text-zinc-400">Cidades atendidas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section id="depoimentos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0 mb-4">Depoimentos</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">O que nossos usuários dizem</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Veja o que jogadores e proprietários de quadras estão falando sobre a plataforma Rachinha.com.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-zinc-400 mb-4">
                  "Encontrar quadras para jogar com os amigos sempre foi um desafio. Com o Rachinha.com, consigo reservar em
                  minutos e ainda convidar todo mundo pelo app. Sensacional!"
                </p>
                <div className="flex items-center gap-3">
                    <Image
                    src="/assets/joao_silva.png"
                    alt="João Silva"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                    />
                  <div>
                    <p className="font-medium">João Silva</p>
                    <p className="text-xs text-zinc-500">Jogador de futebol</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-zinc-400 mb-4">
                  "Como proprietário de uma arena com 5 quadras, o Rachinha.com revolucionou meu negócio. Reduzi
                  cancelamentos, aumentei a ocupação e tenho tudo organizado em um só lugar."
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src="/assets/carlos_oliveira.png"
                    alt="Carlos Oliveira"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                  />
                  <div>
                    <p className="font-medium">Carlos Oliveira</p>
                    <p className="text-xs text-zinc-500">Proprietário de arena</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-zinc-400 mb-4">
                  "Adoro a facilidade de encontrar quadras de vôlei perto de casa. Os filtros são ótimos e as avaliações
                  ajudam muito a escolher os melhores lugares para jogar."
                </p>
                <div className="flex items-center gap-3">
                    <Image
                    src="/assets/ana_souza.png"
                    alt="Ana Souza"
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover bg-zinc-800"
                    />
                  <div>
                    <p className="font-medium">Ana Souza</p>
                    <p className="text-xs text-zinc-500">Jogadora de vôlei</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30 border-0 mb-4">
              Perguntas frequentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Dúvidas comuns</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Encontre respostas para as perguntas mais frequentes sobre a plataforma Rachinha.com.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-bold mb-2">Como faço para reservar uma quadra?</h3>
              <p className="text-zinc-400">
                Basta criar uma conta, buscar quadras disponíveis, selecionar o horário desejado e confirmar a reserva
                com pagamento online.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Posso cancelar minha reserva?</h3>
              <p className="text-zinc-400">
                Sim, você pode cancelar com até 24 horas de antecedência e receber reembolso total. Cancelamentos com
                menos de 24 horas estão sujeitos à política de cada quadra.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Como anuncio minha quadra na plataforma?</h3>
              <p className="text-zinc-400">
                Clique em "Anuncie seu espaço", crie uma conta de administrador, cadastre suas quadras com fotos e
                informações detalhadas e comece a receber reservas.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Quais são as taxas para proprietários?</h3>
              <p className="text-zinc-400">
                Cobramos uma comissão de 10% sobre cada reserva realizada. Não há taxas fixas ou mensalidades, você só
                paga quando recebe.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Como funciona o pagamento?</h3>
              <p className="text-zinc-400">
                Os pagamentos são processados de forma segura através da plataforma. Os valores são transferidos para os
                proprietários em até 7 dias após a conclusão da reserva.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-2">Posso convidar amigos para jogar?</h3>
              <p className="text-zinc-400">
                Sim! Após fazer sua reserva, você pode convidar amigos diretamente pela plataforma, compartilhando um
                link ou adicionando seus emails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-green-500/20 to-yellow-500/20 rounded-2xl p-8 md:p-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Pronto para começar?</h2>
              <p className="text-zinc-400 mb-8">
                Junte-se a milhares de jogadores e proprietários que já estão usando o Rachinha.com para transformar a forma
                como reservamos quadras esportivas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/login">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 w-full sm:w-auto">
                    Criar conta grátis
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/anunciar">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-green-500 text-white hover:bg-green-500/20 w-full sm:w-auto"
                  >
                    Anunciar meu espaço
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
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
              <p className="text-zinc-400 text-sm">
                A plataforma que conecta jogadores a quadras esportivas de forma simples e rápida.
              </p>
            </div>

            <div>
              <h3 className="font-bold mb-4">Para Jogadores</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-zinc-400 hover:text-white text-sm">
                    Encontrar quadras
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-zinc-400 hover:text-white text-sm">
                    Como reservar
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-zinc-400 hover:text-white text-sm">
                    Convidar amigos
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-zinc-400 hover:text-white text-sm">
                    Pagamentos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Para Proprietários</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/anunciar" className="text-zinc-400 hover:text-white text-sm">
                    Anunciar espaço
                  </Link>
                </li>
                <li>
                  <Link href="/anunciar" className="text-zinc-400 hover:text-white text-sm">
                    Gestão de quadras
                  </Link>
                </li>
                <li>
                  <Link href="/anunciar" className="text-zinc-400 hover:text-white text-sm">
                    Receber pagamentos
                  </Link>
                </li>
                <li>
                  <Link href="/anunciar" className="text-zinc-400 hover:text-white text-sm">
                    Relatórios
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white text-sm">
                    Sobre nós
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white text-sm">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white text-sm">
                    Termos de uso
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-zinc-400 hover:text-white text-sm">
                    Política de privacidade
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-zinc-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-zinc-500 text-sm">
              © {new Date().getFullYear()} Rachinha.com. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Link href="#" className="text-zinc-400 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
