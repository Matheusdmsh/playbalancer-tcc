"use client"

import { useState, ChangeEvent, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Check } from "lucide-react"
import Image from "next/image"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast" 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { createGroup, editGroup, Group } from "@/services/groups"
import { uploadGroupImage } from "@/services/storageService"
import { ImageCropModal } from "@/components/ImageCropModal"

interface CreateGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated: (newGroup: Group) => void
}

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome da turma deve ter pelo menos 3 caracteres." }).max(100),
  modality: z.string().optional(),
  photo: z.instanceof(File).optional(),
  arena: z.string().optional(),
  price: z.coerce.number().optional().nullable(),
  price_type: z.enum(['per_person', 'total_split']).optional(),
  recurrence: z.array(z.string()).optional(),
  start_time: z.string().optional(),
  duration: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

const sports = [
  'Futebol', 'Vôlei', 'Basquete', 'Futsal', 'Beach Tennis',
  'Tênis', 'Padel', 'Handebol', 'Outros'
];

const weekDays = [
  { id: 'segunda', label: 'Seg' },
  { id: 'terça', label: 'Ter' },
  { id: 'quarta', label: 'Qua' },
  { id: 'quinta', label: 'Qui' },
  { id: 'sexta', label: 'Sex' },
  { id: 'sábado', label: 'Sab' },
  { id: 'domingo', label: 'Dom' },
];

const priceTypes = [
  { id: 'per_person', label: 'Por Pessoa' },
  { id: 'total_split', label: 'Valor Total (Rateado)' },
];

const durations = [
  { value: '30', label: '30 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1h 30min' },
  { value: '120', label: '2 horas' },
  { value: '150', label: '2h 30min' },
  { value: '180', label: '3 horas' },
];

export function CreateGroupDialog({ open, onOpenChange, onGroupCreated }: CreateGroupDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Estados para o modal de corte
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      modality: "",
      photo: undefined,
      arena: "",
      price: undefined,
      price_type: undefined,
      recurrence: [],
      start_time: "",
      duration: "60",
    },
  })

  useEffect(() => {
    if (!open) {
      form.reset()
      setImagePreview(null);
      setCroppedImageFile(null);
    }
  }, [open, form])

  const onSubmit = async (data: FormValues) => {
    if (isLoading) return;
    setIsLoading(true)

    let newGroup: Group | null = null;

    try {
      // Validações básicas
      if (!data.name || data.name.trim() === "") {
        throw new Error("Nome da turma é obrigatório")
      }

      // Converter start_time para formato ISO e calcular end_time baseado na duração
      let startTime: string | null = null
      let endTime: string | null = null
      
      if (data.start_time) {
        try {
          const startDate = new Date(data.start_time)
          startTime = startDate.toISOString()
          
          // Calcular end_time baseado na duração (em minutos)
          const durationMinutes = data.duration ? parseInt(data.duration) : 60
          const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
          endTime = endDate.toISOString()
        } catch (e) {
          console.error("Erro ao converter start_time:", e)
        }
      }

      // Garantir que recurrence é um array de strings
      const recurrenceArray = Array.isArray(data.recurrence) 
        ? data.recurrence.filter(d => typeof d === 'string')
        : []

      const newGroupData = {
        name: data.name.trim(),
        modality: data.modality && data.modality.trim() ? data.modality : null,
        photo_url: null,
        arena: data.arena && data.arena.trim() ? data.arena : null,
        price: data.price && !isNaN(data.price) ? Number(data.price) : null,
        price_type: data.price_type && data.price_type.trim() ? data.price_type : null,
        recurrence: recurrenceArray.length > 0 ? recurrenceArray : null,
        start_time: startTime,
        end_time: endTime,
      }
      
      console.log("Dados a enviar:", JSON.stringify(newGroupData, null, 2))
      
      newGroup = await createGroup(newGroupData)

      const photoFile = croppedImageFile || data.photo;

      if (photoFile && newGroup?._id) {
        toast({ title: "Enviando imagem...", description: "Aguarde, estamos processando a foto da turma." })
        const imageUrl = await uploadGroupImage(photoFile, newGroup._id)
        const updatedGroup = await editGroup(newGroup._id, { photo_url: imageUrl })
        newGroup = updatedGroup
      }

      toast({
        title: "Turma criada!",
        description: `A turma "${newGroup.name}" foi criada com sucesso.`,
      })

      onGroupCreated(newGroup)
      onOpenChange(false)

    } catch (error: any) {
      console.error("Erro ao criar turma:", error)
      
      let errorMessage = "Ocorreu um erro inesperado."
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data) {
        errorMessage = JSON.stringify(error.response.data)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Erro ao criar turma",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: File) => {
      form.setValue("photo", croppedImage);
      setCroppedImageFile(croppedImage);
      setImagePreview(URL.createObjectURL(croppedImage));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova Turma</DialogTitle>
            <DialogDescription>
              Preencha as informações abaixo para criar uma nova turma para seus rachas.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nome da Turma</Label>
                    <FormControl>
                      <Input placeholder="Ex: Racha de Terça" {...field} className="bg-zinc-800 border-zinc-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modality"
                render={({ field }) => (
                  <FormItem>
                    <Label>Modalidade (opcional)</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Selecione um esporte" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {sports.map(sport => <SelectItem key={sport} value={sport}>{sport}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="photo-upload">Foto da Turma (opcional)</Label>
                    {imagePreview && (
                      <div className="mt-2 flex justify-center">
                        <Image src={imagePreview} alt="Pré-visualização da turma" width={80} height={80} className="rounded-full object-cover" />
                      </div>
                    )}
                    <FormControl>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        className="bg-zinc-800 border-zinc-700 file:text-white"
                        onChange={handlePhotoChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arena"
                render={({ field }) => (
                  <FormItem>
                    <Label>Nome da Quadra (opcional)</Label>
                    <FormControl>
                      <Input placeholder="Ex: Quadra Principal, Vila Mariana" {...field} className="bg-zinc-800 border-zinc-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <Label>Valor (R$) (opcional)</Label>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="Ex: 25.00" 
                        {...field}
                        value={field.value ?? ""}
                        onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="bg-zinc-800 border-zinc-700" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_type"
                render={({ field }) => (
                  <FormItem>
                    <Label>Tipo de Valor (opcional)</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {priceTypes.map(type => (
                          <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recurrence"
                render={({ field }) => (
                  <FormItem>
                    <Label>Dias da Semana (opcional)</Label>
                    <FormControl>
                      <div className="grid grid-cols-7 gap-1">
                        {weekDays.map(day => (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => {
                              const current = field.value || []
                              const updated = current.includes(day.id)
                                ? current.filter(d => d !== day.id)
                                : [...current, day.id]
                              field.onChange(updated)
                            }}
                            className={`p-1 rounded text-xs font-medium transition-all ${
                              field.value?.includes(day.id)
                                ? 'bg-green-500 text-white border-2 border-green-400'
                                : 'bg-zinc-800 text-zinc-300 border-2 border-zinc-700 hover:border-zinc-600'
                            }`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <Label>Início - Data/Hora (opcional)</Label>
                    <FormControl>
                      <Input type="datetime-local" {...field} className="bg-zinc-800 border-zinc-700" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <Label>Duração do Jogo (opcional)</Label>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue placeholder="Selecione a duração" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-700 text-white">
                        {durations.map(duration => (
                          <SelectItem key={duration.value} value={duration.value}>{duration.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-500 hover:bg-green-600" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isLoading ? "Criando..." : "Criar Turma"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}