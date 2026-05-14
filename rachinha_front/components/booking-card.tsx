import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Calendar,
  CalendarDays,
  MoreVertical,
  Edit,
  Trash2,
  Flag,
  MapPin,
  CalendarCheck2,
  CalendarSync,
  CalendarX2,
  CalendarClock,
  Ghost,
  Users,
  Medal,
  MousePointerClick
} from "lucide-react";
import React from "react";

const getSportKey = (modality?: string) => {
  const lower = modality?.toLowerCase() || "";

  if (lower.includes("futebol") || lower.includes("futsal")) return "soccer";
  if (lower.includes("basquete") || lower.includes("basketball")) return "basketball";
  if (lower.includes("volei") || lower.includes("vôlei") || lower.includes("volleyball")) return "volleyball";
  if (lower.includes("tennis") || lower.includes("tênis") || lower.includes("tenis") || lower.includes("padel") || lower.includes("beach tennis")) return "tennis";
  if (lower.includes("handebol") || lower.includes("handball")) return "handball";

  return "default";
};

const getSportTheme = (modality?: string, variant?: "vote", isToday?: boolean) => {
  if (variant === "vote") {
    return {
      background: "linear-gradient(145deg, rgba(57,40,7,0.98) 0%, rgba(26,20,5,0.96) 52%, rgba(12,10,6,0.98) 100%)",
      borderClass: "border-yellow-700/50 hover:border-yellow-500/70",
      dividerClass: "border-yellow-900/40 group-hover:border-yellow-700/50",
      countPillClass: "border-yellow-700/30 bg-yellow-950/35 text-yellow-50",
      countIconClass: "text-yellow-200",
      surfaceTint: "bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(161,98,7,0.2),transparent_40%)]",
      patternStroke: "rgba(250,204,21,0.2)",
      shine: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_42%)]",
    };
  }

  if (isToday) {
    return {
      background: "linear-gradient(145deg, rgba(5,66,23,0.98) 0%, rgba(6,49,18,0.97) 56%, rgba(3,26,10,0.98) 100%)",
      borderClass: "border-emerald-700/45 hover:border-emerald-500/65",
      dividerClass: "border-emerald-900/35 group-hover:border-emerald-700/45",
      countPillClass: "border-emerald-500/20 bg-black/20 text-white",
      countIconClass: "text-emerald-200",
      surfaceTint: "bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_42%)]",
      patternStroke: "rgba(187,247,208,0.18)",
      shine: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_42%)]",
    };
  }

  return {
    background: "linear-gradient(145deg, rgba(45,45,52,0.98) 0%, rgba(31,31,36,0.97) 54%, rgba(16,16,18,0.98) 100%)",
    borderClass: "border-zinc-700/70 hover:border-zinc-500/70",
    dividerClass: "border-zinc-800/70 group-hover:border-zinc-600/70",
    countPillClass: "border-zinc-500/20 bg-black/20 text-white",
    countIconClass: "text-zinc-200",
    surfaceTint: "bg-[radial-gradient(circle_at_top_left,rgba(113,113,122,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(63,63,70,0.12),transparent_42%)]",
    patternStroke: "rgba(228,228,231,0.14)",
    shine: "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%)]",
  };
};

const getSportBallIconPath = (modality?: string) => {
  const key = getSportKey(modality);

  switch (key) {
    case "soccer":
      return "/assets/icons/Football.svg";
    case "basketball":
      return "/assets/icons/Basketball.svg";
    case "volleyball":
      return "/assets/icons/Volleyball.svg";
    case "tennis":
      return "/assets/icons/Tennis.svg";
    case "handball":
      return "/assets/icons/Handball.svg";
    default:
      return "/assets/icons/Football.svg";
  }
};

const renderSportBallPattern = (modality?: string, color = "rgba(255,255,255,0.14)") => {
  const iconPath = getSportBallIconPath(modality);

  return (
    <div
      className="w-full"
      style={{
        aspectRatio: "1 / 1",
        backgroundColor: color,
        maskImage: `url(${iconPath})`,
        WebkitMaskImage: `url(${iconPath})`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "78% 78%",
        WebkitMaskSize: "78% 78%",
      }}
    />
  );
};

type PlayerProfile = {
  name?: string;
  photo_url?: string;
  is_placeholder?: boolean;
};

interface BookingCardProps {
  booking: any;
  isToday: boolean;
  invite?: any;
  isListFull: boolean;
  userInList: boolean;
  isGroupAdmin: boolean;
  headerIcon?: React.ReactNode;
  headerTitle?: React.ReactNode;
  headerSubtitle?: React.ReactNode;
  headerRightBadge?: React.ReactNode;
  showConfirmedPlayers?: boolean;
  hideInfoTags?: boolean;
  playersById?: Map<string, PlayerProfile>;
  confirmedPlayersMax?: number;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  onEditBooking: (booking: any) => void;
  onCancelBooking: (booking: any) => void;
  handlePresence: (bookingId: string, action: "confirm" | "cancel") => void;
  variant?: "vote";
  onVoteClick?: (booking: any) => void;
}

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
};

const getPlayerId = (player: any): string | undefined => {
  if (!player) return undefined;
  const id = player.id || player.user_id;
  if (typeof id === "string") return id;
  if (id && typeof id === "object" && id.$oid) return id.$oid;
  return undefined;
};

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  isToday,
  invite,
  isListFull,
  userInList,
  isGroupAdmin,
  headerIcon,
  headerTitle,
  headerSubtitle,
  headerRightBadge,
  showConfirmedPlayers = false,
  hideInfoTags = false,
  playersById,
  formatDate,
  formatTime,
  onEditBooking,
  onCancelBooking,
  handlePresence,
  variant,
  onVoteClick,
}) => {
  const isInlineVoteCard = variant === "vote" && typeof onVoteClick === "function";
  const showAdminActions = isGroupAdmin && !isInlineVoteCard;
  const theme = getSportTheme(booking?.modality, variant, isToday);

  let buttonState: "confirm" | "cancel" | "disabled" | "not_invited" | "waiting" = "not_invited";

  if (invite) {
    if (!booking.status_list) {
      buttonState = "disabled";
    } else if (invite.status === "accepted") {
      buttonState = "cancel";
    } else if (isListFull && !userInList) {
      buttonState = "waiting";
    } else {
      buttonState = "confirm";
    }
  }

  // Separar jogadores reais de fantasmas
  const allPlayers = [...(booking?.players ?? [])];
  
  const realPlayers = allPlayers.filter((p: any) => {
    const playerId = getPlayerId(p);
    const playerData = playerId ? playersById?.get(playerId) : undefined;
    return !playerData?.is_placeholder && !p?.is_placeholder;
  });

  const ghostPlayers = allPlayers.filter((p: any) => {
    const playerId = getPlayerId(p);
    const playerData = playerId ? playersById?.get(playerId) : undefined;
    return playerData?.is_placeholder || p?.is_placeholder;
  });

  // Ordem de exibição: PRIORIZAR reais nas bolinhas visíveis
  // Reais devem ficar sempre à direita, fantasmas à esquerda (preenchendo o espaço)
  const MAX_VISIBLE = 4;

  // Quantos reais vão aparecer (no máximo MAX_VISIBLE)
  const numRealsToShow = Math.min(realPlayers.length, MAX_VISIBLE);
  // Quantos fantasmas vão aparecer (para completar até MAX_VISIBLE)
  const numGhostsToShow = MAX_VISIBLE - numRealsToShow;

  // Ordem: fantasmas à esquerda + reais à direita
  const displayPlayers = [
    ...ghostPlayers.slice(0, numGhostsToShow),
    ...realPlayers.slice(0, numRealsToShow)
  ];

  const overflowPlayers = Math.max(allPlayers.length - MAX_VISIBLE, 0);

  const confirmedCount = booking?.players?.length ?? 0;
  const maxPlayers = booking?.max_players ?? 0;

  const cardContent = (
      <Card
        className={`group relative isolate cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 ${theme.borderClass}`}
        style={{ background: theme.background }}
      >
        <div className={`pointer-events-none absolute inset-0 ${theme.surfaceTint}`} />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 overflow-hidden opacity-90"
          style={{
            maskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 38%, rgba(0,0,0,1) 100%)",
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.7) 38%, rgba(0,0,0,1) 100%)",
          }}
        >
          <div
            className="absolute -inset-8"
            style={{
              transform: "scale(1.2)",
              transformOrigin: "center",
            }}
          >
            {renderSportBallPattern(booking?.modality, theme.patternStroke)}
          </div>
        </div>
        <div className={`pointer-events-none absolute inset-0 ${theme.shine}`} />
        <div className="pointer-events-none absolute inset-[1px] rounded-[15px] border border-white/10" />
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-white/15" />

        {/* HEADER */}

        <CardHeader className="relative z-10 pb-3 pt-5 sm:pt-6">
          {/* Mobile: Badge acima do título */}
          {headerRightBadge && (
            <div className="mb-3 sm:hidden">
              {headerRightBadge}
            </div>
          )}

          {/* Mobile: Pill de avaliacao acima do titulo */}
          {isInlineVoteCard && (
            <div className="mb-3 sm:hidden">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-yellow-600/50 bg-black/20 px-3 py-1 text-[11px] font-semibold text-yellow-100 backdrop-blur-md">
                <MousePointerClick className="h-3.5 w-3.5 text-yellow-300" />
                <span>Avalie os jogadores</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-start gap-3 sm:gap-4">

            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <CardTitle className="min-w-0 flex-1 text-left text-[1.2rem] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[1.28rem]">
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    {headerIcon ?? (variant === "vote" ? <Medal className="h-6 w-6 text-yellow-400 shrink-0" /> : <CalendarDays className="h-6 w-6 text-green-400 shrink-0" />)}
                    <span className="truncate">{headerTitle || formatDate(booking.start_time)}</span>
                  </span>
                </CardTitle>

                {headerRightBadge && (
                  <div className="hidden sm:block shrink-0">
                    {headerRightBadge}
                  </div>
                )}
              </div>

              <p className="mt-2 text-left text-sm text-zinc-200/82">
                {headerSubtitle || `${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}`}
              </p>
            </div>

            <div className="flex shrink-0 items-center ">
              {isInlineVoteCard && (
                <div className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-yellow-600/50 bg-black/20 px-3 py-1 text-[11px] font-semibold text-yellow-100 backdrop-blur-md">
                  <MousePointerClick className="h-3.5 w-3.5 text-yellow-300" />
                  <span>Avalie os jogadores</span>
                </div>
              )}

              {showAdminActions && (
                <div onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}>
                  <DropdownMenu>

                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="bg-zinc-800 border-zinc-700 text-white">

                      <DropdownMenuItem
                        className="hover:bg-zinc-700 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditBooking(booking);
                        }}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Racha
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="text-red-500 hover:!text-red-500 hover:!bg-red-900/50 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onCancelBooking(booking);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancelar Racha
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

          </div>
        </CardHeader>

        <CardContent className={`relative z-10 pb-5`}>

          {!hideInfoTags && (
            <div className="flex flex-wrap gap-2 mb-3">

              {booking.modality && (
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs flex items-center gap-1 backdrop-blur-md">
                  <Flag className="h-3 w-3 text-green-400" />
                  <span className="text-zinc-100">{booking.modality}</span>
                </div>
              )}

              {booking.location?.alt && (
                <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs flex items-center gap-1 backdrop-blur-md">
                  <MapPin className="h-3 w-3 text-green-400" />
                  <span className="text-zinc-100">{booking.location.alt}</span>
                </div>
              )}

            </div>
          )}

          {/* PLAYERS */}

          {showConfirmedPlayers && (
            <div className={`${hideInfoTags ? "my-0" : "mb-1"} flex min-h-10 items-center gap-3`}>

              <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${theme.countPillClass}`}>
                <Users className={`h-3.5 w-3.5 ${theme.countIconClass}`} />
                <span className="whitespace-nowrap">
                  {confirmedCount}/{maxPlayers} confirmados
                </span>
              </div>

              <div className="ml-auto flex min-w-0 items-center justify-end overflow-hidden">

                <div className="flex max-w-[144px] items-center justify-end overflow-hidden">

                  {displayPlayers.map((player: any, index: number) => {

                    const playerId = getPlayerId(player);
                    const playerData = playerId ? playersById?.get(playerId) : undefined;

                    const hasPhoto = Boolean(playerData?.photo_url);
                    const isGhostUser = Boolean(playerData?.is_placeholder || player?.is_placeholder);
                    const fallbackName = playerData?.name || player?.name;

                    return (
                      <Avatar
                        key={`${booking._id}-${playerId || index}`}
                        className="h-8 w-8 border border-black/35 shadow-[0_8px_18px_-12px_rgba(0,0,0,0.7)]"
                        style={{ marginLeft: index === 0 ? 0 : -8 }}
                      >
                        {hasPhoto && (
                          <AvatarImage
                            src={playerData?.photo_url}
                            alt={playerData?.name}
                            className="object-cover object-center"
                          />
                        )}

                        <AvatarFallback className="bg-black/40 text-[11px] text-zinc-100 backdrop-blur-sm">
                          {isGhostUser
                            ? <Ghost className="h-3.5 w-3.5 text-zinc-300" />
                            : getInitials(fallbackName)}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}

                  {overflowPlayers > 0 && (
                    <div
                      className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-black/35 ${variant === "vote" ? "bg-yellow-500" : "bg-green-500"} text-[11px] font-semibold text-white shadow-[0_8px_18px_-12px_rgba(0,0,0,0.7)]`}
                      style={{ marginLeft: -8 }}
                    >
                      +{overflowPlayers}
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {typeof buttonState !== "undefined" && variant !== "vote" && (
            <div className="mt-4" onClick={(e) => e.preventDefault()}>

              {buttonState === "confirm" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer bg-green-800 hover:bg-green-700/20 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm group"
                  onClick={() => handlePresence(booking._id, "confirm")}
                >
                  <CalendarCheck2 className="h-4 w-4 text-green-400 mr-2" />
                  Confirmar Presença
                </Button>
              )}

              {buttonState === "waiting" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer bg-blue-800 hover:bg-blue-700/20 border-blue-400 hover:border-blue-400 hover:text-blue-400 backdrop-blur-sm group"
                  onClick={() => handlePresence(booking._id, "confirm")}
                >
                  <CalendarSync className="h-4 w-4 text-blue-400 mr-2" />
                  Entrar na Espera
                </Button>
              )}

              {buttonState === "cancel" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full cursor-pointer bg-red-800 hover:bg-red-700/20 border-red-400 hover:border-red-400 hover:text-red-400 backdrop-blur-sm group"
                  onClick={() => handlePresence(booking._id, "cancel")}
                >
                  <CalendarX2 className="h-4 w-4 text-red-400 mr-2" />
                  Cancelar Presença
                </Button>
              )}

              {buttonState === "disabled" && (
                <Button className="w-full bg-zinc-800 text-zinc" disabled>
                  <CalendarClock className="h-4 w-4 mr-2" />
                  Lista não liberada  
                </Button>
              )}

            </div>
          )}

        </CardContent>
      </Card>
  );

  if (isInlineVoteCard) {
    return (
      <div
        role="button"
        tabIndex={0}
        className="no-underline"
        onClick={() => onVoteClick(booking)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onVoteClick(booking);
          }
        }}
      >
        {cardContent}
      </div>
    );
  }

  return (
    <Link
      key={booking._id}
      href={variant === "vote" ? `/user/booking/${booking._id}?openVote=1` : `/user/booking/${booking._id}`}
      className="no-underline"
    >
      {cardContent}
    </Link>
  );
};