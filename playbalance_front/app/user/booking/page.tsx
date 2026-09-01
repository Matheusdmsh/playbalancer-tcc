"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CalendarView } from "@/components/calendar-view"
import { getBookingsByUserId, updateBooking, cancelBooking } from "@/services/bookings"
import { getCurrentUser } from "@/services/users"
import { Booking } from "@/interface/booking"
import { useToast } from "@/components/ui/use-toast"
import { Invite } from "@/interface/invite"
import { User } from "@/interface/users"
import { acceptBookingInvite, declineBookingInvite, getMyBookingInvites } from "@/services/invites"
import { listMyGroups, Group } from "@/services/groups"
import { EditBookingSheet } from "@/components/edit-booking-sheet"
import { CancelBookingDialog } from "@/components/cancel-booking-dialog"


export default function UserReservations() {
  const [selectedMonthDate, setSelectedMonthDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
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

  return (
    <div className="p-6 md:max-w-7xl mx-auto">

      {/* Navegação da agenda mensal */}
      <div className={isLoading ? "hidden" : "flex items-center gap-2"}>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto bg-zinc-800 text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
          onClick={() => {
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            setSelectedMonthDate(firstDayOfMonth);
          }}
        >
          Hoje
        </Button>
      </div>
        {/* Conteúdo principal: loading, lista ou calendário */}
        {isLoading ? (
          <div className="animate-pulse space-y-4 ">
            {/* Skeleton da navegação e do calendário mensal */}
            <div className="flex items-center justify-between gap-2">
              <div className="h-9 w-40 bg-zinc-800/60 rounded" />
              <div className="h-9 w-20 bg-zinc-800/60 rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-8 w-56 bg-zinc-800/60 rounded" />
              <div className="h-[520px] w-full bg-zinc-900/60 rounded-lg" />
            </div>
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

