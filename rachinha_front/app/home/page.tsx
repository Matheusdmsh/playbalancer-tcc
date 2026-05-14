"use client"

import { useState, useEffect, Suspense } from "react"
import { X } from "lucide-react"
import { SportCategories } from "@/components/sport-categories"
import { CourtList } from "@/components/court-list"
import { MainNav } from "@/components/main-nav"
import { useSearchParams, useRouter } from "next/navigation"

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [selectedSport, setSelectedSport] = useState<string | undefined>(searchParams?.get("sport") || undefined)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(searchParams?.get("date") || undefined)
  const location = searchParams?.get("location") || ""
  const time = searchParams?.get("time") || ""

  useEffect(() => {
    if (searchParams) {
      setSelectedSport(searchParams.get("sport") || undefined)
      setSelectedDate(searchParams.get("date") || undefined)
    }
  }, [searchParams])

  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.push(`/home?${params.toString()}`)
  }

  const hasFilters = !!selectedSport || !!selectedDate || !!location || !!time

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto">
        <MainNav />

        
        {/* Sport category pills — clicking one filters the list */}
        <SportCategories
          selectedSport={selectedSport}
          onSelectSport={(sport) =>
            updateParams({ sport: selectedSport === sport ? undefined : sport })
          }
        />

        {/* Active filter tags & Title */}
        <div className="my-6 space-y-4">
          {hasFilters && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-400 text-sm mr-1">Filtros ativos:</span>
              
              {selectedSport && (
                <span className="flex items-center gap-1.5 text-xs bg-green-500/15 text-green-400 border border-green-500/30 px-3 py-1.5 rounded-full">
                  {selectedSport}
                  <button onClick={() => updateParams({ sport: undefined })} aria-label="Remover esporte" className="hover:bg-green-500/20 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {location && (
                <span className="flex items-center gap-1.5 text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-full">
                  📍 {location}
                  <button onClick={() => updateParams({ location: undefined })} aria-label="Remover local" className="hover:bg-zinc-700 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}

              {selectedDate && (
                <span className="flex items-center gap-1.5 text-xs bg-zinc-800 text-zinc-300 border border-zinc-700 px-3 py-1.5 rounded-full">
                  📅 {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                  {time && ` às ${time}`}
                  <button onClick={() => updateParams({ date: undefined, time: undefined })} aria-label="Remover checkin" className="hover:bg-zinc-700 rounded-full p-0.5 transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}
          
          <h2 className="text-2xl font-bold">Quadras disponíveis</h2>
        </div>

        <CourtList sport={selectedSport} date={selectedDate} location={location} time={time} />
      </div>
    </main>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="h-20 flex" />}>
      <HomeContent />
    </Suspense>
  )
}
