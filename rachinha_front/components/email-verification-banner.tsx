"use client"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/services/users"
import { resendEmailVerification } from "@/services/authService"
import { useToast } from "@/components/ui/use-toast"

export function EmailVerificationBanner() {
  const [isVerified, setIsVerified] = useState<boolean | null>(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const user = await getCurrentUser()
        if (user && user.is_email_verified !== undefined) {
          setIsVerified(user.is_email_verified)
        }
      } catch (error) {
        console.error("Erro ao verificar email do usuário", error)
      }
    }
    checkVerification()
  }, [])

  const handleResend = async () => {
    setIsLoading(true)
    try {
      await resendEmailVerification()
      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada e spam.",
      })
      setIsVisible(false); // hides after resending
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isVerified || !isVisible) {
    return null
  }

  return (
    <div className="bg-yellow-500/20 border-b border-yellow-500/50 text-yellow-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-center sm:text-left">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
        <p>Email não confirmado. Você precisa confirmar o seu email para usar todos os recursos do Rachinha.</p>
      </div>
      <Button 
        onClick={handleResend} 
        disabled={isLoading} 
        variant="outline" 
        size="sm"
        className="bg-yellow-500/10 border-yellow-500/50 hover:bg-yellow-500/30 text-yellow-400 whitespace-nowrap"
      >
        {isLoading ? "Enviando..." : "Reenviar confirmação"}
      </Button>
    </div>
  )
}
