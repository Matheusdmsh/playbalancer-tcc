"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Building, Clock, DollarSign, Edit, MoreHorizontal, Plus, Trash, Users, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Arena } from "@/interface/arena"
import { Court } from "@/interface/courts"
import { listMyArenas } from "@/services/arena"
import { listCourtsByArena, deleteCourt } from "@/services/courts"
import { CourtForm } from "@/components/court-form"
import { PhotoCarousel } from "@/components/photo-carousel"
import Image from "next/image"

export default function AdminCourts() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialArena = searchParams.get("arena")

  const [arenas, setArenas] = useState<Arena[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [isLoadingArenas, setIsLoadingArenas] = useState(true)
  const [isLoadingCourts, setIsLoadingCourts] = useState(false)
  const [activeArenaId, setActiveArenaId] = useState<string>(initialArena || "")

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)

  const fetchArenas = useCallback(async () => {
    try {
      setIsLoadingArenas(true)
      const data = await listMyArenas()
      setArenas(data)
      if (!activeArenaId && data.length > 0) {
        setActiveArenaId(data[0].id)
      }
    } catch (error) {
      toast({ title: "Erro ao carregar arenas", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsLoadingArenas(false)
    }
  }, [toast, activeArenaId])

  const fetchCourts = useCallback(async (arenaId: string) => {
    if (!arenaId) return
    try {
      setIsLoadingCourts(true)
      const data = await listCourtsByArena(arenaId)
      setCourts(data)
    } catch (error) {
      toast({ title: "Erro ao carregar quadras", description: (error as Error).message, variant: "destructive" })
    } finally {
      setIsLoadingCourts(false)
    }
  }, [toast])

  useEffect(() => {
    fetchArenas()
  }, [])

  useEffect(() => {
    if (activeArenaId) fetchCourts(activeArenaId)
  }, [activeArenaId, fetchCourts])

  const handleOpenDrawer = (court: Court | null) => {
    setSelectedCourt(court)
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
    setTimeout(() => setSelectedCourt(null), 300)
  }

  const handleSuccess = () => {
    handleCloseDrawer()
    if (activeArenaId) fetchCourts(activeArenaId)
  }

  const openDeleteDialog = (court: Court) => {
    setSelectedCourt(court)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteCourt = async () => {
    if (!selectedCourt) return
    try {
      await deleteCourt(selectedCourt.id)
      toast({ title: "Quadra excluída com sucesso!" })
      setIsDeleteDialogOpen(false)
      if (activeArenaId) fetchCourts(activeArenaId)
    } catch (error) {
      toast({ title: "Erro ao excluir quadra", description: (error as Error).message, variant: "destructive" })
    }
  }

  const getDayLabel = (day: string) => {
    const map: Record<string, string> = {
      monday: "Seg", tuesday: "Ter", wednesday: "Qua",
      thursday: "Qui", friday: "Sex", saturday: "Sáb", sunday: "Dom"
    }
    return map[day] || day
  }

  const activeArena = arenas.find(a => a.id === activeArenaId)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Quadras</h2>
        {activeArenaId && (
          <Button className="bg-green-500 hover:bg-green-600" onClick={() => handleOpenDrawer(null)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Quadra
          </Button>
        )}
      </div>

      {isLoadingArenas ? (
        <Skeleton className="h-12 w-full bg-zinc-800" />
      ) : arenas.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 p-8 text-center">
          <Building className="mx-auto h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-zinc-400">Nenhuma arena encontrada. Crie uma arena primeiro.</p>
        </Card>
      ) : (
        <Tabs value={activeArenaId} onValueChange={setActiveArenaId}>
          <TabsList className="bg-zinc-800 flex-wrap h-auto gap-1 p-1">
            {arenas.map((arena) => (
              <TabsTrigger key={arena.id} value={arena.id} className="text-sm">
                {arena.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {arenas.map((arena) => (
            <TabsContent key={arena.id} value={arena.id} className="mt-6">
              {isLoadingCourts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 bg-zinc-800 rounded-xl" />)}
                </div>
              ) : courts.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Layers className="mx-auto h-10 w-10 text-zinc-600" />
                  <p className="text-zinc-400">Nenhuma quadra cadastrada nesta arena.</p>
                  <Button variant="outline" className="border-zinc-700" onClick={() => handleOpenDrawer(null)}>
                    <Plus className="mr-2 h-4 w-4" /> Criar primeira quadra
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courts.map((court) => (
                    <Card key={court.id || court._id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden">
                      {/* Foto */}
                      <div className="relative h-40 bg-zinc-800">
                        <PhotoCarousel photos={court.photos_url} courtName={court.name} />
                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${court.is_active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}>
                            {court.is_active ? 'Ativa' : 'Inativa'}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 bg-black/50 hover:bg-black/70">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                              <DropdownMenuItem onClick={() => handleOpenDrawer(court)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openDeleteDialog(court)} className="text-red-500">
                                <Trash className="mr-2 h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        <div>
                          <h3 className="font-bold text-base">{court.name}</h3>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {court.sports_supported?.slice(0, 2).map(sport => (
                              <Badge key={sport} variant="outline" className="text-xs border-zinc-700 text-zinc-400">{sport}</Badge>
                            ))}
                            {court.sports_supported?.length > 2 && (
                              <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-500">+{court.sports_supported.length - 2}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="h-3 w-3 text-green-400" />
                            <span>R$ {court.value_per_hour}/h</span>
                          </div>
                          {court.capacity && (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3 w-3 text-blue-400" />
                              <span>Até {court.capacity} pessoas</span>
                            </div>
                          )}
                          {court.available_hours?.length > 0 && (
                            <div className="flex items-center gap-1 col-span-2">
                              <Clock className="h-3 w-3 text-yellow-400 shrink-0" />
                              <span className="truncate">
                                {[...new Set(court.available_hours.map(h => getDayLabel(h.day_of_week)))].join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* Drawer */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="bg-zinc-900 border-zinc-800 w-full max-w-lg overflow-y-auto shadow-xl">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Layers className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex flex-col text-left">
              <SheetTitle className="text-lg">{selectedCourt ? "Editar Quadra" : "Nova Quadra"}</SheetTitle>
              <SheetDescription className="text-zinc-400 text-sm">
                {selectedCourt
                  ? `Editando • ${arenas.find(a => a.id === selectedCourt.belong_arena)?.name || "Arena"}`
                  : "Escolha a arena e preencha os dados."}
              </SheetDescription>
            </div>
          </SheetHeader>
          {isDrawerOpen && (
            <CourtForm
              court={selectedCourt}
              // When editing: lock to the court's own arena.
              // When creating: don't pass arenaId so the selector inside the form appears.
              arenaId={selectedCourt ? selectedCourt.belong_arena : undefined}
              onSuccess={handleSuccess}
              onCancel={handleCloseDrawer}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Excluir Quadra</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir "{selectedCourt?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteCourt}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}