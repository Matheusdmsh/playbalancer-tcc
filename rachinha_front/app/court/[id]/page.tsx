"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Calendar, ChevronLeft, Clock, ExternalLink, Heart, Info,
  Loader2, MapPin, Star, TriangleAlert, CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { MainNav } from "@/components/main-nav"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PhotoCarousel } from "@/components/photo-carousel"
import { useToast } from "@/components/ui/use-toast"
import api from "@/services/api"
import 'leaflet/dist/leaflet.css'

const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

const DAY_LABEL_MAP: Record<string, string> = {
  monday: "Seg", tuesday: "Ter", wednesday: "Qua",
  thursday: "Qui", friday: "Sex", saturday: "Sáb", sunday: "Dom",
}

interface AvailableHour { day_of_week: string; start_time: string; end_time: string; }
interface Court {
  _id: string; id?: string; name: string; description: string;
  sports_supported: string[]; value_per_hour: number; value_per_half_hour?: number;
  photos_url: string[]; characteristics: string[]; capacity?: number;
  is_active: boolean; belong_arena: string; available_hours: AvailableHour[];
}
interface Arena {
  _id: string; id?: string; name: string;
  location: { latitude?: number; longitude?: number; street?: string; neighborhood?: string; city?: string; uf?: string; alt?: string; };
}

export default function CourtDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const courtId = params?.id as string

  const [court, setCourt] = useState<Court | null>(null)
  const [arena, setArena] = useState<Arena | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedStartTime, setSelectedStartTime] = useState<string | null>(null)
  const [selectedEndTime, setSelectedEndTime] = useState<string | null>(null)
  const [selectedModality, setSelectedModality] = useState<string>("Futebol Society")
  const [isBooking, setIsBooking] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const [activePhoto, setActivePhoto] = useState(0)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)

  const MapView = useMemo(() => dynamic(() => import('@/components/map-picker').then(m => {
    // Use read-only view mode
    return { default: m.default }
  }), { ssr: false, loading: () => <div className="h-full bg-zinc-800 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-green-400" /></div> }), [])

  useEffect(() => {
    const fetchCourt = async () => {
      if (!courtId) return
      try {
        setIsLoading(true)
        const response = await api.get(`/courts/public/${courtId}`)
        const courtData = response.data
        setCourt(courtData)
        setSelectedModality(courtData.sports_supported?.[0] || "Futebol")

        // Fetch arena info
        if (courtData.belong_arena) {
          try {
            const arenaRes = await api.get(`/arenas/public/${courtData.belong_arena}`)
            setArena(arenaRes.data)
          } catch { /* arena info not critical */ }
        }
      } catch (error) {
        toast({ title: "Erro ao carregar quadra", description: (error as Error).message, variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchCourt()
  }, [courtId, toast])

  useEffect(() => {
    let isActive = true

    const fetchSlots = async () => {
      if (!courtId || !date) return
      setLoadingSlots(true)
      setSelectedStartTime(null)
      setSelectedEndTime(null)
      try {
        const dateStr = date.toISOString().split('T')[0]
        const response = await api.get(`/courts/${courtId}/available-slots?search_date=${dateStr}`)
        if (isActive) {
          const slots: string[] = response.data?.available_slots || []
          setAvailableSlots(Array.from(new Set(slots)).sort())
        }
      } catch {
        if (isActive) {
          setAvailableSlots([])
        }
      } finally {
        if (isActive) {
          setLoadingSlots(false)
        }
      }
    }
    fetchSlots()

    return () => {
      isActive = false
    }
  }, [courtId, date])

  const availableDays = useMemo(() => {
    if (!court) return []
    return court.available_hours.map(h => DAY_MAP[h.day_of_week])
  }, [court])

  const isDateDisabled = (d: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (d < today) return true
    if (availableDays.length === 0) return false
    return !availableDays.includes(d.getDay())
  }

  const handleBook = async () => {
    if (!selectedStartTime || !selectedEndTime || !date || !court) {
      toast({ title: "Selecione data e horário", variant: "destructive" })
      return
    }
    setIsBooking(true)
    try {
      const dateStr = date.toISOString().split('T')[0]
      const startISO = `${dateStr}T${selectedStartTime}:00:00.000Z`
      const endISO = `${dateStr}T${selectedEndTime}:00:00.000Z`

      await api.post('/bookings/court-request', {
        court_id: court._id || court.id,
        start_time: startISO,
        end_time: endISO,
        modality: selectedModality,
      })
      setBookingSuccess(true)
      toast({
        title: "Solicitação enviada!",
        description: "Aguarde a confirmação do administrador.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar reserva",
        description: error.response?.data?.detail || (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsBooking(false)
    }
  }

  const getGoogleMapsUrl = () => {
    if (!arena?.location) return "#"
    const { latitude, longitude, street, city, uf } = arena.location
    if (latitude && longitude) return `https://www.google.com/maps?q=${latitude},${longitude}`
    const address = [street, city, uf].filter(Boolean).join(', ')
    return `https://www.google.com/maps/search/${encodeURIComponent(address)}`
  }

  const getAddress = () => {
    if (!arena?.location) return "Endereço não disponível"
    const l = arena.location
    return [l.street, l.neighborhood, l.city, l.uf].filter(Boolean).join(', ')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-400" />
      </div>
    )
  }

  if (!court) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4">
          <MainNav />
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <TriangleAlert className="h-12 w-12 text-zinc-600" />
            <p className="text-zinc-400">Quadra não encontrada.</p>
            <Button variant="outline" onClick={() => router.back()}>Voltar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4">
        <MainNav />

        <div className="my-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4 text-zinc-400 hover:text-white">
            <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
          </Button>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Esquerda: Fotos + Info */}
            <div className="flex-1 min-w-0">
              {/* Foto Principal */}
              <div className="relative rounded-2xl overflow-hidden mb-3">
                <button className="relative w-full h-[380px] block" onClick={() => setIsGalleryOpen(true)}>
                  <Image
                    src={court.photos_url?.[activePhoto] || "/placeholder.svg?height=600&width=1200"}
                    alt={court.name}
                    fill
                    className="w-full h-full object-cover"
                  />
                  {/* Subtle overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                </button>
                <button
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  onClick={() => setIsFavorited(f => !f)}
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-white"}`} />
                </button>
                {court.photos_url?.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {court.photos_url.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`h-1.5 rounded-full transition-all ${i === activePhoto ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Miniaturas */}
              {court.photos_url?.length > 1 && (
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {court.photos_url.slice(0, 4).map((photo, i) => {
                    const isLast = i === 3
                    const hasMore = court.photos_url.length > 4

                    return (
                      <button 
                        key={i} 
                        onClick={() => {
                          if (isLast && hasMore) {
                            setIsGalleryOpen(true)
                          } else {
                            setActivePhoto(i)
                            setIsGalleryOpen(true)
                          }
                        }} 
                        className={`relative rounded-lg overflow-hidden aspect-video ring-2 transition-all group ${i === activePhoto ? 'ring-green-500' : 'ring-transparent hover:ring-zinc-600'}`}
                      >
                        <Image src={photo} alt={`Foto ${i + 1}`} fill className="object-cover" />
                        
                        {/* +N Overlay */}
                        {isLast && hasMore && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">+{court.photos_url.length - 4}</span>
                          </div>
                        )}
                        
                        {/* Hover Overlay */}
                        {(!isLast || !hasMore) && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Gallery Dialog */}
              <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                <DialogContent className="max-w-[1000px] h-[80vh] p-0 bg-black border-zinc-800 shadow-2xl overflow-hidden [&>button]:hidden">
                  <DialogTitle className="sr-only">Galeria de Fotos</DialogTitle>
                  <DialogDescription className="sr-only">Visualização de todas as fotos da quadra</DialogDescription>
                  <div className="relative w-full h-full bg-black">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/80 rounded-full"
                      onClick={() => setIsGalleryOpen(false)}
                    >
                      X
                    </Button>
                    <PhotoCarousel photos={court.photos_url} courtName={court.name} initialIndex={activePhoto} />
                  </div>
                </DialogContent>
              </Dialog>

              {/* Título */}
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 className="text-2xl font-bold">{court.name}</h1>
                  <div className="flex items-center gap-1 text-yellow-400 shrink-0">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                </div>
                {arena && (
                  <p className="text-zinc-400 text-sm flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {getAddress()}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mt-3">
                  {court.sports_supported?.map(sport => (
                    <Badge key={sport} className="bg-green-500/15 text-green-400 border-green-500/30">{sport}</Badge>
                  ))}
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="info">
                <TabsList className="w-full grid grid-cols-3 bg-zinc-900">
                  <TabsTrigger value="info">
                    <Info className="h-3.5 w-3.5 mr-1.5" /> Informações
                  </TabsTrigger>
                  <TabsTrigger value="availability">
                    <Clock className="h-3.5 w-3.5 mr-1.5" /> Disponibilidade
                  </TabsTrigger>
                  <TabsTrigger value="location">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" /> Localização
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="mt-6 space-y-6">
                  {court.description && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">Descrição</h3>
                      <p className="text-zinc-400 text-sm leading-relaxed">{court.description}</p>
                    </div>
                  )}
                  {court.characteristics?.length > 0 && (
                    <div>
                      <h3 className="text-base font-semibold mb-3">Características</h3>
                      <div className="flex flex-wrap gap-2">
                        {court.characteristics.map(char => (
                          <span key={char} className="text-xs bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full">
                            {char}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {court.capacity && (
                    <div>
                      <h3 className="text-base font-semibold mb-2">Capacidade</h3>
                      <p className="text-zinc-400 text-sm">Até {court.capacity} pessoas</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="availability" className="mt-6">
                  <h3 className="text-base font-semibold mb-3">Dias e Horários Disponíveis</h3>
                  <div className="space-y-2">
                    {court.available_hours?.map((hour, i) => (
                      <div key={i} className="flex items-center justify-between bg-zinc-900 rounded-lg px-4 py-3">
                        <span className="text-sm font-medium text-zinc-300">{DAY_LABEL_MAP[hour.day_of_week] || hour.day_of_week}</span>
                        <span className="text-sm text-zinc-400">{hour.start_time.slice(0, 5)} – {hour.end_time.slice(0, 5)}</span>
                      </div>
                    ))}
                    {court.available_hours?.length === 0 && (
                      <p className="text-zinc-500 text-sm">Horários não informados.</p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="location" className="mt-6 space-y-4">
                  {arena?.location && (
                    <>
                      <p className="text-zinc-300 text-sm">{getAddress()}</p>
                      {arena.location.latitude && arena.location.longitude ? (
                        <div className="h-64 rounded-xl overflow-hidden border border-zinc-800">
                          <MapView
                            center={[arena.location.latitude, arena.location.longitude]}
                            onLocationSelect={() => {}}
                            readOnly
                          />
                        </div>
                      ) : (
                        <div className="h-40 bg-zinc-900 rounded-xl flex items-center justify-center">
                          <p className="text-zinc-500 text-sm">Coordenadas não disponíveis</p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full border-zinc-700 hover:bg-zinc-800 gap-2"
                        onClick={() => window.open(getGoogleMapsUrl(), '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir no Google Maps
                      </Button>
                    </>
                  )}
                  {!arena && <p className="text-zinc-500 text-sm">Localização não disponível.</p>}
                </TabsContent>
              </Tabs>
            </div>

            {/* Direita: Reserva */}
            <div className="w-full lg:w-[360px] shrink-0">
              <div className="sticky top-4">
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardContent className="p-6 space-y-5">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">R$ {court.value_per_hour}</span>
                        <span className="text-zinc-400 text-sm">/hora</span>
                      </div>
                      {court.value_per_half_hour && (
                        <p className="text-xs text-zinc-500">R$ {court.value_per_half_hour}/meia hora</p>
                      )}
                    </div>

                    {bookingSuccess ? (
                      <div className="text-center py-6 space-y-3">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                        <p className="font-semibold text-green-400">Solicitação enviada!</p>
                        <p className="text-sm text-zinc-400">Aguarde a aprovação do administrador. Você será notificado.</p>
                        <Button variant="outline" className="w-full border-zinc-700" onClick={() => setBookingSuccess(false)}>
                          Fazer outra reserva
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Esporte */}
                        {court.sports_supported?.length > 1 && (
                          <div className="space-y-2">
                            <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Modalidade</label>
                            <Select value={selectedModality} onValueChange={setSelectedModality}>
                              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-zinc-900 border-zinc-800">
                                {court.sports_supported.map(sport => (
                                  <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Calendário */}
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" /> Data
                          </label>
                          <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-2">
                            <CalendarComponent
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                            />
                          </div>
                        </div>

                        {/* Horários disponíveis */}
                        <div className="space-y-2">
                          <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                            <Clock className="h-3 w-3" /> Início
                          </label>
                          {loadingSlots ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                            </div>
                          ) : availableSlots.length === 0 ? (
                            <p className="text-zinc-500 text-sm text-center py-2">Sem horários disponíveis nesta data</p>
                          ) : (
                            <div className="grid grid-cols-4 gap-1.5">
                              {availableSlots.map(slot => (
                                <button
                                  key={slot}
                                  onClick={() => {
                                    setSelectedStartTime(slot)
                                    // Auto set end time +1h
                                    const [h, m] = slot.split(':').map(Number)
                                    const endH = h + 1
                                    setSelectedEndTime(`${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
                                  }}
                                  className={`text-xs py-1.5 rounded-lg border transition-all ${selectedStartTime === slot ? 'bg-green-500 border-green-500 text-white font-medium' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Fim do horário */}
                        {selectedStartTime && (
                          <div className="space-y-2">
                            <label className="text-xs text-zinc-400 uppercase tracking-wider font-medium flex items-center gap-1.5">
                              <Clock className="h-3 w-3" /> Término
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {availableSlots
                                .filter(slot => slot > selectedStartTime)
                                .slice(0, 8)
                                .map(slot => (
                                  <button
                                    key={slot}
                                    onClick={() => setSelectedEndTime(slot)}
                                    className={`text-xs py-1.5 rounded-lg border transition-all ${selectedEndTime === slot ? 'bg-green-500 border-green-500 text-white font-medium' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
                                  >
                                    {slot}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}

                        <Button
                          className="w-full bg-green-500 hover:bg-green-600 font-semibold"
                          disabled={!selectedStartTime || !selectedEndTime || isBooking}
                          onClick={handleBook}
                        >
                          {isBooking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {isBooking ? "Enviando..." : "Solicitar Reserva"}
                        </Button>

                        <p className="text-xs text-zinc-500 text-center">
                          Sua solicitação será analisada pelo administrador
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
