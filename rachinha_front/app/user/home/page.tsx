"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { addWeeks, endOfMonth, endOfWeek, format, isPast, isSameDay, isWithinInterval, parseISO, startOfMonth, startOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, CalendarDays, ChevronRight, Flame, MapPin, Trophy, Users } from "lucide-react"

import { BookingCard } from "@/components/booking-card"
import { HorizontalScroll } from "@/components/horizontal-scroll"
import { UserProfileCard } from "@/components/card/user-profile-card"
import { getSportIcon } from "@/lib/getSportIcon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Booking } from "@/interface/booking"
import { Invite } from "@/interface/invite"
import { User } from "@/interface/users"
import { getBookingsByUserId } from "@/services/bookings"
import { Group, listMyGroups } from "@/services/groups"
import { acceptBookingInvite, declineBookingInvite, getMyBookingInvites } from "@/services/invites"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentUser, getMyFavoriteGroups, getUsersByIds } from "@/services/users"

function setGlowPositionFromMouse(e: React.MouseEvent<HTMLElement>) {
  const rect = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`)
  e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`)
}

function StatCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border ${className ?? "border-zinc-700 bg-zinc-800"}`}
      onMouseMove={setGlowPositionFromMouse}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.09), transparent 65%)" }}
      />
      <div className="relative z-20 flex items-center gap-3 p-4">
        {children}
      </div>
    </div>
  )
}

function getInitials(name?: string) {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

function getCardDisplayName(name?: string, nickname?: string) {
  const trimmedNickname = nickname?.trim()
  if (trimmedNickname) return trimmedNickname

  const firstName = name?.trim().split(/\s+/)[0]
  return firstName || "Jogador"
}

function getPlayerId(player: any): string | undefined {
  if (!player) return undefined
  const id = player.id || player.user_id
  if (typeof id === "string") return id
  if (id && typeof id === "object" && id.$oid) return id.$oid
  return undefined
}

function formatMatchWhen(startTime: string) {
  const date = parseISO(startTime)
  if (isSameDay(date, new Date())) {
    return `Hoje • ${format(date, "HH:mm")}`
  }
  return `${format(date, "EEEE", { locale: ptBR })} • ${format(date, "HH:mm")}`
}

function formatBookingDate(dateString: string) {
  return format(parseISO(dateString), "dd 'de' MMMM", { locale: ptBR })
}

function formatBookingTime(dateString: string) {
  return format(parseISO(dateString), "HH:mm")
}

function formatCompactBookingDate(dateString: string) {
  return format(parseISO(dateString), "dd/MMM", { locale: ptBR }).replace(".", "").toLowerCase()
}

export default function UserHomePage() {
  const { toast } = useToast()
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [myInvites, setMyInvites] = useState<Invite[]>([])
  const [playersById, setPlayersById] = useState<Map<string, User>>(new Map())
  const [favoriteGroupIds, setFavoriteGroupIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isProfilePreviewOpen, setIsProfilePreviewOpen] = useState(false)

  const fetchData = async () => {
    try {
      const me = await getCurrentUser()
      setUser(me)

      const [myGroups, myBookings, invites, favoriteIds] = await Promise.all([
        listMyGroups(),
        getBookingsByUserId(me._id ?? me.id),
        getMyBookingInvites(),
        getMyFavoriteGroups(),
      ])

      const activeBookings = myBookings
        .filter((booking) => booking.status !== "cancelled")
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

      setGroups(myGroups)
      setBookings(activeBookings)
      setMyInvites(invites)
      setFavoriteGroupIds(favoriteIds)

      const allPlayerIds = Array.from(
        new Set(
          activeBookings
            .flatMap((booking) => booking.players.map((player) => getPlayerId(player)))
            .filter((id): id is string => Boolean(id))
        )
      )

      if (allPlayerIds.length > 0) {
        const users = await getUsersByIds(allPlayerIds)
        const usersMap = new Map<string, User>()
        users.forEach((entry) => {
          if (entry._id) usersMap.set(String(entry._id), entry)
          if (entry.id) usersMap.set(String(entry.id), entry)
        })
        setPlayersById(usersMap)
      } else {
        setPlayersById(new Map())
      }
    } catch (error: any) {
      setGroups([])
      setBookings([])
      setMyInvites([])
      setFavoriteGroupIds([])
      setPlayersById(new Map())
      toast({
        title: "Erro ao carregar sua home",
        description: error?.message || "Nao foi possivel carregar seus dados agora.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePresence = async (bookingId: string, action: "confirm" | "cancel") => {
    const invite = myInvites.find((entry) => entry.booking_id === bookingId)
    if (!invite) {
      toast({ title: "Erro", description: "Convite nao encontrado.", variant: "destructive" })
      return
    }

    try {
      if (action === "confirm") {
        await acceptBookingInvite(bookingId, invite._id)
        toast({ title: "Sucesso", description: "Presenca confirmada!" })
      } else {
        await declineBookingInvite(bookingId, invite._id)
        toast({ title: "Sucesso", description: "Presenca cancelada." })
      }

      await fetchData()
    } catch (error: any) {
      toast({
        title: `Erro ao ${action === "confirm" ? "confirmar" : "cancelar"} presenca`,
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 0 })
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 0 })
  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 0 })
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 0 })
  const firstName = user?.name?.split(" ")[0] ?? "jogador"
  const groupsById = new Map(groups.map((group) => [group._id, group]))

  const playedThisMonthCount = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.start_time)
    return bookingDate <= now && isWithinInterval(bookingDate, { start: monthStart, end: monthEnd })
  }).length

  const playingWeeksStreak = useMemo(() => {
    const playedWeeks = new Set(
      bookings
        .filter((booking) => parseISO(booking.start_time) <= now)
        .map((booking) => startOfWeek(parseISO(booking.start_time), { weekStartsOn: 0 }).getTime())
    )

    let streak = 0
    while (playedWeeks.has(startOfWeek(new Date(currentWeekStart.getTime() - streak * 7 * 24 * 60 * 60 * 1000), { weekStartsOn: 0 }).getTime())) {
      streak += 1
    }

    return streak
  }, [bookings, currentWeekStart, now])

  const favoriteSport = useMemo(() => {
    const sportCount = new Map<string, number>()
    bookings
      .filter((booking) => parseISO(booking.start_time) <= now)
      .forEach((booking) => {
        const modality = booking.modality || "Sem modalidade"
        sportCount.set(modality, (sportCount.get(modality) || 0) + 1)
      })

    const sorted = [...sportCount.entries()].sort((a, b) => b[1] - a[1])
    return sorted[0]?.[0] ?? "--"
  }, [bookings, now])

  const thisWeekBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.start_time)
    return isWithinInterval(bookingDate, { start: currentWeekStart, end: currentWeekEnd })
  })

  const upcomingThisWeekBookings = thisWeekBookings.filter((booking) => parseISO(booking.start_time) >= now)
  const nextWeekBookings = bookings.filter((booking) => {
    const bookingDate = parseISO(booking.start_time)
    return bookingDate >= now && isWithinInterval(bookingDate, { start: nextWeekStart, end: nextWeekEnd })
  })

  const openListBookings = bookings
    .filter((booking) => {
      const bookingDate = parseISO(booking.start_time)
      return booking.status_list && !isPast(parseISO(booking.end_time)) && bookingDate >= now
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const openListBookingsThisMonth = openListBookings.filter((booking) => {
    const bookingDate = parseISO(booking.start_time)
    return isWithinInterval(bookingDate, { start: monthStart, end: monthEnd })
  })

  const favoriteGroups = useMemo(() => {
    const favoriteIdsSet = new Set(favoriteGroupIds)
    const bookingCountByGroup = new Map<string, number>()
    bookings.forEach((booking) => {
      if (!booking.associated_group_id) return
      bookingCountByGroup.set(
        booking.associated_group_id,
        (bookingCountByGroup.get(booking.associated_group_id) || 0) + 1
      )
    })

    return [...groups]
      .filter((group) => favoriteIdsSet.has(group._id))
      .sort((a, b) => (bookingCountByGroup.get(b._id) || 0) - (bookingCountByGroup.get(a._id) || 0))
      .slice(0, 8)
  }, [bookings, groups, favoriteGroupIds])

  const upcomingMatches = bookings
    .filter((booking) => parseISO(booking.start_time) >= now)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 8)

  const headerContextLine = useMemo(() => {
    const openThisWeek = openListBookings.filter((booking) => {
      const bookingDate = parseISO(booking.start_time)
      return isWithinInterval(bookingDate, { start: currentWeekStart, end: currentWeekEnd })
    })

    const nearestOpen = openThisWeek[0]
    if (nearestOpen) {
      const remaining = nearestOpen.max_players - nearestOpen.players.length
      if (remaining > 0 && remaining <= 3) {
        return remaining === 1
          ? "Ultima vaga aberta no jogo desta semana"
          : `Faltam ${remaining} jogadores para fechar o jogo da semana`
      }
    }

    if (upcomingThisWeekBookings.length > 0) {
      return `Você ainda tem ${upcomingThisWeekBookings.length} ${upcomingThisWeekBookings.length === 1 ? "partida" : "partidas"} essa semana`
    }

    if (nextWeekBookings.length > 0) {
      return `Semana que vem você tem ${nextWeekBookings.length} ${nextWeekBookings.length === 1 ? "partida" : "partidas"}!`
    }

    return "Nada marcado?! Vamos organizar a próxima partida!"
  }, [
    currentWeekEnd,
    currentWeekStart,
    nextWeekBookings.length,
    openListBookings,
    upcomingThisWeekBookings.length,
  ])

  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 space-y-8 p-4 md:p-6 overflow-x-hidden">      
    
    
    
    {/* 1. Header do usuario */}
      <section
        className="group relative overflow-hidden rounded-3xl bg-zinc-900 p-5 md:p-6"
        onMouseMove={setGlowPositionFromMouse}
      >
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ background: "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.09), transparent 68%)" }}
        />
        <div className="relative z-20">
          {loading ? (
            <Skeleton className="h-24 w-full bg-zinc-800" />
          ) : (
            <div className="flex items-center justify-between gap-4">
              
              {/* Textos: Na direita no mobile (order-2), na esquerda no desktop (sm:order-1) */}
              <div className="order-2 flex flex-1 min-w-0 items-center sm:order-1">
                <div className="min-w-0"> {/* min-w-0 é essencial para o texto quebrar linha em flexbox */}
                  <h1 className="text-xl font-bold text-white break-words sm:text-2xl">
                    Fala, {firstName}! 🔥
                  </h1>
                  <p className="text-sm text-zinc-300 sm:text-base">
                    Bora pro jogo?
                  </p>
                  <p className="mt-1 text-sm leading-snug text-green-300 break-words sm:mt-2">
                    {headerContextLine}
                  </p>
                </div>
              </div>

              {/* Cartinha: Na esquerda no mobile (order-1), na direita no desktop (sm:order-2) */}
              <div className="order-1 flex shrink-0 items-center sm:order-2">
                <button
                  type="button"
                  onClick={() => setIsProfilePreviewOpen(true)}
                  className="w-[100px] shrink-0 cursor-zoom-in rounded-xl sm:w-[140px]"
                  aria-label="Ampliar sua cartinha"
                >
                  <UserProfileCard
                    name={getCardDisplayName(user?.name, user?.nickname).toUpperCase()}
                    username={user?.username ? `@${user.username}` : "jogador"}
                    photoUrl={user?.photo_url}
                    initials={getInitials(user?.name)}
                    skillLevel={user?.skill_level ?? 0}
                    variant={user?.active_card_template}
                    preferSlim
                    memberSince={user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : ""}
                  />
                </button>
              </div>

            </div>
          )}
        </div>
      </section>

      <Dialog open={isProfilePreviewOpen} onOpenChange={setIsProfilePreviewOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-transparent backdrop-blur-sm" />
          <DialogContent className="w-auto max-w-none border-0 bg-transparent p-0 shadow-none [&>button]:hidden data-[state=open]:slide-in-from-left-0 data-[state=open]:slide-in-from-top-0 data-[state=closed]:slide-out-to-left-0 data-[state=closed]:slide-out-to-top-0">
            <div className="animate-in fade-in zoom-in-50 duration-200">
              <DialogTitle className="sr-only">Cartinha do jogador ampliada</DialogTitle>
              <div className="mx-auto w-[min(92vw,420px)]">
                <UserProfileCard 
                  name={getCardDisplayName(user?.name, user?.nickname).toUpperCase()}
                  username={user?.username ? `@${user.username}` : "jogador"}
                  photoUrl={user?.photo_url}
                  initials={getInitials(user?.name)}
                  skillLevel={user?.skill_level ?? 0}
                  variant={user?.active_card_template}
                  preferSlim
                  memberSince={user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : ""}
                />
              </div>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    

    {/* 2. Estatísticas do usuário */}
      <section className="space-y-3">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          
          <StatCard className="h-full border-transparent bg-green-950/60">
            <div className="flex w-full flex-col items-start justify-between">
              <Calendar className="mb-2 h-6 w-6 text-green-400 sm:mb-3 sm:h-8 sm:w-8" />
              <div className="w-full">
                <p className="text-sm font-bold leading-tight text-white sm:text-xl">
                  {loading ? "·" : playedThisMonthCount} partidas
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-400 sm:mt-1 sm:text-xs">
                  esse mês
                </p>
              </div>
            </div>
          </StatCard>

          <StatCard className="h-full border-transparent bg-orange-950/60">
            <div className="flex w-full flex-col items-start justify-between">
              <Flame className="mb-2 h-6 w-6 text-orange-400 sm:mb-3 sm:h-8 sm:w-8" />
              <div className="w-full">
                <p className="text-sm font-bold leading-tight text-white sm:text-xl">
                  {loading ? "·" : playingWeeksStreak} semanas
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-400 sm:mt-1 sm:text-xs">
                  seguidas jogando
                </p>
              </div>
            </div>
          </StatCard>

          <StatCard className="h-full border-transparent bg-yellow-950/60">
            <div className="flex w-full flex-col items-start justify-between">
              <Trophy className="mb-2 h-6 w-6 text-yellow-400 sm:mb-3 sm:h-8 sm:w-8" />
              <div className="w-full">
                <p className="line-clamp-2 text-sm font-bold leading-tight text-white capitalize sm:text-xl">
                  {loading ? "·" : favoriteSport}
                </p>
                <p className="mt-0.5 text-[10px] text-zinc-400 sm:mt-1 sm:text-xs">
                  mais jogado
                </p>
              </div>
            </div>
          </StatCard>

        </div>
      </section>

      {/* 2. Carrossel de partidas com lista aberta */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Partidas liberadas</h2>
            <p className="hidden sm:block text-sm text-zinc-400">Entre na lista antes que lote!</p>
          </div>
          <Link href="/user/booking">
            <Button variant="ghost" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
              <CalendarDays className="h-4 w-4" />
              Ver Todas
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex w-full max-w-full gap-3 overflow-hidden">
            <Skeleton className="h-[310px] min-w-[85vw] rounded-3xl bg-zinc-800 md:min-w-[360px]" />
            <Skeleton className="h-[310px] min-w-[85vw] rounded-3xl bg-zinc-800 md:min-w-[360px]" />
          </div>
        ) : openListBookingsThisMonth.length === 0 ? (
          <Card className="border-dashed border-zinc-800 bg-zinc-900">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Calendar className="h-9 w-9 text-zinc-600" />
              <p className="text-base font-medium text-white">Nenhuma partida com lista aberta este mes</p>
              <p className="max-w-lg text-sm text-zinc-400">
                Assim que uma turma liberar lista, ela aparece aqui para você confirmar em segundos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <HorizontalScroll>
            {openListBookingsThisMonth.map((booking) => {
              const invite = myInvites.find((entry) => entry.booking_id === booking._id)
              const group = booking.associated_group_id ? groupsById.get(booking.associated_group_id) : null
              const isListFull = booking.players.length >= booking.max_players
              const userInList = booking.players.some((player) => {
                const playerId = getPlayerId(player)
                return playerId === user?._id || playerId === user?.id
              })

              return (
                <div key={booking._id} className="flex-shrink-0 w-[min(85vw,430px)] snap-center">
                  <BookingCard
                    booking={booking}
                    isToday={isSameDay(parseISO(booking.start_time), now)}
                    invite={invite}
                    isListFull={isListFull}
                    userInList={userInList}
                    isGroupAdmin={false}
                    headerTitle={`${formatCompactBookingDate(booking.start_time)} • ${formatBookingTime(booking.start_time)}`}
                    headerRightBadge={(
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[0.76rem] font-medium text-zinc-100 backdrop-blur-md">
                        <Users className="h-3.5 w-3.5 text-zinc-300" />
                        {group?.name || "Sem turma"}
                      </span>
                    )}
                    headerSubtitle={(
                      <span className="mt-1 flex flex-wrap items-center gap-3 text-sm text-zinc-300">
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-flex items-center [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-zinc-400 shrink-0">
                            {getSportIcon(booking.modality)}
                          </span>
                          {booking.modality || "Sem modalidade"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                          {booking.location?.alt || "Sem quadra"}
                        </span>
                      </span>
                    )}
                    showConfirmedPlayers
                    hideInfoTags
                    playersById={playersById}
                    formatDate={formatBookingDate}
                    formatTime={formatBookingTime}
                    onEditBooking={() => {}}
                    onCancelBooking={() => {}}
                    handlePresence={handlePresence}
                  />
                </div>
              )
            })}
          </HorizontalScroll>
        )}
      </section>

      

      {/* 4. Grupos favoritos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Grupos favoritos</h2>
            <p className="hidden sm:block text-sm text-zinc-400">Acesse seus grupos favoritos!</p>
          </div>
          <Link href="/user/group">
            <Button variant="ghost" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white">
              <Users className="h-4 w-4" />
              Ver Todos
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            <Skeleton className="h-32 w-[180px] flex-shrink-0 rounded-2xl bg-zinc-800" />
            <Skeleton className="h-32 w-[180px] flex-shrink-0 rounded-2xl bg-zinc-800" />
            <Skeleton className="h-32 w-[180px] flex-shrink-0 rounded-2xl bg-zinc-800" />
          </div>
        ) : favoriteGroups.length === 0 ? (
          <Card className="border-dashed border-zinc-800 bg-zinc-900">
            <CardContent className="py-8 text-center text-sm text-zinc-400">Você ainda nao participa de grupos.</CardContent>
          </Card>
        ) : (
          <HorizontalScroll>
            {favoriteGroups.map((group) => (
              <Link key={group._id} href={`/user/group/${group._id}`} className="w-[190px] flex-shrink-0 snap-start">
                <Card className="h-full border-zinc-800 bg-zinc-900 hover:border-green-500/50">
                  <CardContent className="p-3">
                    <div
                      className="h-16 w-full rounded-xl bg-zinc-800"
                      style={
                        group.photo_url
                          ? {
                              backgroundImage: `url(${group.photo_url})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : undefined
                      }
                    />
                    <p className="mt-3 line-clamp-2 text-sm font-semibold text-white">{group.name}</p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {group.modality || "Sem esporte"} • {group.members?.length ?? 0} membros
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </HorizontalScroll>
        )}
      </section>

      
    </div>
  )
}
