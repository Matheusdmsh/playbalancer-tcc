"use client";

import { useToast } from "@/components/ui/use-toast"
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { getToken, login, register } from "@/services/authService";
import { Eye, EyeOff, Loader2 } from "lucide-react";
// UI components

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    const token = getToken();

    if (token) {
      router.replace("/user/home");
    } else {
      setIsLoading(false);
    }
  }, [router]);

  

  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-black text-white">Carregando...</div>;
  }

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault(); // Impede o recarregamento
  setIsSubmitting(true);
  try {
    // Tenta fazer o login
    const data = await login(email, password);
    console.log("Login bem-sucedido:", data);

    // Mostra o toast de sucesso
    toast({
      title: "Login realizado!",
      description: "Você entrou com sucesso.",
    });

    // Redireciona após um pequeno delay para o toast ser visível
    setTimeout(() => {
      router.push("/user/home");
    }, 1000);

  } catch (err) {
    // Se o login falhar, o código entra aqui
    console.error(err);

    // Mostra o toast de erro
    toast({
      title: "Erro ao fazer login!",
      description: "Verifique seu email/usuário e senha e tente novamente.",
      variant: "destructive",
    });
  } finally {
    // Garante que o estado de "submitting" seja resetado, não importa se deu certo ou errado
    setIsSubmitting(false);
  }
};
  
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await register(name, username, email, password);
      console.log("Cadastro bem-sucedido:", data);
      toast({
        title: "Conta criada!",
        description: "Ative sua conta através do link enviado para seu email.",
      })
      setTimeout(() => {
    router.push("/user/home");
  }, 1000);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Erro ao criar conta",
        description: err.message || "Ocorreu um erro ao tentar criar sua conta.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <Image src="/assets/logobalanca.svg" alt="Logo" width={32} height={32} />
          <span className="text-xl font-bold text-white">
            <span className="text-green-500">Play</span>Balance
          </span>
        </Link>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Acesse sua conta e continue organizando seus rachas.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email-or-username" className="text-sm font-medium">
                        Email ou usuário
                      </label>
                      <Input
                        id="email-or-username"
                        type="text"
                        placeholder="seu@email.com ou usuário"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        Senha
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 focus:outline-none"
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          variant="link"
                          className="mt-2 text-zinc-400 p-0 h-auto"
                          onClick={() => router.push("/forgot-password")}
                          type="button"
                        >
                          Esqueceu a senha?
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <Button
                      type="submit"
                      className=" mt-5 w-full bg-green-500 hover:bg-green-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Entrando..." : "Entrar"}
                    </Button>
                    
                    {isSubmitting && (
                        <div className="flex items-center justify-center gap-2 mt-2 text-zinc-400 text-sm">
                            <Loader2 className="animate-spin h-4 w-4" />
                            <span>Processando login...</span>
                        </div>
                    )}
                    {/* <Button variant="link" className="mt-2 text-sm text-zinc-400" onClick={() => router.push("/admin")}>
                      Entrar como administrador
                    </Button> */}
                    {/* link para esqueceu a senha */}
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Criar conta</CardTitle>
                  <CardDescription>
                    Cadastre-se e comece a gerenciar seus rachas.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Nome
                      </label>
                      <Input
                        id="name"
                        placeholder="Seu nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="username" className="text-sm font-medium">
                        Usuário
                      </label>
                      <Input
                        id="username"
                        placeholder="Seu usuário"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="register-email"
                        className="text-sm font-medium"
                      >
                        Email
                      </label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="register-password"
                        className="text-sm font-medium"
                      >
                        Senha
                      </label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 focus:outline-none"
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col">
                    <Button
                      type="submit"
                      className="w-full bg-green-500 hover:bg-green-600"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Criando conta..." : "Criar conta"}
                    </Button>
                    
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}