"use client"

import { useState, useEffect } from "react"
import { History, Flag, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { format as formatDateFns, addDays, startOfWeek, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useIsMobile } from "@/hooks/use-mobile"

import { Booking } from "@/interface/booking"
import { User } from "@/interface/users"

interface BookingHistorySheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookings: Booking[]
  members: User[]
  currentUser: User | null
}

export function BookingHistorySheet({
  open,
  onOpenChange,
  bookings,
  members,
  currentUser,
}: BookingHistorySheetProps) {
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [weekStartIndex, setWeekStartIndex] = useState(0)

  const formatDate = (date: string): string => {
    return formatDateFns(new Date(date), "dd 'de' MMM", {
      locale: ptBR,
    })
  }

  const formatTime = (date: string): string => {
    return formatDateFns(new Date(date), "HH:mm", { locale: ptBR })
  }

  const formatFullDate = (date: string): string => {
    return formatDateFns(new Date(date), "EEEE, d 'de' MMMM", {
      locale: ptBR,
    })
  }

  const getInitials = (name: string): string => {
    const names = name.split(" ")
    return (
      (names[0]?.[0] || "") +
      (names.length > 1 ? names[names.length - 1]?.[0] : "")
    ).toUpperCase()
  }

  const activeBookings = bookings.filter(b => b.status !== 'cancelled')
  const pastBookings = activeBookings
    .filter((b) => new Date(b.start_time) < new Date())
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )
    .reverse()

  // Gerar semana de datas
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
  const monthName = formatDateFns(weekDays[0], "MMM", { locale: ptBR }).toUpperCase()

  // Verificar quais dias têm partidas
  const daysWithBookings = pastBookings.map(b => new Date(b.start_time).toDateString())

  // Filtrar partidas do dia selecionado
  const selectedDateBookings = pastBookings.filter(b => 
    isSameDay(new Date(b.start_time), selectedDate)
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={isMobile
          ? "bg-zinc-900 border-zinc-800 w-full max-w-none min-h-[80vh] max-h-[88vh] rounded-t-2xl overflow-y-auto p-0"
          : "bg-zinc-900 border-zinc-800 w-[360px] sm:max-w-md overflow-y-auto p-0"
        }
      >
        <SheetHeader className="px-6 py-4 border-b border-zinc-800 text-left">
          <div className="flex items-center gap-2">
            <div className="flex gap-4 items-center flex-1">
              <History className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <SheetTitle className="text-left">Histórico de Partidas</SheetTitle>
                <SheetDescription className="text-left text-xs">
                  Todos os partidas realizados
                </SheetDescription>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-6">
          {/* Calendário de Datas */}
          <div className="mb-6 space-y-3">
            {/* Mês e Navegação */}
            <div className="flex items-center justify-between mb-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-green-400"
                onClick={() => setWeekStartIndex(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium text-zinc-300 flex-1 text-center">{monthName}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-green-400"
                onClick={() => setWeekStartIndex(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Dias da Semana */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, idx) => {
                const dayNum = formatDateFns(day, "d")
                const dayName = formatDateFns(day, "EEEEEE", { locale: ptBR })
                const isSelected = isSameDay(day, selectedDate)
                const hasBooking = daysWithBookings.includes(day.toDateString())

                return (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => setSelectedDate(day)}
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-green-600 text-white border-2 border-green-500"
                          : hasBooking
                          ? "bg-green-900/40 border-2 border-green-700/60 text-green-300 hover:bg-green-900/60"
                          : "bg-zinc-800 border-2 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {dayNum}
                    </button>
                    <span className={`text-[10px] uppercase font-medium transition-all ${
                      isSelected
                        ? "text-green-400"
                        : "text-zinc-400"
                    }`}>{dayName}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Partidas do Dia Selecionado */}
          {selectedDateBookings.length > 0 ? (
            <div className="space-y-3">
              {selectedDateBookings.map((booking) => {
                const playersCount = booking.players?.length || 0
                const maxPlayers = booking.max_players || 0

                return (
                  <Card key={booking._id} className="border-zinc-700 bg-zinc-800/50 overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {/* Data e Hora */}
                      <div className="space-y-1">
                        <p className="text-xs text-zinc-400 uppercase font-medium">
                          {formatFullDate(booking.start_time)}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-green-400" />
                          <span>
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </span>
                        </div>
                      </div>

                      {/* Modalidade e Local */}
                      <div className="space-y-1">
                        {booking.modality && (
                          <div className="flex items-center gap-2 text-sm">
                            <Flag className="h-4 w-4 text-zinc-400" />
                            <span className="text-zinc-300">{booking.modality}</span>
                          </div>
                        )}
                        {booking.location?.alt && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-zinc-400" />
                            <span className="text-zinc-300">{booking.location.alt}</span>
                          </div>
                        )}
                      </div>

                      {/* Jogadores */}
                      <div className="pt-2 border-t border-zinc-700">
                        <p className="text-xs text-zinc-400 uppercase font-medium mb-2">
                          Jogadores ({playersCount}/{maxPlayers})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {booking.players && booking.players.length > 0 ? (
                            booking.players.slice(0, 5).map((player: any, idx: number) => {
                              const member = members.find(
                                m => m._id === player.user_id || m.id === player.user_id
                              )
                              return (
                                <Avatar key={idx} className="h-7 w-7 border border-zinc-700">
                                  <AvatarImage src={member?.photo_url} />
                                  <AvatarFallback className="text-[10px]">
                                    {member ? getInitials(member.name) : "?"}
                                  </AvatarFallback>
                                </Avatar>
                              )
                            })
                          ) : (
                            <p className="text-xs text-zinc-500">Sem jogadores registrados</p>
                          )}
                          {booking.players && booking.players.length > 5 && (
                            <div className="h-7 w-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300 font-medium border border-zinc-600">
                              +{booking.players.length - 5}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">Nenhum racha neste dia</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
