"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  History,
  ClipboardList,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Users,
  Flag,
  MapPin,
  Clock,
  Calendar,
} from "lucide-react";
import { format as formatDateFns } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getGroupById, Group } from "@/services/groups";
import { getBookingsByGroupId } from "@/services/bookings";
import { getUsersByIds, getCurrentUser } from "@/services/users";
import { Booking } from "@/interface/booking";
import { User } from "@/interface/users";
import { SportIcons } from "@/components/sport-icons";
import { EditBookingSheet } from "@/components/edit-booking-sheet";
import { CancelBookingDialog } from "@/components/cancel-booking-dialog";
import { cancelBooking } from "@/services/bookings";

export default function GroupHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const groupId = params.id as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchData = async () => {
    try {
      const user = await getCurrentUser();
      if (user) setCurrentUser(user);

      const groupData = await getGroupById(groupId);
      setGroup(groupData);

      const bookingsData = await getBookingsByGroupId(groupId);
      setBookings(bookingsData);

      if (groupData.members && groupData.members.length > 0) {
        const memberIds = groupData.members.map(m => m._id || m.id).filter(Boolean);
        if (memberIds.length > 0) {
          const membersData = await getUsersByIds(memberIds);
          setMembers(membersData);
        }
      }

      setError(null);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados da turma");
      toast({
        title: "Erro",
        description: err.message || "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const formatDate = (date: string): string => {
    return formatDateFns(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", {
      locale: ptBR,
    });
  };

  const formatTime = (date: string): string => {
    return formatDateFns(new Date(date), "HH:mm", { locale: ptBR });
  };

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
      toast({
        title: "Sucesso!",
        description: "O racha foi cancelado.",
      });
      fetchData();
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

  const getInitials = (name: string): string => {
    const names = name.split(" ");
    return (
      (names[0]?.[0] || "") +
      (names.length > 1 ? names[names.length - 1]?.[0] : "")
    ).toUpperCase();
  };

  const formatRecurrence = (days?: string[] | null): string => {
    if (!days || days.length === 0) return ""
    const abbreviations: { [key: string]: string } = {
      'segunda': 'seg',
      'terça': 'ter',
      'quarta': 'qua',
      'quinta': 'qui',
      'sexta': 'sex',
      'sábado': 'sab',
      'domingo': 'dom'
    }
    return days.map(day => abbreviations[day.toLowerCase()] || day).join(", ")
  }

  const activeBookings = bookings.filter(b => b.status !== 'cancelled');
  const pastBookings = activeBookings
    .filter((b) => new Date(b.start_time) < new Date())
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-4">Carregando histórico...</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="flex flex-col justify-center items-center h-screen text-red-500">
        <p>{error || "Turma não encontrada."}</p>
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

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Histórico de Partidas</h1>
            <p className="text-zinc-400">{group.name}</p>
          </div>
        </header>

        <Separator />

        <main>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="text-green-500" />
                Histórico de Partidas ({pastBookings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pastBookings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastBookings.map((booking) => (
                    <Card
                      key={booking._id}
                      className="bg-zinc-900 border-green-700 hover:border-green-500 transition-all duration-300 flex flex-col overflow-hidden"
                    >
                      {/* Menu */}
                      {booking.owner_id === currentUser?._id && (
                        <div className="absolute top-2 right-2 z-10">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-zinc-900/80 hover:bg-zinc-800">
                                    <MoreVertical className="h-4 w-4 text-white" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-zinc-800 border-zinc-700 text-white"
                                >
                                  <DropdownMenuItem 
                                    className="hover:bg-zinc-700 cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleEditBooking(booking);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Editar Racha</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-500 hover:!text-red-500 hover:!bg-red-900/50 cursor-pointer"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleCancelBookingClick(booking);
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Cancelar Racha</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                        )}

                        {/* Header com data */}
                        <CardHeader className="pb-3 pt-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="flex flex-col justify-center flex-1 min-w-0">
                              <CardTitle className="text-base">{formatDate(booking.start_time)}</CardTitle>
                              <p className="text-sm text-zinc-400">
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </p>
                            </div>
                          </div>
                        </CardHeader>

                        {/* Tags com informações */}
                        <div className="border-t border-zinc-700/50 mt-2 pt-3 px-6"></div>
                        <CardContent className="flex-grow pb-4 pt-2">
                          <div className="flex flex-wrap gap-2">
                            {/* Tag de modalidade */}
                            {booking.modality && (
                              <div className="bg-green-900/40 border border-green-700/60 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                                <Flag className="h-3 w-3 text-green-400" />
                                <span className="text-green-200">{booking.modality}</span>
                              </div>
                            )}

                            {/* Tag de local */}
                            {booking.location?.alt && (
                              <div className="bg-green-900/40 border border-green-700/60 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-green-400" />
                                <span className="text-green-200">{booking.location.alt}</span>
                              </div>
                            )}

                            {/* Tag de horário */}
                            <div className="bg-green-900/40 border border-green-700/60 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3 text-green-400" />
                              <span className="text-green-200">{formatTime(booking.start_time)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 text-center py-8">
                  Nenhum racha no histórico.
                </p>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* --- Modais --- */}
      <EditBookingSheet
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        booking={bookingToEdit}
        onBookingUpdated={() => {
          fetchData();
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
    </>
  );
}
