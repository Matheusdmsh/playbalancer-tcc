"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Camera, IdCardLanyard, Edit, Save, User2, Lock, AtSign, Mail, Phone, LogOut, Share2, Trash2, Plus } from "lucide-react"
import { Eye, EyeOff } from "lucide-react"
import { Loader2 } from "lucide-react"
import { FcGoogle } from "react-icons/fc"
import { FaApple } from "react-icons/fa"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetOverlay, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { changePassword, editCurrentUser, getCurrentUser } from "@/services/users"
import { User } from "@/interface/users"
import { uploadUserImage } from "@/services/storageService"
import { ImageCropModal } from "@/components/ImageCropModal"
import { GoogleLoginButton } from "@/components/google-login-button"
import { AppleLoginButton } from "@/components/apple-login-button";
import { logout, getConnections, disconnectProvider, getToken, checkGoogleStatus, googleLink } from "@/services/authService"
import { ProfileCardCarousel } from "@/components/profile-card-carousel"
import { UserProfileCard } from "@/components/card/user-profile-card"
import { getProfileSelectableCardIndex, PROFILE_CARD_CATALOG } from "@/components/card/card.config"
import { useIsMobile } from "@/hooks/use-mobile"

const profileFormSchema = z.object({
  name: z.string().min(2, { message: "Nome deve ter pelo menos 2 caracteres" }),
  nickname: z.string().min(1, { message: "Apelido é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  phone: z.string().min(0, { message: "Telefone deve ter pelo menos 10 dígitos" }),
  username: z.string().min(2, { message: "Username deve ter pelo menos 2 caracteres" }),
})

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, { message: "Senha atual deve ter pelo menos 8 caracteres" }),
    newPassword: z.string().min(8, { message: "Nova senha deve ter pelo menos 8 caracteres" }),
    confirmPassword: z.string().min(8, { message: "Confirmação de senha deve ter pelo menos 8 caracteres" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type ProfileFormValues = z.infer<typeof profileFormSchema>
type PasswordFormValues = z.infer<typeof passwordFormSchema>

export default function UserProfile() {
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [avatar, setAvatar] = useState("/placeholder.svg?height=100&width=100")
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  // Estados para controlar os sheets laterais
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [showPasswordSheet, setShowPasswordSheet] = useState(false);
  const [showConnectionsSheet, setShowConnectionsSheet] = useState(false);
  const [showCardTemplateSheet, setShowCardTemplateSheet] = useState(false);
  const [isProfileCardPreviewOpen, setIsProfileCardPreviewOpen] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [isSavingCardTemplate, setIsSavingCardTemplate] = useState(false);
  const [isUploadingCardPhoto, setIsUploadingCardPhoto] = useState(false);
  const [cardDraftNickname, setCardDraftNickname] = useState("");
  const [cardDraftPhotoPreview, setCardDraftPhotoPreview] = useState<string | undefined>(undefined);
  const [cardDraftPhotoFile, setCardDraftPhotoFile] = useState<File | null>(null);
  
  // Modal de desconexão
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [providerToDisconnect, setProviderToDisconnect] = useState<string | null>(null);
  

  // Preferências do usuário
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    favoritesSports: ["Futebol", "Futsal"],
  })
 
  // Formulário de perfil
  const profileForm = useForm<ProfileFormValues, any, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema) as any,
    defaultValues: {
      name: "",
      nickname: "",
      email: "",
      username: "",
      phone: "",
    },
  });

  // Formulário de senha
  const passwordForm = useForm<PasswordFormValues, any, PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema) as any,
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Cartões de pagamento
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 1,
      type: "Visa",
      number: "**** **** **** 1234",
      expiry: "12/25",
      isDefault: true,
    },
    {
      id: 2,
      type: "Mastercard",
      number: "**** **** **** 5678",
      expiry: "06/24",
      isDefault: false,
    },
  ])

  const handleProfileSubmit = async (data: ProfileFormValues) => {
    if (!currentUser) return

    const previousUser = currentUser
    const optimisticPatch: Partial<User> = {
      name: data.name,
      nickname: data.nickname,
      phone_number: data.phone,
    }

    try {
        const optimisticUser = mergeUserData(previousUser, optimisticPatch)
        if (optimisticUser) {
          setCurrentUser(optimisticUser)
          setAvatar(optimisticUser.photo_url || "/placeholder.svg?height=100&width=100")
          profileForm.reset(getUserFormValues(optimisticUser))
        }

        const updatedUser = await editCurrentUser({
          name: data.name,
          nickname: data.nickname,
          phone_number: data.phone,
        });

        const mergedUser = mergeUserData(optimisticUser, updatedUser)
        if (mergedUser) {
          setCurrentUser(mergedUser)
          setAvatar(mergedUser.photo_url || "/placeholder.svg?height=100&width=100")
          profileForm.reset(getUserFormValues(mergedUser))
        }

        toast({
            title: "Perfil atualizado",
            description: "Suas informações foram atualizadas com sucesso.",
        });
        setIsEditing(false); // Desativa o modo de edição
    } catch (error: any) {
        setCurrentUser(previousUser)
        setAvatar(previousUser.photo_url || "/placeholder.svg?height=100&width=100")
        profileForm.reset(getUserFormValues(previousUser))
        toast({
            title: "Erro ao atualizar",
            description: error.message || "Não foi possível salvar as alterações.",
            variant: "destructive",
        });
    }
  };


  const handlePasswordSubmit = async (data: PasswordFormValues) => {
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      // Chama o serviço para alterar a senha
      await changePassword(data.currentPassword, data.newPassword, data.confirmPassword);
      setPasswordSuccess("Senha alterada com sucesso!");
      // passwordForm.reset(); // Se quiser limpar o formulário, descomente
    } catch (error: any) {
      setPasswordError(error.message || "Não foi possível alterar sua senha. Verifique a senha atual.");
    }
};

const formatMemberSince = (isoDateString: string): string => {
  if (!isoDateString) {
    return ""; // Retorna uma string vazia se a data não existir
  }

  const date = new Date(isoDateString);

  // Formata a data para o padrão "mês de ano" em português do Brasil
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    month: 'long', // "long" para o nome completo do mês (ex: "janeiro")
    year: 'numeric' // "numeric" para o ano (ex: "2024")
  }).format(date);

  // Capitaliza a primeira letra do mês
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return `${capitalizedDate}`;
};

const getInitials = (name?: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
};

const getCardDisplayName = (name?: string, nickname?: string) => {
  const trimmedNickname = nickname?.trim();
  if (trimmedNickname) return trimmedNickname;

  const firstName = name?.trim().split(/\s+/)[0];
  return firstName || "JOGADOR";
};
const mergeUserData = (currentUser: User | null, updatedUser: Partial<User> | null | undefined): User | null => {
  if (!currentUser) {
    return updatedUser ? (updatedUser as User) : null;
  }

  if (!updatedUser) {
    return currentUser;
  }

  return {
    ...currentUser,
    ...updatedUser,
  };
};

const getUserFormValues = (user: User) => ({
  name: user.name || "",
  nickname: user.nickname || "",
  email: user.email || "",
  username: user.username || "",
  phone: user.phone_number || "",
});

  const handleCardPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageToCrop(event.target.result as string);
          setCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  const handleCropComplete = async (croppedImage: File) => {
    if (!croppedImage || !currentUser) return

    const previewUrl = URL.createObjectURL(croppedImage)
    if (cardDraftPhotoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(cardDraftPhotoPreview)
    }
    setCardDraftPhotoPreview(previewUrl)
    setCardDraftPhotoFile(croppedImage)
    toast({
      title: "Prévia atualizada",
      description: "A nova foto já está aparecendo no card.",
    })
  };

  const setDefaultPaymentMethod = (id: number) => {
    setPaymentMethods(
      paymentMethods.map((method) => ({
        ...method,
        isDefault: method.id === id,
      })),
    )
    toast({
      title: "Método de pagamento atualizado",
      description: "Seu método de pagamento padrão foi atualizado.",
    })
  }

  const removePaymentMethod = (id: number) => {
    setPaymentMethods(paymentMethods.filter((method) => method.id !== id))
    toast({
      title: "Método de pagamento removido",
      description: "Seu método de pagamento foi removido com sucesso.",
    })
  }

  useEffect(() => {
    async function fetchUser() {
      setIsLoading(true)
      setFetchError(null) 
      try {
        const user = await getCurrentUser()
        if (user) {
          console.log("Usuário carregado:", user)
          setCurrentUser(user);
          setSelectedCardIndex(getProfileSelectableCardIndex(user.active_card_template));
          profileForm.reset({
            name: user.name || "",
            nickname: user.nickname || "",
            email: user.email || "",
            username: user.username || "",
            phone: user.phone_number || "",
          })
          setAvatar(user.photo_url || "/placeholder.svg?height=100&width=100")
        } else {
          throw new Error("Dados do usuário não encontrados.")
        }
      } catch (error: any) {
        const errorMessage = error.message || "Não foi possível carregar suas informações."
        setFetchError(errorMessage)
        toast({
          title: "Erro ao carregar perfil",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    async function fetchConnections() {
        try {
            const data = await getConnections();
            setConnections(data);
        } catch (error) {
            console.error(error);
        }
    }

    fetchUser()
    fetchConnections()
   }, [profileForm, toast])

  const handleDisconnect = async (provider: string) => {
    setProviderToDisconnect(provider);
    setIsDisconnectModalOpen(true);
  };

  const confirmDisconnect = async () => {
    if (!providerToDisconnect) return;
    
    try {
        await disconnectProvider(providerToDisconnect);
        setConnections(connections.filter(c => c.provider !== providerToDisconnect));
        toast({ title: "Conexão removida", description: "Vínculo desfeito com sucesso." });
    } catch (error: any) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
        setIsDisconnectModalOpen(false);
        setProviderToDisconnect(null);
    }
  };

  const hasGoogle = connections.some(c => c.provider === "google");
  const hasApple = connections.some(c => c.provider === "apple");

  const selectedCardOption = PROFILE_CARD_CATALOG[selectedCardIndex] ?? PROFILE_CARD_CATALOG[0]
  const selectedCardTemplate = selectedCardOption.id

  const previewNickname = showCardTemplateSheet ? cardDraftNickname : currentUser?.nickname
  const previewPhoto = showCardTemplateSheet ? cardDraftPhotoPreview : undefined
  const cardSheetBusy = isSavingCardTemplate || isUploadingCardPhoto
  const profileCardDisplayName = getCardDisplayName(currentUser?.name, currentUser?.nickname).toUpperCase()
  const profileCardUsername = currentUser?.username ? `@${currentUser.username}` : "jogador"
  const profileCardMemberSince = currentUser?.created_at
    ? new Date(currentUser.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : ""

  const handleCardNicknameChange = (value: string) => {
    setCardDraftNickname(value.slice(0, 12))
  }

  const cardTemplateCards = useMemo(() => {
    const name = getCardDisplayName(currentUser?.name, previewNickname).toUpperCase();
    const username = currentUser?.username || "jogador";

    return PROFILE_CARD_CATALOG.map((option) => ({
      name,
      username,
      photoUrl: previewPhoto || (avatar && !avatar.includes("placeholder") ? avatar : undefined),
      initials: getInitials(currentUser?.name),
      skillLevel: currentUser?.skill_level ?? 0,
      memberSince: currentUser?.created_at ? formatMemberSince(currentUser.created_at) : undefined,
      cardVariant: option.previewVariant,
      
    }));
  }, [currentUser, previewNickname, previewPhoto, avatar]);

  useEffect(() => {
    if (!showCardTemplateSheet || !currentUser) return

    setSelectedCardIndex(getProfileSelectableCardIndex(currentUser.active_card_template))
    setCardDraftNickname(currentUser.nickname || "")
    setCardDraftPhotoPreview(currentUser.photo_url || undefined)
    setCardDraftPhotoFile(null)
  }, [showCardTemplateSheet, currentUser])

  const handleSaveCardTemplate = async () => {
    if (!currentUser) return;

    const previousUser = currentUser;

    try {
      setIsSavingCardTemplate(true);
      let nextPhotoUrl = currentUser.photo_url || undefined

      if (cardDraftPhotoFile) {
        setIsUploadingCardPhoto(true)
        nextPhotoUrl = await uploadUserImage(cardDraftPhotoFile, currentUser._id)
      }

      const optimisticUser = mergeUserData(previousUser, {
        active_card_template: selectedCardTemplate,
        nickname: cardDraftNickname,
        ...(nextPhotoUrl ? { photo_url: nextPhotoUrl } : {}),
      })

      if (optimisticUser) {
        setCurrentUser(optimisticUser);
        setAvatar(optimisticUser.photo_url || "/placeholder.svg?height=100&width=100")
        profileForm.reset(getUserFormValues(optimisticUser))
      }

      const updatedUser = await editCurrentUser({
        active_card_template: selectedCardTemplate,
        nickname: cardDraftNickname,
        ...(nextPhotoUrl ? { photo_url: nextPhotoUrl } : {}),
      } as any);
      const mergedUser = mergeUserData(optimisticUser, updatedUser);
      if (mergedUser) {
        setCurrentUser(mergedUser);
        setAvatar(mergedUser.photo_url || "/placeholder.svg?height=100&width=100")
        profileForm.reset(getUserFormValues(mergedUser))
      }
      toast({
        title: "Card atualizado",
        description: `Seu card padrão agora é o ${selectedCardOption.label}.`,
      });
      setShowCardTemplateSheet(false);
    } catch (error: any) {
      setCurrentUser(previousUser);
      setAvatar(previousUser.photo_url || "/placeholder.svg?height=100&width=100")
      profileForm.reset(getUserFormValues(previousUser))
      toast({
        title: "Erro ao atualizar card",
        description: error.message || "Não foi possível salvar sua escolha de card.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCardPhoto(false)
      setIsSavingCardTemplate(false);
    }
  };

  // Google handling logic removed from here as well

  // Converter sport_ratings em array para navegação
  const sportsArray = currentUser?.sport_ratings
    ? Object.entries(currentUser.sport_ratings).map(([sport, rating]) => ({ sport, rating }))
    : []

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto animate-pulse">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-2/5">
            <div className="rounded-xl bg-zinc-900/40 p-6 space-y-5">
              <div className="h-6 w-32 bg-zinc-800/70 rounded" />
              <div className="w-28 h-28 rounded-full bg-zinc-800/70" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-zinc-800/60 rounded" />
                <div className="h-4 w-5/6 bg-zinc-800/60 rounded" />
                <div className="h-4 w-4/6 bg-zinc-800/60 rounded" />
                <div className="h-4 w-3/6 bg-zinc-800/60 rounded" />
              </div>
            </div>
          </div>

          <div className="w-full md:w-3/5 space-y-4">
            <div className="h-20 rounded-xl bg-zinc-900/40" />
            <div className="h-20 rounded-xl bg-zinc-900/40" />
            <div className="h-20 rounded-xl bg-zinc-900/40" />
            <div className="h-20 rounded-xl bg-zinc-900/40" />
          </div>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return <div className="text-red-500 text-center mt-10">Erro ao carregar perfil: {fetchError}</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-0 sm:pb-0" style={{ paddingBottom: '5rem' }}>
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 lg:gap-16">
        {/* Coluna da esquerda - Card de Perfil Básico */}
         <div className="w-full md:w-2/5">
           <div
             className="group relative mb-5 mx-auto w-full max-w-[250px] cursor-zoom-in"
             onClick={() => setIsProfileCardPreviewOpen(true)}
             role="button"
             tabIndex={0}
             onKeyDown={(event) => {
               if (event.key === "Enter" || event.key === " ") {
                 event.preventDefault()
                 setIsProfileCardPreviewOpen(true)
               }
             }}
           >
             <span className="pointer-events-none absolute -bottom-1 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
               Clique para ampliar
             </span>
             <UserProfileCard
               name={profileCardDisplayName}
               username={profileCardUsername}
               photoUrl={currentUser?.photo_url || undefined}
               initials={getInitials(currentUser?.name)}
               skillLevel={currentUser?.skill_level ?? 0}
               variant={currentUser?.active_card_template}
               preferSlim
               memberSince={profileCardMemberSince}
             />
           </div>

           <Button
             type="button"
             variant="outline"
             className="mx-auto flex w-full max-w-[250px] items-center justify-center gap-2 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
             onClick={() => setShowCardTemplateSheet(true)}
           >
             <Edit className="h-4 w-4 text-zinc-300 group-hover:text-green-400" />
             Alterar card
           </Button>
         </div>


        <ImageCropModal
          isOpen={cropModalOpen}
          onClose={() => setCropModalOpen(false)}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
        />

        {/* Coluna da direita - Menu de botões e sheets laterais */}
        <div className="w-full md:w-3/5 flex flex-col gap-4 mt-8 md:mt-0">
          <div className="flex flex-col gap-4">
            <button
              onClick={() => setShowInfoSheet(true)}
              className="w-full flex items-center gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/60 transition-colors text-left"
            >
              <User2 className="h-6 w-6 text-green-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium text-white text-base">Informações</span>
                <span className="text-xs text-zinc-400">Atualize suas informações pessoais</span>
              </div>
            </button>
            <button
              onClick={() => setShowPasswordSheet(true)}
              className="w-full flex items-center gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/60 transition-colors text-left"
            >
              <Lock className="h-6 w-6 text-green-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium text-white text-base">Alterar senha</span>
                <span className="text-xs text-zinc-400">Troque sua senha de acesso</span>
              </div>
            </button>
            <button
              onClick={() => setShowConnectionsSheet(true)}
              className="w-full flex items-center gap-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/60 transition-colors text-left"
            >
              <Share2 className="h-6 w-6 text-green-400 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium text-white text-base">Conexões</span>
                <span className="text-xs text-zinc-400">Vincule suas redes sociais</span>
              </div>
            </button>
            <button
              onClick={() => logout()}
              className="w-full flex items-center gap-4 p-4 rounded-lg bg-zinc-900 border border-red-900/40 hover:bg-red-900/20 transition-colors text-left"
            >
              <LogOut className="h-6 w-6 text-red-500 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium text-red-500 text-base">Sair da conta</span>
                <span className="text-xs text-red-400/70">Desconectar do Rachinha</span>
              </div>
            </button>
          </div>

          {/* Sheet lateral para Informações - padrão fluido com animação e blur */}
          <Sheet open={showInfoSheet} onOpenChange={setShowInfoSheet}>
            <SheetContent
              side={isMobile ? "bottom" : "right"}
              className={isMobile
                ? "bg-zinc-900 border-zinc-800 w-full max-w-none h-auto max-h-[85vh] rounded-t-2xl p-6 overflow-y-auto"
                : "bg-zinc-900 border-zinc-800 w-full max-w-sm h-full shadow-xl p-8 overflow-y-auto"
              }
            >
              <SheetHeader className="flex flex-row items-center gap-4 pb-6">
                <User2 className="h-7 w-7 text-green-400 flex-shrink-0" />
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-lg">Informações Pessoais</SheetTitle>
                  <SheetDescription className="text-zinc-400">Atualize suas informações pessoais</SheetDescription>
                </div>
              </SheetHeader>
              <form onSubmit={profileForm.handleSubmit(handleProfileSubmit as any)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                    <Input
                      id="name"
                      disabled={false}
                      className="bg-zinc-800 border-zinc-700 pl-10"
                      {...profileForm.register("name")}
                    />
                  </div>
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                    <Input
                      id="username"
                      disabled={true}
                      className="bg-zinc-800 border-zinc-700 pl-10"
                      {...profileForm.register("username")}
                    />
                  </div>
                  {profileForm.formState.errors.username && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      disabled={true}
                      className="bg-zinc-800 border-zinc-700 pl-10"
                      {...profileForm.register("email")}
                    />
                  </div>
                  {profileForm.formState.errors.email && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                    <Input
                      id="phone"
                      disabled={false}
                      className="bg-zinc-800 border-zinc-700 pl-10"
                      {...profileForm.register("phone")}
                    />
                  </div>
                  {profileForm.formState.errors.phone && (
                    <p className="text-sm text-red-500">{profileForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full bg-green-800/40 border-green-400 hover:border-green-400 hover:text-green-400 text-white"
                  disabled={profileForm.formState.isSubmitting}
                >
                  {profileForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 text-green-400" />
                  )}
                  {profileForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
          <Sheet open={showPasswordSheet} onOpenChange={setShowPasswordSheet}>
            <SheetContent
              side={isMobile ? "bottom" : "right"}
              className={isMobile
                ? "bg-zinc-900 border-zinc-800 w-full max-w-none h-auto max-h-[85vh] rounded-t-2xl p-6 overflow-y-auto"
                : "bg-zinc-900 border-zinc-800 w-full max-w-sm h-full shadow-xl p-8 overflow-y-auto"
              }
            >
              <SheetHeader className="flex flex-row items-center gap-4 pb-6">
                <Lock className="h-7 w-7 text-green-400 flex-shrink-0" />
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-lg">Alterar Senha</SheetTitle>
                  <SheetDescription className="text-zinc-400">Atualize sua senha de acesso</SheetDescription>
                </div>
              </SheetHeader>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit as any)} className="space-y-4">
                                {passwordError && (
                                  <div className="mb-4 flex items-center gap-2 bg-red-100 border border-red-400 rounded px-3 py-2 text-red-700">
                                    <Lock className="h-4 w-4 text-red-500" />
                                    <span className="font-medium">{passwordError}</span>
                                  </div>
                                )}
                                {passwordSuccess && (
                                  <div className="mb-4 flex items-center gap-2 bg-green-100 border border-green-400 rounded px-3 py-2 text-green-700">
                                    <Save className="h-4 w-4 text-green-500" />
                                    <span className="font-medium">{passwordSuccess}</span>
                                  </div>
                                )}
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Senha Atual</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      className="bg-zinc-800 border-zinc-700 pl-10 pr-10"
                      {...passwordForm.register("currentPassword")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      onClick={() => setShowCurrentPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      className="bg-zinc-800 border-zinc-700 pl-10 pr-10"
                      {...passwordForm.register("newPassword")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      onClick={() => setShowNewPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className="bg-zinc-800 border-zinc-700 pl-10 pr-10"
                      {...passwordForm.register("confirmPassword")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-sm text-red-500">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full bg-green-800/40 border-green-400 hover:border-green-400 hover:text-green-400 text-white"
                  disabled={passwordForm.formState.isSubmitting}
                >
                  {passwordForm.formState.isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 text-green-400" />
                  )}
                  {passwordForm.formState.isSubmitting ? "Salvando..." : "Salvar"}
                </Button>
              </form>
            </SheetContent>
          </Sheet>
          <Sheet open={showConnectionsSheet} onOpenChange={setShowConnectionsSheet}>
            <SheetContent
              side={isMobile ? "bottom" : "right"}
              className={isMobile
                ? "bg-zinc-900 border-zinc-800 w-full max-w-none h-auto max-h-[85vh] rounded-t-2xl p-6 overflow-y-auto"
                : "bg-zinc-900 border-zinc-800 w-full max-w-sm h-full shadow-xl p-8 overflow-y-auto pt-16"
              }
            >
              <SheetHeader className="flex flex-row items-center gap-4 pb-6">
                <Share2 className="h-7 w-7 text-green-400 flex-shrink-0" />
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-lg">Conexões</SheetTitle>
                  <SheetDescription className="text-zinc-400">Gerencie suas contas vinculadas</SheetDescription>
                </div>
              </SheetHeader>
              
              <div className="space-y-6 mt-6">
                {/* Google Connection */}
                <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FcGoogle className="h-8 w-8" />
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">Google</span>
                            <span className="text-xs text-zinc-500">{hasGoogle ? "Conectado" : "Não conectado"}</span>
                        </div>
                    </div>
                    {hasGoogle ? (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDisconnect("google")}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="w-40">
                            <GoogleLoginButton 
                                mode="link" 
                                onSuccess={() => getConnections().then(setConnections)} 
                            />
                        </div>
                    )}
                  </div>

                {/* Apple Connection */}
                <div className="p-4 rounded-xl bg-black border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FaApple className="h-8 w-8 text-white" />
                        <div className="flex flex-col">
                            <span className="font-bold text-sm">Apple</span>
                            <span className="text-xs text-zinc-500">{hasApple ? "Conectado" : "Não conectado"}</span>
                        </div>
                    </div>
                    {hasApple ? (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDisconnect("apple")}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    ) : (
                        <div className="w-40">
                            <AppleLoginButton 
                                mode="link" 
                                onSuccess={() => getConnections().then(setConnections)} 
                            />
                        </div>
                    )}
                  </div>
                  </div>
            </SheetContent>
          </Sheet>

          <Sheet open={showCardTemplateSheet} onOpenChange={setShowCardTemplateSheet}>
            <SheetContent
              side={isMobile ? "bottom" : "right"}
              className={isMobile
                ? "bg-zinc-900 border-zinc-800 w-full max-w-none h-auto max-h-[85vh] rounded-t-2xl p-6 overflow-y-auto"
                : "bg-zinc-900 border-zinc-800 w-full max-w-md h-full shadow-xl p-6 overflow-y-auto"
              }
            >
              <SheetHeader className="flex flex-row items-center gap-4 pb-4">
                <IdCardLanyard className="h-7 w-7 text-green-400 flex-shrink-0" />
                <div className="flex flex-col text-left">
                  <SheetTitle className="text-lg">Alterar Card</SheetTitle>
                  <SheetDescription className="text-zinc-400">Personalize seu card como quiser!</SheetDescription>
                </div>
              </SheetHeader>

              <div className="space-y-5">
                <ProfileCardCarousel
                  cards={cardTemplateCards}
                  onCardChange={setSelectedCardIndex}
                />

                <div className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="card-nickname">Apelido</Label>
                      <p className="text-xs text-zinc-500">
                        {cardDraftNickname.length}/12
                      </p>
                    </div>
                    <div className="relative">
                      <User2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400 pointer-events-none" />
                      <Input
                        id="card-nickname"
                        value={cardDraftNickname}
                        onChange={(event) => handleCardNicknameChange(event.target.value)}
                        maxLength={12}
                        className="bg-zinc-800 border-zinc-700 pl-10"
                        placeholder="Como quer aparecer no card"
                        disabled={cardSheetBusy}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <label htmlFor="card-photo-upload" className="flex-1">
                        <span className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 transition-colors hover:border-green-400 hover:bg-green-800/40 hover:text-green-400">
                          {isUploadingCardPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                          {cardDraftPhotoFile ? "Trocar foto" : "Alterar foto"}
                        </span>
                      </label>
                      <input
                        id="card-photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCardPhotoChange}
                        disabled={cardSheetBusy}
                      />
                    </div>
                  </div>
                </div>

                <Button
                type="submit"
                  variant="outline"
                  className="w-full bg-green-800/40 border-green-400 hover:border-green-400 hover:text-green-400 text-white"
                  onClick={handleSaveCardTemplate}
                  disabled={cardSheetBusy}
                  
                >
                  {cardSheetBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 text-green-400" />
                  )}
                  {isUploadingCardPhoto ? "Enviando imagem..." : isSavingCardTemplate ? "Salvando..." : "Salvar Card"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        <Dialog open={isProfileCardPreviewOpen} onOpenChange={setIsProfileCardPreviewOpen}>
          <DialogPortal>
            <DialogOverlay className="z-[1200] bg-black/40 backdrop-blur-sm" />
            <DialogContent className="z-[1201] w-auto max-w-none border-0 bg-transparent p-0 shadow-none [&>button]:hidden data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0">
              <div className="animate-in fade-in zoom-in-50 duration-200">
                <DialogTitle className="sr-only">Card do perfil ampliado</DialogTitle>
                <div className="mx-auto w-[min(92vw,420px)]">
                  <UserProfileCard
                    name={profileCardDisplayName}
                    username={profileCardUsername}
                    photoUrl={currentUser?.photo_url || undefined}
                    initials={getInitials(currentUser?.name)}
                    skillLevel={currentUser?.skill_level ?? 0}
                    memberSince={profileCardMemberSince}
                    variant={currentUser?.active_card_template}
                    preferSlim
                  />
                </div>
              </div>
            </DialogContent>
          </DialogPortal>
        </Dialog>
        </div>
      <AlertDialog open={isDisconnectModalOpen} onOpenChange={setIsDisconnectModalOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-xl">Confirmar Desconexão</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Tem certeza que deseja desconectar o <strong>{providerToDisconnect}</strong>? 
              Você não poderá mais entrar usando esta conta até vinculá-la novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDisconnect}
              className="bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20"
            >
              Sim, desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </div>
);
}
