"use client"

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Send, X, Wallet, Banknote, BanknoteArrowUp, BanknoteArrowDown, DollarSign } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

import { createTransaction, CreateTransactionPayload } from "@/services/transactions";

// Schema de validação do formulário
const formSchema = z.object({
  type: z.enum(["Entrada", "Saída"]),
  description: z.string().min(3, "A descrição é obrigatória.").max(100),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  onTransactionCreated: () => void;
}

export function TransactionSheet({ open, onOpenChange, groupId, onTransactionCreated }: TransactionSheetProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [amountDigits, setAmountDigits] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Entrada",
      description: "",
      amount: 0,
    },
  });

  // Limpa o formulário ao fechar o sheet
  useEffect(() => {
    if (!open) {
      form.reset();
      setAmountDigits("");
    }
  }, [open, form]);

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      // Obtenha o id do usuário logado do localStorage (ajuste conforme sua autenticação)
      const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") || "" : "";

      // Converte o tipo selecionado para o formato da API
      const transactionType = data.type === "Entrada" ? "revenue" : "expense";

      const payload: CreateTransactionPayload = {
        group_id: groupId,
        type: transactionType,
        amount: data.amount,
        description: data.description,
        user_id: userId,
      };

      await createTransaction(payload);
      
      toast({
        title: "Sucesso!",
        description: `Transação de ${data.type.toLowerCase()} registrada.`,
      });

      onTransactionCreated(); // Callback para atualizar os dados na página
      onOpenChange(false);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível registrar a transação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const transactionType = form.watch("type");
  const isRevenue = transactionType === "Entrada";

  const formatCurrencyDisplay = (value: number | undefined) => {
    if (!value && value !== 0) return ""
    if (isNaN(value)) return ""
    return value.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigits = e.target.value.replace(/\D/g, "")
    setAmountDigits(onlyDigits)

    const numericValue = onlyDigits
      ? Number(onlyDigits) / 100
      : null

    form.setValue("amount", numericValue ?? 0)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile
          ? "bg-zinc-900 border-zinc-800 w-full max-w-none min-h-[80vh] max-h-[88vh] rounded-t-2xl p-0 flex flex-col"
          : "bg-zinc-900 border-zinc-800 w-[360px] sm:max-w-md p-0 flex flex-col"
        }
      >
        <SheetHeader className="px-6 py-4 border-b border-zinc-800 text-left">
          <div className="flex items-center gap-2">
            <div className="flex gap-4 items-center flex-1">
              <Wallet className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <SheetTitle className="text-left">Nova Transação</SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Registre uma entrada ou saída no caixa
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 min-h-0 flex-col">
            <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
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
                      <TabsList className="grid w-full grid-cols-2 rounded-full bg-zinc-800/70 ">
                        <TabsTrigger
                          value="Entrada"
                          className="rounded-full text-xs gap-2 text-zinc-300 data-[state=active]:rounded-full data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400 data-[state=active]:border data-[state=active]:border-green-500/40"
                        >
                          <BanknoteArrowUp className="h-3.5 w-3.5" />
                          Entrada
                        </TabsTrigger>
                        <TabsTrigger
                          value="Saída"
                          className="rounded-full text-xs gap-2 text-zinc-300 data-[state=active]:rounded-full data-[state=active]:bg-green-600/20 data-[state=active]:text-green-400 data-[state=active]:border data-[state=active]:border-green-500/40"
                        >
                          <BanknoteArrowDown className="h-3.5 w-3.5" />
                          Saída
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormItem>
                )}
              />
              
              <div className="space-y-5 pt-4">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder={isRevenue ? "Ex: Pagamento do João" : "Ex: Cerveja pós-racha"} 
                          {...field}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                            <Banknote className="h-4 w-4" />
                          </span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="0,00"
                            value={formatCurrencyDisplay(field.value ?? undefined)}
                            onChange={handleAmountChange}
                            className="bg-zinc-800 border-zinc-700 pl-10 text-right"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

            </div>

            <div className="border-t border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2 border-zinc-700">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={isLoading}
                  className="flex-1 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
                
                <Button 
                  type="submit" 
                  variant="outline"
                  className={`flex-1 ${isRevenue ? "bg-green-800 border-green-400" : "bg-red-800 border-red-400"} hover:border-${isRevenue ? "green" : "red"}-400 hover:text-${isRevenue ? "green" : "red"}-400 backdrop-blur-sm`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-400 border-t-transparent mr-2" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      {isRevenue ? (
                        <BanknoteArrowUp className={`h-4 w-4 text-green-400`} />
                      ) : (
                        <BanknoteArrowDown className={`h-4 w-4 text-red-400`} />
                      )}
                      {isRevenue ? "Registrar Entrada" : "Registrar Saída"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
