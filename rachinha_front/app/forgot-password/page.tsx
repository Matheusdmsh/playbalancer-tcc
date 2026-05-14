"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { forgotPassword } from "@/services/users"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await forgotPassword(email)
      toast({
        title: "Link Enviado!",
        description: "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
        className: "bg-green-500/10 border-green-500/50 text-white"
      })
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível processar a solicitação. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle>Esqueceu a Senha?</CardTitle>
          <CardDescription>
            Insira seu e-mail para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Link"}
            </Button>
            <Button variant="link" asChild>
                <Link href="/login">Voltar para o Login</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}