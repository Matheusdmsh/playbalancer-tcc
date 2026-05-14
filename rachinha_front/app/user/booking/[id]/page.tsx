"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Star, Users, Calendar, Clock, ArrowLeft, Swords, Crown, UserPlus, Trash2, ChevronLeft, ChevronRight, History, Edit, CalendarCheck2, CalendarClock, CalendarSync, CalendarX2, X, Ghost, LockKeyhole, UnlockKeyhole, Check, Share2, TriangleAlert, SlidersHorizontal, LoaderCircle } from "lucide-react";

// --- Componentes UI ---
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { InvitePlayersSheet } from "@/components/invite-players-sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

// --- Serviços da API e Interfaces ---
import { getBookingsByIds, addPlayerToBooking, removePlayerFromBooking, updatePlayerSkillLevel, organizeTeams, updateBooking, cancelBooking, getOrganizeTeamsHistory, clearOrganizedTeams, OrganizeTeamsResult, voteBookingPlayer, BookingPlayerVote } from "@/services/bookings";
import { getUsersByIds, getCurrentUser, UserSearchResult } from "@/services/users";
import { getGroupById } from "@/services/groups";
import { acceptBookingInvite, declineBookingInvite, getMyBookingInvites } from "@/services/invites";
import { Booking } from "@/interface/booking";
import { User } from "@/interface/users";
import { Group } from "@/services/groups";
import { Invite } from "@/interface/invite";
import { Switch } from "@/components/ui/switch";
import { EditBookingSheet } from "@/components/edit-booking-sheet";
import { CancelBookingDialog } from "@/components/cancel-booking-dialog";
import { getSportIcon } from "@/lib/getSportIcon";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserProfileCard } from "@/components/card/user-profile-card";
import { HorizontalScroll } from "@/components/horizontal-scroll";
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { RatingStars, normalizeSkillRating } from "@/components/ui/rating-stars";
import useEmblaCarousel from "embla-carousel-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { PlayerVoteSheet, VoteCandidate } from "@/components/player-vote-sheet";

// --- Tipos e Funções Utilitárias ---
type PlayerInfo = Pick<User, '_id' | 'name' | 'nickname' | 'username' | 'photo_url' | 'is_placeholder' | 'active_card_template'>;
type TeamsLayout = { teams: string[][]; team_skills_sum: number[]; reserves?: string[]; leftOut?: string[] };
type BookingSlotCardData = {
  id: string;
  name: string;
  username: string;
  photoUrl?: string;
  initials?: string;
  skillLevel: number;
  variant?: User["active_card_template"];
  missingPhotoNode?: React.ReactNode;
  isGuest: boolean;
  isEmpty?: boolean;
};
import { parseUTCDate } from "@/lib/utils";

const normalizeAnyId = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "$oid" in (value as any)) {
    const oid = (value as any).$oid;
    if (typeof oid === "string") return oid;
  }
  return undefined;
};

const getExistingVoteByRater = (player: any, raterId?: string): BookingPlayerVote | undefined => {
  if (!raterId) return undefined;
  const votes = Array.isArray(player?.votes) ? player.votes : [];
  const existing = votes.find((vote: any) => normalizeAnyId(vote?.rater_id) === raterId);
  const rawVote = existing?.vote;
  if (rawVote === -1 || rawVote === 0 || rawVote === 1) return rawVote;
  return undefined;
};

const getPlayerId = (player: any): string | undefined => {
    if (!player) return undefined;
    const id = player.id || player.user_id;
    if (typeof id === 'string') return id;
    if (id && typeof id === 'object' && id.$oid) return id.$oid;
    return undefined;
};

const getGroupRoleLabel = (
  playerId: string,
  groupInfo: Group | null,
  playersInfo: Map<string, PlayerInfo>
) => {
  const isGroupOwner = groupInfo?.owner_id && playerId === groupInfo.owner_id;
  if (isGroupOwner) return "Admin";
  const playerInfo = playersInfo.get(playerId);
  if (playerInfo?.is_placeholder) return "Convidado";
  return "Jogador";
};

const getCardDisplayName = (name?: string, nickname?: string) => {
  const trimmedNickname = nickname?.trim();
  if (trimmedNickname) return trimmedNickname;

  const firstName = name?.trim().split(/\s+/)[0];
  return firstName || "Jogador";
};

const getTeamLevel = (totalSkillRaw: unknown, teamSize: number) => {
  if (!teamSize) return 0;
  return (Number(totalSkillRaw) || 0) / teamSize;
};

const formatTeamLevel = (totalSkillRaw: unknown, teamSize: number) => {
  const roundedLevel = Math.round(getTeamLevel(totalSkillRaw, teamSize) * 2) / 2;
  return roundedLevel.toFixed(1);
};

const CARD_SILHOUETTE_PATH =
  "M107.609 83.1562V1065.41C107.609 1086.74 119.984 1106.15 139.333 1115.14L507.974 1286.42C528.089 1295.77 551.307 1295.77 571.422 1286.42L940.062 1115.14C959.411 1106.15 971.786 1086.74 971.786 1065.41V83.1562C971.786 63.8333 956.125 48.1719 936.802 48.1719H142.594C123.271 48.1719 107.609 63.8333 107.609 83.1562Z";

// ============================================================================
// COMPONENTE PRINCIPAL DA PÁGINA
// ============================================================================
export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [playersInfo, setPlayersInfo] = useState<Map<string, PlayerInfo>>(new Map());
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teams, setTeams] = useState<TeamsLayout | null>(null);
  const [teamsDrawMeta, setTeamsDrawMeta] = useState<{ drawnByName: string; drawnAt: string } | null>(null);
  const [playersPerTeam, setPlayersPerTeam] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [myInvites, setMyInvites] = useState<Invite[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isInvitePlayersOpen, setIsInvitePlayersOpen] = useState(false);
  const [isAdminOptionsOpen, setIsAdminOptionsOpen] = useState(false);
  const [isDrawSelectionOpen, setIsDrawSelectionOpen] = useState(false);
  const [isTeamsResultSheetOpen, setIsTeamsResultSheetOpen] = useState(false);
  const [selectedDrawPlayerIds, setSelectedDrawPlayerIds] = useState<string[]>([]);
  const [isTeamCardPreviewOpen, setIsTeamCardPreviewOpen] = useState(false);
  const [teamPreview, setTeamPreview] = useState<{
    teamLabel: string;
    cards: Array<{
      name: string;
      username: string;
      photoUrl?: string;
      initials?: string;
      skillLevel: number;
      variant?: User["active_card_template"];
      preferSlim?: boolean;
      missingPhotoNode?: React.ReactNode;
    }>;
    currentIndex: number;
  } | null>(null);
  const [isConfirmedListExpanded, setIsConfirmedListExpanded] = useState(true);
  const [isReserveListExpanded, setIsReserveListExpanded] = useState(false);
  const [isMyTeamExpanded, setIsMyTeamExpanded] = useState(true);
  const [isVoteSheetOpen, setIsVoteSheetOpen] = useState(false);
  const [votesByPlayerId, setVotesByPlayerId] = useState<Record<string, BookingPlayerVote>>({});
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [isClearingTeams, setIsClearingTeams] = useState(false);
  const didHandleAutoOpenVoteRef = useRef(false);
  const didSetInitialConfirmedAccordionRef = useRef(false);
  const isMobile = useIsMobile();
  const previewCards = teamPreview?.cards ?? [];
  const shouldDuplicatePreviewLoop = previewCards.length > 1 && previewCards.length < 5;
  const renderedPreviewCards = useMemo(
    () => (shouldDuplicatePreviewLoop ? [...previewCards, ...previewCards, ...previewCards] : previewCards),
    [previewCards, shouldDuplicatePreviewLoop]
  );
  const [teamPreviewEmblaRef, teamPreviewEmblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    dragFree: false,
  });

  useEffect(() => {
    if (!teamPreviewEmblaApi || !teamPreview || !isTeamCardPreviewOpen || previewCards.length === 0) return;
    const targetIndex = shouldDuplicatePreviewLoop
      ? previewCards.length + teamPreview.currentIndex
      : teamPreview.currentIndex;
    teamPreviewEmblaApi.scrollTo(targetIndex, true);
  }, [teamPreviewEmblaApi, isTeamCardPreviewOpen, previewCards.length, shouldDuplicatePreviewLoop, teamPreview?.teamLabel]);

  useEffect(() => {
    if (!teamPreviewEmblaApi || previewCards.length === 0) return;

    const handleSelect = () => {
      setTeamPreview((prev) => {
        if (!prev || prev.cards.length === 0) return prev;
        const selectedIndex = teamPreviewEmblaApi.selectedScrollSnap();
        const normalizedIndex = ((selectedIndex % prev.cards.length) + prev.cards.length) % prev.cards.length;
        return normalizedIndex === prev.currentIndex ? prev : { ...prev, currentIndex: normalizedIndex };
      });
    };

    handleSelect();
    teamPreviewEmblaApi.on("select", handleSelect);

    return () => {
      teamPreviewEmblaApi.off("select", handleSelect);
    };
  }, [teamPreviewEmblaApi, previewCards.length]);

  const handleStatusListChange = async (checked: boolean) => {
      if (!booking) return;
      const previousStatus = booking.status_list;
      setBooking((prev) => prev ? { ...prev, status_list: checked } : prev);
      try {
        await updateBooking(booking._id, { status_list: checked });
        toast({ title: `Lista de presença ${checked ? 'habilitada' : 'desabilitada'}.` });
        refreshPageData();
      } catch (error: any) {
        toast({ title: "Erro", description: "Não foi possível atualizar o status da lista.", variant: "destructive" });
        setBooking((prev) => prev ? { ...prev, status_list: previousStatus } : prev);
      }
    };

  const sanitizeTeamsByCurrentConfirmed = (result: OrganizeTeamsResult, bookingData: Booking): TeamsLayout => {
    const confirmedIds = new Set(
      bookingData.players
        .map((p) => getPlayerId(p))
        .filter((id): id is string => Boolean(id))
    );

    const sanitizedTeams = (result.teams || [])
      .map((team) => team.filter((id) => confirmedIds.has(id)))
      .filter((team) => team.length > 0);

    const playerSkillMap = new Map(
      bookingData.players
        .map((p) => {
          const id = getPlayerId(p);
          return id ? [id, Number(p.skill_level) || 0] as const : null;
        })
        .filter((entry): entry is readonly [string, number] => Boolean(entry))
    );

    const recalculatedSkills = sanitizedTeams.map((team) =>
      team.reduce((sum, playerId) => sum + (playerSkillMap.get(playerId) ?? 0), 0)
    );

    const assignedTeamIds = new Set(sanitizedTeams.flat());
    const sanitizedReserves = (result.reserves || []).filter(
      (id) => confirmedIds.has(id) && !assignedTeamIds.has(id)
    );
    const leftOut = Array.from(confirmedIds).filter(
      (id) => !assignedTeamIds.has(id) && !sanitizedReserves.includes(id)
    );

    return {
      teams: sanitizedTeams,
      team_skills_sum: recalculatedSkills,
      reserves: sanitizedReserves,
      leftOut: [...sanitizedReserves, ...leftOut],
    };
  };

  const loadCurrentOrganizedTeams = (bookingData: Booking) => {
    const currentTeams = bookingData.organized_teams;
    if (!currentTeams) {
      setTeams(null);
      setTeamsDrawMeta(null);
      return;
    }

    const result = currentTeams.result ?? (
      currentTeams.teams
        ? {
            teams: currentTeams.teams,
            team_skills_sum: currentTeams.team_skills_sum ?? [],
            reserves: currentTeams.reserves,
          }
        : null
    );

    if (!result?.teams?.length) {
      setTeams(null);
      setTeamsDrawMeta(null);
      return;
    }

    const sanitized = sanitizeTeamsByCurrentConfirmed(result, bookingData);
    if (!sanitized.teams.length) {
      setTeams(null);
      setTeamsDrawMeta(null);
      return;
    }

    setTeams(sanitized);
    setTeamsDrawMeta(
      currentTeams.drawn_at || currentTeams.drawn_by_name
        ? {
            drawnByName: currentTeams.drawn_by_name || "Usuário",
            drawnAt: currentTeams.drawn_at || new Date().toISOString(),
          }
        : null
    );
  };

  const loadCurrentOrganizedTeamsMetaFromHistory = async (bookingData: Booking) => {
    if (!bookingData.organized_teams) return;
    if (bookingData.organized_teams.drawn_at || bookingData.organized_teams.drawn_by_name) return;

    try {
      const historyResponse = await getOrganizeTeamsHistory(bookingData._id);
      const latestDraw = [...(historyResponse.history || [])].sort(
        (a, b) => new Date(b.drawn_at).getTime() - new Date(a.drawn_at).getTime()
      )[0];

      if (!latestDraw) return;

      setTeamsDrawMeta({
        drawnByName: latestDraw.drawn_by_name || "Usuário",
        drawnAt: latestDraw.drawn_at || new Date().toISOString(),
      });
    } catch (error) {
      console.warn("Falha ao carregar metadados do sorteio:", error);
    }
  };

  const isOwner = useMemo(() => {
      if (!currentUser || !booking) return false;
      const ownerId = getPlayerId(booking.owner_id) || booking.owner_id;
      return ownerId === currentUser._id;
  }, [booking, currentUser]);

  const isGroupAdmin = useMemo(() => {
      if (!currentUser || !groupInfo) return false;
      return (
        groupInfo.owner_id === currentUser._id ||
        Boolean(groupInfo.admins?.includes(currentUser._id))
      );
  }, [groupInfo, currentUser]);

  const fetchData = async (showLoadingSpinner = true) => {
    if (!bookingId) return;
    if (showLoadingSpinner) setLoading(true);

    try {
      const [bookingData, invitesData] = await Promise.all([
        getBookingsByIds([bookingId]).then(data => data[0]),
        getMyBookingInvites()
      ]);
      
      if (!bookingData) throw new Error("Reserva não encontrada.");
      setMyInvites(invitesData);
      
      const allUserIds = new Set<string>();
      const ownerId = getPlayerId(bookingData.owner_id) || bookingData.owner_id;
      if (ownerId) allUserIds.add(ownerId);
      
      bookingData.players.forEach(p => {
          const id = getPlayerId(p);
          if (id) allUserIds.add(id);
      });
      bookingData.reserve_players.forEach(p => {
          const id = getPlayerId(p);
          if (id) allUserIds.add(id);
      });

      let groupData = null;
      if (bookingData.associated_group_id) {
        groupData = await getGroupById(bookingData.associated_group_id);
        groupData.members?.forEach(m => allUserIds.add(m.id));
      }
      
      let usersDataMap = new Map<string, PlayerInfo>();
      if (allUserIds.size > 0) {
        const usersData = await getUsersByIds(Array.from(allUserIds));
        usersDataMap = new Map(usersData.map((u: User) => [u._id, u]));
      }

      setBooking(bookingData);
      setGroupInfo(groupData);
      setPlayersInfo(usersDataMap);
      loadCurrentOrganizedTeams(bookingData);
      await loadCurrentOrganizedTeamsMetaFromHistory(bookingData);

    } catch (err: any) {
      toast({ title: "Erro ao buscar dados", description: err.message, variant: "destructive" });
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  };
  
  useEffect(() => {
    const loadInitialData = async () => {
        try {
            const user = await getCurrentUser();
            setCurrentUser(user);
            await fetchData();
        } catch (error) {
            toast({ title: "Erro de Autenticação", description: "Por favor, faça login para continuar.", variant: "destructive" });
            router.push('/login');
        }
    };
    if (bookingId) {
        loadInitialData();
    }
  }, [bookingId, router, toast]);

  const refreshPageData = () => fetchData(false);

  const confirmedPlayerIds = useMemo(
    () => (booking?.players ?? []).map((p) => getPlayerId(p)).filter((id): id is string => Boolean(id)),
    [booking]
  );

  const voteCandidates = useMemo<VoteCandidate[]>(() => {
    if (!booking || !currentUser?._id) return [];

    return booking.players.reduce<VoteCandidate[]>((acc, player) => {
      const playerId = getPlayerId(player);
      if (!playerId || playerId === currentUser._id) return acc;

      const info = playersInfo.get(playerId);
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
  }, [booking, currentUser, playersInfo]);

  const isCurrentUserConfirmed = useMemo(() => {
    if (!currentUser?._id) return false;
    return confirmedPlayerIds.includes(currentUser._id);
  }, [confirmedPlayerIds, currentUser]);

  const myTeamIndex = useMemo(() => {
    if (!teams || !currentUser?._id) return null;

    const foundIndex = teams.teams.findIndex((team) => team.includes(currentUser._id));
    return foundIndex >= 0 ? foundIndex : null;
  }, [teams, currentUser]);

  const isMyLeftOut = useMemo(() => {
    if (!teams?.leftOut?.length || !currentUser?._id) return false;
    return teams.leftOut.includes(currentUser._id);
  }, [teams, currentUser]);

  const openDrawSelection = () => {
    if (!booking) return;
    setSelectedDrawPlayerIds(confirmedPlayerIds);
    setIsDrawSelectionOpen(true);
  };

  const formatDrawnAt = (drawnAt: string) => {
    const date = parseUTCDate(drawnAt);
    if (!date) return "--";
    const day = date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    const time = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    });
    return `${day} ${time}`;
  };

  const getSharePlayerName = (playerId: string) => {
    const info = playersInfo.get(playerId);
    if (!info) return "Jogador";
    if (info.is_placeholder) return info.name?.trim() || "Convidado";

    const nickname = info.nickname?.trim();
    if (nickname) return nickname;

    const firstName = info.name?.trim().split(/\s+/)[0];
    if (firstName) return firstName;

    return info.username || "Jogador";
  };

  const buildTeamsShareMessage = () => {
    if (!booking || !teams) return "";

    const hasGuestPlayers = teams.teams.some((team) =>
      team.some((playerId) => Boolean(playersInfo.get(playerId)?.is_placeholder))
    );

    const lines: string[] = [
      `🚨 TIMES DEFINIDOS! 🚨`,
      "",
    ];

    teams.teams.forEach((team, index) => {
      lines.push(`Time ${index + 1}:`);
      team.forEach((playerId) => {
        lines.push(`  ✔️ ${getSharePlayerName(playerId)}`);
      });
      lines.push("");
    });

    
    lines.push("");
    lines.push(`Bora pro jogo! ⚽`);
    lines.push("");
    lines.push(`Sorteio feito pelo rachinha.com 🔥`);
    lines.push("Para conhecer, acesse nosso site!");

    return lines.join("\n");
  };

  const handleShareTeamsResult = async () => {
    const text = buildTeamsShareMessage();
    if (!text) {
      toast({ title: "Nada para compartilhar", description: "Sorteie os times antes de compartilhar.", variant: "destructive" });
      return;
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    const popup = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    if (popup) return;

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Resultado copiado", description: "Cole no WhatsApp para compartilhar os times." });
    } catch {
      toast({ title: "Não foi possível compartilhar", description: "Tente novamente em outro navegador.", variant: "destructive" });
    }
  };

  const renderDrawCards = (playerIds: string[], previewLabel: string) => {
    const getInitials = (name?: string) => (name?.match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase();
    const sortedIds = [...playerIds].sort((a, b) => {
      const aPlaceholder = Boolean(playersInfo.get(a)?.is_placeholder);
      const bPlaceholder = Boolean(playersInfo.get(b)?.is_placeholder);
      if (aPlaceholder === bPlaceholder) return 0;
      return aPlaceholder ? 1 : -1;
    });

    const teamCards: NonNullable<typeof teamPreview>["cards"] = sortedIds.map((id) => {
      const info = playersInfo.get(id);
      const player = booking?.players.find((p) => getPlayerId(p) === id);
      const skillLevel = player?.skill_level ?? 0;

      if (!info?.is_placeholder) {
        const displayName = getCardDisplayName(info?.name, info?.nickname);
        return {
          name: displayName.toUpperCase(),
          username: `@${info?.username || "jogador"}`,
          photoUrl: info?.photo_url,
          initials: getInitials(info?.name),
          skillLevel,
          variant: info?.active_card_template,
          missingPhotoNode: undefined as React.ReactNode,
        };
      }

      const firstName = (info?.name || "Jogador").trim().split(/\s+/)[0] || "Jogador";
      return {
        name: firstName.toUpperCase(),
        username: "@convidado",
        photoUrl: undefined,
        initials: undefined,
        skillLevel,
        variant: "v5",
        missingPhotoNode: <Ghost className="h-full w-full" /> as React.ReactNode,
      };
    });

    return (
      <HorizontalScroll fadeColor="#1f1f2200">
        {sortedIds.map((id, cardIndex) => {
          const cardData = teamCards[cardIndex];

          return (
            <button
              key={id}
              type="button"
              className="group relative shrink-0 w-[130px] snap-start cursor-zoom-in"
              onClick={() => {
                setTeamPreview({
                  teamLabel: previewLabel,
                  cards: teamCards,
                  currentIndex: cardIndex,
                });
                setIsTeamCardPreviewOpen(true);
              }}
            >
              <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
                Clique para ampliar
              </span>
              <UserProfileCard
                name={cardData.name}
                username={cardData.username}
                photoUrl={cardData.photoUrl}
                initials={cardData.initials}
                missingPhotoNode={cardData.missingPhotoNode}
                skillLevel={cardData.skillLevel}
                variant={cardData.variant}
                sport={booking?.modality ? { name: booking.modality, icon: getSportIcon(booking.modality) } : undefined}
                overlayPreset="standard"
              />
            </button>
          );
        })}
      </HorizontalScroll>
    );
  };

  const renderPresenceActionButton = (className = "") => {
    if (!booking) return null;

    if (buttonState === "confirm") {
      return (
        <Button
          variant="outline"
          size="sm"
          className={`cursor-pointer bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm ${isPresenceDisabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`.trim()}
          onClick={() => handlePresence(booking._id, "confirm")}
          disabled={isPresenceDisabled}
        >
          <CalendarCheck2 className="h-4 w-4 text-green-400" />
          <span>Confirmar Presença</span>
        </Button>
      );
    }

    if (buttonState === "waiting") {
      return (
        <Button
          variant="outline"
          size="sm"
          className={`cursor-pointer bg-blue-800 border-blue-400 hover:border-blue-400 hover:text-blue-400 hover:bg-blue-700/40 backdrop-blur-sm ${isPresenceDisabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`.trim()}
          onClick={() => handlePresence(booking._id, "confirm")}
          disabled={isPresenceDisabled}
        >
          <CalendarSync className="h-4 w-4 text-blue-400" />
          <span>Entrar na Espera</span>
        </Button>
      );
    }

    if (buttonState === "cancel") {
      return (
        <Button
          variant="outline"
          size="sm"
          className={`cursor-pointer bg-red-800 border-red-400 hover:border-red-400 hover:text-red-400 hover:bg-red-700/40 backdrop-blur-sm ${isPresenceDisabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`.trim()}
          onClick={() => handlePresence(booking._id, "cancel")}
          disabled={isPresenceDisabled}
        >
          <CalendarX2 className="h-4 w-4 text-red-400" />
          <span>Cancelar Presença</span>
        </Button>
      );
    }

    if (buttonState === "disabled") {
      return (
        <Button
          variant="outline"
          size="sm"
          className={`bg-zinc-800 text-zinc-400 border-zinc-800 backdrop-blur-sm ${className}`.trim()}
          disabled
        >
          <CalendarClock className="h-4 w-4 text-zinc-400" />
          <span>Lista não liberada</span>
        </Button>
      );
    }

    return null;
  };

  const renderBookingPlayersList = ({
    players,
    interactive,
    emptyMessage,
  }: {
    players: any[];
    interactive: boolean;
    emptyMessage: string;
  }) => {
    if (!booking) return null;

    if (players.length === 0) {
      return <p className="text-zinc-500 text-sm p-4 text-center">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-3">
        {players.map((playerEntry) => {
          const playerId = getPlayerId(playerEntry);
          if (!playerId) return null;

          return (
            <PlayerCard
              key={playerId}
              player={{ ...playerEntry, user_id: playerId }}
              playerInfo={playersInfo.get(playerId)}
              isOwner={interactive}
              canRemove={interactive && isGroupAdmin && !isMatchLocked}
              canEditSkill={interactive && isGroupAdmin && !isMatchLocked}
              isBookingOwner={playerId === getPlayerId(booking.owner_id)}
              roleLabel={getGroupRoleLabel(playerId, groupInfo, playersInfo)}
              booking={booking}
              onRemove={async () => {
                try {
                  await removePlayerFromBooking(booking._id, playerId);
                  toast({ title: "Jogador removido!" });
                  refreshPageData();
                } catch (error: any) {
                  toast({ title: "Erro", description: error.message, variant: "destructive" });
                }
              }}
              onSkillUpdate={async (newSkill) => {
                try {
                  await updatePlayerSkillLevel(booking._id, playerId, newSkill);
                  toast({ title: "Nível de habilidade atualizado." });
                  refreshPageData();
                } catch (error: any) {
                  toast({ title: "Erro", description: error.message, variant: "destructive" });
                  throw error;
                }
              }}
            />
          );
        })}
      </div>
    );
  };

  const buildBookingSlotCard = (playerEntry: any): BookingSlotCardData | null => {
    const playerId = getPlayerId(playerEntry);
    if (!playerId) return null;

    const info = playersInfo.get(playerId);
    const skillLevel = Number(playerEntry?.skill_level) || 0;

    if (info?.is_placeholder) {
      const firstName = (info.name || "Jogador").trim().split(/\s+/)[0] || "Jogador";
      return {
        id: playerId,
        name: firstName.toUpperCase(),
        username: "@convidado",
        photoUrl: undefined,
        initials: undefined,
        skillLevel,
        variant: "v5",
        missingPhotoNode: <Ghost className="h-full w-full" />,
        isGuest: true,
      };
    }

    return {
      id: playerId,
      name: getCardDisplayName(info?.name, info?.nickname).toUpperCase(),
      username: `@${info?.username || "jogador"}`,
      photoUrl: info?.photo_url,
      initials: (info?.name?.match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase(),
      skillLevel,
      variant: info?.active_card_template,
      missingPhotoNode: undefined,
      isGuest: false,
    };
  };

  const createEmptyBookingSlotCard = (slotIndex: number): BookingSlotCardData => ({
    id: `empty-slot-${slotIndex}`,
    name: "VAGA",
    username: "Disponivel",
    photoUrl: undefined,
    initials: undefined,
    skillLevel: 0,
    variant: "v5",
    missingPhotoNode: <UserPlus className="h-full w-full" />,
    isGuest: false,
    isEmpty: true,
  });

  const confirmedSlotCards = useMemo(() => {
    if (!booking) return [];

    const filledCards = booking.players
      .map((playerEntry) => buildBookingSlotCard(playerEntry))
      .filter((card): card is BookingSlotCardData => Boolean(card));

    const emptyCount = Math.max(booking.max_players - filledCards.length, 0);
    const emptyCards = Array.from({ length: emptyCount }, (_, index) => createEmptyBookingSlotCard(index + 1));

    return [...filledCards, ...emptyCards];
  }, [booking, playersInfo]);

  const reserveSlotCards = useMemo(() => {
    if (!booking) return [];

    return booking.reserve_players
      .map((playerEntry) => buildBookingSlotCard(playerEntry))
      .filter((card): card is BookingSlotCardData => Boolean(card));
  }, [booking, playersInfo]);

  const confirmedCardsLayout = useMemo(() => {
    const slotCount = booking?.max_players ?? 0;
    const columns = Math.min(4, Math.max(2, Math.ceil(slotCount / 3)));

    if (columns === 2) {
      return {
        columns,
        cardClassName: "w-[122px] sm:w-[132px]",
      };
    }

    if (columns === 3) {
      return {
        columns,
        cardClassName: "w-[102px] sm:w-[116px]",
      };
    }

    return {
      columns,
      cardClassName: "w-[88px] sm:w-[106px]",
    };
  }, [booking?.max_players]);

  const confirmedSlotCardRows = useMemo(() => {
    const rows: BookingSlotCardData[][] = [];

    for (let rowIndex = 0; rowIndex < confirmedSlotCards.length; rowIndex += confirmedCardsLayout.columns) {
      rows.push(confirmedSlotCards.slice(rowIndex, rowIndex + confirmedCardsLayout.columns));
    }

    return rows;
  }, [confirmedSlotCards, confirmedCardsLayout.columns]);

  const openRosterPreview = (cards: BookingSlotCardData[], label: string, playerId: string) => {
    const previewCards = cards
      .filter((card) => !card.isEmpty)
      .map((card) => ({
        name: card.name,
        username: card.username,
        photoUrl: card.photoUrl,
        initials: card.initials,
        skillLevel: card.skillLevel,
        variant: card.variant,
        missingPhotoNode: card.missingPhotoNode,
      }));

    const currentIndex = cards.filter((card) => !card.isEmpty).findIndex((card) => card.id === playerId);
    if (currentIndex < 0 || previewCards.length === 0) return;

    setTeamPreview({
      teamLabel: label,
      cards: previewCards,
      currentIndex,
    });
    setIsTeamCardPreviewOpen(true);
  };

  const renderRosterCard = ({
    card,
    cards,
    label,
    className,
  }: {
    card: BookingSlotCardData;
    cards: BookingSlotCardData[];
    label: string;
    className: string;
  }) => {
    const content = (
      <UserProfileCard
        name={card.name}
        username={card.username}
        photoUrl={card.photoUrl}
        initials={card.initials}
        missingPhotoNode={card.missingPhotoNode}
        skillLevel={card.skillLevel}
        variant={card.variant}
        sport={card.isEmpty ? undefined : booking?.modality ? { name: booking.modality, icon: getSportIcon(booking.modality) } : undefined}
        overlayPreset={card.isEmpty ? "empty" : "standard"}
      />
    );

    if (card.isEmpty) {
      return (
        <div key={card.id} className={`relative shrink-0 ${className} opacity-35 grayscale saturate-0 select-none`}>
          {content}
        </div>
      );
    }

    return (
      <button
        key={card.id}
        type="button"
        className={`group relative shrink-0 cursor-zoom-in ${className}`}
        onClick={() => openRosterPreview(cards, label, card.id)}
      >
        <span className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-zinc-200 opacity-0 transition-opacity duration-200 group-hover:opacity-100 whitespace-nowrap">
          Clique para ampliar
        </span>
        {content}
      </button>
    );
  };

  const handleOrganizeTeams = async (selectedIds?: string[]) => {
    if (!booking) return;
    try {
      const allSelected = !selectedIds || selectedIds.length === confirmedPlayerIds.length;
      const result = await organizeTeams(booking._id, playersPerTeam, allSelected ? undefined : selectedIds);

      // Atualiza a UI imediatamente e depois sincroniza com o booking atual do backend.
      const sanitized = sanitizeTeamsByCurrentConfirmed(result, booking);
      setTeams(sanitized.teams.length ? sanitized : null);
      setTeamsDrawMeta({
        drawnByName: currentUser?.name || "Você",
        drawnAt: new Date().toISOString(),
      });

      // Tenta sincronizar com o backend sem bloquear o sucesso do sorteio.
      try {
        await refreshPageData();
      } catch (syncError) {
        console.warn("Sorteio feito, mas falhou sincronização do booking:", syncError);
      }

      toast({ title: "Times organizados com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  const handleClearOrganizedTeams = async () => {
    if (!booking || isClearingTeams) return;

    try {
      setIsClearingTeams(true);
      await clearOrganizedTeams(booking._id);
      setBooking((prev) => prev ? { ...prev, organized_teams: null } : prev);
      setTeams(null);
      setTeamsDrawMeta(null);
      await refreshPageData();
      toast({ title: "Sorteio limpo com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao limpar sorteio",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsClearingTeams(false);
    }
  };

  const toggleSelectedPlayer = (playerId: string, checked: boolean) => {
    setSelectedDrawPlayerIds((prev) => {
      if (checked) {
        return prev.includes(playerId) ? prev : [...prev, playerId];
      }
      return prev.filter((id) => id !== playerId);
    });
  };

  const allPlayersSelected = confirmedPlayerIds.length > 0 && selectedDrawPlayerIds.length === confirmedPlayerIds.length;

  const toggleSelectAllPlayers = () => {
    setSelectedDrawPlayerIds(allPlayersSelected ? [] : confirmedPlayerIds);
  };

  const confirmDrawWithSelection = async () => {
    if (!selectedDrawPlayerIds.length) {
      toast({ title: "Selecione ao menos 1 jogador", variant: "destructive" });
      return;
    }

    if (selectedDrawPlayerIds.length < 4) {
      toast({ title: "Selecione ao menos 4 jogadores", description: "O sorteio precisa de pelo menos dois times.", variant: "destructive" });
      return;
    }

    setIsDrawSelectionOpen(false);
    await handleOrganizeTeams(selectedDrawPlayerIds);
  };

  const selectedPlayersCount = selectedDrawPlayerIds.length;
  const canDrawAtLeastTwoTeams = selectedPlayersCount >= 4;
  const maxPlayersPerTeam = canDrawAtLeastTwoTeams ? Math.floor(selectedPlayersCount / 2) : 2;

  const adjustPlayersPerTeam = (direction: "increment" | "decrement") => {
    setPlayersPerTeam((previous) => {
      const nextValue = direction === "increment" ? previous + 1 : previous - 1;
      return Math.min(maxPlayersPerTeam, Math.max(2, nextValue));
    });
  };

  useEffect(() => {
    setPlayersPerTeam((previous) => Math.min(maxPlayersPerTeam, Math.max(2, previous)));
  }, [maxPlayersPerTeam]);

  const handleEditBooking = (bookingData: Booking) => {
    setBookingToEdit(bookingData);
    setIsEditModalOpen(true);
  };

  const handleCancelBooking = (bookingData: Booking) => {
    setBookingToCancel(bookingData);
    setIsCancelModalOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      await cancelBooking(bookingToCancel._id);
      toast({ title: "Sucesso!", description: "O racha foi cancelado." });
      await fetchData();
      setIsCancelModalOpen(false);
    } catch (error: any) {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePresence = async (bookingId: string, action: "confirm" | "cancel") => {
    const invite = myInvites.find((inv) => inv.booking_id === bookingId);
    if (!invite) {
      toast({ title: "Erro", description: "Convite não encontrado.", variant: "destructive" });
      return;
    }
    try {
      if (action === "confirm") {
        await acceptBookingInvite(bookingId, invite._id);
        toast({ title: "Sucesso", description: "Presença confirmada!" });
      } else {
        await declineBookingInvite(bookingId, invite._id);
        toast({ title: "Sucesso", description: "Presença cancelada." });
      }
      await fetchData();
    } catch (error: any) {
      toast({
        title: `Erro ao ${action === "confirm" ? "confirmar" : "cancelar"} presença`,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const blockedUserIds = useMemo(() => {
    if (!booking) return [];
    const ids = new Set<string>();
    const ownerId = getPlayerId(booking.owner_id) || booking.owner_id;
    if (ownerId) ids.add(ownerId);
    booking.players.forEach(p => {
      const id = getPlayerId(p);
      if (id) ids.add(id);
    });
    booking.reserve_players.forEach(p => {
      const id = getPlayerId(p);
      if (id) ids.add(id);
    });
    return Array.from(ids);
  }, [booking]);

  const defaultInviteUsers = useMemo<UserSearchResult[]>(() => {
    if (!groupInfo?.members?.length) return [];

    const users: UserSearchResult[] = [];
    groupInfo.members.forEach((member) => {
      const user = playersInfo.get(member.id);
      if (user?._id) {
        users.push({ ...user, id: user._id } as UserSearchResult);
      }
    });

    return users;
  }, [groupInfo, playersInfo]);

  const startTime = booking ? parseUTCDate(booking.start_time) : null;
  const endTime = booking ? parseUTCDate(booking.end_time) : null;
  const now = new Date();
  const isPast = startTime ? startTime < now : false;
  const hasEnded = endTime ? endTime < now : false;
  const isMatchLocked = hasEnded;
  const hoursAfterEnd = endTime ? (now.getTime() - endTime.getTime()) / (1000 * 60 * 60) : null;
  const isWithinVoteWindow = Boolean(hasEnded && hoursAfterEnd !== null && hoursAfterEnd <= 48);
  const canOpenVoteFlow = Boolean(booking && isWithinVoteWindow && isCurrentUserConfirmed && voteCandidates.length > 0);

  const voteStatusMessage = !booking
    ? null
    : !hasEnded
      ? "A avaliação abre depois que a partida termina."
      : !isWithinVoteWindow
        ? "A janela de avaliação (48h) já encerrou para esta partida."
        : !isCurrentUserConfirmed
          ? "Somente jogadores confirmados podem avaliar."
          : voteCandidates.length === 0
            ? "Nenhum jogador elegível para avaliação nesta partida."
            : null;

  const votedCount = voteCandidates.filter((candidate) => typeof votesByPlayerId[candidate.id] !== "undefined").length;

  const openVoteSheet = () => {
    if (!booking) return;

    const initialVotes = voteCandidates.reduce<Record<string, BookingPlayerVote>>((acc, candidate) => {
      if (typeof candidate.existingVote !== "undefined") {
        acc[candidate.id] = candidate.existingVote;
      }
      return acc;
    }, {});

    setVotesByPlayerId(initialVotes);
    setIsVoteSheetOpen(true);
  };

  const renderTeamsResultsContent = ({
    mode = "full",
    spacingClassName = "mt-4",
  }: {
    mode?: "full" | "summary";
    spacingClassName?: string;
  } = {}) => {
    if (!teams) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-400">
          <Swords className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Aguardando sorteio de times</p>
        </div>
      );
    }

    const fullResultButton = (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="shrink-0 bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 cursor-pointer"
        onClick={() => setIsTeamsResultSheetOpen(true)}
      >
        <Swords className="h-4 w-4" />
        Ver sorteio completo
      </Button>
    );

    if (mode === "summary") {
      return (
        <div className={`space-y-3 ${spacingClassName}`.trim()}>
          {myTeamIndex === null && isMyLeftOut && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
              <TriangleAlert className="h-4 w-4 text-amber-400" />
              <span>
                Você ficou de <span className="font-semibold text-amber-300">reserva</span> neste sorteio.
              </span>
            </div>
          )}

          {myTeamIndex !== null && (
            <div className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-green-500/35 bg-[linear-gradient(180deg,rgba(34,197,94,0.18),rgba(34,197,94,0.08))] pt-1 transition-colors hover:border-green-400/50">
                <button
                  type="button"
                  className="flex min-h-[42px] w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-green-500/5"
                  onClick={() => setIsMyTeamExpanded((prev) => !prev)}
                  aria-expanded={isMyTeamExpanded}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`h-4 w-4 text-green-300 transition-transform duration-300 ${isMyTeamExpanded ? "rotate-90" : "rotate-0"}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-green-100">
                      Você está no Time {myTeamIndex + 1}
                    </span>
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${isMyTeamExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <div className={`px-3 pb-3 pt-1 transition-all duration-300 ease-out ${isMyTeamExpanded ? "translate-y-0" : "-translate-y-2"}`}>
                      {renderDrawCards(teams.teams[myTeamIndex], `Time ${myTeamIndex + 1}`)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-stretch">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 cursor-pointer"
                  onClick={() => setIsTeamsResultSheetOpen(true)}
                >
                  <Swords className="h-4 w-4" />
                  Ver sorteio completo
                </Button>
              </div>
            </div>
          )}

          {myTeamIndex === null && isMyLeftOut && Boolean(teams.leftOut?.length) && (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardHeader className="space-y-0">
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="truncate">Reservas</span>
                  <Badge className="border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/15">
                    <TriangleAlert className="h-4 w-4 pr-1 text-amber-400" />
                    Ficou de fora
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {renderDrawCards(teams.leftOut || [], "Ficaram de fora")}
                <div className="flex justify-stretch">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 cursor-pointer"
                    onClick={() => setIsTeamsResultSheetOpen(true)}
                  >
                    <Swords className="h-4 w-4" />
                    Ver sorteio completo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {myTeamIndex === null && !isMyLeftOut && (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-300">O sorteio foi concluído. Abra o resultado completo para ver todos os times.</p>
                {fullResultButton}
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${spacingClassName}`.trim()}>
        {teamsDrawMeta && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <History className="h-3.5 w-3.5" />
            <span>
              Sorteado por <span className="text-zinc-200">{teamsDrawMeta.drawnByName || "Usuário"}</span> em {formatDrawnAt(teamsDrawMeta.drawnAt)}
            </span>
          </div>
        )}
        {myTeamIndex !== null && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-100">
            <Swords className="h-4 w-4 text-green-400" />
            <span>
              Você está no <span className="font-semibold text-green-300">Time {myTeamIndex + 1}</span>
            </span>
          </div>
        )}
        {myTeamIndex === null && isMyLeftOut && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            <TriangleAlert className="h-4 w-4 text-amber-400" />
            <span>
              Você ficou de <span className="font-semibold text-amber-300">reserva</span> neste sorteio.
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          {teams.teams.map((team, index) => (
            <Card key={index} className="bg-zinc-800/80 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-6 pt-6 pb-0">
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="truncate">Time {index + 1}</span>
                  {myTeamIndex === index && (
                    <Badge className="border-green-400/40 bg-green-500/15 text-green-200 hover:bg-green-500/15">
                      <Swords className="h-4 w-4 pr-1 text-green-400" />
                      Seu time
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="shrink-0 text-right text-zinc-300">
                  Nível do Time: <span className="font-bold">{formatTeamLevel(teams.team_skills_sum[index], team.length)} </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 py-0">
                {renderDrawCards(team, `Time ${index + 1}`)}
              </CardContent>
            </Card>
          ))}
          {Boolean(teams.leftOut?.length) && (
            <Card className="bg-zinc-800/80 border-zinc-700">
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 px-6 pt-6 pb-0">
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="truncate">Reservas</span>
                  {isMyLeftOut && (
                    <Badge className="border-amber-400/40 bg-amber-500/15 text-amber-200 hover:bg-amber-500/15">
                      <TriangleAlert className="h-4 w-4 pr-1 text-amber-400" />
                      Ficou de fora
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="shrink-0 text-right text-zinc-300">
                  {teams.leftOut?.length} jogador{teams.leftOut?.length === 1 ? "" : "es"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pt-0">
                {renderDrawCards(teams.leftOut || [], "Ficaram de fora")}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (didHandleAutoOpenVoteRef.current) return;

    const shouldOpenVote = searchParams.get("openVote") === "1";
    if (!shouldOpenVote) {
      didHandleAutoOpenVoteRef.current = true;
      return;
    }

    if (!booking) return;

    if (!canOpenVoteFlow) {
      didHandleAutoOpenVoteRef.current = true;
      return;
    }

    openVoteSheet();
    didHandleAutoOpenVoteRef.current = true;
  }, [searchParams, booking, canOpenVoteFlow]);

  useEffect(() => {
    if (loading || didSetInitialConfirmedAccordionRef.current) return;

    setIsConfirmedListExpanded(!teams);
    didSetInitialConfirmedAccordionRef.current = true;
  }, [loading, teams]);



  if (loading) return (
    <div className="flex flex-col h-screen bg-black">
      {/* Skeleton da foto de fundo */}
      <div className="w-full h-[216px] bg-zinc-800/70 animate-pulse" />

      {/* Skeleton da barra sticky */}
      <div className="sticky top-0 z-50 shadow-lg shadow-black/50 backdrop-blur-lg lg:h-[80px] bg-black/40">
        {/* Desktop */}
        <div className="hidden lg:flex h-full justify-between items-center px-4 sm:px-6 lg:px-8 animate-pulse">
          {/* Esquerda */}
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-zinc-800/60 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-32 bg-zinc-800/60 rounded" />
              <div className="flex gap-3">
                <div className="h-6 w-24 bg-zinc-800/60 rounded" />
                <div className="h-6 w-24 bg-zinc-800/60 rounded" />
                <div className="h-6 w-20 bg-zinc-800/60 rounded" />
              </div>
            </div>
          </div>
          {/* Direita */}
          <div className="flex gap-2">
            <div className="h-10 w-40 bg-zinc-800/60 rounded" />
            <div className="h-10 w-48 bg-zinc-800/60 rounded" />
          </div>
        </div>

        {/* Mobile */}
        <div className="lg:hidden animate-pulse">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-zinc-800/60 rounded" />
              <div className="space-y-2">
                <div className="h-3 w-24 bg-zinc-800/60 rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-20 bg-zinc-800/60 rounded" />
                  <div className="h-5 w-16 bg-zinc-800/60 rounded" />
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <div className="h-8 w-8 bg-zinc-800/60 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton do conteúdo */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto animate-pulse ">
          {/* Desktop: 2 blocos lado a lado */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-6">
            {/* Bloco Esquerdo */}
            <div className="w-full h-[600px] bg-zinc-900/60 rounded-lg" />
            
            {/* Bloco Direito */}
            <div className="w-full h-[600px] bg-zinc-900/60 rounded-lg" />
          </div>

          {/* Mobile: 1 bloco */}
          <div className="lg:hidden">
            <div className="w-full h-[500px] bg-zinc-900/60 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
  if (!booking) return <div className="text-center text-zinc-500 mt-10">Reserva não encontrada.</div>;

  const handleVoteSubmit = async (playerId: string, vote: BookingPlayerVote) => {
    if (!booking || isSubmittingVote) return false;

    try {
      setIsSubmittingVote(true);
      await voteBookingPlayer(booking._id, playerId, vote);
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
      refreshPageData();
    }
  };


  // Calcular button state para confirmar presença
  const invite = myInvites.find((inv) => inv.booking_id === booking._id);
  const isListFull = booking.players.length >= booking.max_players;
  const userInList = booking.players.some(p => getPlayerId(p) === currentUser?._id);
  const isPresenceDisabled = isPast;
  
  let buttonState: "confirm" | "cancel" | "disabled" | "not_invited" | "waiting" = "not_invited";
  if (!booking.status_list) {
    buttonState = "disabled";
  } else if (userInList) {
    buttonState = "cancel";
  } else if (invite) {
    if (invite.status === "accepted") {
      buttonState = "cancel";
    } else if (isListFull) {
      buttonState = "waiting";
    } else {
      buttonState = "confirm";
    }
  }

  return (
    <>
      {/* HEADER COMPLETO COM BACKGROUND UNIFICADO */}
      {/* Só mostra o espaçador de foto se houver groupInfo?.photo_url */}
      {groupInfo?.photo_url ? (
        <div
          className="w-full"
          style={{
            height: "216px",
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0, 0.4), rgba(0,0,0,0.2), transparent),
              linear-gradient(to top, rgb(0, 0, 0), rgba(0,0,0,0.4), transparent),
              url(${groupInfo.photo_url})
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
              <button
                onClick={() => groupInfo?._id && router.push(`/user/group/${groupInfo._id}`)}
                className="text-xs text-zinc-400 hover:text-green-400 transition-colors cursor-pointer flex items-center gap-2 mb-1"
              >
                {groupInfo?.name}
              </button>
              <h1 className="font-bold text-lg md:text-lg flex items-center gap-3 flex-wrap">
                {booking.modality && <span className="flex items-center gap-1.5 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-green-400">{getSportIcon(booking.modality)} {booking.modality}</span>}
                {startTime && <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-green-400" /> {format(startTime, 'dd/MMM', { locale: ptBR })}</span>}
                {startTime && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-green-400" /> {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</span>}
               
              </h1>
            </div>
          </div>

          {/* DIREITA */}
          <div className="flex gap-2">
            {isGroupAdmin && (
              <Button
                variant="outline"
                size="sm"
                className="bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm cursor-pointer"
                onClick={() => handleEditBooking(booking)}
              >
                <Edit className="h-4 w-4" />
                <span className="hidden md:inline">Editar Racha</span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden">
          {/* Linha superior - Info do racha resumida */}
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <button
                  onClick={() => groupInfo?._id && router.push(`/user/group/${groupInfo._id}`)}
                  className="text-xs text-zinc-400 hover:text-green-400 transition-colors cursor-pointer font-normal block"
                >
                  {groupInfo?.name}
                </button>
                <div className="flex items-center gap-2 flex-wrap text-base font-bold text-white">
                  {booking.modality && <span className="flex items-center gap-1 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-green-400">{getSportIcon(booking.modality)} {booking.modality}</span>}
                  {startTime && <span className="flex items-center gap-1"><Calendar className="h-4 w-4 text-green-400" /> {format(startTime, 'dd/MMM', { locale: ptBR })}</span>}
                  {startTime && <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-green-400" /> {startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              {isGroupAdmin && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => handleEditBooking(booking)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Container */}
      <div className="md:max-w-7xl mx-auto space-y-6 lg:px-8 py-6 pt-1 lg:pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6" style={{ minHeight: 'calc(100vh - 216px)' }}>
      
        <div className="flex flex-col items-stretch gap-0 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-6">
          {/* BLOCO LISTA */}
          <Card className="border-0 bg-transparent shadow-none lg:bg-zinc-900 lg:border-zinc-800 lg:shadow-sm">
            <CardContent className="space-y-4 lg:space-y-5 lg:pt-7">
              <div className="hidden lg:flex lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-green-400" />
                  <h2 className="text-[1.45rem] font-semibold tracking-[-0.025em] text-white">
                    Lista ({booking.players.length}/{booking.max_players})
                  </h2>
                </div>
              </div>

              <div className="space-y-3">
                {!hasEnded && isGroupAdmin && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="cursor-pointer h-10 w-full bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm"
                      onClick={() => setIsAdminOptionsOpen(true)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      <span>Opções</span>
                    </Button>

                    <Button
                      variant="outline"
                      className={`cursor-pointer h-10 w-full justify-center bg-black border-[#27272a] backdrop-blur-sm ${booking.status_list ? "hover:border-red-400 hover:text-red-400 hover:bg-red-700/40" : "hover:border-green-400 hover:text-green-400 hover:bg-green-700/40"} ${isMatchLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                      onClick={() => handleStatusListChange(!booking.status_list)}
                      disabled={isMatchLocked}
                    >
                      {booking.status_list ? (
                        <LockKeyhole className="h-4 w-4 text-red-400" />
                      ) : (
                        <UnlockKeyhole className="h-4 w-4 text-green-400" />
                      )}
                      <span>{booking.status_list ? "Fechar lista" : "Liberar lista"}</span>
                    </Button>
                  </div>
                )}

                {!hasEnded && !isMobile && (
                  <div className="grid grid-cols-1 gap-2">
                    {renderPresenceActionButton("w-full")}
                  </div>
                )}
              </div>

              {hasEnded && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 text-yellow-300 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">Avaliação pós-jogo</p>
                      <p className="text-xs text-zinc-400">Vote nos confirmados em até 48h após o fim da partida.</p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full cursor-pointer bg-yellow-800 border-yellow-400 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-700/40 backdrop-blur-sm"
                    onClick={openVoteSheet}
                    disabled={!canOpenVoteFlow}
                  >
                    <Star className="h-4 w-4 text-yellow-400" />
                    Avaliar jogadores
                  </Button>
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 pt-1 transition-colors hover:border-zinc-700">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-zinc-900/50"
                  onClick={() => setIsConfirmedListExpanded((prev) => !prev)}
                  aria-expanded={isConfirmedListExpanded}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isConfirmedListExpanded ? "rotate-90" : "rotate-0"}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Confirmados</span>
                    <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-200">
                      {booking.players.length}/{booking.max_players}
                    </span>
                  </div>
                </button>

                <div
                  className={`grid transition-all duration-300 ease-out ${isConfirmedListExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <div className={`px-3 pb-3 pt-1 transition-all duration-300 ease-out ${isConfirmedListExpanded ? "translate-y-0" : "-translate-y-2"}`}>
                      <div className="flex flex-col gap-2 sm:gap-3">
                        {confirmedSlotCardRows.map((row, rowIndex) => (
                          <div key={`confirmed-row-${rowIndex}`} className="flex justify-center  sm:gap-2">
                            {row.map((card) =>
                              renderRosterCard({
                                card,
                                cards: confirmedSlotCards,
                                label: "Confirmados",
                                className: confirmedCardsLayout.cardClassName,
                              })
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {booking.reserve_players.length > 0 && (
                <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 pt-1 transition-colors hover:border-zinc-700">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors hover:bg-zinc-900/50"
                    onClick={() => setIsReserveListExpanded((prev) => !prev)}
                    aria-expanded={isReserveListExpanded}
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className={`h-4 w-4 text-zinc-400 transition-transform duration-300 ${isReserveListExpanded ? "rotate-90" : "rotate-0"}`} />
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Lista de Espera</span>
                      <span className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-200">
                        {booking.reserve_players.length}
                      </span>
                    </div>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ease-out ${isReserveListExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                  >
                    <div className="overflow-hidden">
                      <div className={`px-3 pb-3 pt-1 transition-all duration-300 ease-out ${isReserveListExpanded ? "translate-y-0" : "-translate-y-2"}`}>
                        <HorizontalScroll fadeColor="#1f1f2200">
                          {reserveSlotCards.map((card) =>
                            renderRosterCard({
                              card,
                              cards: reserveSlotCards,
                              label: "Lista de espera",
                              className: "w-[92px] sm:w-[104px] shrink-0 snap-start",
                            })
                          )}
                        </HorizontalScroll>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* BLOCO TIMES */}
          <div className="lg:min-w-0">
            <Card className="border-0 bg-transparent shadow-none lg:bg-zinc-900 lg:border-zinc-800 lg:shadow-sm">
              <CardContent className="space-y-2 lg:space-y-5 lg:pt-7">
                <div className="hidden lg:flex lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <Swords className="h-5 w-5 text-green-400" />
                    <h2 className="text-[1.45rem] font-semibold tracking-[-0.025em] text-white">
                      Times
                    </h2>
                  </div>
                </div>

                {isGroupAdmin && !isMobile && (
                  <div className="flex items-center gap-2">
                    <Button onClick={openDrawSelection} variant="outline" className="w-full cursor-pointer bg-yellow-800 border-yellow-400 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-700/40 backdrop-blur-sm" size="sm">
                      <Swords className="h-4 w-4 text-yellow-400" />Sortear Times
                    </Button>
                  </div>
                )}

                {renderTeamsResultsContent({ mode: "summary", spacingClassName: "mt-0" })}
                </CardContent>
              </Card>
            </div>
        </div>
      </div>

      {!hasEnded && isMobile && (isGroupAdmin || renderPresenceActionButton()) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-800 bg-zinc-950/95 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm lg:hidden">
          <div className={`mx-auto grid max-w-7xl gap-2 ${isGroupAdmin ? "grid-cols-2" : "grid-cols-1"}`}>
            {isGroupAdmin && (
              <Button
                onClick={openDrawSelection}
                variant="outline"
                size="sm"
                className="h-10 w-full cursor-pointer bg-yellow-800 border-yellow-400 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-700/40 backdrop-blur-sm"
              >
                <Swords className="h-4 w-4 text-yellow-400" />
                Sortear Times
              </Button>
            )}

            {renderPresenceActionButton("h-10 w-full")}
          </div>
        </div>
      )}
      
      {/* Modais */}
      <PlayerVoteSheet
        open={isVoteSheetOpen}
        onOpenChange={handleVoteSheetOpenChange}
        side={isMobile ? "bottom" : "right"}
        bookingModality={booking?.modality}
        candidates={voteCandidates}
        votesByPlayerId={votesByPlayerId}
        isSubmitting={isSubmittingVote}
        onVote={handleVoteSubmit}
        onUndoVote={handleUndoVote}
        onResetVotes={() => setVotesByPlayerId({})}
      />
      <EditBookingSheet isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} booking={bookingToEdit} onBookingUpdated={() => { fetchData(); setIsEditModalOpen(false); }} />
      <CancelBookingDialog isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={confirmCancelBooking} booking={bookingToCancel} isCancelling={isCancelling} />
      <Sheet open={isAdminOptionsOpen} onOpenChange={setIsAdminOptionsOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`flex flex-col gap-4 overflow-hidden border-zinc-800 bg-zinc-900 p-0 ${isMobile ? "h-[85vh] max-h-[85vh]" : "h-[100dvh] w-[360px] sm:max-w-md"}`}
        >
          <SheetHeader className="border-b border-zinc-800 px-6 py-4 text-left">
            <div className="flex items-center gap-3">
              <SlidersHorizontal className="h-5 w-5 text-green-400 flex-shrink-0" />
              <SheetTitle className="text-xl">Opções da lista</SheetTitle>
            </div>
            <SheetDescription className="text-left text-xs text-zinc-400">
              Gerencie confirmados e lista de espera, edite habilidades e adicione jogadores do grupo.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-2 pb-2">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-zinc-100">{booking.players.length}/{booking.max_players} Confirmados</p>
                {renderBookingPlayersList({
                  players: booking.players,
                  interactive: true,
                  emptyMessage: "Nenhum jogador confirmado.",
                })}
              </div>

              {booking.reserve_players.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-zinc-700" />
                  <p className="text-xs text-zinc-400 uppercase font-semibold tracking-wider whitespace-nowrap">Lista de Espera</p>
                  <div className="flex-1 border-t border-zinc-700" />
                </div>
                {renderBookingPlayersList({
                  players: booking.reserve_players,
                  interactive: true,
                  emptyMessage: "Nenhum jogador na lista de espera.",
                })}
              </div>
              )}
            </div>
          </div>

          <div className="shrink-0 bg-zinc-900/95 px-6 pt-0 pb-4 backdrop-blur-sm">
            {groupInfo && isGroupAdmin && (
              <Button
                variant="outline"
                className="cursor-pointer w-full bg-black border-[#27272a] hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
                disabled={isMatchLocked}
                onClick={() => {
                  setIsAdminOptionsOpen(false);
                  setIsInvitePlayersOpen(true);
                }}
              >
                <UserPlus className="h-4 w-4" />Adicionar do Grupo
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isDrawSelectionOpen} onOpenChange={setIsDrawSelectionOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`flex flex-col gap-4 overflow-hidden border-zinc-800 bg-zinc-900 p-0 ${isMobile ? "h-[85vh] max-h-[85vh]" : "h-[100dvh] w-[360px] sm:max-w-md"}`}
        >
          <SheetHeader className="px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <Swords className="h-5 w-5 text-green-400 flex-shrink-0" />
              <SheetTitle className="text-xl">Selecionar jogadores</SheetTitle>
            </div>
            <SheetDescription className="text-left text-xs text-zinc-400">
              Escolha quais confirmados entram no sorteio. Se todos ficarem marcados, enviaremos sem seleção para o backend.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 pb-6">
            <div className="space-y-4">
            <div className="flex justify-end">
              <button
                type="button"
                className="text-xs font-medium text-green-400 transition-colors hover:text-green-300"
                onClick={toggleSelectAllPlayers}
              >
                {allPlayersSelected ? "Limpar todos" : "Selecionar todos"}
              </button>
            </div>
            {confirmedPlayerIds.map((playerId) => {
              const info = playersInfo.get(playerId);
              const player = booking.players.find((p) => getPlayerId(p) === playerId);
              const skillLevel = player?.skill_level ?? 0;
              const isPlaceholder = Boolean(info?.is_placeholder);
              const displayName = isPlaceholder
                ? (info?.name || "Jogador")
                : (info?.nickname || info?.name || "Jogador");
              const isChecked = selectedDrawPlayerIds.includes(playerId);
              const initials = ((info?.name || "").match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase();
              return (
                <label
                  key={playerId}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all ${
                    isChecked
                      ? "border-green-500/50 bg-green-900/20"
                      : "border-zinc-800 hover:bg-zinc-800/60"
                  }`}
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => toggleSelectedPlayer(playerId, Boolean(checked))}
                  />
                  <Avatar className="h-9 w-9 border border-zinc-700">
                    <AvatarImage src={info?.photo_url} alt={displayName} className="object-cover object-center" />
                    <AvatarFallback className="text-xs flex items-center justify-center">
                      {isPlaceholder ? (
                        <Ghost className="h-4 w-4 text-zinc-400" />
                      ) : (
                        initials || "JG"
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-zinc-100 truncate">{displayName}</p>
                    <p className="text-xs text-zinc-400 truncate">{isPlaceholder ? "Convidado" : `@${info?.username || "usuario"}`}</p>
                  </div>
                  <div className="flex shrink-0 items-center self-center gap-0.5 ml-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < skillLevel ? "text-yellow-400 fill-yellow-400" : "text-zinc-600"}`}
                      />
                    ))}
                  </div>
                </label>
              );
            })}
            </div>
          </div>

          <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/95 px-6 pt-3 pb-4 backdrop-blur-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${canDrawAtLeastTwoTeams ? "border-zinc-700 bg-zinc-800 text-zinc-200" : "border-red-500/40 bg-red-500/15 text-red-200"}`}
              >
                {canDrawAtLeastTwoTeams ? (
                  <Check className="h-3.5 w-3.5 text-zinc-300" />
                ) : (
                  <X className="h-3.5 w-3.5 text-red-400" />
                )}
                Min 4 jogadores
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-200">
                <Users className="h-3.5 w-3.5 text-zinc-300" />
                Selecionados {selectedDrawPlayerIds.length}/{confirmedPlayerIds.length}
              </div>
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="players-per-team" className="block text-sm font-medium text-zinc-200">
                  Jogadores por time
                </label>
                <div className="inline-flex items-center rounded-lg">
                  <button
                    id="players-per-team"
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-l-lg text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent enabled:text-red-400 enabled:hover:bg-red-500/10 enabled:hover:text-red-300"
                    onClick={() => adjustPlayersPerTeam("decrement")}
                    disabled={!canDrawAtLeastTwoTeams || playersPerTeam <= 2}
                    aria-label="Diminuir jogadores por time"
                  >
                    -
                  </button>
                  <div className="flex h-9 min-w-10 items-center justify-center px-3 text-sm font-medium text-zinc-100">
                    {playersPerTeam}
                  </div>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-r-lg text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:text-zinc-600 disabled:hover:bg-transparent enabled:text-green-400 enabled:hover:bg-green-500/10 enabled:hover:text-green-300"
                    onClick={() => adjustPlayersPerTeam("increment")}
                    disabled={!canDrawAtLeastTwoTeams || playersPerTeam >= maxPlayersPerTeam}
                    aria-label="Aumentar jogadores por time"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            <Button
              onClick={confirmDrawWithSelection}
              variant="outline"
              className="cursor-pointer w-full bg-yellow-800 border-yellow-400 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-700/40 backdrop-blur-sm"
              disabled={!canDrawAtLeastTwoTeams}
            >
              <Swords className="h-4 w-4 text-yellow-400" />
              Sortear Times
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={isTeamsResultSheetOpen} onOpenChange={setIsTeamsResultSheetOpen}>
        <SheetContent
          side={isMobile ? "bottom" : "right"}
          className={`flex flex-col gap-4 overflow-hidden border-zinc-800 bg-zinc-900 p-0 ${isMobile ? "h-[88vh] max-h-[88vh]" : "h-[100dvh] w-[360px] sm:max-w-md"}`}
        >
          <SheetHeader className="border-b border-zinc-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <Swords className="h-5 w-5 flex-shrink-0 text-green-400" />
              <SheetTitle className="text-xl">Times sorteados</SheetTitle>
            </div>
            <SheetDescription className="text-xs text-zinc-400">
              Visualização completa dos times gerados para este racha.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 pb-6">
            {renderTeamsResultsContent({ spacingClassName: "" })}
          </div>

          {isGroupAdmin && teams && (
            <div className="shrink-0 px-6 pt-0 pb-4">
              <div className="grid w-full grid-cols-2 gap-2">
                <Button
                  onClick={handleClearOrganizedTeams}
                  variant="outline"
                  size="sm"
                  className="w-full bg-red-800 border-red-400 hover:bg-red-700/40 hover:border-red-400 hover:text-red-400 cursor-pointer"
                  disabled={isClearingTeams}
                >
                  {isClearingTeams ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Limpar
                </Button>
                <Button
                  onClick={handleShareTeamsResult}
                  variant="outline"
                  size="sm"
                  className="w-full bg-green-800 border-green-400 hover:bg-green-700/40 hover:border-green-400 hover:text-green-400 cursor-pointer"
                >
                  <Share2 className="h-4 w-4" /> Compartilhar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {groupInfo && (
        <InvitePlayersSheet
          open={isInvitePlayersOpen}
          onOpenChange={setIsInvitePlayersOpen}
          group={groupInfo}
          currentUser={currentUser}
          onMemberAdded={refreshPageData}
          searchParams={{ group_id: groupInfo._id, include_ghosts: true }}
          title="Adicionar do Grupo"
          subtitle="Busque membros do grupo para adicionar ao racha."
          onUserAction={(user) => addPlayerToBooking(booking._id, user._id)}
          onGhostCreated={async (user) => {
            await addPlayerToBooking(booking._id, user._id);
          }}
          actionSuccessMessage="Jogador adicionado ao racha."
          actionErrorMessage="Erro ao adicionar jogador"
          disabledUserIds={blockedUserIds}
          defaultUsers={defaultInviteUsers}
        />
      )}
      <Dialog open={isTeamCardPreviewOpen} onOpenChange={setIsTeamCardPreviewOpen}>
        <DialogPortal>
          <DialogOverlay className="z-[1200] bg-black/40 backdrop-blur-sm" />
          <DialogContent className="z-[1201] w-auto max-w-none border-0 bg-transparent p-0 shadow-none [&>button]:hidden data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0">
            <div className="animate-in fade-in zoom-in-50 duration-200 flex flex-col items-center ">
              <DialogTitle className="sr-only  ">Card ampliado</DialogTitle>
              {teamPreview && (() => {
                const canNav = previewCards.length > 1;
                return (
                  <>
                    {/* Identificação do time */}
                    <div className="flex items-center gap-2 text-lg font-semibold text-white/90">
                      <Swords className="h-6 w-6 text-green-400" />
                      <span>{teamPreview.teamLabel}</span>
                      
                    </div>
                    {/* Card + setas */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => teamPreviewEmblaApi?.scrollPrev()}
                        disabled={!canNav}
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <div className="w-[min(92vw,520px)] overflow-hidden" ref={teamPreviewEmblaRef}>
                        <div className="flex touch-pan-y items-center">
                          {renderedPreviewCards.map((previewCard, previewIndex) => {
                            const normalizedIndex = previewCards.length > 0 ? previewIndex % previewCards.length : previewIndex;
                            const isActive = normalizedIndex === teamPreview.currentIndex;
                            return (
                              <div key={`team-preview-${previewIndex}`} className="flex-[0_0_66%] px-1">
                                <div className={`transition-all duration-300 ease-out ${isActive ? "opacity-100 scale-100" : "opacity-45 scale-95"}`}>
                                  <UserProfileCard
                                    name={previewCard.name}
                                    username={previewCard.username}
                                    photoUrl={previewCard.photoUrl}
                                    initials={previewCard.initials}
                                    missingPhotoNode={previewCard.missingPhotoNode}
                                    skillLevel={previewCard.skillLevel}
                                    variant={previewCard.variant}
                                    sport={booking.modality ? { name: booking.modality, icon: getSportIcon(booking.modality) } : undefined}
                                      overlayPreset="standard"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => teamPreviewEmblaApi?.scrollNext()}
                        disabled={!canNav}
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                    {/* Dots de navegação */}
                    {canNav && (
                      <div className="flex gap-2">
                        {previewCards.map((_, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              teamPreviewEmblaApi?.scrollTo(
                                shouldDuplicatePreviewLoop ? previewCards.length + i : i
                              )
                            }
                            style={{
                              width: i === teamPreview.currentIndex ? "24px" : "8px",
                              height: "8px",
                              borderRadius: "4px",
                              backgroundColor: i === teamPreview.currentIndex ? "#f7e7a9" : "rgba(255,255,255,0.3)",
                              transition: "all 0.2s",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}

// ============================================================================
// SUB-COMPONENTES
// ============================================================================

interface PlayerListProps {
  title: string;
  players: any[];
  booking: Booking;
  groupInfo: Group | null;
  playersInfo: Map<string, PlayerInfo>;
  isOwner: boolean;
  onActionComplete: () => void;
}

function PlayerList({ title, players, booking, groupInfo, playersInfo, isOwner, onActionComplete }: PlayerListProps) {
  const { toast } = useToast();
  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader><CardTitle>{title} ({players.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {players.length > 0 ? (
          players.map(p => {
            const playerId = getPlayerId(p);
            if (!playerId) return null;
            return (
              <PlayerCard
                key={playerId}
                player={{...p, user_id: playerId}}
                playerInfo={playersInfo.get(playerId)}
                isOwner={isOwner}
                canRemove={isOwner}
                canEditSkill={isOwner}
                isBookingOwner={playerId === getPlayerId(booking.owner_id)}
                roleLabel={getGroupRoleLabel(playerId, groupInfo, playersInfo)}
                booking={booking}
                onRemove={async () => {
                  try {
                    await removePlayerFromBooking(booking._id, playerId);
                    toast({ title: "Jogador removido!" });
                    onActionComplete();
                  } catch (error: any) {
                    toast({ title: "Erro", description: error.message, variant: "destructive" });
                  }
                }}
                onSkillUpdate={async (newSkill) => {
                  try {
                    await updatePlayerSkillLevel(booking._id, playerId, newSkill);
                    toast({ title: "Nível de habilidade atualizado." });
                    onActionComplete();
                  } catch (error: any) {
                    toast({ title: "Erro", description: error.message, variant: "destructive" });
                    throw error;
                  }
                }}
              />
            )
          })
        ) : (
          <p className="text-zinc-500 text-sm p-4 text-center">Nenhum jogador nesta lista.</p>
        )}
      </CardContent>
    </Card>
  );
}
interface PlayerCardProps {
  player: {user_id: string, skill_level: number};
  playerInfo?: PlayerInfo;
  isOwner: boolean;
  canRemove: boolean;
  canEditSkill: boolean;
  isBookingOwner: boolean;
  roleLabel: string;
  booking: Booking;
  onRemove: () => Promise<void>;
  onSkillUpdate: (newSkill: number) => Promise<void>;
}

function PlayerCard({ player, playerInfo, isOwner, canRemove, canEditSkill, isBookingOwner, roleLabel, booking, onRemove, onSkillUpdate }: PlayerCardProps) {
    const getInitials = (name?: string) => (name?.match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase();
    const isPlaceholder = Boolean(playerInfo?.is_placeholder);
  const [removePopoverOpen, setRemovePopoverOpen] = useState(false);
    const displayName = isPlaceholder
      ? (playerInfo?.name || "...")
      : (playerInfo?.nickname || playerInfo?.name || "...");
    const displaySubtitle = isPlaceholder
      ? "Convidado"
      : `@${playerInfo?.username || "usuario"}`;

    return (
      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="rounded-full transition-colors duration-300 ease-in-out">
              {isOwner && !isBookingOwner ? (
                canRemove ? (
                  <Popover open={removePopoverOpen} onOpenChange={setRemovePopoverOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className="cursor-pointer rounded-full transition-all" aria-label={`Remover ${displayName}`}>
                        <Avatar className="h-9 w-9 ring-1 ring-zinc-700 transition-all duration-200 group-hover:ring-[1.5px] group-hover:ring-red-500">
                          <AvatarImage src={playerInfo?.photo_url} alt={playerInfo?.name} className="object-cover object-center" />
                          <AvatarFallback className="flex items-center justify-center">
                            {playerInfo?.is_placeholder ? (
                              <Ghost className="h-4 w-4 text-zinc-400" />
                            ) : (
                              getInitials(playerInfo?.name)
                            )}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" sideOffset={8} className="w-64 border-zinc-700 bg-zinc-900 p-3">
                      <p className="text-sm font-medium text-zinc-100">Remover {displayName}?</p>
                      <p className="mt-1 text-xs text-zinc-400">Essa pessoa poderá entrar novamente no final da lista.</p>
                      <div className="mt-3 flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="flex-1 h-8 px-2 text-zinc-300 hover:text-white"
                          onClick={() => setRemovePopoverOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-black border-[#27272a] hover:bg-red-400/10 hover:border-red-400 hover:text-red-400 backdrop-red-sm"
                          onClick={async () => {
                            await onRemove();
                            setRemovePopoverOpen(false);
                          }}
                        >
                          <Trash2 className="h-2 m-2 pr-1"></Trash2>
                          Remover
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                ) : (
                  <button type="button" className="cursor-not-allowed rounded-full transition-all opacity-75" disabled aria-label={`${displayName} bloqueado para remoção`}>
                    <Avatar className="h-9 w-9 ring-1 ring-zinc-700">
                      <AvatarImage src={playerInfo?.photo_url} alt={playerInfo?.name} className="object-cover object-center" />
                      <AvatarFallback className="flex items-center justify-center">
                        {playerInfo?.is_placeholder ? (
                          <Ghost className="h-4 w-4 text-zinc-400" />
                        ) : (
                          getInitials(playerInfo?.name)
                        )}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                )
              ) : (
                <div className="transition-all cursor-default">
                  <Avatar className="h-9 w-9 ring-2 ring-zinc-800">
                    <AvatarImage src={playerInfo?.photo_url} alt={playerInfo?.name} className="object-cover object-center" />
                    <AvatarFallback className="flex items-center justify-center">
                      {playerInfo?.is_placeholder ? (
                        <Ghost className="h-4 w-4 text-zinc-400" />
                      ) : (
                        getInitials(playerInfo?.name)
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
            {isOwner && !isBookingOwner && canRemove && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-red-500 rounded-full p-0.5 pointer-events-none">
                <X className="h-2.5 w-2.5 text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{displayName}</p>
            <p className="text-xs text-zinc-400">{displaySubtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StarRating
            currentSkill={
              booking.players.find(bp => getPlayerId(bp) === player.user_id)?.skill_level ?? 
              booking.reserve_players.find(bp => getPlayerId(bp) === player.user_id)?.skill_level ?? 
              player.skill_level ?? 0
            }
            onSkillUpdate={onSkillUpdate}
            enabled={canEditSkill}
            showFrame={isOwner}
          />
        </div>
      </div>
    );
}


interface StarRatingProps {
  currentSkill: number;
  onSkillUpdate: (newSkill: number) => Promise<void>;
  enabled: boolean;
  showFrame: boolean;
}

interface SelectableStarIconProps {
  fillRatio: number;
  size?: number;
}

function SelectableStarIcon({ fillRatio, size = 20 }: SelectableStarIconProps) {
  const boundedFillRatio = Math.max(0, Math.min(1, fillRatio));
  const starSizeStyle = { width: size, height: size };

  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Star
        size={size}
        className="absolute inset-0"
        style={{ ...starSizeStyle, color: "#71717a" }}
      />

      {boundedFillRatio > 0 && (
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${boundedFillRatio * 100}%`, height: size }}
        >
          <Star
            size={size}
            className="absolute inset-0"
            style={{ ...starSizeStyle, color: "#facc15", fill: "#facc15" }}
          />
        </span>
      )}
    </span>
  );
}

function StarRating({ currentSkill, onSkillUpdate, enabled, showFrame }: StarRatingProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [pendingSkill, setPendingSkill] = useState(normalizeSkillRating(currentSkill));
  const [isSaving, setIsSaving] = useState(false);
  const [savingTargetSkill, setSavingTargetSkill] = useState<number | null>(null);
  const stars = [1, 2, 3, 4, 5];

  useEffect(() => {
    if (!isSaving || savingTargetSkill === null) return;

    if (normalizeSkillRating(currentSkill) === savingTargetSkill) {
      setIsSaving(false);
      setSavingTargetSkill(null);
    }
  }, [currentSkill, isSaving, savingTargetSkill]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setPendingSkill(normalizeSkillRating(currentSkill));
    }

    setPopoverOpen(open);
  };

  const handleStarSelect = (starNumber: number) => {
    setPendingSkill((previous) => {
      if (previous > starNumber) {
        return starNumber;
      }

      const currentFillRatio = Math.max(0, Math.min(1, previous - (starNumber - 1)));

      if (currentFillRatio === 0) {
        return starNumber;
      }

      if (currentFillRatio === 1) {
        return starNumber - 0.5;
      }

      return Math.max(0, starNumber - 1);
    });
  };

  const hasPendingChange = pendingSkill !== normalizeSkillRating(currentSkill);

  if (!showFrame) {
    return (
      <RatingStars
        value={currentSkill}
        size={16}
        filledColor="#eab308"
        emptyColor="#52525b"
      />
    );
  }

  if (!enabled) {
    return (
      <button
        type="button"
        className="group flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 px-2 py-1 opacity-70 cursor-not-allowed"
        title="Partida encerrada. Não é possível editar agora"
        disabled
      >
        <RatingStars
          value={currentSkill}
          size={16}
          filledColor="#facc15"
          emptyColor="#52525b"
        />
        <LockKeyhole className="h-3 w-3 text-zinc-500" />
      </button>
    );
  }

  return (
    <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button 
            className="group flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/50 px-2 py-1 transition-all hover:border-green-400 hover:shadow-sm disabled:cursor-wait disabled:opacity-80"
            title="Clique para editar"
            disabled={isSaving}
          >
            <RatingStars
              value={currentSkill}
              size={16}
              filledColor="#facc15"
              emptyColor="#52525b"
            />
            {isSaving ? (
              <LoaderCircle className="h-3 w-3 animate-spin text-green-400" />
            ) : (
              <Edit className="h-3 w-3 text-zinc-500 transition-colors group-hover:text-green-400" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          sideOffset={-45}
          className="w-auto p-2 bg-zinc-800 border-zinc-700"
        >
          <div className="flex flex-col items-center gap-1.5">
          <div className="flex justify-center gap-0.5">
                {stars.map((star, index) => {
                    const fillRatio = Math.max(0, Math.min(1, pendingSkill - index));

                    return (
                    <Button
                      key={star}
                      variant="ghost"
                      size="icon"
                      className="flex h-7 w-7 items-center justify-center rounded-full p-0 hover:bg-zinc-700/60 [&_span]:transition-transform [&_span]:duration-150 hover:[&_span]:scale-110"
                      onClick={() => handleStarSelect(star)}
                      disabled={isSaving}
                    >
                        <SelectableStarIcon fillRatio={fillRatio} size={20} />
                    </Button>
                    );
                })}
                </div>
            <div className="flex w-full items-center justify-between px-0.5">
                    <button
                      type="button"
                      className="text-xs text-zinc-400 transition-colors hover:text-zinc-200"
                      disabled={isSaving}
                      onClick={() => {
                        setPendingSkill(normalizeSkillRating(currentSkill));
                        setPopoverOpen(false);
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium text-green-400 transition-colors hover:text-green-300 disabled:cursor-not-allowed disabled:text-zinc-600"
                      disabled={!hasPendingChange || isSaving}
                      onClick={async () => {
                        const normalizedPendingSkill = normalizeSkillRating(pendingSkill);
                        setPopoverOpen(false);
                        setIsSaving(true);
                        setSavingTargetSkill(normalizedPendingSkill);

                        try {
                          await onSkillUpdate(normalizedPendingSkill);
                        } catch (error) {
                          setIsSaving(false);
                          setSavingTargetSkill(null);
                        }
                      }}
                    >
                      Salvar
                    </button>
                </div>
            </div>
        </PopoverContent>
    </Popover>
  );
}


interface TeamDisplayProps {
  teams: TeamsLayout;
  playersInfo: Map<string, PlayerInfo>;
  booking: Booking;
}

function TeamDisplay({ teams, playersInfo, booking }: TeamDisplayProps) {
  const teamColors = [
    "border-blue-400",
    "border-red-400",
    "border-yellow-400",
    "border-purple-400",
    "border-pink-400",
    "border-orange-400",
  ];

  const getPlayerDetails = (playerId: string) => {
    const info = playersInfo.get(playerId);
    const details = booking.players.find(p => getPlayerId(p) === playerId);
    return { name: info?.name, photo: info?.photo_url, skill: details?.skill_level || 0 };
  }
  
  const renderPlayerAvatar = (playerId: string, teamIndex: number) => {
    const player = getPlayerDetails(playerId);
    const getInitials = (name?: string) => (name?.match(/\b\w/g) || []).slice(0, 2).join("").toUpperCase();
    
    const borderColor = teamColors[teamIndex % teamColors.length];

    return (
        <div key={playerId} className="flex flex-col items-center gap-1 text-center">
            <Avatar className={`w-12 h-12 border-2 ${borderColor}`}>
                <AvatarImage src={player.photo} className="object-cover object-center" />
                <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold w-16">{player.name}</span>
            <RatingStars
              value={player.skill}
              size={12}
              filledColor="#facc15"
              emptyColor="#52525b"
            />
        </div>
    )
  }

  const FutsalField = () => (
    <div className=" border-2 border-black rounded-lg p-4 h-[500px] flex flex-col justify-around items-center relative">
        <div className="absolute top-1/2 left-0 right-0 border-t-2 border border-black -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border border-black rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="w-full flex justify-around">{teams.teams[0]?.map(id => renderPlayerAvatar(id, 0))}</div>
        <div className="w-full flex justify-around">{teams.teams[1]?.map(id => renderPlayerAvatar(id, 1))}</div>
    </div>
  );

  const GenericLayout = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.teams.map((team, index) => (
            <Card key={index} className="bg-zinc-800/80 border-zinc-700">
                <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
                    <CardTitle className="text-white">Time {index + 1}</CardTitle>
                    <CardDescription className="shrink-0 text-right text-zinc-300">
                        Nível do Time:<span className="font-bold"> {formatTeamLevel(teams.team_skills_sum[index], team.length)} </span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                    {team.map(playerId => renderPlayerAvatar(playerId, index))}
                </CardContent>
            </Card>
        ))}
    </div>
  )

  return (
    <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader><CardTitle>Times Organizados</CardTitle></CardHeader>
        <CardContent>
            {(booking.modality === "Futsal" || booking.modality === "Vôlei" || booking.modality === "Handebol" || booking.modality === "Basquete") && teams.teams.length === 2
                ? <FutsalField />
                : <GenericLayout />
            }
        </CardContent>
    </Card>
  )
}