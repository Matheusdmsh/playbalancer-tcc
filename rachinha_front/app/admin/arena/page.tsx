"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Edit, MapPin, MoreHorizontal, Plus, Trash } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Arena } from "@/interface/arena"
import { listMyArenas, deleteArena } from "@/services/arena"
import { Skeleton } from "@/components/ui/skeleton"
import { ArenaForm } from "@/components/arena-form"

export default function AdminArenas() {
  const { toast } = useToast();
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedArena, setSelectedArena] = useState<Arena | null>(null);

  const fetchArenas = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listMyArenas();
      setArenas(data);
    } catch (error) {
      toast({ title: "Erro ao carregar arenas", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchArenas();
  }, [fetchArenas]);

  const handleOpenDrawer = (arena: Arena | null) => {
    setSelectedArena(arena);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedArena(null), 300);
  };

  const handleSuccess = () => {
    handleCloseDrawer();
    fetchArenas();
  };

  const openDeleteDialog = (arena: Arena) => {
    setSelectedArena(arena);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteArena = async () => {
    if (!selectedArena) return;
    try {
      await deleteArena(selectedArena.id);
      toast({ title: "Arena excluída com sucesso!" });
      setIsDeleteDialogOpen(false);
      fetchArenas();
    } catch (error) {
      toast({ title: "Erro ao excluir arena", description: (error as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Arenas</h2>
        <Button className="bg-green-500 hover:bg-green-600" onClick={() => handleOpenDrawer(null)}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Arena
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full bg-zinc-800" />
          <Skeleton className="h-64 w-full bg-zinc-800" />
        </div>
      ) : arenas.length === 0 ? (
        <Card className="bg-zinc-900 border-zinc-800 text-center p-8">
          <CardTitle>Nenhuma arena encontrada</CardTitle>
          <CardContent className="mt-4">
            <p className="text-zinc-400">Clique em "Adicionar Arena" para cadastrar seu primeiro espaço.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {arenas.map((arena) => (
            <Card key={arena.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors">
              <CardHeader className="flex flex-row items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Building className="h-5 w-5 text-green-400" />
                  </div>
                  <CardTitle>{arena.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-5 w-5" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                    <DropdownMenuItem onClick={() => handleOpenDrawer(arena)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openDeleteDialog(arena)} className="text-red-500 focus:text-red-400 focus:bg-red-950"><Trash className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                {arena.location && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-zinc-300">{[arena.location.street, arena.location.neighborhood].filter(Boolean).join(', ')}</p>
                      <p className="text-sm text-zinc-500">{[arena.location.city, arena.location.uf].filter(Boolean).join(' - ')}</p>
                    </div>
                  </div>
                )}
                {arena.description && (
                  <p className="text-sm text-zinc-400 truncate">{arena.description}</p>
                )}
                <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800" onClick={() => (window.location.href = `/admin/court?arena=${arena.id}`)}>
                  Gerenciar Quadras
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Drawer para Adicionar/Editar Arena */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent side="right" className="bg-zinc-900 border-zinc-800 w-full max-w-md h-full shadow-xl overflow-y-auto">
          <SheetHeader className="flex flex-row items-center gap-3 pb-6">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Building className="h-6 w-6 text-green-400" />
            </div>
            <div className="flex flex-col text-left">
              <SheetTitle className="text-lg">{selectedArena ? "Editar Arena" : "Nova Arena"}</SheetTitle>
              <SheetDescription className="text-zinc-400 text-sm">
                {selectedArena ? "Atualize os dados da arena." : "Preencha os detalhes da sua arena."}
              </SheetDescription>
            </div>
          </SheetHeader>
          {isDrawerOpen && (
            <ArenaForm arena={selectedArena} onSuccess={handleSuccess} onCancel={handleCloseDrawer} />
          )}
        </SheetContent>
      </Sheet>

      {/* Dialog de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Excluir Arena</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a arena "{selectedArena?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteArena}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}