
"use client"

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

import { createTransaction, CreateTransactionPayload } from "@/services/transactions";

// Schema de validação do formulário
const formSchema = z.object({
  type: z.enum(["Entrada", "Saída"]),
  description: z.string().min(3, "A descrição é obrigatória.").max(100),
  amount: z.coerce.number().positive("O valor deve ser positivo."),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onTransactionCreated: () => void;
}

export function TransactionDialog({ isOpen, onClose, groupId, onTransactionCreated }: TransactionDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "Entrada",
      description: "",
      amount: 0,
    },
  });

  // Limpa o formulário ao fechar o modal
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

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
      onClose();

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Registre uma entrada ou saída no caixa da turma.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                      <TabsTrigger value="Entrada" className="text-xs">Entrada</TabsTrigger>
                      <TabsTrigger value="Saída" className="text-xs">Saída</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder={isRevenue ? "Ex: Pagamento do João" : "Ex: Cerveja pós-racha"} {...field} />
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
                    <Input type="number" step="0.01" placeholder="0,00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className={isRevenue ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRevenue ? "Adicionar" : "Retirar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}