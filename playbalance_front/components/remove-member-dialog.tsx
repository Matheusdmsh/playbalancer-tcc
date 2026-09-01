"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/interface/users";
import { Loader2 } from "lucide-react";

interface RemoveMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  member: User | null;
  isRemoving: boolean;
}

export function RemoveMemberDialog({
  isOpen,
  onClose,
  onConfirm,
  member,
  isRemoving,
}: RemoveMemberDialogProps) {
  if (!member) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que deseja remover{" "}
            <span className="font-bold text-white">{member.name}</span> da
            turma? Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} disabled={isRemoving}>
              Cancelar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isRemoving}
            >
              {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover Membro
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}