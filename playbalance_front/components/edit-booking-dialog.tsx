"use client";

/*import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn, parseUTCDate } from "@/lib/utils";
import { Calendar as CalendarIcon, Minus, Plus, Loader2 } from "lucide-react";

import { updateBooking } from "@/services/bookings"; // Usar o serviço de atualização
import { Booking } from "@/interface/booking"; // Importar a interface do Booking
import { Switch } from "./ui/switch";

// Schema de validação para a edição
const formSchema = z.object({
  courtName: z.string().min(3, { message: "O nome da quadra é obrigatório." }),
  date: z.date({ required_error: "A data do racha é obrigatória." }),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Formato de hora inválido.",
    }),
  duration: z
    .number()
    .min(0.5, { message: "A duração mínima é de 30 minutos." }),
  sport: z.string().min(1, { message: "Selecione um esporte." }),
  maxPlayers: z
    .string()
    .min(1, { message: "Selecione o máximo de jogadores." }),
  status_list: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const sports = [
  "Futebol",
  "Vôlei",
  "Basquete",
  "Futsal",
  "Beach Tennis",
  "Tênis",
  "Padel",
  "Handebol",
  "Outros",
];
const playerOptions = Array.from({ length: 29 }, (_, i) => i + 2); // De 2 a 30 jogadores

interface EditBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null; // Recebe o booking a ser editado
  onBookingUpdated: () => void;
}

export function EditBookingDialog({
  isOpen,
  onClose,
  booking,
  onBookingUpdated,
}: EditBookingDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(1);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      courtName: "",
      startTime: "00:00",
      duration: 1,
      sport: "",
      maxPlayers: "10",
      status_list: false,
    },
  });

  // Efeito para popular o formulário quando o booking for recebido
  useEffect(() => {
    if (booking) {
      // Garante que a string da API seja interpretada como UTC
      const startTimeUTC = parseUTCDate(booking.start_time);
      const endTimeUTC = parseUTCDate(booking.end_time);

      let durationInHours = 1;
      if (startTimeUTC && endTimeUTC) {
        durationInHours =
          (endTimeUTC.getTime() - startTimeUTC.getTime()) / (1000 * 60 * 60);
      }
      setDuration(durationInHours);

      form.reset({
        courtName: booking.location.alt,
        date: startTimeUTC ?? undefined, // O componente Calendar usará a data correta
        startTime: startTimeUTC ? format(startTimeUTC, "HH:mm") : "", // Formata a hora para o input type="time"
        duration: durationInHours,
        sport: booking.modality,
        maxPlayers: String(booking.max_players),
        status_list: booking.status_list,
      });
    }
  }, [booking, form]);

  useEffect(() => {
    form.setValue("duration", duration);
  }, [duration, form]);

  const handleDurationChange = (amount: number) => {
    setDuration((prev) => Math.max(0.5, prev + amount));
  };

  const onSubmit = async (data: FormValues) => {
    if (!booking) return;

    setIsLoading(true);
    try {
      // 1. Pega os componentes da data e hora selecionados pelo usuário (em fuso local)
      const year = data.date.getFullYear();
      const month = data.date.getMonth();
      const day = data.date.getDate();
      const [hours, minutes] = data.startTime.split(":").map(Number);

      // 2. Cria um objeto Date no fuso horário LOCAL do navegador
      const startTime = new Date(year, month, day, hours, minutes);

      // 3. Calcula o horário final a partir do início
      const endTime = new Date(
        startTime.getTime() + data.duration * 60 * 60 * 1000
      );
      
      // 4. Converte as datas locais para o formato UTC ISO string para enviar à API
      const payload = {
        location: { alt: data.courtName },
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        modality: data.sport,
        max_players: parseInt(data.maxPlayers, 10),
        status_list: data.status_list,
      };

      await updateBooking(booking._id, payload);

      toast({
        title: "Sucesso!",
        description: "Racha atualizado com sucesso.",
      });
      onBookingUpdated();
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Editar Racha</DialogTitle>
          <DialogDescription>
            Altere os detalhes do evento e clique em salvar.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="courtName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quadra (nome ou local)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Quadra do Zé" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Racha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Escolha uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário de Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Duração</FormLabel>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handleDurationChange(-0.5)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    readOnly
                    value={`${Math.floor(duration)}h${
                      duration % 1 !== 0 ? "30" : "00"
                    }`}
                    className="text-center w-24 bg-zinc-800"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handleDurationChange(0.5)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </FormItem>
              <FormField
                control={form.control}
                name="status_list"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 h-full">
                    <FormLabel>Habilitar lista</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <Switch
                          checked={field.value ?? booking?.status_list ?? false}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-green-500"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sport"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Esporte</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um esporte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sports.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máximo de Jogadores</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Nº de jogadores" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {playerOptions.map((p) => (
                          <SelectItem key={p} value={String(p)}>
                            {p} jogadores
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-500 hover:bg-green-600"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}*/