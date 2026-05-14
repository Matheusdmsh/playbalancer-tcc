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
import { Booking } from "@/interface/booking";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CancelBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  booking: Booking | null;
  isCancelling: boolean; // Renomeado de isDeleting para isCancelling
}

export function CancelBookingDialog({
  isOpen,
  onClose,
  onConfirm,
  booking,
  isCancelling,
}: CancelBookingDialogProps) {
  if (!booking) return null;

  const bookingDate = format(new Date(booking.start_time), "dd 'de' MMMM 'às' HH:mm", {
    locale: ptBR,
  });

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que deseja cancelar o racha de{" "}
            <span className="font-bold text-white">{booking.modality}</span> agendado para{" "}
            <span className="font-bold text-white">{bookingDate}</span>?
            <br />
            Esta ação não poderá ser revertida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" onClick={onClose} disabled={isCancelling}>
              Voltar
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, Cancelar Racha
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}