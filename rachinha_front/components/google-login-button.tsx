"use client"

import { useState } from "react"
import { useGoogleLogin } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { checkGoogleStatus, authenticateGoogle, googleLink, getConnections } from "@/services/authService"

interface GoogleLoginButtonProps {
    onNewUser?: (idToken: string) => void;
    mode?: "auth" | "link";
    onSuccess?: () => void;
}

export function GoogleLoginButton({ onNewUser, mode = "auth", onSuccess }: GoogleLoginButtonProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const loginGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setIsLoading(true)
            try {
                const token = tokenResponse.access_token;
                
                if (mode === "link") {
                    // Direct link for logged in users
                    await googleLink(token, "", ""); 
                    toast({ title: "Sucesso!", description: "Conta Google vinculada com sucesso." });
                    if (onSuccess) onSuccess();
                    return;
                }

                // Auth flow
                const { status } = await checkGoogleStatus(token);

                if (status === "linked" || status === "email_match") {
                    const data = await authenticateGoogle(token);
                    if (data.access_token) {
                        toast({ title: "Login realizado!", description: "Bem-vindo de volta!" });
                        if (onSuccess) onSuccess();
                        router.push("/user/home");
                    }
                } else if (status === "new_user") {
                    if (onNewUser) {
                        onNewUser(token);
                    }
                }
            } catch (error: any) {
                console.error("Google Error:", error);
                toast({
                    title: "Erro no Google",
                    description: error.message || "Não foi possível realizar a operação.",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        },
        onError: () => toast({ title: "Erro", description: "Falha ao conectar com Google", variant: "destructive" }),
    });

    return (
        <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-10 font-bold border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white transition-all"
            onClick={() => loginGoogle()}
            disabled={isLoading}
        >
            {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <FcGoogle className="h-5 w-5" />
            )}
            {mode === "link" ? "Vincular Google" : "Entrar com o Google"}
        </Button>
    )
}
