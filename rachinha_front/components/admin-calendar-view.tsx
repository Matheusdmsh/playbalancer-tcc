"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export function AdminCalendarView({
  reservations,
  onStatusChange,
  onCancel,
}: {
  reservations: any[]
  onStatusChange: (reservation: any) => void
  onCancel: (reservation: any) => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<Date[]>([])
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Gerar os dias do calendário para o mês atual
  useEffect(() => {
    const days = generateCalendarDays(currentDate)
    setCalendarDays(days)
  }, [currentDate])

  // Função para gerar os dias do calendário
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()

    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1)
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0)

    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, etc.)
    const firstDayOfWeek = firstDay.getDay()

    // Array para armazenar todos os dias que serão exibidos no calendário
    const days: Date[] = []

    // Adicionar dias do mês anterior para completar a primeira semana
    const daysFromPrevMonth = firstDayOfWeek
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = new Date(year, month, -i)
      days.push(day)
    }

    // Adicionar todos os dias do mês atual
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const day = new Date(year, month, i)
      days.push(day)
    }

    // Adicionar dias do próximo mês para completar a última semana
    const remainingDays = 42 - days.length // 6 semanas * 7 dias = 42
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i)
      days.push(day)
    }

    return days
  }

  // Função para navegar para o mês anterior
  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  // Função para navegar para o próximo mês
  const goToNextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  // Função para formatar o nome do mês e ano
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  // Função para verificar se uma data é hoje
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Função para verificar se uma data é do mês atual
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  // Função para obter as reservas de um dia específico
  const getDayReservations = (day: Date) => {
    return reservations.filter((reservation) => {
      const reservationDate = reservation.dateObj
      return (
        reservationDate.getDate() === day.getDate() &&
        reservationDate.getMonth() === day.getMonth() &&
        reservationDate.getFullYear() === day.getFullYear()
      )
    })
  }

  // Função para abrir o modal de detalhes da reserva
  const openReservationDetails = (reservation: any) => {
    setSelectedReservation(reservation)
    setIsDetailsOpen(true)
  }

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/20 text-green-500"
      case "completed":
        return "bg-blue-500/20 text-blue-500"
      case "cancelled":
        return "bg-red-500/20 text-red-500"
      default:
        return "bg-zinc-500/20 text-zinc-500"
    }
  }

  // Função para obter o texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmada"
      case "completed":
        return "Concluída"
      case "cancelled":
        return "Cancelada"
      default:
        return "Desconhecido"
    }
  }

  // Nomes dos dias da semana
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{formatMonthYear(currentDate)}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousMonth}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(new Date())}
            className="border-zinc-700 hover:bg-zinc-800"
          >
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth} className="border-zinc-700 hover:bg-zinc-800">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        {/* Cabeçalho com os dias da semana */}
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {weekDays.map((day, index) => (
            <div key={index} className="p-2 text-center text-sm font-medium text-zinc-400">
              {day}
            </div>
          ))}
        </div>

        {/* Grade do calendário */}
        <div className="grid grid-cols-7 grid-rows-6 h-[800px]">
          {calendarDays.map((day, index) => {
            const dayReservations = getDayReservations(day)
            console.log(`Day: ${day.toDateString()}, Reservations:`, dayReservations.length)
            const isCurrentMonthDay = isCurrentMonth(day)

            return (
              <div
                key={index}
                className={`border-r border-b border-zinc-800 p-1 relative ${
                  isCurrentMonthDay ? "bg-zinc-900" : "bg-zinc-950 opacity-50"
                } ${isToday(day) ? "bg-zinc-800" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-sm font-medium p-1 rounded-full w-7 h-7 flex items-center justify-center ${
                      isToday(day) ? "bg-green-500 text-white" : ""
                    } ${!isCurrentMonthDay ? "text-zinc-600" : ""}`}
                  >
                    {day.getDate()}
                  </span>
                  {isCurrentMonthDay && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 hover:opacity-100 hover:bg-zinc-800"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                {/* Reservas do dia */}
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
                  {dayReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate ${getStatusColor(reservation.status)}`}
                      onClick={() => openReservationDetails(reservation)}
                    >
                      {reservation.time.split(" - ")[0]} - {reservation.courtName} ({reservation.userName})
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Modal de detalhes da reserva */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedReservation.courtName}</h3>
                  <p className="text-sm text-zinc-400">Reservado por: {selectedReservation.userName}</p>
                </div>
                <Badge variant="outline" className={getStatusColor(selectedReservation.status)}>
                  {getStatusText(selectedReservation.status)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Data</p>
                  <p className="text-sm text-zinc-400">{selectedReservation.date}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Horário</p>
                  <p className="text-sm text-zinc-400">{selectedReservation.time}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Local</p>
                  <p className="text-sm text-zinc-400">{selectedReservation.location}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Participantes</p>
                  <p className="text-sm text-zinc-400">{selectedReservation.participants} pessoas</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Valor</p>
                  <p className="text-sm text-zinc-400">{selectedReservation.price}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button
                  variant="outline"
                  className="border-zinc-700 hover:bg-zinc-800"
                  onClick={() => {
                    setIsDetailsOpen(false)
                    onStatusChange(selectedReservation)
                  }}
                >
                  Alterar status
                </Button>
                {selectedReservation.status === "confirmed" && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailsOpen(false)
                      onCancel(selectedReservation)
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
