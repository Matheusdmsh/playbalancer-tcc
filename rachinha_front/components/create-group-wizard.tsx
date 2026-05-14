"use client"

import { useState, ChangeEvent, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, ArrowRight, ArrowLeft, Check, Users, MapPin, Calendar, X } from "lucide-react"
import Image from "next/image"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"

import { createGroup, editGroup, Group } from "@/services/groups"
import { uploadGroupImage } from "@/services/storageService"
import { ImageCropModal } from "@/components/ImageCropModal"
import {
  SPORTS,
  WEEK_DAYS,
  DURATIONS,
  PRICE_TYPE_DESCRIPTIONS,
  BUTTON_STYLES,
  INPUT_STYLES,
  WEEKDAY_BUTTON_STYLES,
} from "@/lib/groupFormConstants"
import { SportField } from "@/components/sport-field"
import { MaxPlayersField } from "@/components/max-players-field"
import { PriceField } from "@/components/price-field"
import { DurationField } from "@/components/duration-field"
import { TimeField } from "@/components/time-field"

interface CreateGroupWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGroupCreated: (newGroup: Group) => void
}

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome do grupo deve ter pelo menos 3 caracteres." }).max(100),
  modality: z.string().optional(),
  photo: z.instanceof(File).optional(),
  arena: z.string().optional(),
  max_players: z.string().optional(),
  price: z.number().optional().nullable(),
  price_type: z.enum(['per_person', 'total_split']).optional(),
  recurrence: z.array(z.string()).optional(),
  start_time: z.string().optional(),
  duration: z.string().optional(),
}).refine((data) => {
  // Se price está preenchido, price_type é obrigatório
  if (data.price && data.price > 0) {
    return !!data.price_type
  }
  return true
}, {
  message: "Selecione o tipo de valor quando informar um preço",
  path: ["price_type"],
})

type FormValues = z.infer<typeof formSchema>

export function CreateGroupWizard({ open, onOpenChange, onGroupCreated }: CreateGroupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null)

  const totalSteps = 3

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      modality: "",
      photo: undefined,
      arena: "",
      max_players: "",
      price: undefined,
      price_type: undefined,
      recurrence: [],
      start_time: "",
      duration: "",
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset()
      setImagePreview(null)
      setCroppedImageFile(null)
      setCurrentStep(1)
    }
  }, [open, form])

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageToCrop(reader.result as string)
        setCropModalOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: File) => {
    form.setValue("photo", croppedImage)
    setCroppedImageFile(croppedImage)
    setImagePreview(URL.createObjectURL(croppedImage))
  }

  const handleNext = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    
    if (currentStep === 1) {
      // Valida o campo de nome
      const nameValue = form.getValues('name')
      if (!nameValue || nameValue.trim().length < 3) {
        form.setError('name', {
          type: 'manual',
          message: 'O nome do grupo deve ter pelo menos 3 caracteres.'
        })
        return
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: FormValues) => {
    if (isLoading) return
    setIsLoading(true)

    let newGroup: Group | null = null

    try {
      const recurrenceArray = Array.isArray(data.recurrence)
        ? data.recurrence.filter(d => typeof d === 'string')
        : []

      let startTimeFormatted: string | null = null
      let endTime: string | null = null

      if (data.start_time && typeof data.start_time === 'string' && data.start_time.trim()) {
        const [hours, minutes] = data.start_time.split(':')
        const startDate = new Date()
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        startTimeFormatted = startDate.toISOString()

        const durationMinutes = data.duration ? parseInt(data.duration) : 60
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
        endTime = endDate.toISOString()
      }

      const newGroupData = {
        name: data.name.trim(),
        modality: data.modality && data.modality.trim() ? data.modality : null,
        photo_url: null,
        arena: data.arena && data.arena.trim() ? data.arena : null,
        max_players: data.max_players ? parseInt(data.max_players, 10) : null,
        price: data.price && !isNaN(data.price) ? Number(data.price) : null,
        price_type: data.price_type && data.price_type.trim() ? data.price_type : null,
        recurrence: recurrenceArray.length > 0 ? recurrenceArray : null,
        start_time: startTimeFormatted,
        end_time: endTime,
      }

      newGroup = await createGroup(newGroupData)

      const photoFile = croppedImageFile || data.photo
      if (photoFile && newGroup?._id) {
        toast({ title: "Enviando imagem..." })
        const imageUrl = await uploadGroupImage(photoFile, newGroup._id)
        const updatedGroup = await editGroup(newGroup._id, { photo_url: imageUrl })
        newGroup = updatedGroup
      }

      toast({
        title: "Grupo criado!",
        description: `O grupo "${newGroup.name}" foi criada com sucesso.`,
      })

      onGroupCreated(newGroup)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao criar grupo:", error)
      toast({
        title: "Erro ao criar grupo",
        description: error.message || "Não foi possível criar o grupo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const progress = (currentStep / totalSteps) * 100

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="bg-zinc-900 border-zinc-800 w-[400px] sm:max-w-md overflow-y-auto p-0">
          <SheetHeader className="px-6 py-4 border-b border-zinc-800 space-y-3">
            <SheetTitle className="text-xl">Criar Novo Grupo</SheetTitle>
            <SheetDescription className="text-xs text-zinc-400">
              Passo {currentStep} de {totalSteps}
            </SheetDescription>
            <Progress value={progress} className="h-1" />
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4">
              {/* Passo 1: Infos do grupo */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-5 w-5 text-green-400" />
                    <div>
                      <h3 className="font-semibold text-white">Infos do Grupo</h3>
                      <p className="text-xs text-zinc-400">Nome e foto do grupo</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Nome do Grupo *</Label>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                              <Users className="h-4 w-4" />
                            </span>
                            <Input placeholder="Ex: Racha de Terça" {...field} className="bg-zinc-800 border-zinc-700 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="photo"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-zinc-200">
                          Foto do Grupo
                        </FormLabel>
                        {imagePreview && (
                          <div className="mt-2 flex justify-center">
                            <Image
                              src={imagePreview}
                              alt="Pré-visualização"
                              width={80}
                              height={80}
                              className="rounded-full object-cover"
                            />
                          </div>
                        )}
                        <FormControl>
                          <Input
                            id="photo-upload-create"
                            type="file"
                            accept="image/*"
                            className="bg-zinc-800 border-zinc-700 file:text-white"
                            onChange={handlePhotoChange}
                          />
                        </FormControl>
                        <p className="text-xs text-zinc-500 mt-1">
                          Adicione uma imagem para identificar seu grupo
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Passo 2: Padrão de Racha */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="h-5 w-5 text-green-400" />
                    <div>
                      <h3 className="font-semibold text-white">Padrão de Racha</h3>
                      <p className="text-xs text-zinc-400">Dias, horários e esporte</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="recurrence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-zinc-200">
                          Recorrência
                        </FormLabel>
                        <FormControl>
                          <div className="grid grid-cols-7 gap-1">
                            {WEEK_DAYS.map(day => (
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
                                className={`p-2 rounded text-xs font-medium transition-all border ${
                                  field.value?.includes(day.id)
                                    ? WEEKDAY_BUTTON_STYLES.selected
                                    : WEEKDAY_BUTTON_STYLES.unselected
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

                  <div className="grid grid-cols-2 gap-4">
                    <TimeField
                      control={form.control}
                      name="start_time"
                      label="Horário"
                    />

                    <DurationField
                      control={form.control}
                      name="duration"
                    />
                  </div>

                  <SportField
                    control={form.control}
                    name="modality"
                  />

                  <MaxPlayersField
                    control={form.control}
                    name="max_players"
                  />
                </div>
              )}

              {/* Passo 3: Quadra e Valores */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-green-400" />
                    <div>
                      <h3 className="font-semibold text-white">Quadra e Valores</h3>
                      <p className="text-xs text-zinc-400">Local e divisão de preços</p>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="arena"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Nome da Quadra</Label>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
                              <MapPin className="h-4 w-4" />
                            </span>
                            <Input placeholder="Ex: Quadra Principal, Vila Mariana" {...field} className="bg-zinc-800 border-zinc-700 pl-10" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <PriceField
                    control={form.control}
                    priceName="price"
                    priceTypeName="price_type"
                  />
                </div>
              )}

              {/* Botões de Navegação */}
              <div className="flex items-center gap-2 pt-6">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex-1 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                  </Button>
                )}

                {currentStep < totalSteps ? (
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleNext}
                    className="flex-1 bg-green-800/40 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm text-white"
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    variant = "outline"
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-green-800/40 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm text-white"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Criar Grupo
                      </>
                    )}
                  </Button>
                )}

              </div>
            </form>
          </Form>
        </SheetContent>
      </Sheet>

      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}
