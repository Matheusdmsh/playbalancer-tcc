"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { UserCog } from "lucide-react"

export function RoleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(pathname?.startsWith("/admin"))

  useEffect(() => {
    setIsAdmin(pathname?.startsWith("/admin"))
  }, [pathname])

  const handleRoleChange = (checked: boolean) => {
    setIsAdmin(checked)
    if (checked) {
      router.push("/admin")
    } else {
      router.push("/user/group")
    }
  }

  return (
    <div className="flex items-center space-x-2 bg-zinc-800 p-2 rounded-lg">
      <UserCog className="h-4 w-4 text-zinc-400" />
      <div className="flex items-center space-x-2">
        <Label htmlFor="role-switch" className="text-xs text-zinc-400">
          Usuário
        </Label>
        <Switch
          id="role-switch"
          checked={isAdmin}
          onCheckedChange={handleRoleChange}
          className="data-[state=checked]:bg-green-500"
        />
        <Label htmlFor="role-switch" className="text-xs text-zinc-400">
          Admin
        </Label>
      </div>
    </div>
  )
}
