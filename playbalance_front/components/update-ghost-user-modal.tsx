import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Send } from "lucide-react";
import { User } from "@/interface/users";
import { updateGhostUserEmail } from "@/services/users";
import { Label } from "./ui/label";

interface UpdateGhostUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: User | null;
  onInviteSent: () => void;
}

export function UpdateGhostUserModal({ isOpen, onClose, member, onInviteSent }: UpdateGhostUserModalProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSendInvite = async () => {
    if (!member || !email) {
      toast({ title: "Erro", description: "O e-mail é obrigatório.", variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      await updateGhostUserEmail(member._id, email);
      toast({ title: "Sucesso!", description: `Convite enviado para ${email}.` });
      onInviteSent();
      handleOnClose();
    } catch (error: any) {
      toast({ title: "Erro ao enviar convite", description: error.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleOnClose = () => {
    setEmail("");
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOnClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Convidar {member?.name}</DialogTitle>
          <DialogDescription>
            Digite o e-mail do jogador para que ele possa se cadastrar na plataforma e entrar para a turma.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-2">
            <Label htmlFor="email">E-mail do Jogador</Label>
            <Input 
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
        </div>

        <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={handleOnClose}>Cancelar</Button>
            <Button 
              className="bg-blue-500 hover:bg-blue-600"
              onClick={handleSendInvite}
              disabled={isSending}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Convite
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}