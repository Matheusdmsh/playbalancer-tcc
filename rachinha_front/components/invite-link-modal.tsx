"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { generateInviteLink, Group } from "@/services/groups";
import { useState, useEffect } from "react";
import { Copy, RefreshCw, Loader2, Info } from "lucide-react";
import { User } from "@/interface/users";
import { isGroupAdmin } from "@/lib/groupPermissions";

interface InviteLinkSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  currentUser: User | null;
}

export function InviteLinkSheet({
  open,
  onOpenChange,
  group,
  currentUser,
}: InviteLinkSheetProps) {
  const [inviteLink, setInviteLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const canGenerateLink = isGroupAdmin(group, currentUser?._id);

  useEffect(() => {
    if (group?.invite_token) {
      setInviteLink(`https://rachinha.com/user/group/join/${group.invite_token}`);
    } else {
      setInviteLink("");
    }
  }, [group]);

  // Auto-gerar link quando o sheet abre e não há link (se for admin)
  useEffect(() => {
    if (open && canGenerateLink && !inviteLink && !isLoading) {
      handleGenerateLink();
    }
  }, [open, canGenerateLink]);

  const handleGenerateLink = async () => {
    if (!group) return;
    setIsLoading(true);
    try {
      const data = await generateInviteLink(group._id);
      setInviteLink(data.invite_link);
      // O ideal é que o objeto 'group' seja atualizado no pai para refletir a mudança
      // Mas, por simplicidade, apenas atualizamos o link localmente.
      toast({
        title: "Sucesso!",
        description: "Um novo link de convite foi gerado.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copiado!",
      description: "Link de convite copiado para a área de transferência.",
    });
  };

  const renderContent = () => {
    // Se o usuário é admin (dono ou admin), ele sempre pode gerar um link.
    if (canGenerateLink) {
      return (
        <>
          <div className="space-y-3">
            <Input 
              id="link" 
              value={inviteLink} 
              readOnly 
              placeholder="Gerando link de convite..." 
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleGenerateLink}
                disabled={isLoading}
                variant="outline"
                className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Gerando..." : "Novo Link"}
              </Button>
              <Button
              variant="outline"
                type="button"
                onClick={handleCopyLink}
                disabled={!inviteLink || isLoading}
                className="bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
              >
                <Copy className="mr-2 h-4 w-4 text-green-400 group-hover:text-green-400" />
                Copiar Link
              </Button>
            </div>
          </div>
        </>
      );
    }

    // Se não for o dono, verificamos se existe um link.
    if (inviteLink) {
      return (
        <>
          <p className="text-sm text-zinc-400 mb-4">
            Compartilhe este link para convidar novos membros para a turma.
          </p>
          <div className="space-y-3">
            <Input 
              id="link" 
              value={inviteLink} 
              readOnly 
              className="bg-zinc-800 border-zinc-700 text-zinc-100"
            />
            <Button
              variant="outline"
              type="button"
              onClick={handleCopyLink}
              className="w-full bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
            >
              <Copy className=" h-4 w-4 text-green-400 " />
              Copiar Link
            </Button>
          </div>
        </>
      );
    }

    // Se não for o dono e não houver link.
    return (
      <div className="mt-4 flex flex-col items-center justify-center text-center text-zinc-400 bg-zinc-800/50 p-4 rounded-md">
        <Info className="h-8 w-8 text-blue-500 mb-2" />
        <p className="font-semibold">Nenhum link de convite disponível</p>
        <p className="text-sm">Peça para o dono da turma gerar um novo link de convite.</p>
      </div>
    );
  };


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[450px] sm:w-[540px] bg-zinc-900 border-zinc-800 p-0 flex flex-col">
        <SheetHeader className="border-b border-zinc-800 p-6">
          <SheetTitle className="text-base">Convidar para a Turma</SheetTitle>
          <p className="text-xs text-zinc-400 mt-1 text-left">
            {canGenerateLink
              ? "Compartilhe este link para que outras pessoas possam entrar na sua turma."
              : "Convite para a turma."}
          </p>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderContent()}
        </div>
      </SheetContent>
    </Sheet>
  );
}