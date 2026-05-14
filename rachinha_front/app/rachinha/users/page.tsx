"use client"

import { useEffect, useState } from "react"
import api from "@/services/api"
import { Users, Edit, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"

export default function UsersMetricsPage() {
  const [data, setData] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [roleInput, setRoleInput] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = () => {
    api.get("/system/users").then(res => setData(res.data.users))
  }

  const handleEditRole = (user: any) => {
    setEditingId(user.id)
    setRoleInput(user.roles.join(", "))
  }

  const handleSaveRole = async (userId: string) => {
    try {
      const parsedRoles = roleInput.split(",").map(r => r.trim()).filter(Boolean)
      await api.put(`/system/users/${userId}/role`, { roles: parsedRoles })
      toast({ title: "Roles atualizadas do usuário" })
      setEditingId(null)
      fetchUsers()
    } catch {
      toast({ title: "Erro ao atualizar roles", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-mono text-zinc-100 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-500" /> Audiência Oculta
        </h1>
        <p className="text-zinc-400 mt-2">Métricas e controle de perfil de Usuários Reais (non-placeholders).</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono">
            <thead>
              <tr className="text-zinc-500 border-b border-zinc-800 text-sm">
                <th className="pb-3 px-2 font-medium">Foto</th>
                <th className="pb-3 px-2 font-medium">Username</th>
                <th className="pb-3 px-2 font-medium">E-mail</th>
                <th className="pb-3 px-2 font-medium">Data de Criação</th>
                <th className="pb-3 px-2 font-medium">Roles</th>
                <th className="pb-3 px-2 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {data.map((u: any, idx: number) => (
                <tr key={idx} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                  <td className="py-3 px-2">
                    <Avatar className="h-8 w-8 border border-zinc-700">
                      <AvatarImage src={u.photo_url} />
                      <AvatarFallback className="bg-zinc-800 text-xs">{(u.username || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="py-3 px-2 text-zinc-300 font-bold">{u.username || "N/A"}</td>
                  <td className="py-3 px-2 text-zinc-400 max-w-[200px] truncate">{u.email || "N/A"}</td>
                  <td className="py-3 px-2 text-zinc-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-2">
                    {editingId === u.id ? (
                      <Input 
                        value={roleInput} 
                        onChange={(e) => setRoleInput(e.target.value)} 
                        className="h-8 bg-black border-zinc-700 text-zinc-200"
                        placeholder="admin, rachinha"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {u.roles.map((r: string) => (
                          <span key={r} className={`px-2 py-0.5 rounded-full text-xs font-bold bg-zinc-800 border border-zinc-700 ${r === 'admin' ? 'text-yellow-500' : r === 'rachinha' ? 'text-red-500' : 'text-zinc-300'}`}>
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {editingId === u.id ? (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-400" onClick={() => handleSaveRole(u.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-zinc-300" onClick={() => handleEditRole(u)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-zinc-500">Nenhum dado retornado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
