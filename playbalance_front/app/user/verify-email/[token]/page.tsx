"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader } from "lucide-react"
import { verifyEmail } from "@/services/users"

export default function VerifyEmailPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (token) {
      const verifyToken = async () => {
        try {
          await verifyEmail(token)
          setStatus("success")
          setMessage("Seu e-mail foi verificado com sucesso! Você pode agora fazer login.")
        } catch (error: any) {
          setStatus("error")
          setMessage(error.message || "Ocorreu um erro ao verificar seu e-mail. O link pode ter expirado.")
        }
      }
      verifyToken()
    }
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-center">Verificação de E-mail</CardTitle>
          <CardDescription className="text-center">
            Aguarde enquanto validamos seu cadastro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader className="h-8 w-8 animate-spin text-green-500" />
              <p className="text-zinc-400">Verificando...</p>
            </div>
          )}

          {status === "success" && (
            <Alert variant="default" className="bg-green-500/10 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">Sucesso!</AlertTitle>
              <AlertDescription className="text-white">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Erro na Verificação</AlertTitle>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <div className="p-6 pt-0">
          <Button onClick={() => router.push('/login')} className="w-full bg-green-500 hover:bg-green-600">
            Ir para o Login
          </Button>
        </div>
      </Card>
    </div>
  )
}