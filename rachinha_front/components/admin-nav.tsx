"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser } from "@/services/users"
import * as auth from "@/services/authService"
import { NotificationsPopover } from "./notifications-popover"
import { Menu } from "lucide-react"

interface User {
  name: string;
  email: string;
  photo_url?: string;
  is_admin?: boolean;
}

interface AdminNavProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onMobileMenuToggle?: () => void
}

export function AdminNav({ isCollapsed = false, onToggleCollapse, onMobileMenuToggle }: AdminNavProps) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error("Usuário não autenticado ou erro ao buscar dados:", error)
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  const handleLogout = () => {
    auth.logout();
  }

  const getInitials = (name: string) => {
    const names = name.split(' ')
    const first = names[0]?.[0] || ''
    const last = names.length > 1 ? names[names.length - 1]?.[0] : ''
    return (first + last).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-40 bg-black/40 shadow-lg shadow-black/50 backdrop-blur-lg">
      <div className="flex h-14 items-center px-4 md:px-6 relative">
        {/* Botão Menu Sanduíche - Apenas Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden text-zinc-300 flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo - Centralizado no mobile, esquerda no desktop */}
        <Link href="/admin" className="flex items-center gap-2 md:gap-4 md:ml-0 absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0">
          <span className="flex items-center">
            <img
              src="/assets/logo.svg"
              alt="Logo Rachinha.com"
              width={24}
              height={24}
            />
          </span>
          <span className="text-base md:text-xl font-bold whitespace-nowrap">
            rachinha<span className="text-green-500">.com</span> <span className="text-zinc-500 font-normal">| Admin</span>
          </span>
        </Link>

        {/* Notificações - Direita */}
        {user && (
          <div className="ml-auto flex items-center gap-4">
            <NotificationsPopover />
          </div>
        )}
      </div>
    </header>
  )
}