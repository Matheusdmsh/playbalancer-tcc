"use client";

import { useState, useEffect } from "react";
import { useEffect as useLayoutEffect, useState as useResponsiveState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Invite } from "@/interface/invite";

// Quantidade de meses exibidos no menu
function useMonthsMenuCount() {
  const [count, setCount] = useState(6);
  useEffect(() => {
    function handleResize() {
      setCount(window.innerWidth < 640 ? 3 : 6);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return count;
}

interface CalendarViewProps {
  reservations: any[];
  myInvites?: Invite[];
  onPresenceChange?: (bookingId: string, action: "confirm" | "cancel") => void;
  currentDate?: Date;
  onMonthChange?: (date: Date) => void;
}

export function CalendarView({
  reservations,
  myInvites,
  onPresenceChange,
  currentDate: controlledDate,
  onMonthChange,
}: CalendarViewProps) {
  const MONTHS_MENU_COUNT = useMonthsMenuCount();
  // Estado local só se não for controlado
  const [uncontrolledDate, setUncontrolledDate] = useState(new Date());
  const currentDate = controlledDate ?? uncontrolledDate;
  const setCurrentDate = onMonthChange ?? setUncontrolledDate;
  // Estado para o menu customizado de meses
  const [monthMenuStart, setMonthMenuStart] = useState(() => {
    const now = new Date();
    // Sempre começa no início do bloco de MONTHS_MENU_COUNT meses
    return new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % MONTHS_MENU_COUNT), 1);
  });

  // Sempre que currentDate mudar, centraliza o menu de meses para o mês selecionado
  useEffect(() => {
    const centralMonth = currentDate.getMonth();
    const startMonth = centralMonth - (centralMonth % MONTHS_MENU_COUNT);
    setMonthMenuStart(new Date(currentDate.getFullYear(), startMonth, 1));
  }, [currentDate, MONTHS_MENU_COUNT]);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    const days = generateCalendarDays(currentDate);
    setCalendarDays(days);
  }, [currentDate]);

  // Gera lista de meses para o menu customizado
  const getMonthMenu = () => {
    const months = [];
    for (let i = 0; i < MONTHS_MENU_COUNT; i++) {
      const date = new Date(monthMenuStart.getFullYear(), monthMenuStart.getMonth() + i, 1);
      months.push(date);
    }
    return months;
  };

  const handlePrevMonths = () => {
    setMonthMenuStart(prev => new Date(prev.getFullYear(), prev.getMonth() - MONTHS_MENU_COUNT, 1));
  };
  const handleNextMonths = () => {
    setMonthMenuStart(prev => new Date(prev.getFullYear(), prev.getMonth() + MONTHS_MENU_COUNT, 1));
  };
  const handleSelectMonth = (date: Date) => {
    setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
  };
  const generateCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const days: Date[] = [];
    for (let i = firstDayOfWeek; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }
    return days;
  };

  // Removido: goToPreviousMonth, goToNextMonth
  const formatMonthYear = (date: Date) => {
    const mes = date.toLocaleDateString("pt-BR", { month: "short" });
    const ano = date.getFullYear();
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)}/${ano}`;
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const getDayReservations = (day: Date) => {
    return reservations.filter((reservation) => {
      const reservationDate = new Date(reservation.start_time);
      return reservationDate.getDate() === day.getDate() && reservationDate.getMonth() === day.getMonth() && reservationDate.getFullYear() === day.getFullYear();
    });
  };

  const openReservationDetails = (reservation: any) => {
    setSelectedReservation(reservation);
    setIsDetailsOpen(true);
  };

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const invite = myInvites?.find((inv) => inv.booking_id === selectedReservation?._id);
  let buttonState: "confirm" | "cancel" | "disabled" | "not_invited" = "not_invited";
  if (invite && selectedReservation) {
    if (!selectedReservation.status_list) {
      buttonState = "disabled";
    } else if (invite.status === "accepted") {
      buttonState = "cancel";
    } else {
      buttonState = "confirm";
    }
  }
  const isPast = selectedReservation ? new Date(selectedReservation.start_time) < new Date() : false;


  return (
    <div className="space-y-4">
      {/* Menu customizado de meses */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-green-400"
          onClick={handlePrevMonths}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-4">
          {getMonthMenu().map((month, idx) => {
            const isSelected = month.getMonth() === currentDate.getMonth() && month.getFullYear() === currentDate.getFullYear();
            const isCurrentMonth = (() => {
              const today = new Date();
              return month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();
            })();
            return (
              <button
                key={idx}
                onClick={() => handleSelectMonth(month)}
                className={`flex flex-col items-center px-2 py-1 rounded-lg border-2 transition-all min-w-[54px] min-h-[40px] font-semibold text-xs relative
                  ${isSelected ? "bg-green-500/10 text-green-500 border-transparent" : "text-zinc-300 border-transparent hover:bg-zinc-800/60"}
                  ${isCurrentMonth ? "border-green-500/40" : ""}
                `}
                style={{ outline: 'none', padding: '4px 8px' }}
              >
                <span className="text-base font-bold">
                  {month.toLocaleDateString("pt-BR", { month: "short" }).replace('.', '')}
                </span>
                <span className="text-[10px] uppercase tracking-wide">
                  {month.getFullYear()}
                </span>
              </button>
            );
          })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:text-green-400"
          onClick={handleNextMonths}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-800">
          {weekDays.map((day) => (<div key={day} className="p-2 text-center text-sm font-medium text-zinc-400">{day}</div>))}
        </div>
        <div className="grid grid-cols-7 grid-rows-6 h-auto min-h-0 sm:h-[800px]">
          {calendarDays.map((day, index) => {
            const dayReservations = getDayReservations(day);
            const isCurrentMonthDay = isCurrentMonth(day);
            const isTodayDay = isToday(day);
            return (
              <div key={index} className={`border-r border-b border-zinc-800 p-1 relative ${isCurrentMonthDay ? "bg-zinc-900" : "bg-zinc-950 opacity-50"} ${isTodayDay && !isCurrentMonthDay ? "bg-green-100/30" : ""}`} style={{ padding: isTodayDay ? '8px 4px' : '4px 4px' }}>
                <span className={`text-sm font-medium p-1 rounded-full w-7 h-7 flex items-center justify-center relative
                  ${isTodayDay ? "text-green-500" : ""}
                  ${!isCurrentMonthDay ? "text-zinc-600" : ""}`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)]">
                  {dayReservations.map((reservation) => {
                    const isPastEvent = new Date(reservation.start_time) < new Date();
                    return (
                      <div
                        key={reservation._id}
                        className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 truncate ${isPastEvent ? "bg-zinc-700 text-zinc-400" : "bg-green-500/20 text-green-500"}`}
                        onClick={() => openReservationDetails(reservation)}
                      >
                        {reservation.time.split(" - ")[0]} - {reservation.courtName}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold">{selectedReservation.courtName}</h3>
                <p className="text-sm text-zinc-400">{selectedReservation.date}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm font-medium">Horário</p><p className="text-sm text-zinc-400">{selectedReservation.time}</p></div>
                <div><p className="text-sm font-medium">Local</p><p className="text-sm text-zinc-400">{selectedReservation.location}</p></div>
                <div><p className="text-sm font-medium">Participantes</p><p className="text-sm text-zinc-400">{selectedReservation.participants} / {selectedReservation.max_players} pessoas</p></div>
                <div><p className="text-sm font-medium">Valor</p><p className="text-sm text-zinc-400">{selectedReservation.price}</p></div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-zinc-800">
                {isPast ? (
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Fechar</Button>
                ) : (
                  <>
                  {buttonState === "confirm" && onPresenceChange && (
                    <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      onPresenceChange(selectedReservation._id, "confirm");
                      setSelectedReservation({
                      ...selectedReservation,
                      participants: selectedReservation.participants + 1,
                      });
                      setIsDetailsOpen(true);
                    }}
                    >
                    Confirmar Presença
                    </Button>
                  )}
                  {buttonState === "cancel" && onPresenceChange && (
                    <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      onPresenceChange(selectedReservation._id, "cancel");
                      setSelectedReservation({
                      ...selectedReservation,
                      participants: selectedReservation.participants - 1,
                      });
                      setIsDetailsOpen(true);
                    }}
                    >
                    Cancelar Presença
                    </Button>
                  )}
                  {buttonState === "disabled" && (
                    <Button className="w-full bg-zinc-800 text-zinc-400" disabled>Lista não liberada</Button>
                  )}
                  {buttonState === 'not_invited' && (
                    <Button variant="outline" onClick={() => setIsDetailsOpen(true)}>Fechar</Button>
                  )}
                  </>
                )}
                <Button
                  variant="secondary"
                  onClick={() => {
                  window.location.href = `/user/booking/${selectedReservation._id}`;
                  }}
                >
                  Ver mais detalhes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}