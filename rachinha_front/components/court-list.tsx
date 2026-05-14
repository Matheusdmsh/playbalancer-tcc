"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Heart, Loader2, ChevronLeft, ChevronRight, Star, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import api from "@/services/api"
import { PhotoCarousel } from "@/components/photo-carousel"
import { useToast } from "@/components/ui/use-toast"

interface Court {
  _id: string
  id?: string
  name: string
  sports_supported: string[]
  value_per_hour: number
  photos_url: string[]
  characteristics: string[]
  available_hours: { day_of_week: string; start_time: string; end_time: string }[]
  is_active: boolean
}

interface CourtListProps {
  sport?: string
  date?: string
  location?: string
  time?: string
}

const DAY_LABEL: Record<string, string> = {
  monday: "Seg", tuesday: "Ter", wednesday: "Qua",
  thursday: "Qui", friday: "Sex", saturday: "Sáb", sunday: "Dom",
}

const ITEMS_PER_PAGE = 12

export function CourtList({ sport, date, location, time }: CourtListProps) {
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const { toast } = useToast()

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get("/users/me/favorites")
      if (Array.isArray(data)) {
        setFavorites(new Set(data))
      }
    } catch (error) {
      // Ignore if not logged in
    }
  }

  const fetchCourts = useCallback(async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("limit", String(ITEMS_PER_PAGE))
      if (sport) params.set("sport", sport)
      if (date) params.set("date", date)
      if (location) params.set("location", location)
      if (time) params.set("time", time)

      const response = await api.get(`/courts/public/list?${params.toString()}`)
      setCourts(response.data.courts || [])
      setTotal(response.data.total || 0)
    } catch (error) {
      console.error("Erro ao carregar quadras:", error)
      setCourts([])
    } finally {
      setIsLoading(false)
    }
  }, [page, sport, date, location, time])

  useEffect(() => {
    setPage(1)
  }, [sport, date, location, time])

  useEffect(() => {
    fetchCourts()
    fetchFavorites()
  }, [fetchCourts])

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const isFav = favorites.has(id)
    
    // Otimista (UX instantânea)
    setFavorites(prev => {
      const next = new Set(prev)
      if (isFav) next.delete(id)
      else next.add(id)
      return next
    })

    // Sincroniza com backend
    try {
      if (isFav) {
        await api.delete(`/users/me/favorites/${id}`)
      } else {
        await api.post(`/users/me/favorites/${id}`)
      }
    } catch (error: any) {
      // Reverter mudança caso dê erro
      setFavorites(prev => {
        const next = new Set(prev)
        if (isFav) next.add(id) // Volta se deu erro em deletar
        else next.delete(id)    // Remove se deu erro em adicionar
        return next
      })
      // Só avisa se for erro de request de fato e não "não autorizado" não logado
      if (error?.response?.status !== 401) {
        toast({ title: "Erro ao favoritar", variant: "destructive" })
      } else {
        toast({ title: "Faça login para salvar favoritos", variant: "default" })
      }
    }
  }

  const getAvailabilityText = (hours: Court["available_hours"]) => {
    if (!hours || hours.length === 0) return null
    const days = [...new Set(hours.map(h => DAY_LABEL[h.day_of_week] || h.day_of_week))]
    const first = hours[0]
    return `${days.join(", ")}: ${first.start_time.slice(0, 5)} – ${first.end_time.slice(0, 5)}`
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-green-400" />
      </div>
    )
  }

  if (courts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Layers className="h-12 w-12 text-zinc-700" />
        <p className="text-zinc-400 text-lg font-medium">Nenhuma quadra encontrada</p>
        {(sport || date) && (
          <p className="text-zinc-500 text-sm">Tente alterar os filtros de busca</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {courts.map((court) => {
          const courtId = court._id || court.id || ""
          const isFav = favorites.has(courtId)
          const availText = getAvailabilityText(court.available_hours)

          return (
            <div
              key={courtId}
              className="group bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer hover:ring-1 hover:ring-zinc-700 transition-all"
              onClick={() => router.push(`/court/${courtId}`)}
            >
              {/* ── Photo carousel ── */}
              <div className="relative h-44 bg-zinc-800 overflow-hidden">
                <PhotoCarousel photos={court.photos_url} courtName={court.name} />

                {/* Sport badge */}
                {court.sports_supported?.length > 0 && (
                  <div className="absolute top-2 left-2 z-10">
                    <span className="text-xs bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {court.sports_supported[0]}
                    </span>
                  </div>
                )}

                {/* Favourite button */}
                <button
                  className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                  onClick={(e) => toggleFavorite(courtId, e)}
                  aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                  <Heart className={`h-4 w-4 ${isFav ? "fill-red-500 text-red-500" : "text-white"}`} />
                </button>

                {/* Rating */}
                <div className="absolute bottom-8 right-2 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-white">4.8</span>
                </div>
              </div>

              {/* ── Info ── */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-base truncate">{court.name}</h3>

                {availText && (
                  <p className="text-xs text-zinc-400 truncate">{availText}</p>
                )}

                {court.characteristics?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {court.characteristics.slice(0, 2).map(c => (
                      <span key={c} className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-base font-bold">R$ {court.value_per_hour}</span>
                    <span className="text-xs text-zinc-500">/hora</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-xs h-8 px-3"
                    onClick={(e) => { e.stopPropagation(); router.push(`/court/${courtId}`) }}
                  >
                    Reservar
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pb-4">
          <Button
            variant="outline"
            size="icon"
            className="border-zinc-700 hover:bg-zinc-800"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`h-2 rounded-full transition-all ${i + 1 === page ? "w-5 bg-green-400" : "w-2 bg-zinc-600 hover:bg-zinc-500"}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="border-zinc-700 hover:bg-zinc-800"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <span className="text-xs text-zinc-500 ml-2">
            {page}/{totalPages} · {total} quadra{total !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  )
}
