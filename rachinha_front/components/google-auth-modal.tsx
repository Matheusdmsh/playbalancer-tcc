'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode } from "jwt-decode"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import * as authService from "@/services/authService"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface TempGoogleToken {
  email: string
  name?: string
  given_name?: string
  picture?: string
  photo_url?: string
  provider?: string
  provider_user_id?: string
  sub?: string
  exp: number
}

interface GoogleAuthModalProps {
  tempToken: string
  onClose: () => void
}

export function GoogleAuthModal({ tempToken, onClose }: GoogleAuthModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [userData, setUserData] = useState<TempGoogleToken | null>(null)
  
  // States for registration
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  
  // States for linking
  const [linkUser, setLinkUser] = useState("")
  const [linkPassword, setLinkPassword] = useState("")

  useEffect(() => {
    try {
      const decoded = jwtDecode<TempGoogleToken>(tempToken)
      setUserData(decoded)
      
      const displayName = decoded.name || decoded.given_name || ""
      const initialNickname = decoded.given_name || displayName.split(' ')[0]
      const initialUsername = decoded.email.split('@')[0]

      // Set initial defaults
      setLinkUser(decoded.email)
      setUsername(initialUsername)
      setNickname(initialNickname)
    } catch (e) {
      console.error("Error decoding temp token", e)
      toast.error("Vínculo temporário inválido.")
      onClose()
    }
  }, [tempToken, onClose])

  const handleRegister = async () => {
    if (!username) {
      toast.error("Username é obrigatório")
      return
    }
    setLoading(true)
    try {
      await authService.googleRegister(tempToken, username, nickname)
      toast.success("Conta criada e vinculada com sucesso!")
      router.push("/user/home")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta")
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async () => {
    if (!linkUser || !linkPassword) {
      toast.error("Preencha as credenciais")
      return
    }
    setLoading(true)
    try {
      await authService.googleLink(tempToken, linkUser, linkPassword)
      toast.success("Conta vinculada com sucesso!")
      router.push("/user/home")
    } catch (error: any) {
      toast.error(error.message || "Erro ao vincular conta")
    } finally {
      setLoading(false)
    }
  }

  if (!userData) return null

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-[#0A0A0A] text-white border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userData.picture || userData.photo_url} />
              <AvatarFallback>{(userData.name || userData.given_name || "U")[0]}</AvatarFallback>
            </Avatar>
            Olá, {userData.given_name || (userData.name?.split(' ')[0]) || "usuário"}!
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Não encontramos um usuário vinculado ao e-mail {userData.email}. Como deseja prosseguir?
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="register" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
            <TabsTrigger value="register">Criar conta</TabsTrigger>
            <TabsTrigger value="link">Vincular existente</TabsTrigger>
          </TabsList>
          
          <TabsContent value="register" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="ex: neymar_jr"
                className="bg-zinc-900 border-zinc-800 focus:ring-green-500"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              />
              <p className="text-[10px] text-zinc-500">Este será seu identificador único na plataforma.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Apelido (Opcional)</Label>
              <Input
                id="nickname"
                placeholder="Como quer ser chamado"
                className="bg-zinc-900 border-zinc-800 focus:ring-green-500"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>
            <Button 
                onClick={handleRegister} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Criar minha conta
            </Button>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="linkUser">E-mail ou Username</Label>
              <Input
                id="linkUser"
                placeholder="Seu email ou @username"
                className="bg-zinc-900 border-zinc-800 focus:ring-green-500"
                value={linkUser}
                onChange={(e) => setLinkUser(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkPassword">Sua senha do Rachinha.com</Label>
              <Input
                id="linkPassword"
                type="password"
                placeholder="••••••••"
                className="bg-zinc-900 border-zinc-800 focus:ring-green-500"
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
              />
            </div>
            <p className="text-[10px] text-zinc-500">
              Ao vincular, você poderá entrar na sua conta atual usando este perfil do Google.
            </p>
            <Button 
                onClick={handleLink} 
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Vincular e entrar
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
