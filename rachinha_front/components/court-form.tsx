"use client"

import React, { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Plus, Loader2, Save, Upload, Trash2, ImageIcon, Building } from "lucide-react"
import { Court, CourtCreate, CourtUpdate, AvailableHour } from "@/interface/courts"
import { Arena } from "@/interface/arena"
import { createCourt, editCourt } from "@/services/courts"
import { listMyArenas } from "@/services/arena"
import api from "@/services/api"
import Image from "next/image"

const SPORTS = [
  "Futebol Society", "Futsal", "Beach Football",
  "Tênis", "Padel", "Beach Tênis",
  "Vôlei", "Beach Vôlei", "Basquete",
  "Handebol", "Badminton", "Squash",
]

const DAYS_OF_WEEK = [
  { label: "Seg", value: "monday" },
  { label: "Ter", value: "tuesday" },
  { label: "Qua", value: "wednesday" },
  { label: "Qui", value: "thursday" },
  { label: "Sex", value: "friday" },
  { label: "Sáb", value: "saturday" },
  { label: "Dom", value: "sunday" },
]

const CHARACTERISTICS = [
  "Grama Sintética", "Grama Natural", "Piso de Madeira",
  "Piso de Cimento", "Saibro", "Iluminação Noturna",
  "Vestiários", "Estacionamento", "Banheiros",
  "Arquibancada", "Cobertura", "Ar-condicionado",
  "Bebedouro", "Câmera de Segurança", "Wifi",
]

const formSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres." }),
  description: z.string().optional(),
  value_per_hour: z.coerce.number().min(0, "Valor deve ser positivo."),
  value_per_half_hour: z.coerce.number().optional(),
  capacity: z.coerce.number().optional(),
  is_active: z.boolean().default(true),
  available_hours: z.array(z.object({
    day_of_week: z.string(),
    start_time: z.string(),
    end_time: z.string(),
  })).min(1, "Adicione pelo menos um horário disponível."),
})

type FormValues = z.infer<typeof formSchema>

interface CourtFormProps {
  court?: Court | null
  /** ID da arena pré-selecionada. Quando vazio, exibe o seletor de arenas. */
  arenaId?: string
  onSuccess: () => void
  onCancel?: () => void
}

export function CourtForm({ court, arenaId: arenaIdProp, onSuccess, onCancel }: CourtFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSports, setSelectedSports] = useState<string[]>(court?.sports_supported || [])
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>(court?.characteristics || [])
  const [photos, setPhotos] = useState<string[]>(court?.photos_url || [])
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")

  // Arena selector state (only used when no arenaId prop)
  const [arenas, setArenas] = useState<Arena[]>([])
  const [selectedArenaId, setSelectedArenaId] = useState<string>(arenaIdProp || court?.belong_arena || "")
  const [loadingArenas, setLoadingArenas] = useState(false)

  // Load arenas only when no arena is pre-selected
  useEffect(() => {
    if (!arenaIdProp) {
      const fetchArenas = async () => {
        setLoadingArenas(true)
        try {
          const data = await listMyArenas()
          setArenas(data)
          // Auto-select first arena if none selected
          if (!selectedArenaId && data.length > 0) {
            setSelectedArenaId(data[0].id)
          }
        } catch (error) {
          toast({ title: "Erro ao carregar arenas", description: (error as Error).message, variant: "destructive" })
        } finally {
          setLoadingArenas(false)
        }
      }
      fetchArenas()
    }
  }, [arenaIdProp])

  const effectiveArenaId = arenaIdProp || selectedArenaId

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: court?.name || "",
      description: court?.description || "",
      value_per_hour: court?.value_per_hour || 0,
      value_per_half_hour: court?.value_per_half_hour,
      capacity: court?.capacity,
      is_active: court?.is_active ?? true,
      available_hours: court?.available_hours || [],
    },
  })

  const { fields: hourFields, append: appendHour, remove: removeHour } = useFieldArray({
    control: form.control,
    name: "available_hours",
  })

  const toggleSport = (sport: string) => {
    setSelectedSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport])
  }

  const toggleCharacteristic = (char: string) => {
    setSelectedCharacteristics(prev => prev.includes(char) ? prev.filter(c => c !== char) : [...prev, char])
  }

  /**
   * Handles multiple file uploads at once.
   * Envia as imagens selecionadas direto para o storage e recebe o link oficial.
   */
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    e.target.value = "" // Reset input
    setUploadingPhoto(true)

    const newlyUploadedPhotos: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(`Enviando ${i + 1}/${files.length}...`)
      try {
        const formData = new FormData()
        formData.append("file", file)
        const response = await api.post("/upload/image", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        if (response.data.url) {
          newlyUploadedPhotos.push(response.data.url)
        }
      } catch (error) {
        toast({
          title: `Erro ao enviar "${file.name}"`,
          description: (error as Error).message,
          variant: "destructive",
        })
      }
    }

    if (newlyUploadedPhotos.length > 0) {
      setPhotos(prev => [...prev, ...newlyUploadedPhotos])
      toast({ title: `${newlyUploadedPhotos.length > 1 ? `${newlyUploadedPhotos.length} fotos adicionadas` : "Foto adicionada"} com sucesso!` })
    }
    
    setUploadProgress("")
    setUploadingPhoto(false)
  }

  const handleDeletePhoto = async (photoUrl: string) => {
    // Agora que todas as URLs são oficiais do storage desde a seleção da foto, 
    // a gente apenas remove do array de estado para que ao enviar o form (salvar) já vá apagado do array no DB
    setPhotos(prev => prev.filter(p => p !== photoUrl))
    toast({ title: "Foto removida da pré-seleção!" })
    // Você opcionalmente poderia fazer um call para api.delete('/upload/image/...')
    // caso o admin esteja gastando muito espaço. Mas manter órfã temporariamente não tem problema pro array da quadra em si.
  }

  const addHourSlot = () => {
    appendHour({ day_of_week: "monday", start_time: "08:00", end_time: "22:00" })
  }

  const onSubmit = async (data: FormValues) => {
    if (selectedSports.length === 0) {
      toast({ title: "Selecione pelo menos um esporte", variant: "destructive" })
      return
    }
    if (!effectiveArenaId) {
      toast({ title: "Selecione a arena à qual esta quadra pertence", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      const payload: CourtCreate | CourtUpdate = {
        name: data.name,
        description: data.description || "",
        sports_supported: selectedSports,
        value_per_hour: data.value_per_hour,
        value_per_half_hour: data.value_per_half_hour,
        capacity: data.capacity,
        is_active: data.is_active,
        characteristics: selectedCharacteristics,
        photos_url: photos.filter(p => p.startsWith("http")), // only real server URLs
        available_hours: data.available_hours as AvailableHour[],
        belong_arena: effectiveArenaId,
      }

      if (court) {
        await editCourt(court.id, payload)
        toast({ title: "Quadra atualizada com sucesso!" })
      } else {
        await createCourt(payload as CourtCreate)
        toast({ title: "Quadra criada com sucesso!" })
      }
      onSuccess()
    } catch (error) {
      toast({ title: "Erro ao salvar quadra", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

      {/* ---- Arena Selector (shown only when no arena is pre-set) ---- */}
      {!arenaIdProp && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <Building className="h-4 w-4 text-green-400" />
            Arena
          </Label>
          {loadingArenas ? (
            <div className="flex items-center gap-2 text-zinc-400 text-sm py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando arenas...
            </div>
          ) : arenas.length === 0 ? (
            <p className="text-sm text-red-400">Nenhuma arena encontrada. Crie uma arena primeiro.</p>
          ) : (
            <Select value={selectedArenaId} onValueChange={setSelectedArenaId}>
              <SelectTrigger className="bg-zinc-800/60 border-zinc-700 focus:border-green-500">
                <SelectValue placeholder="Selecione a arena..." />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {arenas.map(arena => (
                  <SelectItem key={arena.id} value={arena.id}>
                    {arena.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="court-name" className="text-sm font-medium text-zinc-300">Nome da Quadra</Label>
        <Input id="court-name" {...form.register("name")} className="bg-zinc-800/60 border-zinc-700 focus:border-green-500" placeholder="Ex: Quadra Ace" />
        {form.formState.errors.name && <p className="text-sm text-red-400">{form.formState.errors.name.message}</p>}
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="court-description" className="text-sm font-medium text-zinc-300">Descrição</Label>
        <Textarea id="court-description" {...form.register("description")} rows={3} className="bg-zinc-800/60 border-zinc-700 focus:border-green-500 resize-none" placeholder="Descreva sua quadra..." />
      </div>

      {/* Esportes */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-zinc-300">Esportes Suportados</Label>
        <div className="flex flex-wrap gap-2">
          {SPORTS.map(sport => (
            <Badge
              key={sport}
              variant={selectedSports.includes(sport) ? "default" : "outline"}
              className={`cursor-pointer transition-all ${selectedSports.includes(sport) ? "bg-green-500 hover:bg-green-600 text-white border-transparent" : "border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-400"}`}
              onClick={() => toggleSport(sport)}
            >
              {sport}
            </Badge>
          ))}
        </div>
      </div>

      {/* Preços */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="value-hour" className="text-sm font-medium text-zinc-300">Valor por Hora (R$)</Label>
          <Input id="value-hour" type="number" step="0.01" {...form.register("value_per_hour", { valueAsNumber: true })} className="bg-zinc-800/60 border-zinc-700 focus:border-green-500" />
          {form.formState.errors.value_per_hour && <p className="text-sm text-red-400">{form.formState.errors.value_per_hour.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="value-half" className="text-sm font-medium text-zinc-300">Valor Meia Hora (R$)</Label>
          <Input id="value-half" type="number" step="0.01" {...form.register("value_per_half_hour", { valueAsNumber: true })} className="bg-zinc-800/60 border-zinc-700 focus:border-green-500" />
        </div>
      </div>

      {/* Capacidade + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity" className="text-sm font-medium text-zinc-300">Capacidade</Label>
          <Input id="capacity" type="number" {...form.register("capacity", { valueAsNumber: true })} className="bg-zinc-800/60 border-zinc-700 focus:border-green-500" placeholder="Máx. de pessoas" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-300">Status</Label>
          <div className="flex items-center gap-2 mt-3">
            <Switch id="is-active" checked={form.watch("is_active")} onCheckedChange={val => form.setValue("is_active", val)} />
            <Label htmlFor="is-active" className="text-sm text-zinc-300">{form.watch("is_active") ? "Ativa" : "Inativa"}</Label>
          </div>
        </div>
      </div>

      {/* Características */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-zinc-300">Características</Label>
        <div className="flex flex-wrap gap-2">
          {CHARACTERISTICS.map(char => (
            <Badge
              key={char}
              variant={selectedCharacteristics.includes(char) ? "default" : "outline"}
              className={`cursor-pointer transition-all text-xs ${selectedCharacteristics.includes(char) ? "bg-zinc-700 text-white border-transparent hover:bg-zinc-600" : "border-zinc-700 text-zinc-400 hover:border-zinc-500"}`}
              onClick={() => toggleCharacteristic(char)}
            >
              {char}
            </Badge>
          ))}
        </div>
      </div>

      {/* Fotos */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-zinc-300 flex items-center justify-between">
          <span>Fotos da Quadra</span>
          {photos.length > 0 && (
            <span className="text-xs text-zinc-500 font-normal">{photos.length} foto{photos.length !== 1 ? "s" : ""}</span>
          )}
        </Label>

        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div key={idx} className="relative rounded-lg overflow-hidden group aspect-square bg-zinc-800">
              <Image
                src={photo}
                alt={`Foto ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized={photo.startsWith("blob:")}
              />
              <button
                type="button"
                onClick={() => handleDeletePhoto(photo)}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-5 w-5 text-red-400" />
              </button>
            </div>
          ))}

          {/* Upload button — accepts multiple files */}
          <label
            className={`border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-500/5 transition-colors aspect-square ${uploadingPhoto ? "opacity-50 pointer-events-none" : ""}`}
          >
            {uploadingPhoto ? (
              <div className="flex flex-col items-center gap-1">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                <span className="text-xs text-zinc-500 text-center px-1">{uploadProgress}</span>
              </div>
            ) : (
              <>
                <Upload className="h-5 w-5 text-zinc-400 mb-1" />
                <span className="text-xs text-zinc-500 text-center px-1">Adicionar<br/>fotos</span>
              </>
            )}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple               // ← allow multiple selection
              onChange={handlePhotoUpload}
            />
          </label>
        </div>

        {photos.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <ImageIcon className="h-3 w-3" /> Selecione uma ou mais fotos da sua quadra
          </div>
        )}
      </div>

      {/* Disponibilidade */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-zinc-300">Disponibilidade</Label>
          <Button type="button" variant="outline" size="sm" onClick={addHourSlot} className="border-zinc-700 hover:bg-zinc-800 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Adicionar Horário
          </Button>
        </div>
        {form.formState.errors.available_hours && (
          <p className="text-sm text-red-400">{form.formState.errors.available_hours.message as string}</p>
        )}
        <div className="space-y-2">
          {hourFields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-3">
              <select
                {...form.register(`available_hours.${index}.day_of_week`)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md text-sm text-zinc-200 px-2 py-1.5 focus:border-green-500 focus:outline-none"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <Input
                type="time"
                {...form.register(`available_hours.${index}.start_time`)}
                className="w-28 bg-zinc-900 border-zinc-700 text-sm focus:border-green-500"
              />
              <span className="text-zinc-500 text-sm">–</span>
              <Input
                type="time"
                {...form.register(`available_hours.${index}.end_time`)}
                className="w-28 bg-zinc-900 border-zinc-700 text-sm focus:border-green-500"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeHour(index)} className="text-zinc-500 hover:text-red-400 shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {hourFields.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-4">Clique em "Adicionar Horário" para definir disponibilidade</p>
        )}
      </div>

      {/* Botões */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button variant="outline" type="button" onClick={onCancel} className="flex-1 border-zinc-700 hover:bg-zinc-800">
            Cancelar
          </Button>
        )}
        <Button className="flex-1 bg-green-500 hover:bg-green-600 gap-2" type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isLoading ? "Salvando..." : court ? "Salvar Alterações" : "Criar Quadra"}
        </Button>
      </div>
    </form>
  )
}