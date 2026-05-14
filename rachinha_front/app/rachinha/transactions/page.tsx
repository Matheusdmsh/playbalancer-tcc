"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import { CreditCard, CheckCircle2, XCircle, Clock } from "lucide-react"

export default function TransactionsDashboardPage() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/system/transactions")
      .then(res => setTransactions(res.data.transactions))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-zinc-500 animate-pulse font-mono">Buscando transações globais...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-zinc-100 flex items-center gap-3">
          <CreditCard className="h-8 w-8 text-blue-500" /> Transações Financeiras
        </h1>
        <p className="text-zinc-400 mt-2">Log global de cobranças, repasses e reservas. Apenas leitura.</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-sm text-left font-mono">
               <thead className="text-xs text-zinc-400 uppercase bg-black/40 border-b border-zinc-800">
                  <tr>
                     <th className="px-6 py-4">Data/Hora</th>
                     <th className="px-6 py-4">Status</th>
                     <th className="px-6 py-4">Valor</th>
                     <th className="px-6 py-4">Método</th>
                     <th className="px-6 py-4">Gateway ID</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-800/50">
                  {transactions.length === 0 && (
                     <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">Nenhuma transação registrada.</td>
                     </tr>
                  )}
                  {transactions.map((t, idx) => {
                     const isSuccess = t.status === "paid" || t.status === "succeeded" || t.status === "completed"
                     const isPending = t.status === "pending" || t.status === "processing"
                     
                     return (
                        <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                           <td className="px-6 py-4 text-zinc-300">
                              {new Date(t.created_at).toLocaleString()}
                           </td>
                           <td className="px-6 py-4">
                              <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-bold ${
                                 isSuccess ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                 isPending ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                 'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                                 {isSuccess && <CheckCircle2 className="h-3 w-3" />}
                                 {isPending && <Clock className="h-3 w-3" />}
                                 {!isSuccess && !isPending && <XCircle className="h-3 w-3" />}
                                 {t.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 font-bold text-zinc-100">
                              R$ {((t.amount || 0)).toFixed(2)}
                           </td>
                           <td className="px-6 py-4 text-zinc-400">
                              {t.payment_method || "N/A"}
                           </td>
                           <td className="px-6 py-4 text-zinc-500 text-xs">
                              {t.gateway_id || t.external_id || "N/A"}
                           </td>
                        </tr>
                     )
                  })}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}
