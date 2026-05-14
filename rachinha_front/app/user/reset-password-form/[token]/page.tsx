"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { resetPassword } from "@/services/users"


const formSchema = z.object({
  new_password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres." }),
  confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
  message: "As senhas não coincidem.",
  path: ["confirm_password"],
});

type FormValues = z.infer<typeof formSchema>

export default function ResetPasswordFormPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        new_password: "",
        confirm_password: "",
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      await resetPassword(token, data.new_password)

      toast({
        title: "Senha Redefinida!",
        description: "Sua senha foi alterada com sucesso. Você já pode fazer login.",
        className: "bg-green-500/10 border-green-500/50 text-white"
      })

      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível redefinir a senha. O link pode ser inválido ou ter expirado.",
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
          <CardTitle>Redefinir Senha</CardTitle>
          <CardDescription>
            Crie uma nova senha para sua conta.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    <FormField
                        control={form.control}
                        name="new_password"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="new_password">Nova Senha</Label>
                                <FormControl>
                                    <Input id="new_password" type="password" {...field} className="bg-zinc-800 border-zinc-700" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="confirm_password"
                        render={({ field }) => (
                            <FormItem>
                                <Label htmlFor="confirm_password">Confirmar Senha</Label>
                                <FormControl>
                                    <Input id="confirm_password" type="password" {...field} className="bg-zinc-800 border-zinc-700" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={isLoading}>
                    {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                    </Button>
                </CardFooter>
            </form>
        </Form>
      </Card>
    </div>
  )
}