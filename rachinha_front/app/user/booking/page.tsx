"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format as formatDateFns, addDays, startOfWeek, isSameDay } from "date-fns"
import { Calendar, Clock, LayoutGrid, LayoutList, MapPin, MoreHorizontal, ScrollText, Users, Edit, Trash2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CalendarView } from "@/components/calendar-view"
import { getBookingsByUserId, updateBooking, cancelBooking } from "@/services/bookings"
import { getCurrentUser } from "@/services/users"
import { Booking } from "@/interface/booking"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BookingCard } from "@/components/booking-card"
import { Switch } from "@/components/ui/switch"
import { Invite } from "@/interface/invite"
import { User } from "@/interface/users"
import { acceptBookingInvite, declineBookingInvite, getMyBookingInvites } from "@/services/invites"
import { listMyGroups, Group } from "@/services/groups"
import { EditBookingSheet } from "@/components/edit-booking-sheet"
import { CancelBookingDialog } from "@/components/cancel-booking-dialog"
import { parseUTCDate } from "@/lib/utils";
import { BookingCardCompact } from "@/components/booking-card-compact"


export default function UserReservations() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  // Novo estado para o mês selecionado no modo mensal
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [weekStartIndex, setWeekStartIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [isFading, setIsFading] = useState(false)
  const weekDaysRef = useRef<HTMLDivElement>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [groups, setGroups] = useState<Map<string, Group>>(new Map())
  const [myInvites, setMyInvites] = useState<Invite[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchData = async () => {
    try {
      const user = await getCurrentUser()
      setCurrentUser(user)

      const [userBookings, invitesData, groupsData] = await Promise.all([
        getBookingsByUserId(user._id),
        getMyBookingInvites(),
        listMyGroups()
      ]);

      const groupsMap = new Map(groupsData.map(group => [group._id, group]));
      setGroups(groupsMap);

      const activeBookings = userBookings.filter(b => b.status !== 'cancelled');
      setBookings(activeBookings); // Salva os bookings sem conversão aqui
      setMyInvites(invitesData)

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking);
    setIsEditModalOpen(true);
  };

  const handleCancelBookingClick = (booking: Booking) => {
    setBookingToCancel(booking);
    setIsCancelModalOpen(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    setIsCancelling(true);
    try {
      await cancelBooking(bookingToCancel._id);
      toast({ title: "Sucesso!", description: "O racha foi cancelado." });
      fetchData();
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
      fetchData();
    } catch (error: any) {
      toast({
        title: `Erro ao ${action === "confirm" ? "confirmar" : "cancelar"} presença`,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Funções para calendário semanal
  const getWeekDays = () => {
    const baseDate = new Date()
    const firstDayOfWeek = startOfWeek(baseDate, { weekStartsOn: 1 })
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(firstDayOfWeek, i + weekStartIndex * 7))
    }
    return days
  }
  const weekDays = getWeekDays()
  // Lógica para janela de 3 dias no menu semanal
  const selectedIdx = weekDays.findIndex(d => isSameDay(d, selectedDate));
  let visibleDays = [];
  if (selectedIdx <= 0) {
    visibleDays = weekDays.slice(0, 3);
  } else if (selectedIdx >= weekDays.length - 1) {
    visibleDays = weekDays.slice(-3);
  } else {
    visibleDays = weekDays.slice(selectedIdx - 1, selectedIdx + 2);
  }
  const monthName = formatDateFns(weekDays[0], "MMM", { locale: ptBR }).toUpperCase()
  // Verificar quais dias têm rachas
  const daysWithBookings = bookings.map(b => new Date(b.start_time).toDateString())
  // Filtrar rachas do dia selecionado
  const selectedDateBookings = bookings.filter(b => isSameDay(new Date(b.start_time), selectedDate))
  return (
    <div className="p-6 md:max-w-7xl mx-auto">

      {/* MENU DIÁRIO E MENSAL + BOTAO HOJE*/}
      <div className={isLoading ? "hidden" : "flex items-center gap-2"}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode("list")}
          className={viewMode === "list" ? "bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm" : "bg-zinc-800 text-zinc-400 hover:border-green-400 hover:text-green-400"}
        >
          <LayoutList className="h-4 w-4" />
          <span  className={viewMode === "list" ? "ml-2" : "hidden"}>Diário</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setViewMode("calendar")}
          className={viewMode === "calendar" ? "bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm" : "bg-zinc-800 text-zinc-400 hover:border-green-400 hover:text-green-400"}
        >
          <LayoutGrid className="h-4 w-4" />
          <span  className={viewMode === "calendar" ? "ml-2" : "hidden"}>Mensal</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto bg-zinc-800 text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
          onClick={() => {
            const now = new Date();
            if (viewMode === "list") {
              setSelectedDate(now);
              // Centraliza o menu semanal no dia de hoje
              const firstDayOfWeek = startOfWeek(now, { weekStartsOn: 1 });
              const diffDays = Math.floor((now.getTime() - firstDayOfWeek.getTime()) / (1000 * 60 * 60 * 24));
              setWeekStartIndex(Math.floor(diffDays / 7));
            } else {
              // Mensal: seleciona o primeiro dia do mês atual e centraliza o menu de meses
              const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              setSelectedMonthDate(firstDayOfMonth);
            }
          }}
        >
          Hoje
        </Button>
      </div>
      
      <div className={isLoading ? "hidden" : "pt-4"}>
        <div className="flex justify-between items-center ">
          {/* Bloco do calendário semanal só aparece no modo lista */}
          {viewMode === 'list' && (
            <div className="w-full">
              {/* Calendário semanal superior */}
              <div className="mb-8 space-y-3 w-full">
                {/* Navegação */}
                <div className="flex items-center justify-between mb-2 w-full mx-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-green-400"
                    onClick={() => {
                      if (isFading) return;
                      setIsFading(true);
                      setTimeout(() => {
                        setWeekStartIndex(prev => prev - 1);
                        setIsFading(false);
                      }, 150);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="relative flex-1 overflow-hidden max-w-2xl" style={{ minWidth: 0 }}>
                    {/* MOBILE: sempre 3 dias visíveis, janela fluida */}
                    <div className="flex w-full gap-2 overflow-x-auto sm:hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
                      {visibleDays.map((day) => {
                        const dayNum = formatDateFns(day, "d")
                        const dayMonth = formatDateFns(day, "M")
                        const dayName = formatDateFns(day, "EEE", { locale: ptBR })
                        const isSelected = isSameDay(day, selectedDate)
                        const hasBooking = daysWithBookings.includes(day.toDateString())
                        const isCurrentDay = isSameDay(day, new Date())
                        return (
                          <div
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={`relative border-2 border-transparent flex flex-col items-center gap-1 cursor-pointer rounded-lg px-1 py-1 transition-all flex-shrink-0 ${isSelected ? "bg-green-500/10" : "hover:bg-zinc-800/60"} ${isCurrentDay ? "border-2 border-green-500/40" : ""}`}
                            style={{ maxWidth: 90, minWidth: 90 }}
                          >
                            <div className="relative flex flex-col items-center">
                              <span className={`text-base font-bold ${isSelected ? "text-green-500" : "text-zinc-100"}`}>{dayNum}/{dayMonth}</span>
                              <span className={`text-[10px] uppercase font-semibold tracking-wide ${isSelected ? "text-green-500" : "text-zinc-400"}`}>{dayName}</span>
                              {hasBooking && (
                                <span className="absolute -top-1 -right-2 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* DESKTOP: todos os 7 dias */}
                    <div className="hidden sm:flex w-full transition-opacity duration-300 gap-0 justify-between">
                      {weekDays.map((day, idx) => {
                        const dayNum = formatDateFns(day, "d")
                        const dayMonth = formatDateFns(day, "M")
                        const dayName = formatDateFns(day, "EEE", { locale: ptBR })
                        const isSelected = isSameDay(day, selectedDate)
                        const hasBooking = daysWithBookings.includes(day.toDateString())
                        const isCurrentDay = isSameDay(day, new Date())
                        return (
                          <div
                            key={day.toISOString()}
                            onClick={() => setSelectedDate(day)}
                            className={`relative border-2 border-transparent flex flex-col items-center gap-1 cursor-pointer rounded-lg px-1 py-1 transition-all flex-1 ${isSelected ? "bg-green-500/10" : "hover:bg-zinc-800/60"} ${isCurrentDay ? "border-2 border-green-500/40" : ""}`}
                            style={{ maxWidth: 90 }}
                          >
                            <div className="relative flex flex-col items-center">
                              <span className={`text-base font-bold ${isSelected ? "text-green-500" : "text-zinc-100"}`}>{dayNum}/{dayMonth}</span>
                              <span className={`text-[10px] uppercase font-semibold tracking-wide ${isSelected ? "text-green-500" : "text-zinc-400"}`}>{dayName}</span>
                              {hasBooking && (
                                <span className="absolute -top-1 -right-2 w-3 h-3 rounded-full bg-green-500 border-2 border-zinc-900" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-400 hover:text-green-400 flex-shrink-0"
                    onClick={() => {
                      if (isFading) return;
                      setIsFading(true);
                      setTimeout(() => {
                        setWeekStartIndex(prev => prev + 1);
                        setIsFading(false);
                      }, 150);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
        {/* Conteúdo principal: loading, lista ou calendário */}
        {isLoading ? (
          <div className="animate-pulse space-y-4 ">
            {/* Skeleton do menu superior (Diário/Mensal/Hoje) */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-9 w-24 bg-zinc-800/60 rounded" />
              <div className="h-9 w-24 bg-zinc-800/60 rounded" />
              <div className="h-9 w-20 bg-zinc-800/60 rounded" />
            </div>

            {/* Skeleton do seletor de dias/meses */}
            {viewMode === "list" ? (
              <div className="pt-2">
                <div className="h-14 w-full bg-zinc-900/60 rounded-lg" />
              </div>
            ) : (
              <div className="pt-2">
                <div className="h-8 w-56 bg-zinc-800/60 rounded" />
              </div>
            )}

            {viewMode === "list" ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-3">
                    <div className="h-6 w-36 bg-zinc-800/60 rounded" />
                    <div className="h-[420px] w-full bg-zinc-900/60 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-8 w-56 bg-zinc-800/60 rounded" />
                <div className="h-[520px] w-full bg-zinc-900/60 rounded-lg" />
              </div>
            )}
          </div>
        ) : viewMode === "list" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
            {(() => {
              const daysToShow = [addDays(selectedDate, -1), selectedDate, addDays(selectedDate, 1)];
              return daysToShow.map((day, idx) => {
                // MOBILE: só renderiza o dia selecionado
                // DESKTOP: renderiza os 3
                return (
                  <div
                    key={idx}
                    className={`flex flex-col items-center md:col-span-1 md:w-full ${isSameDay(day, selectedDate) ? '' : 'hidden md:flex opacity-60'}`}
                  >
                    <div className={isSameDay(day, selectedDate)
                      ? "text-lg font-bold text-green-500 mb-3"
                      : "text-lg font-semibold text-zinc-400 mb-3"}
                    >
                      {(() => {
                        const dayNum = formatDateFns(day, "d")
                        const dayMonth = formatDateFns(day, "M")
                        const dayName = formatDateFns(day, "EEE", { locale: ptBR })
                        const isYesterday = isSameDay(day, addDays(new Date(), -1))
                        const isToday = isSameDay(day, new Date())
                        const isTomorrow = isSameDay(day, addDays(new Date(), 1))
                        let label = dayName;
                        if (isYesterday) label = "ontem";
                        else if (isToday) label = "hoje";
                        else if (isTomorrow) label = "amanhã";
                        return `${label.charAt(0).toUpperCase() + label.slice(1)}, ${dayNum}/${dayMonth}`;
                      })()}
                    </div>
                    <div className="flex-1 w-full pt-2 flex flex-col gap-y-3">
                      {(() => {
                        const bookingsOfDay = bookings.filter(b => isSameDay(new Date(b.start_time), day))
                        if (bookingsOfDay.length > 0) {
                          return bookingsOfDay.map((reservation, idx2) => {
                            const invite = myInvites.find((inv) => inv.booking_id === reservation._id);
                            const isListFull = reservation.players.length >= reservation.max_players;
                            const userInList = reservation.players.some((p) => {
                              const playerId = p.user_id || p._id;
                              return playerId === currentUser?._id;
                            });
                            const associatedGroup = groups.get(reservation.associated_group_id ?? "");
                            const isGroupAdmin =
                              currentUser?._id === reservation.owner_id ||
                              currentUser?._id === associatedGroup?.owner_id ||
                              Boolean(associatedGroup?.admins?.includes(currentUser?._id ?? ""));
                            const formatDate = (dateString: string) => {
                              const date = new Date(dateString + "Z");
                              return formatDateFns(date, "dd 'de' MMMM", { locale: ptBR });
                            };
                            const formatTime = (dateString: string) => {
                              const date = new Date(dateString + "Z");
                              return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
                            };
                            const groupName = associatedGroup?.name || reservation.modality || "Turma";
                            let buttonState: "confirm" | "cancel" | "disabled" | "not_invited" | "waiting" = "not_invited";
                            if (invite) {
                              if (!reservation.status_list) {
                                buttonState = "disabled";
                              } else if (invite.status === "accepted") {
                                buttonState = "cancel";
                              } else if (isListFull && !userInList) {
                                buttonState = "waiting";
                              } else {
                                buttonState = "confirm";
                              }
                            }
                            return (
                              <BookingCardCompact
                                key={reservation._id}
                                booking={reservation}
                                groupName={groupName}
                                isGroupAdmin={isGroupAdmin}
                                formatDate={formatDate}
                                formatTime={formatTime}
                                onEditBooking={handleEditBooking}
                                onCancelBooking={handleCancelBookingClick}
                                handlePresence={handlePresence}
                                invite={invite}
                                buttonState={buttonState}
                              />
                            );
                          });
                        } else {
                          return <div className="text-xs text-zinc-500 text-center">Sem racha</div>;
                        }
                      })()}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <CalendarView
            reservations={bookings.map(b => {
              const dateObj = new Date(b.start_time + "Z");
              const endDateObj = new Date(b.end_time + "Z");
              return {
                ...b,
                courtName: groups.get(b.associated_group_id ?? "")?.name || b.modality,
                date: dateObj.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
                time: `${dateObj.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })} - ${endDateObj.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}`,
                location: b.location.alt,
                price: `Não informado`,
                participants: b.players.length,
                maxParticipants: b.max_players,
                status: new Date(b.start_time) >= new Date() ? 'upcoming' : 'past'
              };
            })}
            myInvites={myInvites}
            onPresenceChange={handlePresence}
            currentDate={selectedMonthDate}
            onMonthChange={setSelectedMonthDate}
          />
        )}
      <EditBookingSheet isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen} booking={bookingToEdit} onBookingUpdated={() => { fetchData(); setIsEditModalOpen(false); }} />
      <CancelBookingDialog isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={confirmCancelBooking} booking={bookingToCancel} isCancelling={isCancelling} />
    </div>
  );
}

