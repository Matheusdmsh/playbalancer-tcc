"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import { Database, Folder, MapPin, Map, BarChart4 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

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
        <p className="text-zinc-400 mt-2">Métricas e volumetria sobre coleções geradas por usuários e empresas.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400 font-mono text-xs flex items-center gap-2"><Folder className="h-4 w-4" /> Grupos/Turmas</CardDescription>
            <CardTitle className="text-3xl font-mono text-green-400">{data.totals.groups}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400 font-mono text-xs flex items-center gap-2"><Folder className="h-4 w-4" /> Quadras Criadas</CardDescription>
            <CardTitle className="text-3xl font-mono text-indigo-400">{data.totals.courts}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-zinc-400 font-mono text-xs flex items-center gap-2"><Folder className="h-4 w-4" /> Arenas Criadas</CardDescription>
            <CardTitle className="text-3xl font-mono text-yellow-500">{data.totals.arenas}</CardTitle>
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

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-zinc-300">
          <Map className="h-5 w-5 text-orange-400" /> Distribuição Demográfica x Arenas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            {data.arena_regions.map((region: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 bg-black/30">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-orange-900/20 text-orange-500 rounded-md">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span className="font-mono text-zinc-300 font-medium">{region.city}</span>
                </div>
                <div className="bg-zinc-800 text-zinc-300 font-bold px-3 py-1 rounded-full text-xs">
                  {region.count} un
                </div>
              </div>
            ))}
          </div>

          <div className="bg-black/20 border border-zinc-800 rounded-lg p-6 flex flex-col items-center justify-center text-center">
            <Map className="h-16 w-16 text-zinc-800 mb-4" />
            <p className="text-sm font-mono text-zinc-500 max-w-[200px]">
              Atuação focada no polo central de {data.arena_regions[0]?.city || "Brasil"}. <span className="text-zinc-400">Expansão em andamento.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
