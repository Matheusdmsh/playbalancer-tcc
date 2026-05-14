"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { searchUsers, UserSearchResult, createGhostUser, UserSearchParams, getUsersByIds } from "@/services/users";
import { generateInviteLink, Group, addMemberToGroup } from "@/services/groups";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Loader2, UserPlus, Ghost, Share2, Link as LinkIcon, ChevronLeft, Copy, RefreshCw, Users } from "lucide-react";
import { Separator } from "./ui/separator";
import { isGroupAdmin } from "@/lib/groupPermissions";
import { User } from "@/interface/users";
import { useIsMobile } from "@/hooks/use-mobile";

interface InvitePlayersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  currentUser: User | null;
  onMemberAdded?: () => void;
  searchParams?: UserSearchParams;
  title?: string;
  subtitle?: string;
  onUserAction?: (user: UserSearchResult) => Promise<void> | void;
  actionSuccessMessage?: string;
  actionErrorMessage?: string;
  disabledUserIds?: string[];
  defaultUsers?: UserSearchResult[];
  onGhostCreated?: (user: UserSearchResult) => Promise<void>;
}

const getInitials = (name: string = "") => {
  const names = name.split(" ");
  return (
    (names[0]?.[0] || "") +
    (names.length > 1 ? names[names.length - 1]?.[0] : "")
  ).toUpperCase();
};

export function InvitePlayersSheet({
  open,
  onOpenChange,
  group,
  currentUser,
  onMemberAdded,
  searchParams,
  title,
  subtitle,
  onUserAction,
  actionSuccessMessage,
  actionErrorMessage,
  disabledUserIds = [],
  defaultUsers = [],
  onGhostCreated,
}: InvitePlayersSheetProps) {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [disabledUsers, setDisabledUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<"main" | "link">("main");
  const [memberWasAdded, setMemberWasAdded] = useState(false);
  const [disabledOverrides, setDisabledOverrides] = useState<Set<string>>(new Set());
  const [createdGhostIds, setCreatedGhostIds] = useState<Set<string>>(new Set());
  const [createdGhostUsers, setCreatedGhostUsers] = useState<Map<string, UserSearchResult>>(new Map());

  const canGenerateLink = isGroupAdmin(group, currentUser?._id);

  // Buscar dados completos dos usuários bloqueados
  useEffect(() => {
    const fetchDisabledUsers = async () => {
      if (disabledUserIds.length === 0) {
        setDisabledUsers([]);
        return;
      }
      try {
        const users = await getUsersByIds(disabledUserIds);
        setDisabledUsers(users);
      } catch (error) {
        console.error('Erro ao buscar usuários bloqueados:', error);
        setDisabledUsers([]);
      }
    };
    fetchDisabledUsers();
  }, [disabledUserIds.join(',')]);

  // Auto-gerar link quando o sheet abre
  useEffect(() => {
    if (open && canGenerateLink && !inviteLink && !isLoadingLink) {
      handleGenerateLink();
    }
  }, [open, canGenerateLink]);

  // --- LÓGICA DE DEBOUNCE PARA BUSCA ---
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    const debounceTimer = setTimeout(() => {
      searchUsers(searchQuery, searchParams)
        .then((results) => {
          setSearchResults(
            results.map((user) =>
              createdGhostIds.has(user._id)
                ? ({ ...user, is_placeholder: true } as UserSearchResult)
                : user
            )
          );
        })
        .catch((error) => {
          toast({
            title: "Erro na busca",
            description: error.message,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, toast, searchParams, createdGhostIds]);

  const handleGenerateLink = async () => {
    if (!group) return;
    setIsLoadingLink(true);
    try {
      const data = await generateInviteLink(group._id);
      setInviteLink(data.invite_link);
    } catch (error: any) {
      toast({
        title: "Erro ao gerar link",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoadingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copiado!",
      description: "Link de convite copiado para a área de transferência.",
    });
  };

  const handleAddMember = async (user: UserSearchResult) => {
    if (!group) return;
    await addMemberToGroup(group._id, user._id, 0);
  };

  const disabledIds = disabledUsers.map(u => u._id);

  useEffect(() => {
    setDisabledOverrides(new Set(disabledIds));
  }, [disabledIds.join(','), open]);

  const effectiveDisabledIdsSet = new Set([
    ...disabledIds,
    ...Array.from(disabledOverrides),
  ]);

  // Filtrar usuários desabilitados que correspondem à query de busca
  const matchingDisabledUsers = searchQuery.trim().length >= 2
    ? disabledUsers.filter(user => {
        const query = searchQuery.toLowerCase();
        const userName = (user.name || '').toLowerCase();
        const userUsername = (user.username || '').toLowerCase();
        
        return userName.includes(query) || userUsername.includes(query);
      })
    : [];

  // Combinar resultados da API com usuários desabilitados que correspondem à busca
  // Remover duplicatas: priorizar dados de disabledUsers pois têm is_placeholder correto
  const combinedResultsMap = new Map<string, UserSearchResult>();

  const matchingCreatedGhostUsers = searchQuery.trim().length >= 2
    ? Array.from(createdGhostUsers.values()).filter((user) => {
        const query = searchQuery.toLowerCase();
        const userName = (user.name || '').toLowerCase();
        const userUsername = (user.username || '').toLowerCase();

        return userName.includes(query) || userUsername.includes(query);
      })
    : [];
  
  // Adicionar resultados da API
  searchResults.forEach(user => {
    combinedResultsMap.set(user._id, user);
  });
  
  // Sobrescrever com usuários desabilitados que correspondem à busca (dados mais completos)
  matchingDisabledUsers.forEach(user => {
    combinedResultsMap.set(user._id, user as UserSearchResult);
  });

  // Sobrescrever com convidados criados nesta sessão (exceção local para buscas sem ghosts)
  matchingCreatedGhostUsers.forEach((user) => {
    combinedResultsMap.set(user._id, user);
  });
  
  const combinedResults = Array.from(combinedResultsMap.values());
  const shouldShowSearchResults = searchQuery.trim().length >= 2;

  const defaultResultsMap = new Map<string, UserSearchResult>();
  defaultUsers.forEach((user) => {
    defaultResultsMap.set(user._id, user);
  });
  const defaultResults = Array.from(defaultResultsMap.values());

  const visibleResults = shouldShowSearchResults ? combinedResults : defaultResults;
  const isCreatingGhost = isAdding === "ghost" && searchQuery.trim().length > 0;

  const handleUserAction = async (user: UserSearchResult) => {
    if (effectiveDisabledIdsSet.has(user._id)) return;
    setIsAdding(user.id || user._id);
    try {
      if (onUserAction) {
        await onUserAction(user);
      } else {
        if (!group) return;
        await handleAddMember(user);
      }
      toast({
        title: "Sucesso!",
        description: actionSuccessMessage || `${user.name} foi adicionado à turma.`,
      });
      setDisabledOverrides((prev) => {
        const next = new Set(prev);
        next.add(user._id);
        return next;
      });
      setMemberWasAdded(true);
    } catch (error: any) {
      toast({
        title: actionErrorMessage || "Erro ao adicionar membro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAdding(null);
    }
  };

  const handleAddGhostMember = async () => {
    if (!group) return;
    setIsAdding("ghost");
    try {
      const ghostUser = await createGhostUser(searchQuery);
      const userName = ghostUser.name || searchQuery;
      const ghostUserId = ghostUser._id || ghostUser.id;

      const createdUserResult: UserSearchResult = {
        ...ghostUser,
        name: userName,
        _id: ghostUserId,
        id: ghostUserId,
        is_placeholder: true,
      } as UserSearchResult;

      await addMemberToGroup(group._id, ghostUserId, 0);

      // Se onGhostCreated está definido (ex: contexto de racha), adiciona ao racha também
      if (onGhostCreated) {
        await onGhostCreated(createdUserResult);
      }

      // Marca o ghost como já adicionado e rastreia para manter label correta
      setCreatedGhostIds((prev) => { const next = new Set(prev); next.add(ghostUserId); return next; });
      setCreatedGhostUsers((prev) => {
        const next = new Map(prev);
        next.set(createdUserResult._id, createdUserResult);
        return next;
      });
      setDisabledOverrides((prev) => { const next = new Set(prev); next.add(ghostUserId); return next; });

      // Mantém a busca ativa e mostra o jogador criado imediatamente na lista.
      setSearchResults((prev) => {
        const next = new Map<string, UserSearchResult>();
        next.set(createdUserResult._id, createdUserResult);
        prev.forEach((user) => { next.set(user._id, user); });
        return Array.from(next.values());
      });

      toast({
        title: "Sucesso!",
        description: onGhostCreated
          ? `${userName} foi adicionado à turma e ao racha como jogador reserva.`
          : `${userName} foi adicionado à turma como jogador reserva.`,
      });
      setIsAdding(null);
      setMemberWasAdded(true);
    } catch (error: any) {
      toast({
        title: "Erro ao criar membro reserva",
        description: error.message,
        variant: "destructive",
      });
      setIsAdding(null);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    setIsAdding(null);
    setCurrentScreen("main");
    setCreatedGhostIds(new Set());
    setCreatedGhostUsers(new Map());
    
    // Só chamar onMemberAdded se um membro foi realmente adicionado
    if (memberWasAdded) {
      onMemberAdded?.();
      setMemberWasAdded(false);
    }
    
    onOpenChange(false);
  };

  const handleBackToMain = () => {
    setCurrentScreen("main");
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile
          ? "bg-zinc-900 border-zinc-800 w-full max-w-none min-h-[80vh] max-h-[88vh] rounded-t-2xl p-0 flex flex-col overflow-y-auto"
          : "bg-zinc-900 border-zinc-800 w-[360px] sm:max-w-md p-0 flex flex-col overflow-y-auto"
        }
      >
        <SheetHeader className="px-6 py-4 border-b border-zinc-800 text-left">
          <div className="flex items-center gap-2">
            {currentScreen !== "main" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBackToMain}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex gap-4 items-center flex-1">
              {currentScreen === "main" && <UserPlus className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />}
              {currentScreen === "link" && <LinkIcon className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />}
              <div>
                <SheetTitle className="text-left">
                  {currentScreen === "main" && (title || "Adicionar Jogadores")}
                  {currentScreen === "link" && "Convidar Via Link"}
                </SheetTitle>
                <p className="text-xs text-zinc-400 mt-1 text-left">
                  {currentScreen === "main"
                    ? (subtitle || "Adicione jogadores ou compartilhe um link de convite.")
                    : "Compartilhe o link com seus amigos para convidá-los."}
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
          {/* TELA PRINCIPAL */}
          {currentScreen === "main" && (
            <>
              {/* SEÇÃO 1: Caixa de Pesquisa */}
              <div className="relative">
                <Input
                  placeholder="Buscar por nome ou usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-zinc-100"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />
                )}
              </div>

              

              {/* SEÇÃO 2: Novo Jogador Reserva */}
              <button
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleAddGhostMember();
                  }
                }}
                disabled={isAdding === "ghost" || !searchQuery.trim()}
                className="w-full p-3 rounded-lg hover:bg-zinc-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <div className="flex gap-4 items-center">
                  {isAdding === "ghost" ? (
                    <Loader2 className="h-5 w-5 text-yellow-400 animate-spin flex-shrink-0 mt-0.5" />
                  ) : (
                    <Ghost className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">
                      {searchQuery.trim()
                        ? "Adicionar Convidado "
                        : "Adicionar Convidado"}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {searchQuery.trim()
                        ? <>Adicione <span className="text-yellow-400 opacity-60 text-xs">{searchQuery}</span> como convidado!</>
                        : "Digite um nome para criar um novo jogador"}
                    </div>
                  </div>
                </div>
              </button>

              {/* SEÇÃO 3: Convidar Via Link */}
              {canGenerateLink && (
                <button
                  onClick={() => setCurrentScreen("link")}
                  className="w-full p-3 rounded-lg hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <div className="flex gap-4 items-center">
                    <LinkIcon className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-left">
                      <div className="font-medium text-white">Convidar Via Link do Grupo</div>
                      <div className="text-xs text-zinc-400 mt-0.5">Compartilhe o link com seus amigos</div>
                    </div>
                  </div>
                </button>
              )}

              <Separator className="bg-zinc-800" />

              {/* SEÇÃO 4: Resultados da Busca */}
              {searchQuery.trim().length === 0 && defaultResults.length === 0 && (
                <div className="flex flex-col items-center text-center py-8 gap-3">
                  <Users className="h-8 w-8 text-zinc-500 opacity-70" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Busque um jogador para adicionar</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Digite nome ou usuario para buscar ou convide pelo link!
                    </p>
                  </div>
                </div>
              )}

              {(visibleResults.length > 0 || isCreatingGhost) && (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-400 uppercase font-medium px-1">
                    {shouldShowSearchResults ? "Resultados" : "Sugestões"} ({visibleResults.length + (isCreatingGhost ? 1 : 0)})
                  </p>
                  {isCreatingGhost && (
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-9 w-9 flex-shrink-0">
                          <AvatarFallback className="text-xs flex items-center justify-center">
                            <Ghost className="h-4 w-4 text-zinc-400" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="h-4 w-32 rounded bg-zinc-700/70 animate-pulse" />
                          <p className="text-xs text-zinc-400 truncate mt-1">Reserva</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-500 hover:text-green-400 flex-shrink-0"
                        disabled
                      >
                        <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                      </Button>
                    </div>
                  )}
                  {visibleResults.map((user) => {
                    if (isCreatingGhost && user.is_placeholder && !user.name?.trim()) {
                      return null;
                    }

                    const displayName = user.name?.trim() || user.username?.trim() || '';
                    const isPlaceholderUser = Boolean(user.is_placeholder);
                    const isDisabled = effectiveDisabledIdsSet.has(user._id);
                    return (
                      <div
                        key={user.id || user._id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-zinc-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarImage src={user.photo_url} className="object-cover object-center" />
                            <AvatarFallback className="text-xs flex items-center justify-center">
                              {isPlaceholderUser ? (
                                <Ghost className="h-4 w-4 text-zinc-400" />
                              ) : (
                                getInitials(displayName || 'U')
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${isDisabled ? 'text-zinc-400' : 'text-zinc-100'}`}>
                              {displayName}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {isPlaceholderUser ? 'Convidado' : user.username ? `@${user.username}` : ''}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-green-500 hover:text-green-400 flex-shrink-0"
                          onClick={() => handleUserAction(user)}
                          disabled={isAdding === (user.id || user._id) || isDisabled}
                        >
                          {isAdding === (user.id || user._id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isDisabled ? (
                            <Users className="h-4 w-4 text-zinc-500" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {isSearching && (
                <div className="flex flex-col items-center text-center py-8 gap-3">
                  <Loader2 className="h-8 w-8 text-green-400 animate-spin" />
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Buscando usuarios...</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Estamos procurando por nome e usuario.
                    </p>
                  </div>
                </div>
              )}

              {!isSearching &&
                searchQuery.trim().length > 2 &&
                isAdding !== "ghost" &&
                combinedResults.length === 0 && (
                  <div className="flex flex-col items-center text-center py-8 gap-3">
                    <Ghost className="h-8 w-8 text-yellow-400 opacity-60" />
                    <div>
                      <p className="text-sm font-medium text-zinc-300">Nenhum usuário encontrado.</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Adicione{" "}
                        <span className="text-yellow-400 opacity-60 font-medium">{searchQuery}</span>{" "}
                        como convidado usando o botão acima!
                      </p>
                    </div>
                  </div>
                )}
            </>
          )}

          {/* TELA DE LINK */}
          {currentScreen === "link" && (
            <div className="space-y-4">
              {/* Input do Link */}
              <div>
                
                <Input
                  value={inviteLink}
                  readOnly
                  placeholder="Gerando link de convite..."
                  className="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm mb-3"
                />
              </div>

              {/* Botões */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                
                  onClick={handleGenerateLink}
                  disabled={isLoadingLink}
                  variant="outline"
                  className="flex-1 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
                >
                  {isLoadingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span >Novo Link</span>
                </Button>
                <Button
                    variant="outline"
                  onClick={handleCopyLink}
                  disabled={!inviteLink || isLoadingLink}
                  className="flex-1 bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
                >
                  {!inviteLink || isLoadingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span>Copiar</span>
                </Button>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Compartilhe este link com seus amigos para convidá-los a participar do grupo. O link é permanente e funciona para todos.
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
