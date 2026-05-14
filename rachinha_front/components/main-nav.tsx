"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { UserCircle, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { useState, useEffect, Suspense } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const SPORTS = [
  "Vôlei", "Basquete", "Vôlei de praia", "Beach Tennis", "Futevôlei",
  "Tênis", "Pickleball", "Padel", "Futsal", "Futebol Society",
  "Futebol de Campo", "Handebol", "Queimada"
]

function MainNavContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [sport, setSport] = useState(searchParams?.get("sport") || "")
  const [location, setLocation] = useState(searchParams?.get("location") || "")
  const [date, setDate] = useState(searchParams?.get("date") || "")
  const [time, setTime] = useState(searchParams?.get("time") || "")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Atualiza os states se a URL mudar externamente (ex: pelas pílulas)
  useEffect(() => {
    if (searchParams) {
      if (searchParams.get("sport") !== null) setSport(searchParams.get("sport") || "")
      if (searchParams.get("date") !== null) setDate(searchParams.get("date") || "")
    }
  }, [searchParams])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (sport) params.set("sport", sport)
    if (location) params.set("location", location)
    if (date) params.set("date", date)
    if (time) params.set("time", time)

    setIsSearchOpen(false)
    router.push(`/home?${params.toString()}`)
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <Link href="/home" className="flex items-center gap-2">
          <span className="flex items-center">
            <Image
              src="/assets/logo.svg"
              alt="Logo Rachinha.com"
              width={32}
              height={32}
            />
          </span>
          <span className="text-xl font-bold">
            rachinha<span className="text-green-500">.com</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="border-green-500 text-white hover:bg-green-500/20 hidden md:flex"
            onClick={() => router.push("/rent-out-your-court")}
          >
            Anuncie seu espaço
          </Button>
          <Button variant="ghost" size="icon" className="text-white" onClick={() => router.push("/user/profile")}>
            <UserCircle className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Desktop search bar */}
      <div className="hidden md:flex flex-col md:flex-row items-center gap-2 rounded-full bg-zinc-900 p-2 border border-zinc-800 shadow-xl">
        <div className="flex flex-1 flex-col px-4 py-2">
          <span className="text-sm font-medium text-white mb-1">Esporte</span>
          <Select value={sport || "all"} onValueChange={(val) => setSport(val === "all" ? "" : val)}>
            <SelectTrigger className="w-full bg-transparent border-none text-white focus:ring-0 p-0 h-[24px] shadow-none truncate font-medium">
              <SelectValue placeholder="Qualquer esporte" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800 text-white z-[9999]">
              <SelectItem value="all" className="text-zinc-400">Qualquer esporte</SelectItem>
              {SPORTS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-8 w-px bg-zinc-800 hidden md:block" />
        <div className="flex flex-1 flex-col px-4 py-2">
          <span className="text-sm font-medium text-white mb-1">Onde</span>
          <Input
            type="text"
            placeholder="Ex: Uberaba"
            className="border-none bg-transparent p-0 text-white placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:ring-offset-0 h-[24px]"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div className="h-8 w-px bg-zinc-800 hidden md:block" />
        <div className="flex flex-1 flex-col px-4 py-2">
          <span className="text-sm font-medium text-white mb-1">Check-in</span>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex-1 bg-transparent text-white focus:outline-none font-medium text-sm text-left truncate leading-tight h-[24px]">
                  {date ? format(new Date(date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : <span className="text-zinc-500">Adicionar data</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 text-white z-[9999]" align="start">
                <CalendarComponent
                  mode="single"
                  selected={date ? new Date(date + "T12:00:00") : undefined}
                  onSelect={(d) => setDate(d ? d.toISOString().split("T")[0] : "")}
                />
              </PopoverContent>
            </Popover>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-transparent text-white focus:outline-none font-medium text-sm w-[70px] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
            />
          </div>
        </div>
        <Button size="icon" className="h-12 w-12 shrink-0 rounded-full bg-green-500 text-black hover:bg-green-600" onClick={handleSearch}>
          <Search className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile search bar */}
      <div className="md:hidden flex items-center gap-2">
        <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <SheetTrigger asChild>
            <Button className="w-full bg-zinc-900 text-white justify-between hover:bg-zinc-800">
              <span>Buscar quadras...</span>
              <Search className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh] bg-zinc-900 border-zinc-800 rounded-t-xl">
            <div className="space-y-6 pt-6">
              <div className="space-y-3">
                <span className="text-sm font-medium text-white">Esporte</span>
                <Select value={sport || "all"} onValueChange={(val) => setSport(val === "all" ? "" : val)}>
                  <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white p-3 h-10 shadow-none font-medium">
                    <SelectValue placeholder="Qualquer esporte" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white z-[9999]">
                    <SelectItem value="all" className="text-zinc-400">Qualquer esporte</SelectItem>
                    {SPORTS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-white">Onde</span>
                <Input
                  type="text"
                  placeholder="Ex: Uberaba"
                  className="bg-zinc-800 border-zinc-700 h-10"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-white">Check-in</span>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex-1 bg-zinc-800 border-zinc-700 border text-white p-2 text-left rounded-md focus:outline-none text-sm h-10">
                        {date ? format(new Date(date + "T12:00:00"), "dd/MM/yyyy", { locale: ptBR }) : <span className="text-zinc-500">Selecionar data</span>}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 text-white z-[9999]" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={date ? new Date(date + "T12:00:00") : undefined}
                        onSelect={(d) => setDate(d ? d.toISOString().split("T")[0] : "")}
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-24 bg-zinc-800 border-zinc-700 border text-white p-2 rounded-md focus:outline-none text-sm [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert h-10"
                  />
                </div>
              </div>
              <Button className="w-full bg-green-500 hover:bg-green-600 text-black font-bold h-10" onClick={handleSearch}>
                Buscar
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}

export function MainNav() {
  return (
    <Suspense fallback={<div className="h-20" />}>
      <MainNavContent />
    </Suspense>
  )
}
