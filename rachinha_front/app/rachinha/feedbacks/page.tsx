"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import { MessageSquare, ThumbsUp, ThumbsDown, User, Calendar as CalendarIcon, Tag } from "lucide-react"

export default function FeedbacksPage() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    api.get("/system/feedbacks").then(res => setData(res.data.feedbacks))
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-zinc-100 flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-yellow-500" /> Comunidade (Feedback Box)
        </h1>
        <p className="text-zinc-400 mt-2">Visão geral de problemas, sugestões e críticas capturados via componente de Feedback.</p>
      </div>

      {data.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 flex flex-col items-center justify-center">
          <MessageSquare className="h-12 w-12 text-zinc-700 mb-4" />
          <h2 className="text-lg font-mono text-zinc-500">Nenhum feedback registrado ainda.</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((f: any, idx: number) => {
            const isNegative = f.type === "bug" || f.type === "complaint"
            const isPositive = f.type === "compliment"
            
            return (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-yellow-500/50 transition-colors flex flex-col items-start gap-4">
                <div className="flex w-full items-start justify-between mb-2 border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-zinc-500" />
                    <span className="text-sm font-medium text-zinc-300 truncate max-w-[150px]">
                      {f.user ? f.user.name : "Anônimo"}
                    </span>
                  </div>
                  {isPositive && <ThumbsUp className="h-4 w-4 text-green-500" />}
                  {isNegative && <ThumbsDown className="h-4 w-4 text-red-500" />}
                  {!isPositive && !isNegative && <MessageSquare className="h-4 w-4 text-zinc-500" />}
                </div>

                <h3 className="text-md font-bold text-zinc-100">{f.title || "Sem título"}</h3>
                
                <p className="text-zinc-300 text-sm whitespace-pre-wrap flex-1 break-words w-full font-mono mb-2">
                  {f.description}
                </p>

                <div className="w-full flex items-center justify-between text-xs text-zinc-500 pt-4 border-t border-zinc-800/50 mt-auto">
                   <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-md border border-zinc-800 uppercase tracking-wider font-bold text-yellow-500/80">
                      <Tag className="h-3 w-3" /> {f.type || "Geral"}
                   </div>
                   <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(f.created_at).toLocaleDateString()}
                   </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
