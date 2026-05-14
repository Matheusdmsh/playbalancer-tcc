"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquarePlus } from "lucide-react";
import { getToken } from "@/services/authService";
import { submitFeedback, Feedback } from "@/services/feedback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({
    title: "Sugestão",
    description: "",
    type: "suggestion",
  });
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLoggedIn = getToken();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoggedIn) {
    return null;
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitFeedback(feedback);
      toast({
        title: "Feedback enviado!",
        description: "Obrigado pela sua contribuição.",
      });
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar feedback",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg"
          size="icon"
        >
          <MessageSquarePlus className="h-6 w-6 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
          <DialogDescription>
            Sua opinião é importante para nós.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Título
            </Label>
            <Input
              id="title"
              type="text"
              value={feedback.title}
              onChange={(e) =>
                setFeedback({ ...feedback, title: e.target.value })
              }
              className="col-span-3 bg-zinc-800 border-zinc-700"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <Select
              onValueChange={(value: "bug" | "suggestion" | "other") =>
                setFeedback({ ...feedback, type: value })
              }
              defaultValue={feedback.type}
            >
              <SelectTrigger className="col-span-3 bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="suggestion">Sugestão</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="message" className="text-right">
              Mensagem
            </Label>
            <Textarea
              id="message"
              value={feedback.description}
              onChange={(e) =>
                setFeedback({ ...feedback, description: e.target.value })
              }
              className="col-span-3 bg-zinc-800 border-zinc-700"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-500 hover:bg-green-600"
          >
            {isSubmitting ? "Enviando..." : "Enviar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}