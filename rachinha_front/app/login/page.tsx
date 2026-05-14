"use client";

import { useToast } from "@/components/ui/use-toast" 
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
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

import { getToken, login, register, authenticateGoogle, checkGoogleStatus, googleRegister, googleLink } from "@/services/authService";
import { FcGoogle } from "react-icons/fc";
import { Eye, EyeOff, Loader2, ArrowLeft, UserPlus, Link2 } from "lucide-react";
// import { GoogleAuthModal } from "@/components/google-auth-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { GoogleLoginButton } from "@/components/google-login-button";
import { AppleLoginButton } from "@/components/apple-login-button";

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
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [googleStep, setGoogleStep] = useState<"login" | "setup">("login");
  const [googleInfo, setGoogleInfo] = useState<any>(null);
  const [googlePassword, setGooglePassword] = useState("");
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState("");
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [showGoogleConfirmPassword, setShowGoogleConfirmPassword] = useState(false);
  const { toast } = useToast()

  const searchParams = useSearchParams();

  useEffect(() => {
    const token = getToken();
    const externalTempToken = searchParams.get('temp_token');

    if (token) {
      router.replace("/user/home"); 
    } else {
      if (externalTempToken) {
          handleGoogleSetupTrigger(externalTempToken);
      }
      setIsLoading(false); 
    }
  }, [router, searchParams]);

  const handleGoogleSetupTrigger = async (token: string, name?: string) => {
    try {
        let payload: any;
        if (token.includes(".") && token.split(".").length === 3) {
            // It's a JWT (id_token)
            payload = JSON.parse(atob(token.split(".")[1]));
        } else {
            // Try to fetch from Google if it looks like an opaque token
            try {
              const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                payload = await response.json();
              }
            } catch (e) {
              console.log("Not a google token or failed to fetch");
            }
        }

        setGoogleInfo({
            email: payload?.email || "",
            name: name || payload?.name || "",
            picture: payload?.picture || "",
            given_name: payload?.given_name || name?.split(' ')[0] || payload?.name?.split(' ')[0] || ""
        });
        setTempToken(token);
        setGoogleStep("setup");
    } catch (e) {
        console.error("Error processing auth token:", e);
        toast({ title: "Erro", description: "Não foi possível obter dados da conta.", variant: "destructive" });
    }
  };

  // Google handling logic moved to GoogleLoginButton component

  const handleGoogleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;

    if (googlePassword && googlePassword !== googleConfirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (googlePassword && googlePassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
        await googleRegister(tempToken, username, name || undefined, googlePassword || undefined);
        toast({ title: "Conta criada!", description: "Bem-vindo ao Rachinha!" });
        router.push("/user/home");
    } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGoogleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) return;
    setIsSubmitting(true);
    try {
        await googleLink(tempToken, email, password); // usa email/password do estado local
        toast({ title: "Contas vinculadas!", description: "Quase pronto!" });
        router.push("/user/home");
    } catch (err: any) {
        toast({ title: "Erro no vínculo", description: err.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  
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
          <Image src="/assets/logo.svg" alt="Logo" width={32} height={32} />
          <span className="text-xl font-bold text-white">
            rachinha<span className="text-green-500">.com</span>
          </span>
        </Link>

        {googleStep === "setup" && googleInfo ? (
            <Card className="border-green-500/20 shadow-xl bg-zinc-900">
                <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                        <Avatar className="h-12 w-12 border-2 border-green-500">
                            <AvatarImage src={googleInfo.picture} />
                            <AvatarFallback>{googleInfo.given_name?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">Olá, {googleInfo.given_name}!</CardTitle>
                            <CardDescription className="text-xs">Identificamos o e-mail {googleInfo.email}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="register" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="register">Criar Conta</TabsTrigger>
                            <TabsTrigger value="link">Vincular</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="register" className="space-y-4 pt-4">
                            <form onSubmit={handleGoogleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Usuário (@)</Label>
                                    <Input 
                                        value={username} 
                                        onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                                        placeholder="ex: neymarjr"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Apelido</Label>
                                    <Input 
                                        value={name} 
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Como devemos te chamar"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        Senha
                                        <span className="text-xs text-zinc-500 font-normal">(opcional — deixe em branco para usar só o Google)</span>
                                    </Label>
                                    <div className="relative">
                                        <Input 
                                            type={showGooglePassword ? "text" : "password"}
                                            value={googlePassword} 
                                            onChange={e => setGooglePassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowGooglePassword(!showGooglePassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 focus:outline-none"
                                        >
                                            {showGooglePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                {googlePassword && (
                                    <div className="space-y-2">
                                        <Label>Confirmar senha</Label>
                                        <div className="relative">
                                            <Input 
                                                type={showGoogleConfirmPassword ? "text" : "password"}
                                                value={googleConfirmPassword} 
                                                onChange={e => setGoogleConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowGoogleConfirmPassword(!showGoogleConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-300 focus:outline-none"
                                            >
                                                {showGoogleConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <Button className="w-full bg-green-500 hover:bg-green-600" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Criar e Entrar"}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="link" className="space-y-4 pt-4">
                            <form onSubmit={handleGoogleLink} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Email ou Usuário</Label>
                                    <Input 
                                        value={email} 
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Sua conta existente"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Senha</Label>
                                    <div className="relative">
                                        <Input 
                                            type={showLoginPassword ? "text" : "password"} 
                                            value={password} 
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="Sua senha atual"
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
                                </div>
                                <Button className="w-full bg-green-500 hover:bg-green-600" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Vincular e Entrar"}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>


                </CardContent>
                <CardFooter>
                    <Button variant="ghost" className="w-full text-zinc-400 text-xs" onClick={() => setGoogleStep("login")}>
                        <ArrowLeft className="h-3 w-3 mr-2" /> Voltar para o Login
                    </Button>
                </CardFooter>
            </Card>
        ) : (
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
                    Entre com sua conta para gerenciar suas turmas
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
                      <div className="flex items-center w-full my-4">
                        <div className="flex-grow h-px bg-black" />
                        <span className="mx-3 text-zinc-400 text-sm font-medium">ou</span>
                        <div className="flex-grow h-px bg-black" />
                      </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                      <GoogleLoginButton onNewUser={handleGoogleSetupTrigger} />
                      <AppleLoginButton onNewUser={handleGoogleSetupTrigger} />
                    </div>
                    
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
                    Crie sua conta para gerenciar suas turmas
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
                    <div className="flex items-center w-full my-4">
                      <div className="flex-grow h-px bg-black" />
                      <span className="mx-3 text-zinc-400 text-sm font-medium">ou</span>
                      <div className="flex-grow h-px bg-black" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full mt-4">
                      <GoogleLoginButton onNewUser={handleGoogleSetupTrigger} />
                      <AppleLoginButton onNewUser={handleGoogleSetupTrigger} />
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}