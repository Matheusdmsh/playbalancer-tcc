"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { parseUTCDate } from "@/lib/utils";
import { Loader2, Pencil, MapPin, Save, X } from "lucide-react";
import { SportField } from "@/components/sport-field";
import { TimeField } from "@/components/time-field";
import { DateField } from "@/components/date-field";
import { DurationField } from "@/components/duration-field";
import { MaxPlayersField } from "@/components/max-players-field";
import { PriceField } from "@/components/price-field";

import { updateBooking } from "@/services/bookings";
import { Booking } from "@/interface/booking";

// Schema de validação
const formSchema = z.object({
  courtName: z.string().min(3, { message: "O nome da quadra é obrigatório." }),
  date: z.date().refine((val) => !!val, { message: "A data do racha é obrigatória." }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: "Formato de hora inválido.",
  }),
  duration: z.number().min(0.5, { message: "A duração mínima é de 30 minutos." }),
  sport: z.string().min(1, { message: "Selecione um esporte." }),
  maxPlayers: z.string().min(1, { message: "Selecione o máximo de jogadores." }),
  price: z.number().optional().nullable(),
  price_type: z.enum(["per_person", "total_split"]).optional(),
}).refine((data) => {
  if (data.price && data.price > 0) {
    return !!data.price_type;
  }
  return true;
}, {
  message: "Selecione o tipo de valor quando informar um preço",
  path: ["price_type"],
});

type FormValues = z.infer<typeof formSchema>;

interface EditBookingSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
  onBookingUpdated: () => void;
}

export function EditBookingSheet({
  isOpen,
  onOpenChange,
  booking,
  onBookingUpdated,
}: EditBookingSheetProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      courtName: "",
      startTime: "19:00",
      duration: 1,
      sport: "",
      maxPlayers: "10",
      price: undefined,
      price_type: undefined,
    },
  });

  useEffect(() => {
    if (booking && isOpen) {
      const startTimeUTC = parseUTCDate(booking.start_time);
      const endTimeUTC = parseUTCDate(booking.end_time);

      let durationInHours = 1;
      if (startTimeUTC && endTimeUTC) {
        durationInHours = (endTimeUTC.getTime() - startTimeUTC.getTime()) / (1000 * 60 * 60);
      }

      form.reset({
        courtName: booking.location.alt,
        date: startTimeUTC ?? undefined,
        startTime: startTimeUTC ? format(startTimeUTC, "HH:mm") : "19:00",
        duration: durationInHours,
        sport: booking.modality,
        maxPlayers: String(booking.max_players),
        price: booking.price ?? undefined,
        price_type: (booking.price_type as "per_person" | "total_split" | undefined) || undefined,
      });
    }
  }, [booking, isOpen, form]);

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };

  const onSubmit = async (data: FormValues) => {
    if (!booking) return;

    setIsLoading(true);
    try {
      const year = data.date.getFullYear();
      const month = data.date.getMonth();
      const day = data.date.getDate();
      const [hours, minutes] = data.startTime.split(":").map(Number);

      const startTime = new Date(year, month, day, hours, minutes);
      const endTime = new Date(startTime.getTime() + data.duration * 60 * 60 * 1000);

      const payload = {
        location: { alt: data.courtName },
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        modality: data.sport,
        max_players: parseInt(data.maxPlayers, 10),
        price: data.price && !isNaN(data.price) ? Number(data.price) : undefined,
        price_type: data.price_type && data.price_type.trim() ? data.price_type : undefined,
      };

      await updateBooking(booking._id, payload);

      toast({
        title: "Sucesso!",
        description: "Racha atualizado com sucesso.",
      });
      onBookingUpdated();
      handleClose();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.response?.data?.detail || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="bg-zinc-900 border-zinc-800 w-[360px] sm:max-w-md p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-6 py-4 border-b border-zinc-800 space-y-3">
          <div className="flex items-center gap-3">
            <Pencil className="h-5 w-5 text-green-400 flex-shrink-0" />
            <SheetTitle className="text-xl">Editar Racha</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-zinc-400">
            Altere os detalhes do evento
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-600">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
              <DateField
                control={form.control}
                name="date"
                label="Data do Racha"
                placeholder="Data"
              />

              <div className="grid grid-cols-2 gap-3">
                <TimeField
                  control={form.control}
                  name="startTime"
                  label="Horário"
                />

                <DurationField
                  control={form.control}
                  name="duration"
                  valueInHours={true}
                />
              </div>

              <SportField control={form.control} name="sport" />

              <MaxPlayersField
                control={form.control}
                name="maxPlayers"
              />

              <FormField
                control={form.control}
                name="courtName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-zinc-200">Nome da Quadra</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                          <MapPin className="h-4 w-4" />
                        </span>
                        <Input
                          placeholder="Ex: Quadra Principal, Vila Mariana"
                          {...field}
                          className="bg-zinc-800 border-zinc-700 pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <PriceField control={form.control} />

              <div className="pt-2 pb-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="outline"
                  className="flex-1 bg-green-800/40 border-green-400 hover:border-green-400 hover:text-green-400 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 text-green-400" />
                  )}
                  {isLoading ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
