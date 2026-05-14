"use client"

import { useState, useEffect, ChangeEvent, useMemo, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Image from "next/image"
import { Loader2, Save, ChevronLeft, ChevronRight, User as UserIcon, ArrowBigUpDash, ArrowBigDownDash, MapPin, Settings, Lock, Zap, X, Check, Trophy, Wind, Dribbble, Flame, Hammer, Radio, Briefcase, HelpCircle, Users, Crown, ShieldPlus, Trash2, AlertCircle, MoreVertical } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { editGroup, Group, GroupUpdateData, addAdminToGroup, removeAdminFromGroup, deleteGroup, Player, transferGroupOwner, removeMemberFromGroup } from "@/services/groups"
import { uploadGroupImage } from "@/services/storageService"
import { ImageCropModal } from "@/components/ImageCropModal"
import { UserRoleBadge } from "@/components/user-role-badge"
import { isGroupOwner } from "@/lib/groupPermissions"
import { getUsersByIds } from "@/services/users"
import { SportField } from "@/components/sport-field"
import { MaxPlayersField } from "@/components/max-players-field"
import { PriceField } from "@/components/price-field"
import { DurationField } from "@/components/duration-field"
import { TimeField } from "@/components/time-field"
import type { User } from "@/interface/users"
import {
  SPORTS,
  WEEK_DAYS,
  DURATIONS,
  PRICE_TYPE_DESCRIPTIONS,
  BUTTON_STYLES,
  INPUT_STYLES,
  WEEKDAY_BUTTON_STYLES,
} from "@/lib/groupFormConstants"
import { useIsMobile } from "@/hooks/use-mobile"

type ScreenType = "menu" | "infos" | "quadra" | "racha" | "permissoes"

interface EditGroupSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group: Group
  onGroupUpdated: (updatedGroup: Group) => void
  currentUserId?: string
}

const formSchema = z.object({
  name: z.string().min(3, { message: "O nome do grupo deve ter pelo menos 3 caracteres." }).max(100),
  modality: z.string().optional(),
  photo: z.instanceof(File).optional(),
  photo_url: z.string().optional(),
  arena: z.string().optional(),
  max_players: z.string().optional(),
  price: z.number().optional().nullable(),
  price_type: z.enum(["per_person", "total_split"]).optional(),
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

const getInitials = (name?: string) => {
  if (!name) return "?"
  const parts = name.trim().split(" ")
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""
  return (first + last).toUpperCase() || "?"
}

const toHHMM = (timeValue?: string | null) => {
  if (!timeValue || typeof timeValue !== "string") return ""
  const value = timeValue.trim()
  if (!value) return ""

  // ISO/UTC -> exibir no horário local (mesmo comportamento dos cards)
  if (value.includes("T") || value.endsWith("Z")) {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      const hh = String(date.getHours()).padStart(2, "0")
      const mm = String(date.getMinutes()).padStart(2, "0")
      return `${hh}:${mm}`
    }
  }

  const match = value.match(/(\d{2}):(\d{2})/)
  if (!match) return ""

  return `${match[1]}:${match[2]}`
}

const EDITABLE_SCREENS: ScreenType[] = ["infos", "quadra", "racha"]

export function EditGroupSheet({ open, onOpenChange, group, onGroupUpdated, currentUserId }: EditGroupSheetProps) {
  const isMobile = useIsMobile()
  const [isLoading, setIsLoading] = useState(false)
  const [isPermissionLoading, setIsPermissionLoading] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isRemoveMemberDialogOpen, setIsRemoveMemberDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null)
  const [members, setMembers] = useState<User[]>([])
  const prevOpenRef = useRef<boolean>(open)

  const [currentScreen, setCurrentScreen] = useState<ScreenType>("menu")
  const { toast } = useToast()
  const [imagePreview, setImagePreview] = useState<string | null>(group.photo_url || null)

  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [croppedImageFile, setCroppedImageFile] = useState<File | null>(null)

  const initialDuration = useMemo(() => {
    // Duration em minutos vem do backend
    if (group?.duration && typeof group.duration === 'number') {
      return String(group.duration)
    }
    return "60"
  }, [group?.duration])

  // Buscar dados completos dos membros
  useEffect(() => {
    const fetchMembers = async () => {
      if (group.members && group.members.length > 0) {
        try {
          const memberIds = group.members.map((m) => m.id)
          const membersData = await getUsersByIds(memberIds)
          setMembers(membersData)
        } catch (error) {
          console.error("Erro ao buscar membros:", error)
        }
      }
    }
    fetchMembers()
  }, [group.members])

  const form = useForm<FormValues, any, FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: group.name,
      modality: group.modality || "",
      photo_url: group.photo_url || "",
      arena: group.arena || "",
      max_players: "10",
      price: group.price ?? undefined,
      price_type: (group.price_type as "per_person" | "total_split" | undefined) || undefined,
      recurrence: group.recurrence || [],
      start_time: toHHMM(group.start_time),
      duration: initialDuration,
    },
  })

  useEffect(() => {
    form.reset({
      name: group.name,
      modality: group.modality || "",
      photo_url: group.photo_url || "",
      arena: group.arena || "",
      max_players: "10",
      price: group.price ?? undefined,
      price_type: (group.price_type as "per_person" | "total_split" | undefined) || undefined,
      recurrence: group.recurrence || [],
      start_time: toHHMM(group.start_time),
      duration: initialDuration,
    })
    setImagePreview(group.photo_url || null)
    setCroppedImageFile(null)

    const justOpened = open && !prevOpenRef.current
    if (justOpened) {
      setCurrentScreen("menu")
    }
    prevOpenRef.current = open
  }, [group, form, open, initialDuration])

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true)
    try {
      const recurrenceArray = Array.isArray(data.recurrence)
        ? data.recurrence.filter(d => typeof d === "string")
        : []

      const duration = data.duration ? parseInt(data.duration) : null
      
      // Converter start_time para HH:MM:SS apenas quando houver horário válido
      let startTimeFormatted: string | null = null
      if (data.start_time && typeof data.start_time === "string") {
        const hhmm = toHHMM(data.start_time)
        if (hhmm) {
          startTimeFormatted = `${hhmm}:00`
        }
      }

      const updatedData: GroupUpdateData = {
        name: data.name,
        modality: data.modality || null,
        arena: data.arena && data.arena.trim() ? data.arena : null,
        price: data.price && !isNaN(data.price) ? Number(data.price) : null,
        price_type: data.price_type && data.price_type.trim() ? data.price_type : null,
        recurrence: recurrenceArray.length > 0 ? recurrenceArray : null,
        start_time: startTimeFormatted,
        duration: duration,
      }

      const photoFile = croppedImageFile || data.photo
      if (photoFile) {
        toast({ title: "Enviando nova imagem..." })
        const imageUrl = await uploadGroupImage(photoFile, group._id)
        updatedData.photo_url = imageUrl
      }

      console.log("Enviando dados:", updatedData)

      const updatedGroup = await editGroup(group._id, updatedData)
      toast({
        title: "Grupo atualizado!",
        description: `O grupo "${updatedGroup.name}" foi atualizado com sucesso.`,
      })
      onGroupUpdated(updatedGroup)
      onOpenChange(false)
    } catch (error: any) {
      console.error("Erro ao editar:", error)
      toast({
        title: "Erro ao editar grupo",
        description: error.message || "Não foi possível atualizar o grupo. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

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

const handlePromoteToAdmin = async (userId: string) => {
  setIsPermissionLoading(true)
  try {
    const updatedGroup = await addAdminToGroup(group._id, userId)
    onGroupUpdated(updatedGroup)
    toast({
      title: "Sucesso!",
      description: "Usuário promovido a admin.",
    })
  } catch (error: any) {
    toast({
      title: "Erro ao promover",
      description: error.message,
      variant: "destructive",
    })
  } finally {
    setIsPermissionLoading(false)
  }
}

const handleRemoveAdmin = async (userId: string) => {
  setIsPermissionLoading(true)
  try {
    const updatedGroup = await removeAdminFromGroup(group._id, userId)
    onGroupUpdated(updatedGroup)
    toast({
      title: "Sucesso!",
      description: "Admin removido.",
    })
  } catch (error: any) {
    toast({
      title: "Erro ao remover admin",
      description: error.message,
      variant: "destructive",
    })
  } finally {
    setIsPermissionLoading(false)
  }
}

const handleTransferOwner = async (userId: string) => {
  setIsPermissionLoading(true)
  try {
    const updatedGroup = await transferGroupOwner(group._id, userId)
    onGroupUpdated(updatedGroup)
    toast({
      title: "Sucesso!",
      description: "Dono transferido com sucesso.",
    })
  } catch (error: any) {
    toast({
      title: "Erro ao transferir dono",
      description: error.message,
      variant: "destructive",
    })
  } finally {
    setIsPermissionLoading(false)
  }
}

const handleDeleteGroup = async () => {
  setIsPermissionLoading(true)
  try {
    await deleteGroup(group._id)
    toast({
      title: "Grupo removido!",
      description: "O grupo foi removido permanentemente.",
    })
    onOpenChange(false)
  } catch (error: any) {
    toast({
      title: "Erro ao deletar",
      description: error.message,
      variant: "destructive",
    })
  } finally {
    setIsPermissionLoading(false)
  }
}

const handleRemoveMemberClick = (member: User) => {
  setMemberToRemove(member)
  setIsRemoveMemberDialogOpen(true)
}

const confirmRemoveMember = async () => {
  if (!memberToRemove) return

  setIsPermissionLoading(true)
  try {
    const memberId = memberToRemove.id || memberToRemove._id
    await removeMemberFromGroup(group._id, memberId)

    setMembers(prev => prev.filter((m) => (m.id || m._id) !== memberId))

    const updatedGroup = {
      ...group,
      members: (group.members || []).filter((m) => m.id !== memberId),
      admins: (group.admins || []).filter((adminId) => adminId !== memberId),
    }

    onGroupUpdated(updatedGroup as Group)

    toast({
      title: "Sucesso!",
      description: "Membro removido do grupo.",
    })
  } catch (error: any) {
    toast({
      title: "Erro ao remover membro",
      description: error.message,
      variant: "destructive",
    })
  } finally {
    setIsPermissionLoading(false)
    setIsRemoveMemberDialogOpen(false)
    setMemberToRemove(null)
  }
}

  const isEditableScreen = EDITABLE_SCREENS.includes(currentScreen)


  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={isMobile
            ? "bg-zinc-900 border-zinc-800 w-full max-w-none min-h-[80vh] max-h-[88vh] rounded-t-2xl p-0 flex flex-col overflow-hidden"
            : "bg-zinc-900 border-zinc-800 w-[360px] sm:max-w-md p-0 flex flex-col overflow-hidden"
          }
        >
          <SheetHeader className="px-6 py-4 border-b border-zinc-800 text-left">
            <div className="flex items-center gap-2">
              {currentScreen !== "menu" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentScreen("menu")}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex gap-4 items-center flex-1">
                {currentScreen === "menu" && <Settings className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />}
                {currentScreen === "infos" && <UserIcon className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />}
                {currentScreen === "quadra" && <MapPin className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />}
                {currentScreen === "racha" && <Zap className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />}
                {currentScreen === "permissoes" && <Lock className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />}
                <div>
                  <SheetTitle className="text-left">
                    {currentScreen === "menu" && "Configurações do Grupo"}
                    {currentScreen === "infos" && "Infos do Grupo"}
                    {currentScreen === "quadra" && "Quadra e Valores"}
                    {currentScreen === "racha" && "Padrão de Racha"}
                    {currentScreen === "permissoes" && "Permissões"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-left">
                    {currentScreen === "menu" && "Escolha o que deseja alterar"}
                    {currentScreen === "infos" && "Nome e foto do grupo"}
                    {currentScreen === "quadra" && "Quadra, preço e tipo de valor"}
                    {currentScreen === "racha" && "Modalidade, dias e horários"}
                    {currentScreen === "permissoes" && "Gerencie os membros do grupo"}
                  </SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>

          {/* Menu Principal */}
          {currentScreen === "menu" && (
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 animate-in fade-in duration-300">
              <button
                onClick={() => setCurrentScreen("infos")}
                className="w-full p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
              >
                <div className="flex gap-4 items-center">
                  <UserIcon className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-white">Infos do Grupo</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Nome e foto</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400" />
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen("quadra")}
                className="w-full p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
              >
                <div className="flex gap-4 items-center">
                  <MapPin className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-white">Quadra e Valores</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Local e divisão de preços</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400" />
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen("racha")}
                className="w-full p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
              >
                <div className="flex gap-4 items-center">
                  <Zap className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-white">Padrão de Racha</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Esporte, dias e horários</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400" />
                </div>
              </button>

              <button
                onClick={() => setCurrentScreen("permissoes")}
                className="w-full p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
              >
                <div className="flex gap-4 items-center">
                  <Lock className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-white">Permissões</div>
                    <div className="text-xs text-zinc-400 mt-0.5">Gerenciar membros</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-zinc-400" />
                </div>
              </button>
            </div>
          )}

          {/* Telas Específicas */}
          {isEditableScreen && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 min-h-0 flex-col transition-all duration-300 ease-in-out">
                <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Infos do Grupo */}
              {currentScreen === "infos" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Nome do Grupo</Label>
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
                        <Label htmlFor="photo-upload-edit">Foto do Grupo</Label>
                        {imagePreview && (
                          <div className="mt-2 flex justify-center">
                            <Image src={imagePreview} alt="Pré-visualização do grupo" width={80} height={80} className="rounded-full object-cover" />
                          </div>
                        )}
                        <FormControl>
                          <Input
                            id="photo-upload-edit"
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
                </div>
              )}

              {/* Quadra e Valores */}
              {currentScreen === "quadra" && (
                <div className="space-y-4 animate-in fade-in duration-300">
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

              {/* Padrão de Racha */}
              {currentScreen === "racha" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <FormField
                    control={form.control}
                    name="recurrence"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Recorrência</Label>
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

                  {/* Horário e Duração - Lado a Lado */}
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
                </div>

                <div className="border-t border-zinc-800 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" type="button" onClick={() => setCurrentScreen("menu")} disabled={isLoading} className={BUTTON_STYLES.cancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button variant="outline" type="submit" className={BUTTON_STYLES.submit} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 text-green-400" />
                      )}
                      {isLoading ? "Salvando..." : "Salvar"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          )}

          {/* Permissões */}
          {currentScreen === "permissoes" && (
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Lista de Membros e Admins */}
                  <div>
                    <h3 className="font-semibold mb-3">Membros ({members.filter(m => !m.is_placeholder)?.length || 0})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {members
                        .filter(member => !member.is_placeholder)
                        .sort((a, b) => {
                          const isCurrentUser = (member: User) => {
                            const id = member.id || member._id
                            return id === currentUserId || member._id === currentUserId
                          }

                          if (isCurrentUser(a) && !isCurrentUser(b)) return -1
                          if (!isCurrentUser(a) && isCurrentUser(b)) return 1

                          const getRank = (member: User) => {
                            const id = member.id || member._id
                            const owner = id === group.owner_id || member._id === group.owner_id
                            const admin = group.admins?.includes(id) ?? false
                            return owner ? 2 : admin ? 1 : 0
                          }
                          return getRank(b) - getRank(a)
                        })
                        .map((member) => {
                          const userId = member.id || member._id
                          const isOwner = userId === group.owner_id || member._id === group.owner_id
                          const isAdmin = group.admins?.includes(userId) ?? false
                          const isSelf = userId === currentUserId || member._id === currentUserId
                          const userName = member.name || member.username || member.id

                          return (
                            <div key={userId} className="flex items-center justify-between py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className="rounded-full border-2 border-zinc-700">
                                    <Avatar className="h-9 w-9">
                                      <AvatarImage src={member.photo_url} alt={userName} />
                                      <AvatarFallback className="bg-zinc-700 text-zinc-200 text-xs">
                                        {getInitials(userName)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </div>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-zinc-100">{userName}</span>
                                  {member.username && (
                                    <span className="text-xs text-zinc-400">@{member.username}</span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isSelf && <UserRoleBadge role={isOwner ? "owner" : isAdmin ? "admin" : "member"} isSelf />}
                                {isOwner ? (
                                  <UserRoleBadge role="owner" />
                                ) : isAdmin ? (
                                  <UserRoleBadge role="admin" />
                                ) : (
                                  <UserRoleBadge role="member" />
                                )}

                                {/* Ações (apenas para owner) */}
                                {isGroupOwner(group, currentUserId ?? "") && !isOwner && (
                                  <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 text-zinc-300 hover:text-white"
                                        disabled={isPermissionLoading}
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="z-[1001] bg-zinc-900 border-zinc-700 text-white">
                                      {!isAdmin ? (
                                        <DropdownMenuItem onClick={() => handlePromoteToAdmin(userId)}>
                                          <ArrowBigUpDash className="mr-2 h-4 w-4" />
                                          Tornar admin
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem onClick={() => handleRemoveAdmin(userId)}>
                                          <ArrowBigDownDash className="mr-2 h-4 w-4" />
                                          Remover admin
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => handleTransferOwner(userId)}>
                                        <Crown className="mr-2 h-4 w-4" />
                                        Transferir dono
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleRemoveMemberClick(member)}
                                        className="text-red-400 focus:text-red-400"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Remover membro
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* Zona de Perigo - Apenas para Owner */}
                  {isGroupOwner(group, currentUserId ?? "") && (
                    <div className="border-t border-zinc-700 pt-6">
                      <h3 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Zona de Perigo
                      </h3>
                      <Button
                        variant="destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={isPermissionLoading}
                        className="w-full bg-red-900 hover:bg-red-800 border border-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Apagar Grupo
                      </Button>
                    </div>
                  )}

                  
                </div>
              </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Apagar Grupo</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              Tem certeza que deseja deletar esse grupo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              disabled={isPermissionLoading}
              className="bg-red-900 hover:bg-red-800 text-white"
            >
              {isPermissionLoading ? "Deletando..." : "Deletar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRemoveMemberDialogOpen} onOpenChange={setIsRemoveMemberDialogOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400">Remover membro</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-300">
              Tem certeza que deseja remover {memberToRemove?.name || "este usuário"} do grupoo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2">
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700" disabled={isPermissionLoading}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveMember}
              disabled={isPermissionLoading}
              className="bg-red-900 hover:bg-red-800 text-white"
            >
              {isPermissionLoading ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => setCropModalOpen(false)}
        imageSrc={imageToCrop}
        onCropComplete={handleCropComplete}
      />
    </>
  )
}
