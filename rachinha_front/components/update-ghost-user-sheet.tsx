"use client"

import { useState } from "react"
import { ChevronLeft, Send, MailPlus, X } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { User } from "@/interface/users"
import { updateGhostUserEmail } from "@/services/users"

interface UpdateGhostUserSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  member: User | null
  onInviteSent: () => void
}

export function UpdateGhostUserSheet({ open, onOpenChange, member, onInviteSent }: UpdateGhostUserSheetProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSendInvite = async () => {
    if (!member || !email) {
      toast({ title: "Erro", description: "O e-mail é obrigatório.", variant: "destructive" })
      return
    }
    setIsSending(true)
    try {
      await updateGhostUserEmail(member._id, email)
      toast({ title: "Sucesso!", description: `Convite enviado para ${email}.` })
      onInviteSent()
      handleClose()
    } catch (error: any) {
      toast({ title: "Erro ao enviar convite", description: error.message, variant: "destructive" })
    } finally {
      setIsSending(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-zinc-900 border-zinc-800 w-[360px] sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            
            <div className="flex gap-4 items-center flex-1">
              <MailPlus className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <SheetTitle>Convidar {member?.name}</SheetTitle>
                <SheetDescription className="text-xs">
                  Envie um convite para o jogador se cadastrar
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              Digite o e-mail do jogador para que ele possa se cadastrar na plataforma e entrar para a turma.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-zinc-200">
              E-mail do Jogador
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                <Send className="h-4 w-4" />
              </span>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-800 border-zinc-700 pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 mt-4 border-t border-zinc-700">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSending}
              className="flex-1 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
            >
            <X className="h-4 w-4" />
              Cancelar
            </Button>
            <Button
            variant="outline"
              onClick={handleSendInvite}
              disabled={isSending || !email}
              className="flex-1 bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
            >
              {isSending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-green-400" />
                  Enviar Convite
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
