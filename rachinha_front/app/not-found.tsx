"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Lottie from "lottie-react";

export default function NotFound() {
  const [animationData, setAnimationData] = useState(null);

  // Carrega os dados da animação do arquivo JSON na pasta public
  useEffect(() => {
    fetch('/assets/lottie-404-animation.json')
      .then((response) => response.json())
      .then((data) => setAnimationData(data))
      .catch((error) => console.error("Erro ao carregar a animação:", error));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-white">
      <div className="container mx-auto flex max-w-4xl flex-col items-center justify-center gap-12 md:flex-row">
        {/* Coluna da Esquerda: Texto e Botão */}
        <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
          <p className="text-lg font-medium text-green-500">Erro 404</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
            Ih, essa caiu no vizinho!
          </h1>
          <p className="mt-6 text-base leading-7 text-zinc-400">
            A página que você tentou acessar não foi encontrada. Parece que essa bola foi longe demais. Mas não se preocupe, vamos te ajudar a voltar pro jogo.
          </p>
          <div className="mt-10">
            <Link href="/">
              <Button className="bg-green-500 text-black hover:bg-green-600">
                Voltar para o Início
              </Button>
            </Link>
          </div>
        </div>

        {/* Coluna da Direita: Animação Lottie */}
        <div className="flex-1" style={{ width: '100%', maxWidth: '500px' }}>
          {animationData && (
            <Lottie 
              animationData={animationData} 
              loop={true} 
            />
          )}
        </div>
      </div>
    </div>
  );
}