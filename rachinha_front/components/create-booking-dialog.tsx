"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Minus, Plus, Loader2 } from "lucide-react";

import { createBooking } from "@/services/bookings";
import { Calendar } from "@/components/ui/calendar";

// Schema de validação atualizado
const formSchema = z.object({
  type: z.enum(["Pontual", "Recorrente"]),
  occurrences: z.string().optional(),
  courtName: z.string().min(3, { message: "O nome da quadra é obrigatório." }),
  date: z.date(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Formato de hora inválido.",
    }),
  duration: z.number().min(1, { message: "A duração mínima é de 1 hora." }),
  sport: z.string().min(1, { message: "Selecione um esporte." }),
  maxPlayers: z
    .string()
    .min(1, { message: "Selecione o máximo de jogadores." }),
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
const playerOptions = Array.from({ length: 29 }, (_, i) => i + 2);
const recurrenceOptions = Array.from({ length: 11 }, (_, i) => i + 2);

interface CreateBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  group?: any; // Dados do grupo para pré-preenchimento
  onBookingCreated: (newBooking: any) => void;
}

export function CreateBookingDialog({
  isOpen,
  onClose,
  groupId,
  group,
  onBookingCreated,
}: CreateBookingDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(1);
  // Adicionado para controlar o popover do calendário
  const [isCalendarOpen, setCalendarOpen] = useState(false);

  // Extrair hora de start_time (formato HH:MM:SS)
  const getStartTimeFromGroup = () => {
    if (group?.start_time && typeof group.start_time === 'string') {
      // Se for formato HH:MM:SS ou HH:MM, retorna apenas a hora
      const timeMatch = group.start_time.match(/^(\d{2}):(\d{2})/)
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`
      }
    }
    return "19:00"
  }

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: "Pontual",
      courtName: group?.arena || group?.court_name || group?.location?.alt || "",
      startTime: getStartTimeFromGroup(),
      duration: group?.duration ? group.duration / 60 : 1,
      sport: group?.modality || "",
      maxPlayers: String(group?.max_players || "10"),
      occurrences: "2", // Valor padrão para recorrência
    },
  });

  const bookingType = useWatch({
    control: form.control,
    name: "type",
  });

  useEffect(() => {
    form.setValue("duration", duration);
  }, [duration, form]);

  const handleDurationChange = (amount: number) => {
    const newDuration = Math.max(0.5, duration + amount);
    setDuration(newDuration);
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // 1. Pega os componentes da data e hora selecionados pelo usuário
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
        court_id: "offline",
        location: { alt: data.courtName },
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        modality: data.sport,
        max_players: parseInt(data.maxPlayers, 10),
        associated_group_id: groupId,
        recurrence_type: "weekly",
        occurrences:
          data.type === "Recorrente"
            ? parseInt(data.occurrences || "1", 10)
            : 1,
        status_list: true,
      };

      const newBooking = await createBooking(payload);
      toast({ title: "Sucesso!", description: "Racha agendado com sucesso." });
      onBookingCreated(newBooking);
      onClose();
      form.reset();
      setDuration(1);
    } catch (error: any) {
      toast({
        title: "Erro",
        description:
          error.response?.data?.detail ||
          error.message ||
          "Não foi possível agendar o racha.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-md">
        <DialogHeader>
          <DialogTitle>Agendar Novo Racha</DialogTitle>
          <DialogDescription>
            Preencha os principais detalhes do racha
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* --- TYPE SELECTOR --- */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <Tabs
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="Pontual" className="text-xs">Pontual</TabsTrigger>
                      <TabsTrigger value="Recorrente" className="text-xs">Recorrente</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormItem>
              )}
            />

            {/* --- TOP FIELDS --- */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel className="text-sm font-medium">Data do Racha</FormLabel>
                    <Popover
                      open={isCalendarOpen}
                      onOpenChange={setCalendarOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal text-xs",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy", { locale: ptBR })
                            ) : (
                              <span>Data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date: Date | undefined) => {
                            if (!date) return;
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxPlayers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Máx de Jogadores</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Nº" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {playerOptions.map((p) => (
                          <SelectItem key={p} value={String(p)}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Horário de Início</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} className="text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel className="text-sm font-medium">Duração</FormLabel>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDurationChange(-0.5)}
                    className="h-8 w-8"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    readOnly
                    value={`${Math.floor(duration)}h${
                      duration % 1 !== 0 ? "30" : "00"
                    }`}
                    className="text-center text-xs h-8 w-16"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDurationChange(0.5)}
                    className="h-8 w-8"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </FormItem>
            </div>

            <FormField
              control={form.control}
              name="courtName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Quadra (Nome ou Local)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Quadra do Zé" 
                      {...field}
                      className="text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Esporte</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="text-sm">
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

            {bookingType === "Recorrente" && (
              <FormField
                control={form.control}
                name="occurrences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Recorrência (semanal)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecione a recorrência" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {recurrenceOptions.map((w) => (
                          <SelectItem key={w} value={String(w)}>
                            {w} semanas
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="text-sm">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-sm"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                {isLoading ? "Criando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}