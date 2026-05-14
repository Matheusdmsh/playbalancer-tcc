"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import { ShieldCheck, UserCheck, AlertOctagon } from "lucide-react"

export default function AccessLogsDashboardPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/system/access-logs")
      .then(res => setLogs(res.data.access_logs))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-zinc-500 animate-pulse font-mono">Processando histórico de firewall e acessos...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-zinc-100 flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-teal-500" /> Histórico de Acessos
        </h1>
        <p className="text-zinc-400 mt-2">Log de tentativas de autenticação e tracking de IPs.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
               <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-zinc-800">
                  <tr>
                     <th className="px-6 py-4">Data/Hora</th>
                     <th className="px-6 py-4">Usuário</th>
                     <th className="px-6 py-4">Método</th>
                     <th className="px-6 py-4">Resultado</th>
                     <th className="px-6 py-4">Endereço IP</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800/50">
                  {logs.length === 0 && (
                     <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Nenhum log de acesso interceptado.</td>
                     </tr>
                  )}
                  {logs.map((l, idx) => (
                     <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-4 text-zinc-300">
                           {new Date(l.login_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-zinc-100 font-bold">
                           {l.username || 'Anônimo'}
                        </td>
                        <td className="px-6 py-4">
                           <span className="bg-zinc-800/80text-zinc-300 border border-zinc-700/50 px-2 py-0.5 rounded text-xs font-mono">
                              {l.method}
                           </span>
                        </td>
                        <td className="px-6 py-4">
                           {l.success ? (
                              <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded border border-teal-500/20 bg-teal-500/10 text-teal-500 text-xs font-bold uppercase">
                                 <UserCheck className="h-3 w-3" /> Sucesso
                              </span>
                           ) : (
                              <span className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-bold uppercase">
                                 <AlertOctagon className="h-3 w-3" /> Negado
                              </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 text-xs">
                           {l.ip_address || "N/A"}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}
