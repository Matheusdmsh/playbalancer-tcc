"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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
import { Progress } from "@/components/ui/progress";
import { Loader2, CalendarPlus, MapPin, ArrowRight, ArrowLeft, CalendarCheck } from "lucide-react";
import { SportField } from "@/components/sport-field";
import { PriceField } from "@/components/price-field";
import { DurationField } from "@/components/duration-field";
import { TimeField } from "@/components/time-field";
import { DateField } from "@/components/date-field";
import { MaxPlayersField } from "@/components/max-players-field";
import { useIsMobile } from "@/hooks/use-mobile";
import { handleApiError } from "@/lib/utils";

import { createBooking, type CreateBookingResponse } from "@/services/bookings";

// Schema de validação atualizado
const formSchema = z.object({
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

const pageOneBaseSchema = z.object({
  date: z.date(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Formato de hora inválido.",
    }),
  duration: z.number().min(1, { message: "A duração mínima é de 1 hora." }),
  sport: z.string().min(1, { message: "Selecione um esporte." }),
  maxPlayers: z.string().min(1, { message: "Selecione o máximo de jogadores." }),
});

interface CreateBookingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  group?: BookingGroupDefaults;
  onBookingCreated: (newBooking: CreateBookingResponse) => void;
}

interface BookingGroupDefaults {
  start_time?: string | null;
  recurrence?: string[] | null;
  duration?: number | null;
  arena?: string | null;
  court_name?: string | null;
  location?: { alt?: string | null } | null;
  modality?: string | null;
  max_players?: number | null;
  price?: number | null;
  price_type?: "per_person" | "total_split" | null;
}

export function CreateBookingSheet({
  open,
  onOpenChange,
  groupId,
  group,
  onBookingCreated,
}: CreateBookingSheetProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);

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

  const getWeekdayIndex = (value?: string | null) => {
    if (!value) return null;
    const normalized = value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");

    const mapping: Record<string, number> = {
      domingo: 0,
      segunda: 1,
      terca: 2,
      quarta: 3,
      quinta: 4,
      sexta: 5,
      sabado: 6,
    };

    return mapping[normalized] ?? null;
  };

  const getSuggestedDateFromGroup = () => {
    const baseDate = new Date();
    const recurrence: string[] = Array.isArray(group?.recurrence) ? group?.recurrence : [];
    const weekdays = recurrence
      .map((day) => getWeekdayIndex(day))
      .filter((day): day is number => day !== null);

    if (!weekdays.length) {
      return baseDate;
    }

    const todayIndex = baseDate.getDay();
    let minDiff = 7;

    weekdays.forEach((weekday) => {
      const diff = (weekday - todayIndex + 7) % 7;
      if (diff < minDiff) {
        minDiff = diff;
      }
    });

    const suggested = new Date(baseDate);
    suggested.setDate(baseDate.getDate() + minDiff);
    return suggested;
  };

  const getDefaultValues = () => {
    const suggestedDate = getSuggestedDateFromGroup();
    const durationMinutes = group?.duration ? group.duration : 60;
    return {
      date: suggestedDate,
      courtName: group?.arena || group?.court_name || group?.location?.alt || "",
      startTime: getStartTimeFromGroup(),
      duration: durationMinutes / 60,
      sport: group?.modality || "",
      maxPlayers: String(group?.max_players || "10"),
      price: group?.price ?? undefined,
      price_type: (group?.price_type as "per_person" | "total_split" | undefined) || undefined,
    };
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (open) {
      const defaults = getDefaultValues();
      form.reset(defaults);
      setCurrentPage(1);
    }
  }, [open, group, form]);

  const handleNextPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const values = form.getValues();
    const result = pageOneBaseSchema.safeParse(values);

    if (result.success) {
      setCurrentPage(2);
      return;
    }

    result.error.issues.forEach((issue) => {
      const field = issue.path[0] as keyof FormValues | undefined;
      if (!field) return;
      form.setError(field, { type: "manual", message: issue.message });
    });

    toast({
      title: "Revise os campos",
      description: "Preencha os dados obrigatórios para avançar.",
      variant: "destructive",
    });
  };

  const handleBackPage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentPage(1);
  };

  const handleClose = () => {
    const defaults = getDefaultValues();
    form.reset(defaults);
    setCurrentPage(1);
    onOpenChange(false);
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
        location: { alt: data.courtName },
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        modality: data.sport,
        max_players: parseInt(data.maxPlayers, 10),
        associated_group_id: groupId,
        status_list: true,
        price: data.price ? Number(data.price) : null,
        price_type: data.price_type?.trim() ? data.price_type : null,
      };

      const newBooking = await createBooking(payload);
      toast({ title: "Sucesso!", description: "Racha agendado com sucesso." });
      onBookingCreated(newBooking);
      handleClose();
    } catch (error) {
      const apiError = handleApiError(error, "Não foi possível agendar o racha.");
      toast({
        title: "Erro",
        description: apiError.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (currentPage / 2) * 100;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile
          ? "bg-zinc-900 border-zinc-800 w-full max-w-none min-h-[80vh] max-h-[88vh] rounded-t-2xl p-0 flex flex-col gap-0"
          : "bg-zinc-900 border-zinc-800 w-[360px] sm:max-w-md p-0 flex flex-col gap-0"
        }
      >
        <SheetHeader className="px-6 py-4 space-y-3 border-b border-zinc-800 text-left">
          <div className="flex items-center gap-3">
            <CalendarPlus className="h-5 w-5 text-green-400 flex-shrink-0" />
            <SheetTitle className="text-left text-xl">Agendar Novo Racha</SheetTitle>
          </div>
          <SheetDescription className="text-left text-xs text-zinc-400">
            Etapa {currentPage} de 2
          </SheetDescription>
          <Progress value={progress} className="h-1" />
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 min-h-0 flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent hover:scrollbar-thumb-zinc-600">
              <div className="space-y-4 pb-4">
                {currentPage === 1 && (
                  <div className="space-y-4">
                    <DateField
                      control={form.control}
                      name="date"
                      label="Data do Racha"
                      placeholder="Data"
                    />

                  <div className="grid grid-cols-2 gap-4">
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

                  <SportField
                    control={form.control}
                    name="sport"
                  />

                  <MaxPlayersField
                    control={form.control}
                    name="maxPlayers"
                  />
                  </div>
                )}

                {currentPage === 2 && (
                  <div className="space-y-4">
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
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-zinc-800 px-4 py-4">
              <div className="flex items-center gap-2 relative z-10">
                {currentPage === 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleNextPage}
                    className="flex-1 bg-green-800/40 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm text-white relative z-10 pointer-events-auto"
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBackPage}
                      className="flex-1 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm relative z-10 pointer-events-auto"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      className="flex-1 bg-green-800/40 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm text-white relative z-10 pointer-events-auto"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? "Criando..." : <>
                        <CalendarCheck className="h-4 w-4 mr-2" />
                        Agendar
                      </>}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
