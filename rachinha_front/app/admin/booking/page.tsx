"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Check, Clock, LayoutGrid, LayoutList, Loader2, MapPin, MoreHorizontal, Users, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { AdminCalendarView } from "@/components/admin-calendar-view"
import api from "@/services/api"

interface Booking {
  _id: string;
  court_id: string;
  court_name?: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: string;
  modality?: string;
  notes?: string;
  location?: { street?: string; city?: string; uf?: string; alt?: string; };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendente", color: "bg-yellow-500/20 text-yellow-400" },
  confirmed: { label: "Confirmada", color: "bg-green-500/20 text-green-500" },
  completed: { label: "Concluída", color: "bg-blue-500/20 text-blue-500" },
  cancelled: { label: "Cancelada", color: "bg-red-500/20 text-red-500" },
  rejected:  { label: "Rejeitada", color: "bg-red-500/20 text-red-400" },
}

function formatDateTime(isoString: string) {
  const d = new Date(isoString)
  const date = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return { date, time }
}

export default function AdminReservations() {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/bookings/admin/court-bookings')
      setBookings(response.data || [])
    } catch (error) {
      toast({ title: "Erro ao carregar reservas", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === "all") return true
    return b.status === activeTab
  })

  const handleApprove = async (booking: Booking) => {
    setIsProcessing(true)
    try {
      await api.put(`/bookings/${booking._id}/approve`)
      toast({ title: "Reserva aprovada!", description: "O usuário foi notificado." })
      fetchBookings()
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.response?.data?.detail || (error as Error).message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenReject = (booking: Booking) => {
    setSelectedBooking(booking)
    setRejectReason("")
    setIsRejectDialogOpen(true)
  }

  const handleReject = async () => {
    if (!selectedBooking) return
    setIsProcessing(true)
    try {
      await api.put(`/bookings/${selectedBooking._id}/reject`, { reason: rejectReason })
      toast({ title: "Reserva rejeitada." })
      setIsRejectDialogOpen(false)
      fetchBookings()
    } catch (error: any) {
      toast({ title: "Erro ao rejeitar", description: error.response?.data?.detail || (error as Error).message, variant: "destructive" })
    } finally {
      setIsProcessing(false)
    }
  }

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Reservas</h2>
          {counts.pending > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 font-medium animate-pulse">
              {counts.pending} pendente{counts.pending > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="icon" onClick={() => setViewMode("list")} className={viewMode === "list" ? "bg-green-500 hover:bg-green-600" : "border-zinc-700 hover:bg-zinc-800"}>
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "calendar" ? "default" : "outline"} size="icon" onClick={() => setViewMode("calendar")} className={viewMode === "calendar" ? "bg-green-500 hover:bg-green-600" : "border-zinc-700 hover:bg-zinc-800"}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-800 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all">Todas ({counts.all})</TabsTrigger>
          <TabsTrigger value="pending">
            <span className="flex items-center gap-1.5">
              Pendentes ({counts.pending})
              {counts.pending > 0 && <span className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />}
            </span>
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmadas ({counts.confirmed})</TabsTrigger>
          <TabsTrigger value="completed">Concluídas ({counts.completed})</TabsTrigger>
          <TabsTrigger value="cancelled">Canceladas ({counts.cancelled})</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-green-400" />
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-zinc-500">Nenhuma reserva encontrada.</p>
            </div>
          ) : (
            filteredBookings.map((booking) => {
              const { date, time } = formatDateTime(booking.start_time)
              const { time: endTime } = formatDateTime(booking.end_time)
              const statusCfg = STATUS_CONFIG[booking.status] || { label: booking.status, color: "bg-zinc-700 text-zinc-300" }

              return (
                <Card key={booking._id} className={`bg-zinc-900 border-zinc-800 transition-all ${booking.status === 'pending' ? 'ring-1 ring-yellow-500/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{booking.court_name || "Quadra"}</h3>
                        {booking.modality && <p className="text-sm text-zinc-400">{booking.modality}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                            {booking.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleApprove(booking)} className="text-green-400">
                                  <Check className="mr-2 h-4 w-4" /> Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleOpenReject(booking)} className="text-red-400">
                                  <X className="mr-2 h-4 w-4" /> Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            {booking.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleOpenReject(booking)} className="text-red-400">
                                <X className="mr-2 h-4 w-4" /> Cancelar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                        <span>{date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Clock className="h-4 w-4 text-zinc-500" />
                        <span>{time} – {endTime}</span>
                      </div>
                      {booking.location && (
                        <div className="flex items-center gap-2 text-zinc-400 md:col-span-2">
                          <MapPin className="h-4 w-4 text-zinc-500" />
                          <span>{booking.location.alt || [booking.location.street, booking.location.city, booking.location.uf].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      {booking.notes && (
                        <div className="md:col-span-2 bg-zinc-800/50 rounded-lg px-3 py-2 text-xs text-zinc-400">
                          <span className="font-medium text-zinc-300">Observações: </span>{booking.notes}
                        </div>
                      )}
                    </div>

                    {booking.status === 'pending' && (
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-500 hover:bg-green-600 gap-1.5"
                          onClick={() => handleApprove(booking)}
                          disabled={isProcessing}
                        >
                          <Check className="h-4 w-4" /> Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-800 text-red-400 hover:bg-red-950 gap-1.5"
                          onClick={() => handleOpenReject(booking)}
                          disabled={isProcessing}
                        >
                          <X className="h-4 w-4" /> Rejeitar
                        </Button>
                      </div>
                    )}
                    {booking.status === 'confirmed' && (
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-800"
                          onClick={() => window.location.href = `/admin/chat`}>
                          Chat da Reserva
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      ) : (
        <AdminCalendarView
          reservations={filteredBookings.map(b => ({
            id: b._id,
            courtName: b.court_name || 'Quadra',
            courtId: b.court_id,
            userName: b.user_id,
            date: new Date(b.start_time).toLocaleDateString('pt-BR'),
            time: `${formatDateTime(b.start_time).time} - ${formatDateTime(b.end_time).time}`,
            location: b.location?.alt || '',
            price: '',
            participants: 0,
            status: b.status,
            dateObj: new Date(b.start_time),
          }))}
          onStatusChange={() => {}}
          onCancel={() => {}}
        />
      )}

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Rejeitar Reserva</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição (opcional). O usuário será notificado.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo da rejeição..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            className="bg-zinc-800 border-zinc-700 resize-none"
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
