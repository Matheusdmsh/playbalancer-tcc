"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import { Activity, Users, UserPlus } from "lucide-react"

export default function OverviewPage() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    api.get("/system/overview").then(res => setData(res.data))
  }, [])

  if (!data) return <div className="text-zinc-500 animate-pulse font-mono">Carregando métricas de overview...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-zinc-100 flex items-center gap-3">
          <Activity className="h-8 w-8 text-red-500" /> Visão Geral
        </h1>
        <p className="text-zinc-400 mt-2">Métricas vitais de retenção e login.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-zinc-300">
            <Users className="h-5 w-5 text-red-400" /> Usuários Ativos (MAU/WAU/DAU)
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/50 p-4 rounded-lg border border-red-900/30">
              <span className="text-sm text-zinc-500 block mb-1">Hoje</span>
              <span className="text-3xl font-mono font-bold text-red-400">{data.active_users.daily}</span>
            </div>
            <div className="bg-black/50 p-4 rounded-lg border border-zinc-800/50">
              <span className="text-sm text-zinc-500 block mb-1">Esta Semana</span>
              <span className="text-3xl font-mono font-bold text-zinc-300">{data.active_users.weekly}</span>
            </div>
            <div className="bg-black/50 p-4 rounded-lg border border-zinc-800/50">
              <span className="text-sm text-zinc-500 block mb-1">Este Mês</span>
              <span className="text-3xl font-mono font-bold text-zinc-300">{data.active_users.monthly}</span>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-6 text-zinc-300">
            <UserPlus className="h-5 w-5 text-green-400" /> Novos Cadastros
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-black/50 p-4 rounded-lg border border-green-900/30">
              <span className="text-sm text-zinc-500 block mb-1">Hoje</span>
              <span className="text-3xl font-mono font-bold text-green-400">{data.new_users.daily}</span>
            </div>
            <div className="bg-black/50 p-4 rounded-lg border border-zinc-800/50">
              <span className="text-sm text-zinc-500 block mb-1">Esta Semana</span>
              <span className="text-3xl font-mono font-bold text-zinc-300">{data.new_users.weekly}</span>
            </div>
            <div className="bg-black/50 p-4 rounded-lg border border-zinc-800/50">
              <span className="text-sm text-zinc-500 block mb-1">Este Mês</span>
              <span className="text-3xl font-mono font-bold text-zinc-300">{data.new_users.monthly}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-300">
          <Activity className="h-5 w-5 text-blue-400" /> Últimos Acessos (Top 10)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800">
                <th className="pb-3 px-2 font-medium">Nome</th>
                <th className="pb-3 px-2 font-medium">Username</th>
                <th className="pb-3 px-2 font-medium">Último Login (UTC)</th>
                <th className="pb-3 px-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.last_accesses.map((u: any, idx: number) => (
                <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="py-3 px-2 truncate max-w-[200px] text-zinc-200">{u.name || "N/A"}</td>
                  <td className="py-3 px-2 text-zinc-400">{u.username || "N/A"}</td>
                  <td className="py-3 px-2 text-blue-400">{new Date(u.last_login).toLocaleString()}</td>
                  <td className="py-3 px-2 text-green-500">Online</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
