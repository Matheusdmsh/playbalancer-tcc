"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Users,
  Plus,
  DollarSign,
  History,
  ClipboardList,
  UserPlus,
  ArrowUpCircle,
  ArrowDownCircle,
  Trash2,
  Loader2,
  Minus,
  MoreVertical,
  Edit,
  Share2,
  Link2,
  MessageCircle,
  Flag,
  Calendar,
  MailPlus,
  CalendarPlus,
  Banknote,
  BanknoteArrowUp,
  BanknoteArrowDown,
  Wallet,
  X,
  MapPin,
  Trophy,
  Check,
  CalendarCheck2,
  CalendarSync,
  CalendarX2,
  CalendarClock,
  CalendarFold,
  Clock3,
  Settings,
  Ghost,
  Star,
  Medal,
  Pencil
} from "lucide-react";
import { format as formatDateFns } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { RemoveMemberDialog } from "@/components/remove-member-dialog";
import { CreateBookingSheet } from "@/components/create-booking-sheet";
import { TransactionSheet } from "@/components/transaction-sheet";
import { InvitePlayersSheet } from "@/components/invite-players-sheet";
import { UserRoleBadge } from "@/components/user-role-badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/ui/rating-stars";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Importando os Serviços da API ---
import { getGroupById, Group, removeMemberFromGroup, addMemberToGroup, updateMemberSkillLevel } from "@/services/groups";
import { BookingPlayerVote, getBookingsByGroupId, voteBookingPlayer } from "@/services/bookings";
import {
  getTransactionsForGroup,
  getGroupBalance,
  Transaction,
  Balance,
} from "@/services/transactions";
import {
  getUsersByIds,
  getCurrentUser,
  getMyFavoriteGroups,
  addGroupToFavorites,
  removeGroupFromFavorites,
} from "@/services/users";
import * as transactionService from "@/services/transactions";
import { Booking } from "@/interface/booking";
import { acceptBookingInvite, declineBookingInvite, getMyBookingInvites } from "@/services/invites";
import { Invite } from "@/interface/invite";
import React from "react";
import { User } from "@/interface/users";
import { EditBookingSheet } from "@/components/edit-booking-sheet";
import { CancelBookingDialog } from "@/components/cancel-booking-dialog";
import { cancelBooking } from "@/services/bookings";
import { UpdateGhostUserSheet } from "@/components/update-ghost-user-sheet";
import { EditGroupSheet } from "@/components/edit-group-sheet";
import { ChatSheet } from "@/components/chat-sheet";
import { BookingHistorySheet } from "@/components/booking-history-sheet";
import { ProfileCardCarousel } from "@/components/profile-card-carousel";
import { getSportIcon } from "@/lib/getSportIcon";
import { PlayerVoteSheet, VoteCandidate } from "@/components/player-vote-sheet";
import { useIsMobile } from "@/hooks/use-mobile";


// --- Componente Principal da Página ---
export default function GroupDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const groupId = params.id as string;

  // --- Estados do Componente ---
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<transactionService.Transaction[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isUpdateGhostUserModalOpen, setIsUpdateGhostUserModalOpen] = useState(false);
  const [memberToUpdate, setMemberToUpdate] = useState<User | null>(null);

  // Estados para interatividade da UI
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"revenue" | "expense">("revenue");
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [myInvites, setMyInvites] = useState<Invite[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isFavoriteGroup, setIsFavoriteGroup] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [activeTab, setActiveTab] = useState<"partidas" | "caixa" | "jogadores">("partidas");
  const [transactionPageIndex, setTransactionPageIndex] = useState(0);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [visibleReserveCount, setVisibleReserveCount] = useState(5);
  const [selectedVoteBooking, setSelectedVoteBooking] = useState<Booking | null>(null);
  const [isVoteSheetOpen, setIsVoteSheetOpen] = useState(false);
  const [votesByPlayerId, setVotesByPlayerId] = useState<Record<string, BookingPlayerVote>>({});
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const isMobile = useIsMobile();

  const isGroupAdmin = useMemo(
    () => currentUser?._id === group?.owner_id || group?.admins?.includes(currentUser?._id ?? ''),
    [currentUser, group]
  );

  const isOwner = useMemo(
    () => currentUser?._id === group?.owner_id,
    [currentUser, group]
  );

  const playersById = useMemo(() => {
    const usersMap = new Map<string, User>();

    members.forEach((member) => {
      if (member?._id) usersMap.set(String(member._id), member);
      if (member?.id) usersMap.set(String(member.id), member);
    });

    return usersMap;
  }, [members]);

  const normalizeAnyId = (value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && "$oid" in (value as Record<string, unknown>)) {
      const oid = (value as { $oid?: unknown }).$oid;
      if (typeof oid === "string") return oid;
    }
    return undefined;
  };

  const getBookingPlayerId = (player: any): string | undefined => {
    return normalizeAnyId(player?.user_id ?? player?._id ?? player?.id);
  };

  const getExistingVoteByRater = (player: any, raterId?: string): BookingPlayerVote | undefined => {
    if (!raterId) return undefined;
    const votes = Array.isArray(player?.votes) ? player.votes : [];
    const existing = votes.find((vote: any) => normalizeAnyId(vote?.rater_id) === raterId);
    const rawVote = existing?.vote;
    if (rawVote === -1 || rawVote === 0 || rawVote === 1) return rawVote;
    return undefined;
  };

  const voteSheetCandidates = useMemo<VoteCandidate[]>(() => {
    if (!selectedVoteBooking || !currentUser?._id) return [];

    return selectedVoteBooking.players.reduce<VoteCandidate[]>((acc, player) => {
      const playerId = getBookingPlayerId(player);
      if (!playerId || playerId === currentUser._id) return acc;

      const info = playersById.get(playerId);
      const isPlaceholder = Boolean(info?.is_placeholder || (player as any)?.is_placeholder);
      if (isPlaceholder) return acc;

      const nickname = info?.nickname?.trim();
      const firstName = info?.name?.trim().split(/\s+/)[0];
      const displayName = nickname || firstName || info?.name || "Jogador";

      acc.push({
        id: playerId,
        name: displayName,
        username: info?.username || "jogador",
        photoUrl: info?.photo_url,
        initials: (info?.name?.match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase(),
        skillLevel: Number((player as any)?.skill_level) || 0,
        cardVariant: info?.active_card_template,
        existingVote: getExistingVoteByRater(player, currentUser._id),
      });

      return acc;
    }, []);
  }, [selectedVoteBooking, currentUser, playersById]);



  // --- Funções de Formatação ---
  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "Z");
    return formatDateFns(date, "dd 'de' MMMM", { locale: ptBR });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString + "Z");
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
  };

  const formatCompactDate = (dateString: string) => {
    const date = new Date(dateString + "Z");
    return formatDateFns(date, "dd/MMM", { locale: ptBR }).replace(".", "").toLowerCase();
  };

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setIsEditModalOpen(true);
  };

  const handleCancelBookingClick = (booking: Booking) => {
    setBookingToCancel(booking);
    setIsCancelModalOpen(true);
  };

  const handleInviteGhostMemberClick = (member: User) => {
    setMemberToUpdate(member);
    setIsUpdateGhostUserModalOpen(true);
  };
  
  // --- Efeito para Buscar os Dados da API ---
  const fetchData = async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const [
        groupData,
        bookingsData,
        balanceData,
        transactionsData,
        invitesData,
        currentUserData,
        favoriteGroupIds,
      ] = await Promise.all([
        getGroupById(groupId),
        getBookingsByGroupId(groupId),
        transactionService.getGroupBalance(groupId),
        transactionService.getTransactionsForGroup(groupId),
        getMyBookingInvites(),
        getCurrentUser(),
        getMyFavoriteGroups(),
      ]);

      setGroup(groupData);
      setBookings(bookingsData);
      setBalance(balanceData);
      setTransactions(transactionsData);
      setMyInvites(invitesData);
      setCurrentUser(currentUserData);
      setIsFavoriteGroup(favoriteGroupIds.includes(groupId));

      if (groupData.members && groupData.members.length > 0) {
        const memberIds = groupData.members.map((m) => m.id);
        const membersData = await getUsersByIds(memberIds);
        
        // Mesclar dados do usuário com skill_level do grupo
        const mergedMembers = membersData.map(userData => {
          const groupMember = groupData.members?.find(m => m.id === userData._id);
          return {
            ...userData,
            skill_level: groupMember?.skill_level ?? undefined
          };
        });
        
        setMembers(mergedMembers);
      }
    } catch (err: any) {
      setError("Não foi possível carregar os dados do grupo.");
      toast({
        title: "Erro na comunicação com o servidor",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId, toast]);

  useEffect(() => {
    setVisibleReserveCount(5);
  }, [groupId]);

  // Funções de atualização granular (sem loading state)
  const updateMemberSkillLocally = (memberId: string, newSkill: number) => {
    setMembers(prev => prev.map(m => 
      m._id === memberId ? { ...m, skill_level: newSkill } : m
    ));
  };

  const refreshMembersOnly = async () => {
    try {
      // Primeiro buscar os dados atualizados do grupo
      const groupData = await getGroupById(groupId);
      setGroup(groupData);
      
      // Depois buscar os dados completos dos membros
      if (groupData.members && groupData.members.length > 0) {
        const memberIds = groupData.members.map((m) => m.id);
        const membersData = await getUsersByIds(memberIds);
        
        const mergedMembers = membersData.map(userData => {
          const groupMember = groupData.members?.find(m => m.id === userData._id);
          return {
            ...userData,
            skill_level: groupMember?.skill_level ?? undefined
          };
        });
        
        setMembers(mergedMembers);
      }
    } catch (err) {
      console.error("Erro ao atualizar membros:", err);
    }
  };

  const refreshBookingsOnly = async () => {
    try {
      const bookingsData = await getBookingsByGroupId(groupId);
      setBookings(bookingsData);
    } catch (err) {
      console.error("Erro ao atualizar partidas:", err);
    }
  };

  const refreshTransactionsOnly = async () => {
    try {
      const [balanceData, transactionsData] = await Promise.all([
        transactionService.getGroupBalance(groupId),
        transactionService.getTransactionsForGroup(groupId),
      ]);
      setBalance(balanceData);
      setTransactions(transactionsData);
    } catch (err) {
      console.error("Erro ao atualizar transações:", err);
    }
  };

  const refreshInvitesOnly = async () => {
    try {
      const invitesData = await getMyBookingInvites();
      setMyInvites(invitesData);
    } catch (err) {
      console.error("Erro ao atualizar convites:", err);
    }
  };

  const openVoteSheetForBooking = (booking: Booking) => {
    const currentUserId = normalizeAnyId(currentUser?._id);
    if (!currentUserId) return;

    const initialVotes = booking.players.reduce<Record<string, BookingPlayerVote>>((acc, player) => {
      const playerId = getBookingPlayerId(player);
      if (!playerId || playerId === currentUserId) return acc;

      const existingVote = getExistingVoteByRater(player, currentUserId);
      if (typeof existingVote !== "undefined") {
        acc[playerId] = existingVote;
      }
      return acc;
    }, {});

    setSelectedVoteBooking(booking);
    setVotesByPlayerId(initialVotes);
    setIsVoteSheetOpen(true);
  };

  const handleVoteSubmit = async (playerId: string, vote: BookingPlayerVote) => {
    if (!selectedVoteBooking || isSubmittingVote) return false;

    try {
      setIsSubmittingVote(true);
      await voteBookingPlayer(selectedVoteBooking._id, playerId, vote);
      setVotesByPlayerId((prev) => ({ ...prev, [playerId]: vote }));
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao registrar avaliação",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmittingVote(false);
    }
  };

  const handleUndoVote = (playerId: string) => {
    setVotesByPlayerId((prev) => {
      if (typeof prev[playerId] === "undefined") return prev;
      const next = { ...prev };
      delete next[playerId];
      return next;
    });
  };

  const handleVoteSheetOpenChange = (open: boolean) => {
    setIsVoteSheetOpen(open);
    if (!open) {
      setSelectedVoteBooking(null);
      setVotesByPlayerId({});
      void refreshBookingsOnly();
    }
  };

  // --- Manipuladores de Eventos ---
  const getInitials = (name: string = "") => {
    const names = name.split(" ");
    return (
      (names[0]?.[0] || "") +
      (names.length > 1 ? names[names.length - 1]?.[0] : "")
    ).toUpperCase();
  };

  const getCardDisplayName = (name?: string, nickname?: string) => {
    const trimmedNickname = nickname?.trim();
    if (trimmedNickname) return trimmedNickname;

    const firstName = name?.trim().split(/\s+/)[0];
    return firstName || "Jogador";
  };

  const handleRemoveMemberClick = (member: User) => {
    setMemberToRemove(member);
    setIsRemoveMemberModalOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;

    setIsCancelling(true);
    try {
      await cancelBooking(bookingToCancel._id);
      toast({
        title: "Sucesso!",
        description: "A partida foi cancelado.",
      });
      await refreshBookingsOnly();
      setIsCancelModalOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove || !group) return;

    setIsRemovingMember(true);
    try {
      await removeMemberFromGroup(group._id, memberToRemove._id);
      await refreshMembersOnly();
      toast({
        title: "Sucesso",
        description: `${memberToRemove.name} foi removido(a) do grupo.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao remover membro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRemovingMember(false);
      setIsRemoveMemberModalOpen(false);
      setMemberToRemove(null);
    }
  };

  const openTransactionModal = () => {
    setIsTransactionModalOpen(true);
  };

  const handleToggleFavoriteGroup = async () => {
    if (!group?._id || isTogglingFavorite) return;

    const previousValue = isFavoriteGroup;
    const nextValue = !previousValue;

    setIsFavoriteGroup(nextValue);
    setIsTogglingFavorite(true);

    try {
      if (nextValue) {
        await addGroupToFavorites(group._id);
        toast({ title: "Grupo favoritado" });
      } else {
        await removeGroupFromFavorites(group._id);
        toast({ title: "Grupo removido dos favoritos" });
      }
    } catch (error: any) {
      setIsFavoriteGroup(previousValue);
      toast({
        title: "Erro ao atualizar favorito",
        description: error?.message || "Não foi possível atualizar o favorito.",
        variant: "destructive",
      });
    } finally {
      setIsTogglingFavorite(false);
    }
  };
  
  // --- Listas Filtradas e Ordenadas ---
  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const upcomingBookings = activeBookings
    .filter((b) => new Date(b.start_time) >= new Date())
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

  // Bookings já encerrados (dentro de 48h) onde o usuário ainda tem jogadores para avaliar
  const voteableBookings = activeBookings.filter((booking) => {
    const currentUserId = normalizeAnyId(currentUser?._id);
    if (!currentUserId) return false;
    const now = new Date();
    const endTime = new Date(booking.end_time + "Z");
    if (endTime >= now) return false;
    const hoursAfterEnd = (now.getTime() - endTime.getTime()) / (1000 * 60 * 60);
    if (hoursAfterEnd > 48) return false;
    const isParticipant = booking.players.some((p: any) => {
      const pid = normalizeAnyId(p.user_id ?? p._id ?? p.id);
      return pid === currentUserId;
    });
    return isParticipant;
  }).sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime());

  const voteableBookingIds = new Set(voteableBookings.map((b) => b._id));
  const displayBookings = [...voteableBookings, ...upcomingBookings];

  const sortedMembers = [...members].sort(
    (a, b) => Number(a.is_placeholder) - Number(b.is_placeholder)
  );

  const groupPhotoUrl = group?.photo_url || "";
  const groupSportIcon = group?.modality ? getSportIcon(group.modality) : null;

  const renderCaixaCard = (cardClassName?: string) => {
    const TRANSACTIONS_PER_PAGE = 10;
    const totalPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);
    const startIdx = transactionPageIndex * TRANSACTIONS_PER_PAGE;
    const endIdx = startIdx + TRANSACTIONS_PER_PAGE;
    const paginatedTransactions = transactions.slice(startIdx, endIdx);

    return (
      <Card className={`border-zinc-800 flex flex-col h-fit overflow-hidden ${cardClassName ?? ""}`}>
        {/* Header - Desktop apenas */}
        <CardHeader className="hidden lg:flex flex-row justify-between items-center pb-4 gap-2">
          <CardTitle className="flex items-center gap-2 text-lg shrink-0">
            <Wallet className="text-green-500" /> Caixa
          </CardTitle>

          {isGroupAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
              onClick={() => openTransactionModal()}
            >
              <Banknote className="h-4 w-4 group-hover:text-green-400" />
              Registrar
            </Button>
          )}
        </CardHeader>

        {/* Mobile - Saldo Grande e Centralizado */}
        <CardContent className="lg:pb-2 pt-6 lg:pt-0">
          <div className="lg:hidden text-center mb-6">
            <p className="text-xs text-zinc-400 uppercase font-medium mb-2">Saldo Atual</p>
            <p className="text-5xl font-bold text-white-400 mb-6">
              {formatCurrency(balance?.balance || 0)}
            </p>
            {isGroupAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
                onClick={() => openTransactionModal()}
              >
                <Banknote className="h-4 w-4 group-hover:text-green-400" />
                Registrar
              </Button>
            )}
          </div>

          {/* Desktop - Saldo Normal */}
          <div className="hidden lg:block pb-2">
            <p className="text-sm text-zinc-400">Saldo Atual</p>
            <p className="text-4xl font-bold leading-tight whitespace-nowrap truncate">
              {formatCurrency(balance?.balance || 0)}
            </p>
          </div>

          {/* Entradas e Saídas - Mobile lado a lado, Desktop em coluna */}
          <div className="mt-6 lg:mt-4 grid grid-cols-2 lg:flex lg:flex-col lg:xl:flex-row gap-3 lg:gap-4">
            <div className="flex flex-col gap-1 p-3 lg:p-0 bg-zinc-900/30 lg:bg-transparent rounded-lg lg:rounded-none border border-zinc-800 lg:border-0 lg:w-full">
              <div className="flex items-center gap-2">
                <BanknoteArrowUp className="h-4 w-4 text-green-400 shrink-0" />
                <p className="text-[10px] text-zinc-400 uppercase font-medium">Entradas</p>
              </div>
              <p className="font-bold text-lg text-green-400">
                {formatCurrency(balance?.total_revenue || 0)}
              </p>
            </div>

            <div className="flex flex-col gap-1 p-3 lg:p-0 bg-zinc-900/30 lg:bg-transparent rounded-lg lg:rounded-none border border-zinc-800 lg:border-0 lg:w-full">
              <div className="flex items-center gap-2">
                <BanknoteArrowDown className="h-4 w-4 text-red-400 shrink-0" />
                <p className="text-[10px] text-zinc-400 uppercase font-medium">Saídas</p>
              </div>
              <p className="font-bold text-lg text-red-400">
                {formatCurrency(balance?.total_expense || 0)}
              </p>
            </div>
          </div>
        </CardContent>

        {/* Transações */}
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-semibold">
            Últimas Transações
          </h3>
        </div>

        <CardContent className="space-y-3 pb-3">
          {paginatedTransactions.length > 0 ? (
            paginatedTransactions.map((t) => {
              const author = members.find((m) => m._id === t.user_id);
              const authorFirstName = author ? author.name.split(' ')[0] : "Sistema";
              const date = new Date(t.created_at);
              const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

              return (
                <div
                  key={t._id}
                  className="flex items-center justify-between gap-3 w-full border-b border-zinc-900 pb-3 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {t.type === "revenue" ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-400 shrink-0" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-400 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-zinc-100 truncate">{t.description}</p>
                      <p className="text-[10px] text-zinc-500 uppercase">
                        {authorFirstName} • {formattedDate}
                      </p>
                    </div>
                  </div>
                  
                  <span
                    className={`font-bold text-sm shrink-0 ${
                      t.type === "revenue" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {t.type === "revenue" ? "+" : "-"}{formatCurrency(t.amount)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-zinc-500 text-center py-4">
              Nenhuma transação recente.
            </p>
          )}
        </CardContent>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 px-6 pb-4">
            <Button
              variant="outline"
              size="sm"
              disabled={transactionPageIndex === 0}
              onClick={() => setTransactionPageIndex(transactionPageIndex - 1)}
              className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </Button>
            <span className="text-sm text-zinc-400">
              Página {transactionPageIndex + 1} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={transactionPageIndex >= totalPages - 1}
              onClick={() => setTransactionPageIndex(transactionPageIndex + 1)}
              className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </Button>
          </div>
        )}
      </Card>
    );
  };

  const renderJogadoresCard = (cardClassName?: string) => (
    <Card className={`border-zinc-800 ${cardClassName ?? ""}`}>
      <CardHeader className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-4">
        <CardTitle className="hidden lg:flex items-center gap-2 text-lg">
          <Users className="text-green-500" /> Jogadores ({members.length})
        </CardTitle>
        
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Carrossel de cards dos jogadores (exceto reservas) */}
        {(() => {
          const getRoleRank = (memberId: string) => {
            if (memberId === group?.owner_id) return 0;
            if (group?.admins?.includes(memberId)) return 1;
            return 2;
          };

          const carouselCards = sortedMembers
            .filter((m) => !m.is_placeholder)
            .sort((a, b) => {
              const rankDiff = getRoleRank(a._id) - getRoleRank(b._id);
              if (rankDiff !== 0) return rankDiff;
              return (a.name || "").localeCompare(b.name || "", "pt-BR", { sensitivity: "base" });
            })
            .map((m) => {
              const groupRole: "owner" | "admin" | undefined =
                m._id === group?.owner_id
                  ? "owner"
                  : group?.admins?.includes(m._id)
                  ? "admin"
                  : undefined;

              return {
                name: getCardDisplayName(m.name, m.nickname),
                username: m.username,
                photoUrl: m.photo_url,
                initials: getInitials(m.name),
                skillLevel: m.skill_level ?? 0,
                cardVariant: m.active_card_template,
                groupRole,
                memberSince: m.created_at
                  ? new Date(m.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
                  : undefined,
                sport: group?.modality
                  ? { name: group.modality, icon: getSportIcon(group.modality) }
                  : undefined,
              };
            });
          return carouselCards.length > 0 ? (
            <ProfileCardCarousel cards={carouselCards} />
          ) : null;
        })()}
        {sortedMembers
          .filter((member) => member.is_placeholder)
          .slice(0, visibleReserveCount)
          .map((member) => (
          <div
            key={member._id}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className={`transition-colors duration-300 ease-in-out rounded-full border-2 border-zinc-800 ${
                  member._id !== group?.owner_id && isGroupAdmin
                    ? "group-hover:border-red-500/70"
                    : ""
                }`}>
                  <button
                    onClick={() => member._id !== group?.owner_id && isGroupAdmin && handleRemoveMemberClick(member)}
                    className={`transition-all ${
                      member._id !== group?.owner_id && isGroupAdmin
                        ? "cursor-pointer"
                        : "cursor-default"
                    }`}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.photo_url} />
                      <AvatarFallback className="text-xs flex items-center justify-center">
                        {member.is_placeholder ? (
                          <Ghost className="h-4 w-4 text-zinc-400" />
                        ) : (
                          getInitials(member.name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </div>
                {member._id !== group?.owner_id && isGroupAdmin && (
                  <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 pointer-events-none">
                    <X className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{member.name}</p>
                <div className="mt-1">
                  {member.is_placeholder ? (
                    <UserRoleBadge role="reserva" variant="subtle" />
                  ) : member._id === group?.owner_id ? (
                    <UserRoleBadge role="owner" variant="subtle" />
                  ) : group?.admins?.includes(member._id) ? (
                    <UserRoleBadge role="admin" variant="subtle" />
                  ) : (
                    <UserRoleBadge role="member" variant="subtle" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!member.is_placeholder && (
                <StarRating
                  currentSkill={member.skill_level ?? 0}
                  onSkillUpdate={async (newSkill) => {
                    try {
                      await updateMemberSkillLevel(group?._id ?? '', member._id, newSkill);
                      updateMemberSkillLocally(member._id, newSkill);
                      toast({ title: "Nível de habilidade atualizado." });
                    } catch (error: any) {
                      toast({ title: "Erro", description: error.message, variant: "destructive" });
                    }
                  }}
                  enabled={!!isGroupAdmin}
                />
              )}
              {member.is_placeholder && isGroupAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
                  onClick={() => handleInviteGhostMemberClick(member)}
                >
                  <MailPlus className="h-4 w-4 group-hover:text-green-400" />
                  Convidar
                </Button>
              )}
            </div>
          </div>
        ))}

        {sortedMembers.filter((member) => member.is_placeholder).length > visibleReserveCount && (
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
            onClick={() => setVisibleReserveCount((prev) => prev + 5)}
          >
            <Plus className="h-4 w-4" />
            Mostrar mais
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // --- Renderização Condicional ---
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-black">
        {/* Skeleton do Header com foto de fundo */}
        <div className="w-full h-[216px] bg-zinc-800/70 animate-pulse" />

        {/* Skeleton da barra sticky */}
        <div className="sticky top-0 z-50 shadow-lg shadow-black/50 backdrop-blur-lg lg:h-[80px] bg-black/40">
          <div className="hidden lg:flex h-full justify-between items-center px-4 sm:px-6 lg:px-8 animate-pulse">
            {/* Esquerda */}
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-zinc-800/60 rounded" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-zinc-800/60 rounded" />
                <div className="h-4 w-32 bg-zinc-800/60 rounded" />
              </div>
            </div>
            {/* Direita */}
            <div className="flex gap-2">
              <div className="h-10 w-40 bg-zinc-800/60 rounded" />
              <div className="h-10 w-32 bg-zinc-800/60 rounded" />
              <div className="h-10 w-24 bg-zinc-800/60 rounded" />
              <div className="h-10 w-32 bg-zinc-800/60 rounded" />
            </div>
          </div>

          {/* Mobile header skeleton */}
          <div className="lg:hidden animate-pulse">
            <div className="flex justify-between items-center px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-zinc-800/60 rounded" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-zinc-800/60 rounded" />
                  <div className="h-3 w-24 bg-zinc-800/60 rounded" />
                </div>
              </div>
              <div className="flex gap-1">
                <div className="h-8 w-8 bg-zinc-800/60 rounded" />
                <div className="h-8 w-8 bg-zinc-800/60 rounded" />
                <div className="h-8 w-8 bg-zinc-800/60 rounded" />
              </div>
            </div>
            {/* Tabs skeleton */}
            <div className="flex px-4">
              <div className="flex-1 h-10 bg-zinc-800/40 rounded-t" />
              <div className="flex-1 h-10 bg-zinc-800/40 rounded-t" />
              <div className="flex-1 h-10 bg-zinc-800/40 rounded-t" />
            </div>
          </div>
        </div>

        {/* Skeleton do conteúdo principal */}
        <div className="flex-1 overflow-auto px-2 sm:px-2 lg:px-8 pt-1 lg:pt-4 ">
          {/* Desktop: 2 blocos principais */}
          <div className="hidden lg:grid lg:grid-cols-5 gap-6 animate-pulse">
            {/* Bloco Esquerdo: Partidas (col-span-3) */}
            <div className="lg:col-span-3">
              <div className="w-full h-[600px] bg-zinc-900/60 rounded-lg" />
            </div>

            {/* Bloco Direito: Jogadores + Caixa (col-span-2) */}
            <div className="lg:col-span-2">
              <div className="w-full h-[600px] bg-zinc-900/60 rounded-lg" />
            </div>
          </div>

          {/* Mobile: skeleton simples */}
          <div className="lg:hidden p-4 space-y-4 animate-pulse">
            <div className="bg-zinc-900 rounded-lg p-4 space-y-3">
              <div className="h-5 w-32 bg-zinc-800/60 rounded" />
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-zinc-800/40 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-500">
        <p>{error || "Grupo não encontrado."}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.back()}
        >
          Voltar
        </Button>
      </div>
    );
  }

  // --- Renderização Principal ---
  return (
    <>
      {/* HEADER COMPLETO COM BACKGROUND UNIFICADO */}
      {/* Só mostra o espaçador de foto se houver groupPhotoUrl */}
      {groupPhotoUrl ? (
        <div
          className="w-full"
          style={{
            height: "216px",
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0, 0.4), rgba(0,0,0,0.2), transparent),
              linear-gradient(to top, rgb(0, 0, 0), rgba(0,0,0,0.4), transparent),
              url(${groupPhotoUrl})
            `,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
      ) : null}

      {/* FAIXA INFERIOR — STICKY COM BLUR */}
      <div
        className="sticky top-0 z-50 shadow-lg shadow-black/50 backdrop-blur-lg lg:h-[80px]"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Desktop Header */}
        <div className="hidden lg:flex h-full justify-between items-center px-4 sm:px-6 lg:px-8">

      {/* ESQUERDA */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg md:text-lg">
              {group.name}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              className="group h-8 w-8 cursor-pointer bg-transparent hover:bg-transparent focus-visible:bg-transparent"
              onClick={handleToggleFavoriteGroup}
              disabled={isTogglingFavorite}
              aria-label={isFavoriteGroup ? "Remover grupo dos favoritos" : "Favoritar grupo"}
              title={isFavoriteGroup ? "Remover dos favoritos" : "Favoritar grupo"}
            >
              {isTogglingFavorite ? (
                <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
              ) : (
                <Star className={`h-4 w-4 transition-transform duration-200 group-hover:scale-130 ${isFavoriteGroup ? "fill-yellow-400 text-yellow-400" : "text-zinc-300"}`} />
              )}
            </Button>
          </div>

          <div className="text-xs text-zinc-300 flex items-center gap-2 mt-1">
            {isOwner && <UserRoleBadge role="owner" />}
            {!isOwner && isGroupAdmin && <UserRoleBadge role="admin" />}
            {!isOwner && !isGroupAdmin && <UserRoleBadge role="member" />}

            {group?.modality && (
              <Badge className="border-0 bg-emerald-900/70 text-emerald-200 hover:bg-emerald-800 text-xs gap-1 max-w-[150px]">
                <span className="[&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-emerald-300">{groupSportIcon}</span>
                <span className="truncate">{group.modality}</span>
              </Badge>
            )}

            <Badge className="border-0 bg-emerald-900/70 text-emerald-200 hover:bg-emerald-800 text-xs gap-1">
              <Users className="h-3 w-3 text-emerald-300" />
              {members.length} {members.length === 1 ? "membro" : "membros"}
            </Badge>
          </div>
        </div>
      </div>

      {/* DIREITA */}
      <div className="flex gap-2">
        {isGroupAdmin && (
          <Button
            variant="outline"
            className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-4 w-4 " />
            <span className="hidden md:inline">Configurações</span>
          </Button>
        )}
        {isGroupAdmin && (
          <Button
            variant="outline"
            className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus className="h-4 w-4 " />
            <span className="hidden md:inline">Adicionar</span>
          </Button>
        )}

        <Button
          variant="outline"
          className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageCircle className="h-4 w-4 " />
          <span className="hidden md:inline">Chat</span>
        </Button>

        {isGroupAdmin && (
          <Button
            variant="outline"
            className="hidden md:inline-flex bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
            onClick={() => setIsBookingModalOpen(true)}
          >
            <CalendarPlus className="h-4 w-4 text-green-400" />
            Nova Partida
          </Button>
        )}
      </div>

    </div>

        {/* Mobile Header com Tabs Integradas */}
        <div className="lg:hidden">
          {/* Linha superior - Info do grupo */}
          <div className="flex justify-between items-center px-4 py-3 ">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base">{group.name}</h1>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group h-7 w-7 cursor-pointer bg-transparent hover:bg-transparent focus-visible:bg-transparent"
                    onClick={handleToggleFavoriteGroup}
                    disabled={isTogglingFavorite}
                    aria-label={isFavoriteGroup ? "Remover grupo dos favoritos" : "Favoritar grupo"}
                    title={isFavoriteGroup ? "Remover dos favoritos" : "Favoritar grupo"}
                  >
                    {isTogglingFavorite ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-300" />
                    ) : (
                      <Star className={`h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110 ${isFavoriteGroup ? "fill-yellow-400 text-yellow-400" : "text-zinc-300"}`} />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-zinc-300 flex items-center gap-2 mt-1">
            {isOwner && <UserRoleBadge role="owner" />}
            {!isOwner && isGroupAdmin && <UserRoleBadge role="admin" />}
            {!isOwner && !isGroupAdmin && <UserRoleBadge role="member" />}

            {group?.modality && (
              <Badge className="border-0 bg-emerald-900/70 text-emerald-200 hover:bg-emerald-800 text-xs gap-1 max-w-[120px]">
                <span className="[&_svg]:h-3 [&_svg]:w-3 [&_svg]:text-emerald-300">{groupSportIcon}</span>
                <span className="truncate">{group.modality}</span>
              </Badge>
            )}
          </div>
              </div>
            </div>
            <div className="flex gap-1">
              {isGroupAdmin && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
              {isGroupAdmin && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsInviteModalOpen(true)}>
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsChatOpen(true)}>
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Linha inferior - Tabs */}
          <div className="relative px-4 py-2">
            <div className="flex justify-around items-center relative">
              {/* Indicador Verde Animado */}
              <div
                className="absolute bottom-0 h-0.5 bg-green-500 transition-all duration-300 ease-out"
                style={{
                  width: '33.333%',
                  left: activeTab === 'partidas' ? '0%' : activeTab === 'caixa' ? '33.333%' : '66.666%',
                }}
              />
              
              {/* Tab Partidas */}
              <button
                onClick={() => setActiveTab('partidas')}
                className={`flex flex-col items-center gap-1 py-2 flex-1 transition-all duration-200 ${
                  activeTab === 'partidas' ? 'scale-110' : 'scale-100 opacity-70'
                }`}
              >
                <ClipboardList className={activeTab === 'partidas'? 'h-4 w-4 text-green-400' : 'h-3.5 w-3.5'} />
                <span className={`text-xs font-medium ${activeTab === 'partidas' ? 'text-green-400' : ''}`}>
                  Partidas
                </span>
              </button>

              {/* Tab Caixa */}
              <button
                onClick={() => setActiveTab('caixa')}
                className={`flex flex-col items-center gap-1 py-2 flex-1 transition-all duration-200 ${
                  activeTab === 'caixa' ? 'scale-110' : 'scale-100 opacity-70'
                }`}
              >
                <Wallet className={activeTab === 'caixa' ? 'h-4 w-4 text-green-400' : 'h-3.5 w-3.5'} />
                <span className={`text-xs font-medium ${activeTab === 'caixa' ? 'text-green-400' : ''}`}>
                  Caixa
                </span>
              </button>

              {/* Tab Jogadores */}
              <button
                onClick={() => setActiveTab('jogadores')}
                className={`flex flex-col items-center gap-1 py-2 flex-1 transition-all duration-200 ${
                  activeTab === 'jogadores' ? 'scale-110' : 'scale-100 opacity-70'
                }`}
              >
                <Users className={activeTab === 'jogadores' ? 'h-4 w-4 text-green-400' : 'h-3.5 w-3.5'} />
                <span className={`text-xs font-medium ${activeTab === 'jogadores' ? 'text-green-400' : ''}`}>
                  Jogadores
                </span>
              </button>
            </div>
          </div>
        </div>
  </div>
      

      {/* Conteúdo Principal */}
      <div className="space-y-6 px-2 sm:px-2 lg:px-8 pt-1 lg:pt-4 md:max-w-7xl mx-auto " style={{ minHeight: 'calc(100vh - 216px)' }}>
        {/* Mobile Content */}
        <div className="lg:hidden">
          {activeTab === 'partidas' && (
            <PartidasSection
              title="Partidas"
              bookings={displayBookings}
              myInvites={myInvites}
              onRefreshBookings={async () => {
                await refreshBookingsOnly();
                await refreshInvitesOnly();
              }}
              currentUser={currentUser}
              playersById={playersById}
              group={group}
              isGroupAdmin={!!isGroupAdmin}
              formatDate={formatDate}
              formatCompactDate={formatCompactDate}
              formatTime={formatTime}
              onEditBooking={handleEditBooking}
              onCancelBooking={handleCancelBookingClick}
              onViewHistory={() => setIsHistorySheetOpen(true)}
              onCreateBooking={isGroupAdmin ? () => setIsBookingModalOpen(true) : undefined}
              onOpenChat={() => setIsChatOpen(true)}
              voteableBookingIds={voteableBookingIds}
              onOpenVoteSheet={openVoteSheetForBooking}
              cardClassName="border-0 bg-transparent shadow-none"
            />
          )}
          {activeTab === 'caixa' && renderCaixaCard("border-0 bg-transparent shadow-none")}
          {activeTab === 'jogadores' && renderJogadoresCard("border-0 bg-transparent shadow-none")}
        </div>

        <main className="hidden lg:grid grid-cols-1 lg:grid-cols-5 gap-6 ">
          {/* Colunas 1, 2 e 3: Próximos Partidas */}
          <div className="lg:col-span-3 space-y-6">
            <PartidasSection
              title="Partidas"
              bookings={displayBookings}
              myInvites={myInvites}
              onRefreshBookings={async () => {
                await refreshBookingsOnly();
                await refreshInvitesOnly();
              }}
              currentUser={currentUser}
              playersById={playersById}
              group={group}
              isGroupAdmin={!!isGroupAdmin}
              formatDate={formatDate}
              formatCompactDate={formatCompactDate}
              formatTime={formatTime}
              onEditBooking={handleEditBooking}
              onCancelBooking={handleCancelBookingClick}
              onViewHistory={() => setIsHistorySheetOpen(true)}
              onCreateBooking={isGroupAdmin ? () => setIsBookingModalOpen(true) : undefined}
              onOpenChat={() => setIsChatOpen(true)}
              voteableBookingIds={voteableBookingIds}
              onOpenVoteSheet={openVoteSheetForBooking}
            />
          </div>
          
          {/* Colunas 4 e 5: Jogadores + Caixa */}
          <div className="lg:col-span-2 space-y-6">
            {renderJogadoresCard()}
            {renderCaixaCard()}
          </div>
        </main>
      </div>

      {/* --- Modais --- */}
      <RemoveMemberDialog
        isOpen={isRemoveMemberModalOpen}
        onClose={() => setIsRemoveMemberModalOpen(false)}
        onConfirm={confirmRemoveMember}
        member={memberToRemove}
        isRemoving={isRemovingMember}
      />
      <CreateBookingSheet
        open={isGroupAdmin ? isBookingModalOpen : false}
        onOpenChange={setIsBookingModalOpen}
        groupId={group._id}
        group={group}
        onBookingCreated={refreshBookingsOnly}
      />
      <TransactionSheet
        open={isTransactionModalOpen}
        onOpenChange={setIsTransactionModalOpen}
        groupId={group!._id}
        onTransactionCreated={refreshTransactionsOnly}
      />
      <EditBookingSheet
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        booking={bookingToEdit}
        onBookingUpdated={async () => {
          await refreshBookingsOnly();
          setIsEditModalOpen(false);
        }}
      />
      <CancelBookingDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={confirmCancelBooking}
        booking={bookingToCancel}
        isCancelling={isCancelling}
      />
      <UpdateGhostUserSheet
        open={isUpdateGhostUserModalOpen}
        onOpenChange={setIsUpdateGhostUserModalOpen}
        member={memberToUpdate}
        onInviteSent={async () => {
          await refreshMembersOnly();
          setIsUpdateGhostUserModalOpen(false);
        }}
      />
      {group && (
        <EditGroupSheet
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          group={group}
          onGroupUpdated={(updatedGroup) => setGroup(updatedGroup)}
          currentUserId={currentUser?._id}
        />
      )}
      <InvitePlayersSheet
        open={isInviteModalOpen}
        onOpenChange={setIsInviteModalOpen}
        group={group}
        currentUser={currentUser}
        onMemberAdded={refreshMembersOnly}
        searchParams={{ include_ghosts: false }}
        onUserAction={async (user) => {
          await addMemberToGroup(group!._id, user._id, 0);
        }}
        disabledUserIds={(group?.members || []).map((member) => member.id)}
      />
      {group && (
        <ChatSheet
          open={isChatOpen}
          onOpenChange={setIsChatOpen}
          group={group}
        />
      )}
      <BookingHistorySheet
        open={isHistorySheetOpen}
        onOpenChange={setIsHistorySheetOpen}
        bookings={bookings}
        members={members}
        currentUser={currentUser}
      />
      <PlayerVoteSheet
        open={isVoteSheetOpen}
        onOpenChange={handleVoteSheetOpenChange}
        side={isMobile ? "bottom" : "right"}
        bookingModality={selectedVoteBooking?.modality}
        candidates={voteSheetCandidates}
        votesByPlayerId={votesByPlayerId}
        isSubmitting={isSubmittingVote}
        onVote={handleVoteSubmit}
        onUndoVote={handleUndoVote}
        onResetVotes={() => setVotesByPlayerId({})}
      />
    </>
  );
}

// --- StarRating Component ---
interface StarRatingProps {
  currentSkill: number;
  onSkillUpdate: (newSkill: number) => Promise<void>;
  enabled: boolean;
}

function StarRating({ currentSkill, onSkillUpdate, enabled }: StarRatingProps) {
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const stars = [1, 2, 3, 4, 5];
  
  if (!enabled) {
    return (
      <RatingStars
        value={currentSkill}
        size={16}
        filledColor="#eab308"
        emptyColor="#52525b"
      />
    );
  }

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button 
            className="group flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-800/50 border border-zinc-700 hover:border-green-400 transition-all cursor-pointer hover:shadow-sm"
            title="Clique para editar"
          >
            <RatingStars
              value={currentSkill}
              size={16}
              filledColor="#facc15"
              emptyColor="#52525b"
            />
            <Pencil className="h-3 w-3 text-zinc-500 group-hover:text-green-400 transition-colors" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 bg-zinc-800 border-zinc-700">
            <div className="flex gap-2">
                {stars.map((star) => (
                    <Button key={star} variant="ghost" size="icon" onClick={async () => {
                        await onSkillUpdate(star);
                        setPopoverOpen(false);
                    }}>
                        <Star className={`h-6 w-6 transition-transform hover:scale-125 ${star <= currentSkill ? "text-yellow-400 fill-yellow-400" : "text-zinc-500"}`} />
                    </Button>
                ))}
            </div>
        </PopoverContent>
    </Popover>
  );
}

// --- Componente para a Seção de Partidas ---
import { BookingCard } from "@/components/booking-card";
const PartidasSection = ({
  title,
  bookings,
  myInvites,
  onRefreshBookings,
  currentUser,
  playersById,
  group,
  isGroupAdmin,
  formatDate,
  formatCompactDate,
  formatTime,
  onEditBooking,
  onCancelBooking,
  onViewHistory,
  onCreateBooking,
  onOpenChat,
  cardClassName,
  voteableBookingIds,
  onOpenVoteSheet,
}: {
  title: string;
  bookings: Booking[];
  myInvites: Invite[];
  onRefreshBookings: () => Promise<void>;
  currentUser: User | null;
  playersById: Map<string, User>;
  group: Group | null;
  isGroupAdmin: boolean;
  formatDate: (date: string) => string;
  formatCompactDate: (date: string) => string;
  formatTime: (date: string) => string;
  onEditBooking: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
  onViewHistory?: () => void;
  onCreateBooking?: () => void;
  onOpenChat?: () => void;
  cardClassName?: string;
  voteableBookingIds?: Set<string>;
  onOpenVoteSheet?: (booking: Booking) => void;
}) => {
  const { toast } = useToast();

  const handlePresence = async (
    bookingId: string,
    action: "confirm" | "cancel"
  ) => {
    const invite = myInvites.find((inv) => inv.booking_id === bookingId);
    if (!invite) {
      toast({
        title: "Erro",
        description: "Convite não encontrado para essa partida.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (action === "confirm") {
        await acceptBookingInvite(bookingId, invite._id);
        toast({ title: "Sucesso", description: "Presença confirmada!" });
      } else {
        await declineBookingInvite(bookingId, invite._id);
        toast({
          title: "Sucesso",
          description: "Presença cancelada.",
        });
      }
      await onRefreshBookings();
    } catch (error: any) {
      toast({
        title: `Erro ao ${action === "confirm" ? "confirmar" : "cancelar"} presença`,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className={`border-zinc-800 ${cardClassName ?? ""}`}>
      <CardHeader className="flex flex-col lg:flex-row justify-between items-start lg:items-center pb-4">
        <CardTitle className="hidden lg:flex items-center gap-2 text-lg">
          {title === "Partidas" ? (
            <ClipboardList className="text-green-500" />
          ) : (
            <History className="text-green-500" />
          )}
          {title}
        </CardTitle>
        <div className="flex flex-col lg:flex-row gap-2 w-full lg:w-auto">
          {title === "Partidas" && onViewHistory && (
            <Button
              variant="outline"
              size="sm"
              className="w-full lg:w-auto bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
              onClick={onViewHistory}
            >
              <History className="h-4 w-4 group-hover:text-green-400" />
              Histórico
            </Button>
          )}
          {title === "Partidas" && isGroupAdmin && onCreateBooking && (
            <Button
              variant="outline"
              size="sm"
              className="w-full lg:w-auto lg:hidden bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
              onClick={onCreateBooking}
            >
              <CalendarPlus className="h-4 w-4  text-green-400 group-hover:text-green-400" />
              Nova Partida
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => {
              const today = new Date();
              const bookingDate = new Date(booking.start_time);
              const isToday =
                today.getDate() === bookingDate.getDate() &&
                today.getMonth() === bookingDate.getMonth() &&
                today.getFullYear() === bookingDate.getFullYear();

              const invite = myInvites.find(
                (inv) => inv.booking_id === booking._id
              );

              const isListFull = booking.players.length >= booking.max_players;
              const userInList = booking.players.some(p => {
                const playerId = (p as any).user_id || (p as any)._id;
                return playerId === currentUser?._id;
              });

              const isVoteable = voteableBookingIds?.has(booking._id);
              const titleDateTime = `${booking.modality || "Sem esporte"} • ${formatCompactDate(booking.start_time)} • ${formatTime(booking.start_time)}`;

              return (
                <BookingCard
                  key={booking._id}
                  booking={booking}
                  isToday={isToday}
                  invite={invite}
                  isListFull={isListFull}
                  userInList={userInList}
                  isGroupAdmin={isGroupAdmin}
                  variant={isVoteable ? "vote" : undefined}
                  headerTitle={`${formatCompactDate(booking.start_time)} • ${formatTime(booking.start_time)}`}
                  headerSubtitle={(
                    <span className="inline-flex items-center gap-2 text-sm text-zinc-300 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <span className="inline-flex items-center [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-zinc-400 shrink-0">
                          {getSportIcon(booking.modality)}
                        </span>
                        {booking.modality || "Sem esporte"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                        {booking.location?.alt || "Sem quadra"}
                      </span>
                    </span>
                  )}
                  showConfirmedPlayers={Boolean(booking.status_list)}
                  hideInfoTags
                  playersById={playersById}
                  formatDate={formatDate}
                  formatTime={formatTime}
                  onEditBooking={onEditBooking}
                  onCancelBooking={onCancelBooking}
                  handlePresence={handlePresence}
                  onVoteClick={isVoteable ? onOpenVoteSheet : undefined}
                />
              );
            })}
          </div>
        ) : (
          title === "Partidas" ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto mb-4 flex items-center justify-center">
                {isGroupAdmin ? (
                  <CalendarPlus className="h-7 w-7 text-green-400" />
                ) : (
                  <MessageCircle className="h-7 w-7 text-green-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">
                {isGroupAdmin ? "Nenhum racha agendado ainda" : "Ainda não tem racha marcado"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">
                {isGroupAdmin
                  ? "Puxe a fila e crie a primeira partida do grupo para já deixar a agenda rodando."
                  : "Hora de agitar a turma: manda uma mensagem no chat e tenta puxar a próxima resenha da galera."}
              </p>
              <div className="mt-5 flex justify-center">
                {isGroupAdmin && onCreateBooking ? (
                  <Button
                    variant="outline"
                    className="bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
                    onClick={onCreateBooking}
                  >
                    <CalendarPlus className="h-4 w-4 text-green-400 group-hover:text-green-400" />
                    Criar nova partida
                  </Button>
                ) : onOpenChat ? (
                  <Button
                    variant="outline"
                    className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
                    onClick={onOpenChat}
                  >
                    <MessageCircle className="h-4 w-4 group-hover:text-green-400" />
                    Agitar no chat
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-400 text-center py-4">
              Nenhuma partida no histórico.
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
};