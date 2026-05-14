"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus,CircleFadingPlus , Users, Clock, MapPin, DollarSign, Calendar, Calendar1, Flag, Search, Award, ArrowUpDown, SlidersHorizontal } from "lucide-react"
import { CreateGroupWizard } from "./create-group-wizard"
import { getSportIcon } from "@/lib/getSportIcon"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

import { listMyGroups, Group } from "@/services/groups"
import { getUserDataFromToken } from "@/services/users"
import { useToast } from "@/components/ui/use-toast"
import { EditGroupDialog } from "./edit-group-dialog"
import { DeleteGroupDialog } from "./delete-group-dialog"
import Link from "next/link"
import { UserRoleBadge } from "./user-role-badge"

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null | undefined>(null)

  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedModalities, setSelectedModalities] = useState<string[]>([])
  const [selectedDays, setSelectedDays] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<"nome" | "recente" | "antigo">("recente")
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    async function fetchGroups() {
      const userData = getUserDataFromToken()
      if (userData) setCurrentUserId(userData.sub)
      try {
        const myGroups = await listMyGroups()
        setGroups(myGroups)
      } catch (error: any) {
        toast({
          title: "Erro ao carregar turmas",
          description: error.message || "Não foi possível buscar suas turmas.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchGroups()
  }, [toast])

  const handleGroupCreated = (newGroup: Group) => {
    setGroups((prevGroups) => [newGroup, ...prevGroups])
  }

  const handleGroupUpdated = (updatedGroup: Group) => {
    setGroups((prevGroups) =>
      prevGroups.map((group) => (group._id === updatedGroup._id ? updatedGroup : group))
    )
  }

  const handleGroupDeleted = (deletedGroupId: string) => {
    setGroups((prevGroups) => prevGroups.filter((group) => group._id !== deletedGroupId))
  }

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group)
    setIsEditDialogOpen(true)
  }

  const openDeleteDialog = (group: Group) => {
    setSelectedGroup(group)
    setIsDeleteDialogOpen(true)
  }

  // Funções para toggle de múltiplas seleções
  const toggleModality = (modality: string) => {
    setSelectedModalities(prev =>
      prev.includes(modality)
        ? prev.filter(m => m !== modality)
        : [...prev, modality]
    )
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  // Função para formatar dias da semana
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

  // Função para formatar horário
  const extractHHMM = (timeValue?: string | null): string => {
    if (!timeValue || typeof timeValue !== "string") return ""
    const value = timeValue.trim()
    if (!value) return ""

    // ISO/UTC
    if (value.includes("T") || value.endsWith("Z")) {
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }
    }

    // HH:MM ou HH:MM:SS
    const match = value.match(/(\d{2}):(\d{2})/)
    if (match) return `${match[1]}:${match[2]}`

    return ""
  }

  const formatTime = (startTime?: string | null, endTime?: string | null): string => {
    const startStr = extractHHMM(startTime)
    if (!startStr) return ""

    const endStr = extractHHMM(endTime)
    return endStr ? `${startStr} a ${endStr}` : startStr
  }

  // Função para formatar preço
  const formatPrice = (price?: number | null, priceType?: string | null): string => {
    if (!price) return ""
    const typeLabel = priceType === 'per_person' ? 'por pessoa' : 'rateado'
    return `R$ ${price.toFixed(2)} ${typeLabel}`
  }

  // Função para filtrar e ordenar grupos
  const filteredGroups = groups
    .filter(group => {
      // Filtro por nome
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro por modalidade (se houver seleções, verifica inclusão; senão mostra todas)
      const matchesModality = selectedModalities.length === 0 || (group.modality && selectedModalities.some(m => m.toLowerCase() === group.modality?.toLowerCase()))
      
      // Filtro por dia da semana (se houver seleções, verifica inclusão; senão mostra todas)
      const matchesDay = selectedDays.length === 0 || (group.recurrence && group.recurrence.some(day => selectedDays.some(selectedDay => selectedDay.toLowerCase() === day.toLowerCase())))
      
      return matchesSearch && matchesModality && matchesDay
    })
    .sort((a, b) => {
      if (sortBy === "nome") {
        return a.name.localeCompare(b.name, 'pt-BR')
      } else if (sortBy === "recente") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      } else if (sortBy === "antigo") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      return 0
    })

  if (isLoading) {
    // Skeleton loader: simula barra de pesquisa + filtros + cards
    return (
      <div className="p-6 md:max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 mb-6">
          {/* Skeleton da barra de pesquisa e filtros */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
            {/* Web: barra de pesquisa + filtros inline */}
            <div className="hidden md:flex md:flex-row gap-3 items-end flex-1 animate-pulse">
              {/* Skeleton da barra de pesquisa */}
              <div className="flex-1 h-10 bg-zinc-800/60 rounded-full" />
              {/* Skeleton dos botões de filtro */}
              <div className="h-9 w-32 bg-zinc-800/60 rounded-full flex-shrink-0" />
              <div className="h-9 w-32 bg-zinc-800/60 rounded-full flex-shrink-0" />
              <div className="h-9 w-32 bg-zinc-800/60 rounded-full flex-shrink-0" />
            </div>

            {/* Mobile: skeleton do botão de filtros */}
            <div className="md:hidden flex gap-3 w-full animate-pulse">
              <div className="flex-1 h-10 bg-zinc-800/60 rounded-full" />
              <div className="h-10 w-10 bg-zinc-800/60 rounded-full" />
            </div>

            {/* Skeleton do botão "Novo Grupo" */}
            <div className="h-10 w-full md:w-40 bg-zinc-800/60 rounded-full animate-pulse flex-shrink-0" />
          </div>
        </div>

        {/* Skeleton dos cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-lg shadow-lg h-72 flex flex-col animate-pulse overflow-hidden"
            >
              {/* Imagem skeleton */}
              <div className="w-full h-40 bg-zinc-800/70" />
              {/* Header skeleton */}
              <div className="flex gap-3 px-6 pt-4">
                <div className="h-8 w-8 bg-zinc-800/60 rounded-full" />
                <div className="flex-1 h-6 bg-zinc-800/60 rounded mt-1" />
              </div>
              {/* Tags skeleton */}
              <div className="flex gap-2 px-6 mt-4">
                <div className="h-5 w-20 bg-zinc-800/50 rounded-full" />
                <div className="h-5 w-16 bg-zinc-800/50 rounded-full" />
                <div className="h-5 w-12 bg-zinc-800/50 rounded-full" />
              </div>
              {/* Rodapé skeleton */}
              <div className="flex-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <><div className = "p-6 md:max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 mb-6 ">
        {/* Barra de filtros */}
        <div className="flex flex-col gap-3">
          {/* Web: filtros sempre visíveis */}
          <div className="hidden md:flex md:flex-row gap-3 items-end">
            {/* Barra de pesquisa */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Pesquisar grupos por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-zinc-800 border-zinc-700 rounded-full"
              />
            </div>

            {/* Filtro de modalidade - Multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto h-9 rounded-full px-4 text-xs font-medium uppercase tracking-wide bg-black/30 border-[#083818] text-green-100 hover:bg-black/40 hover:border-green-400"
                >
                  <Award className="h-3 w-3 text-green-400" />
                  {selectedModalities.length === 0 ? "Esportes" : `${selectedModalities.length} selecionado(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-zinc-900 border-zinc-700 p-3">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Selecione os esportes:</p>
                  <div className="space-y-2">
                    {[
                      "Futebol",
                      "Vôlei",
                      "Basquete",
                      "Futsal",
                      "Beach Tennis",
                      "Tênis",
                      "Padel",
                      "Handebol",
                      "Outros",
                    ].map((modality) => (
                      <div key={modality} className="flex items-center space-x-2">
                        <Checkbox
                          id={`modality-${modality}`}
                          checked={selectedModalities.includes(modality)}
                          onCheckedChange={() => toggleModality(modality)}
                          className="border-zinc-600"
                        />
                        <label
                          htmlFor={`modality-${modality}`}
                          className="text-sm text-zinc-300 cursor-pointer"
                        >
                          {modality}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filtro de dia da semana - Multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto h-9 rounded-full px-4 text-xs font-medium uppercase tracking-wide bg-black/30 border-[#083818] text-green-100 hover:bg-black/40 hover:border-green-400"
                >
                  <Calendar1 className="h-3 w-3 text-green-400" />
                  {selectedDays.length === 0 ? "Dias" : `${selectedDays.length} dia(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-zinc-900 border-zinc-700 p-3">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Selecione os dias:</p>
                  <div className="space-y-2">
                    {[
                      "segunda",
                      "terça",
                      "quarta",
                      "quinta",
                      "sexta",
                      "sábado",
                      "domingo",
                    ].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={selectedDays.includes(day)}
                          onCheckedChange={() => toggleDay(day)}
                          className="border-zinc-600"
                        />
                        <label
                          htmlFor={`day-${day}`}
                          className="text-sm text-zinc-300 cursor-pointer capitalize"
                        >
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filtro de ordenação */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto h-9 rounded-full px-4 text-xs font-medium uppercase tracking-wide bg-black/30 border-[#083818] text-green-100 hover:bg-black/40 hover:border-green-400"
                >
                  <ArrowUpDown className="h-3 w-3 text-green-400" />
                  Ordenar: {sortBy === "nome" ? "Nome" : sortBy === "recente" ? "Recente" : "Antigo"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-zinc-900 border-zinc-700 p-3">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Ordenar por:</p>
                  <div className="space-y-2">
                    {[
                      { value: "nome" as const, label: "Nome (A-Z)" },
                      { value: "recente" as const, label: "Mais Recentes" },
                      { value: "antigo" as const, label: "Mais Antigos" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          sortBy === option.value
                            ? "bg-green-900/50 text-green-400"
                            : "hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Botão Novo Grupo */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full md:w-auto bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm group whitespace-nowrap"
            >
              <CircleFadingPlus className=" h-4 w-4 text-green-400 group-hover:text-green-400" /> Novo Grupo
            </Button>
          </div>

          {/* Barra de pesquisa + toggle de filtros (mobile) */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500 hidden md:block" />
              <Input
                placeholder="Pesquisar grupos por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-3 md:pl-10 bg-zinc-800 border-zinc-700 rounded-full"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsFiltersOpen((v) => !v)}
              className={`md:hidden h-9 rounded-full px-4 text-xs font-medium uppercase tracking-wide bg-black/30 border-[#083818] text-green-100 hover:bg-black/40 hover:border-green-400 ${
                isFiltersOpen ? "border-green-400 text-green-300" : ""
              }`}
              aria-pressed={isFiltersOpen}
              aria-label="Filtros"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Filtros */}
          <div className={`${isFiltersOpen ? "flex" : "hidden"} flex-col gap-3 items-end md:hidden`}>
            {/* Filtro de modalidade - Multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto h-9 rounded-full px-4 text-xs font-medium uppercase tracking-wide bg-black/30 border-[#083818] text-green-100 hover:bg-black/40 hover:border-green-400"
                >
                  <Award className="h-3 w-3 text-green-400" />
                  {selectedModalities.length === 0 ? "Esportes" : `${selectedModalities.length} selecionado(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-zinc-900 border-zinc-700 p-3">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Selecione os esportes:</p>
                  <div className="space-y-2">
                    {[
                      "Futebol",
                      "Vôlei",
                      "Basquete",
                      "Futsal",
                      "Beach Tennis",
                      "Tênis",
                      "Padel",
                      "Handebol",
                      "Outros",
                    ].map((modality) => (
                      <div key={modality} className="flex items-center space-x-2">
                        <Checkbox
                          id={`modality-${modality}`}
                          checked={selectedModalities.includes(modality)}
                          onCheckedChange={() => toggleModality(modality)}
                          className="border-zinc-600"
                        />
                        <label
                          htmlFor={`modality-${modality}`}
                          className="text-sm text-zinc-300 cursor-pointer"
                        >
                          {modality}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filtro de dia da semana - Multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto h-9 rounded-full px-4 text-xs font-medium uppercase tracking-wide bg-black/30 border-[#083818] text-green-100 hover:bg-black/40 hover:border-green-400"
                >
                  <Calendar1 className="h-3 w-3 text-green-400" />
                  {selectedDays.length === 0 ? "Dias" : `${selectedDays.length} dia(s)`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-zinc-900 border-zinc-700 p-3">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white">Selecione os dias:</p>
                  <div className="space-y-2">
                    {[
                      "segunda",
                      "terça",
                      "quarta",
                      "quinta",
                      "sexta",
                      "sábado",
                      "domingo",
                    ].map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={`day-${day}`}
                          checked={selectedDays.includes(day)}
                          onCheckedChange={() => toggleDay(day)}
                          className="border-zinc-600"
                        />
                        <label
                          htmlFor={`day-${day}`}
                          className="text-sm text-zinc-300 cursor-pointer capitalize"
                        >
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Filtro de ordenação */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full md:w-auto h-9 rounded-full px-4 text-xs font-medium uppercase tracking-wide bg-black/30 border-[#083818] text-green-100 hover:bg-black/40 hover:border-green-400"
                >
                  <ArrowUpDown className="h-3 w-3 text-green-400" />
                  Ordenar: {sortBy === "nome" ? "Nome" : sortBy === "recente" ? "Recente" : "Antigo"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 bg-zinc-900 border-zinc-700 p-3">
                <div className="space-y-3">
                  
                  <p className="text-sm font-medium text-white">Ordenar por:</p>
                  <div className="space-y-2">
                    {[
                      { value: "nome" as const, label: "Nome (A-Z)" },
                      { value: "recente" as const, label: "Mais Recentes" },
                      { value: "antigo" as const, label: "Mais Antigos" },
                    ].map((option) => (
                      <div
                        key={option.value}
                        onClick={() => setSortBy(option.value)}
                        className={`p-2 rounded cursor-pointer transition-colors ${
                          sortBy === option.value
                            ? "bg-green-900/50 text-green-400"
                            : "hover:bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Botão Novo Grupo */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full bg-green-800 border-green-400 hover:border-green-400 hover:text-green-400 backdrop-blur-sm group whitespace-nowrap md:hidden"
          >
            <CircleFadingPlus className="h-4 w-4 text-green-400 group-hover:text-green-400" /> Novo Grupo
          </Button>
        </div>
      </div>

      {/* Grid de turmas */}
      {isLoading ? (
        <p className="text-zinc-400">Carregando turmas...</p>
      ) : filteredGroups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <Link key={group._id} href={`/user/group/${group._id}`} className="no-underline">
              <Card className="bg-zinc-900 border-zinc-800 flex flex-col overflow-hidden hover:border-green-500 transition-all duration-300 shadow-lg hover:shadow-green-500/30 hover:bg-zinc-800/50 h-full cursor-pointer group relative">
                {/* Foto da turma em destaque com gradiente no hover */}
                <div className="relative w-full h-40 bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                  {group.photo_url && group.photo_url !== "" ? (
                    <>
                      <Image
                        src={group.photo_url}
                        alt={`Foto da turma ${group.name}`}
                        fill
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Gradiente overlay no hover */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/40 group-hover:to-green-900/70 transition-all duration-300" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="h-12 w-12 text-zinc-600" />
                    </div>
                  )}
                  {/* Badge de papel do usuário na turma */}
                  {(() => {
                    if (!currentUserId) return null;
                    if (group.owner_id === currentUserId) {
                      return <div className="absolute top-3 right-3 z-10"><UserRoleBadge role="owner" /></div>;
                    }
                    if (group.admins && group.admins.includes(currentUserId)) {
                      return <div className="absolute top-3 right-3 z-10"><UserRoleBadge role="admin" /></div>;
                    }
                    if (group.members && group.members.some(m => m.id === currentUserId && m.is_placeholder)) {
                      return <div className="absolute top-3 right-3 z-10"><UserRoleBadge role="reserva" /></div>;
                    }
                    if (group.members && group.members.some(m => m.id === currentUserId)) {
                      return <div className="absolute top-3 right-3 z-10"><UserRoleBadge role="member" /></div>;
                    }
                    return null;
                  })()}
                </div>

                {/* Header com ícone em uma coluna e título/subtítulo em outra */}
                <CardHeader className="pb-3">
                  <div className="flex gap-3">
                    {/* Coluna 1: Ícone */}
                    <div className="flex items-center justify-center flex-shrink-0">
                      <div className="scale-75">
                        {getSportIcon(group.modality)}
                      </div>
                    </div>
                    
                    {/* Coluna 2: Título */}
                    <div className="flex flex-col justify-center flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-2">{group.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>

                {/* Tags com informações */}
                <div className="border-t border-zinc-700/50 mt-3 pt-4 px-6"></div>
                <CardContent className="flex-grow pb-4 pt-0">
                  <div className="flex flex-wrap gap-2">
                    {/* Tag de esporte */}
                    {group.modality && (
                      <div className="bg-green-900/40 border border-green-700/60 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                        <Flag className="h-3 w-3 text-green-400" />
                        <span className="text-green-200">{group.modality}</span>
                      </div>
                    )}

                    {/* Tag de quadra */}
                    {group.arena && (
                      <div className="bg-green-900/40 border border-green-700/60 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-green-400" />
                        <span className="text-green-200">{group.arena}</span>
                      </div>
                    )}

                    {/* Tag de valor */}
                    {group.price && (
                      <div className="bg-green-900/40 border border-green-700/60 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-green-400" />
                        <span className="text-green-200">{formatPrice(group.price, group.price_type)}</span>
                      </div>
                    )}

                    {/* Tag de dias da semana */}
                    {group.recurrence && group.recurrence.length > 0 && (
                      <div className="bg-green-900/40 border border-green-700/60 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-green-400" />
                        <span className="text-green-200">{formatRecurrence(group.recurrence)}</span>
                      </div>
                    )}

                    {/* Tag de horário */}
                    {group.start_time && (
                      <div className="bg-green-900/40 border border-green-700/60 rounded-full px-3 py-1 text-xs flex items-center gap-1">
                        <Clock className="h-3 w-3 text-green-400" />
                        <span className="text-green-200">{formatTime(group.start_time)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-lg">
          <p className="text-zinc-400 mb-4">
            {searchTerm || selectedModalities.length > 0 || selectedDays.length > 0
              ? "Nenhuma turma encontrada com esses filtros." 
              : "Você ainda não faz parte de nenhuma turma."}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-green-500 hover:bg-green-600">
            <Plus className="mr-2 h-4 w-4" /> Criar sua primeira turma
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateGroupWizard
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onGroupCreated={handleGroupCreated}
      />
      {selectedGroup && (
        <EditGroupDialog
          key={`edit-${selectedGroup._id}`}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          group={selectedGroup}
          onGroupUpdated={handleGroupUpdated}
        />
      )}
      {selectedGroup && (
        <DeleteGroupDialog
          key={`delete-${selectedGroup._id}`}
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          group={selectedGroup}
          onGroupDeleted={handleGroupDeleted}
        />
      )}
      </div>
    </>
  )
}