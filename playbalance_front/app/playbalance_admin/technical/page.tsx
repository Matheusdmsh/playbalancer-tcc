"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import { Server, Cpu, HardDrive, Database, Gauge, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function TechnicalMetricsPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    // Refresh interval for hardware visualization
    const fetchTech = () => api.get("/system/technical").then((res) => setData(res.data))
    fetchTech()
    const interval = setInterval(fetchTech, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!data) return <div className="text-zinc-500 animate-pulse font-mono">Lendo telemetria da máquina e MongoDb...</div>

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold font-mono text-zinc-100 flex items-center gap-3">
          <Server className="h-8 w-8 text-purple-500" /> Infraestrutura e Saúde
        </h1>
        <p className="text-zinc-400 mt-2">Visão em tempo real do Hardware subjacente (Cloud) e APM (Desempenho da API). Auto-update(5s).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="flex items-center gap-2"><Cpu className="h-4 w-4" /> Uso de CPU</CardDescription>
            <CardTitle className="text-2xl mt-2 font-mono">{data.hardware.cpu_percent}%</CardTitle>
            <Progress value={data.hardware.cpu_percent} className="mt-4 bg-zinc-800" />
          </CardHeader>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="flex items-center gap-2"><Gauge className="h-4 w-4" /> Uso de Memória (RAM)</CardDescription>
            <CardTitle className="text-2xl mt-2 font-mono text-purple-400">{data.hardware.memory_percent}% <span className="text-sm text-zinc-500">({data.hardware.memory_used_gb} / {data.hardware.memory_total_gb} GB)</span></CardTitle>
            <Progress value={data.hardware.memory_percent} className="mt-4 bg-zinc-800" />
          </CardHeader>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardDescription className="flex items-center gap-2"><HardDrive className="h-4 w-4" /> Armazenamento (Disco Primário)</CardDescription>
            <CardTitle className="text-2xl mt-2 font-mono text-zinc-300">{data.hardware.disk_percent}% <span className="text-sm text-zinc-500">({data.hardware.disk_used_gb} / {data.hardware.disk_total_gb} GB)</span></CardTitle>
            <Progress value={data.hardware.disk_percent} className="mt-4 bg-zinc-800" />
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-zinc-300">
            <Database className="h-5 w-5 text-green-500" /> Banco de Dados (MongoDB)
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-sm">Coleções:</span>
              <span className="text-green-400 font-bold font-mono">{data.database.collections}</span>
            </div>
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-sm">Quantidade de Objetos BSON:</span>
              <span className="text-green-400 font-bold font-mono">{data.database.objects} un</span>
            </div>
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-sm">Tamanho do Banco Atual:</span>
              <span className="text-zinc-300 font-bold font-mono">{data.database.storage_size_mb} MB</span>
            </div>
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-sm">Tamanho Bruto dos Dados:</span>
              <span className="text-zinc-400 font-bold font-mono">{data.database.data_size_mb} MB</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-zinc-300">
            <AlertCircle className="h-5 w-5 text-pink-500" /> API Performance
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-sm">Latência Média:</span>
              <span className="text-pink-400 font-bold font-mono">{data.api_performance.avg_ms} ms</span>
            </div>
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-sm">Percentil P95 (Resoluções ruins):</span>
              <span className="text-pink-500 font-bold font-mono">{data.api_performance.p95_ms} ms</span>
            </div>
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-sm">Percentil P99 (1% Extremo):</span>
              <span className="text-red-500 font-bold font-mono">{data.api_performance.p99_ms} ms</span>
            </div>
            <div className="flex justify-between items-center bg-black/50 p-3 rounded-lg border border-zinc-800">
              <span className="text-zinc-500 font-mono text-sm">Taxa de Erro 5xx Apdex:</span>
              <span className="text-yellow-500 font-bold font-mono">{data.api_performance.error_rate_5xx_percent}%</span>
            </div>
          </div>
        </div>
      </div>

      {data.api_performance.error_logs && data.api_performance.error_logs.length > 0 && (
         <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-zinc-300">
              <AlertCircle className="h-5 w-5 text-red-500" /> Histórico de Erros Recentes (5xx)
            </h2>
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
               {data.api_performance.error_logs.map((e: any, i: number) => (
                  <div key={i} className="bg-black/50 border border-zinc-800/50 rounded-lg p-4 flex flex-col gap-2">
                     <div className="flex items-center gap-3">
                        <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-0.5 rounded text-xs font-bold font-mono">{e.status_code}</span>
                        <span className="bg-zinc-800/50 text-zinc-300 border border-zinc-700/50 px-2 py-0.5 rounded text-xs font-mono">{e.method}</span>
                        <span className="text-zinc-200 text-sm font-mono truncate">{e.path}</span>
                     </div>
                     <p className="text-zinc-400 text-xs font-mono">{new Date(e.timestamp).toLocaleString()}</p>
                     <p className="text-zinc-500 text-xs font-mono border-t border-zinc-800 mt-2 pt-2 line-clamp-3 leading-loose">{e.error_message}</p>
                  </div>
               ))}
            </div>
         </div>
      )}
    </div>
  )
}
