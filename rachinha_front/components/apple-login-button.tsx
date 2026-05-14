"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { FaApple } from "react-icons/fa"
import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { authenticateApple, appleLink } from "@/services/authService"

interface AppleLoginButtonProps {
    onNewUser?: (idToken: string, name?: string) => void;
    mode?: "auth" | "link";
    onSuccess?: () => void;
}

export function AppleLoginButton({ onNewUser, mode = "auth", onSuccess }: AppleLoginButtonProps) {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)
    const [isInitializing, setIsInitializing] = useState(true)

    const handleAppleResponse = useCallback(async (response: any) => {
        if (!response || !response.authorization || !response.authorization.id_token) {
            console.error("Apple Auth Error: Missing token", response);
            return;
        }

        setIsLoading(true)
        try {
            const idToken = response.authorization.id_token;
            const user = response.user; 
            const name = user ? `${user.name.firstName} ${user.name.lastName}` : undefined;

            if (mode === "link") {
                await appleLink(idToken);
                toast({ title: "Sucesso!", description: "Conta Apple vinculada com sucesso." });
                if (onSuccess) onSuccess();
                return;
            }

            const data = await authenticateApple(idToken, name);

            if (data.status === "success") {
                toast({ title: "Login realizado!", description: "Bem-vindo de volta!" });
                if (onSuccess) onSuccess();
                router.push("/user/group");
            } else if (data.status === "setup_required") {
                if (onNewUser) {
                    onNewUser(idToken, name);
                }
            }
        } catch (error: any) {
            console.error("Apple Auth Error:", error);
            toast({
                title: "Erro na Apple",
                description: error.message || "Não foi possível realizar o login.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [onNewUser, onSuccess, router, toast]);

    const initApple = useCallback(() => {
        if (typeof window === "undefined") return false;
        if (!(window as any).AppleID || !(window as any).AppleID.auth) return false;

        const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "com.rachinha.atena.web";
        const redirectURI = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI || `${window.location.origin}/login`;

        console.log("Iniciando Apple ID with ClientID:", clientId, "Redirect:", redirectURI);
        
        try {
            (window as any).AppleID.auth.init({
                clientId: clientId,
                scope: "name email",
                redirectURI: redirectURI,
                usePopup: true
            });
            setIsScriptLoaded(true);
            setIsInitializing(false);
            return true;
        } catch (err: any) {
            console.error("Apple ID initialization failed:", err);
            setIsInitializing(false);
            return false;
        }
    }, []);

    useEffect(() => {
        const appleToken = searchParams.get("apple_token")
        if (appleToken) {
            console.log("Apple token detected in URL, processing login...")
            handleAppleResponse({ authorization: { id_token: appleToken } })

            const url = new URL(window.location.href)
            url.searchParams.delete("apple_token")
            window.history.replaceState({}, "", url.pathname)
        }
    }, [searchParams, handleAppleResponse])

    useEffect(() => {
        if (typeof window === "undefined") return;

        // Tenta inicializar se o script já estiver lá (carregado via layout.tsx)
        if (initApple()) return;

        // Caso contrário, fica monitorando até o Script do Next.js carregar
        const intervalId = setInterval(() => {
            if (initApple()) {
                clearInterval(intervalId);
            }
        }, 1000);

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            setIsInitializing(false);
        }, 8000);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, [initApple]);

    const handleButtonClick = async () => {
        // FALLBACK: Se o script não carregou ou foi bloqueado, tentamos o redirecionamento direto OAuth2
        if (!(window as any).AppleID || !(window as any).AppleID.auth || !isScriptLoaded) {
            console.warn("Apple SDK missing or blocked. Using Direct OAuth Fallback.");

            const clientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || "com.rachinha.atena.web";
            const backendUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";
            const redirectUri = `${backendUrl}/auth/apple/callback/web`;

            const scope = "name email";
            const state = Math.random().toString(36).substring(7);

            const authUrl = `https://appleid.apple.com/auth/authorize?` +
                `client_id=${clientId}&` +
                `redirect_uri=${encodeURIComponent(redirectUri)}&` +
                `response_type=code id_token&` +
                `scope=${encodeURIComponent(scope)}&` +
                `response_mode=form_post&` +
                `state=${state}`;

            console.log("Redirecting to Apple Auth:", authUrl);
            window.location.href = authUrl;
            return;
        }

        try {
            setIsLoading(true);
            const response = await (window as any).AppleID.auth.signIn();
            await handleAppleResponse(response);
        } catch (error: any) {
            console.error("Apple Sign-In error:", error);
            if (error && error.error !== "user_cancelled_popup") {
                toast({ title: "Erro", description: "Falha ao conectar com Apple", variant: "destructive" });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-10 font-bold border-zinc-800 bg-black hover:bg-zinc-900 text-white transition-all"
            onClick={handleButtonClick}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <FaApple className="h-5 w-5" />
            )}
            {isLoading ? "Processando..." : mode === "link" ? "Vincular Apple" : "Entrar com Apple"}
        </Button>
    )
}
