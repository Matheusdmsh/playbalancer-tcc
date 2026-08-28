"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import { Database, Folder, BarChart4 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ContentMetricsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get("/system/content").then(res => setData(res.data))
  }, [])

  if (!data) return <div className="text-zinc-500 animate-pulse font-mono">Processando métricas DBs...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-zinc-100 flex items-center gap-3">
          <Database className="h-8 w-8 text-green-500" /> Conteúdo & Uso (UGC)
        </h1>
        <p className="text-zinc-400 mt-2">Métricas do conteúdo criado pelos usuários no PlayBalance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400 font-mono text-xs flex items-center gap-2"><Folder className="h-4 w-4" /> Grupos/Turmas</CardDescription>
            <CardTitle className="text-3xl font-mono text-green-400">{data.totals.groups}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 border-b-2 border-b-zinc-400">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400 font-mono text-xs flex items-center gap-2"><BarChart4 className="h-4 w-4" /> Rachas (Bookings)</CardDescription>
            <CardTitle className="text-3xl font-mono text-blue-400">{data.totals.bookings}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 border-b-2 border-b-zinc-400">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400 font-mono text-xs flex items-center gap-2"><BarChart4 className="h-4 w-4" /> Total de Transações</CardDescription>
            <CardTitle className="text-3xl font-mono text-zinc-100">{data.totals.transactions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

    </div>
  )
}
