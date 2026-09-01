// playbalance_front/components/user-nav.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { NotificationsPopover } from "./notifications-popover"

interface UserNavProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  onMobileMenuToggle?: () => void
}

export function UserNav({ onMobileMenuToggle }: UserNavProps) {
  return (
    <header className="sticky top-0 z-40 bg-black/40 shadow-lg shadow-black/50 backdrop-blur-lg">
      <div className="flex h-14 items-center px-4 md:px-6 relative">
        {/* Botão Menu Sanduíche - Apenas Mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden text-green-200 flex-shrink-0"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo - Centralizado no mobile, esquerda no desktop */}
        <Link href="/" className="flex items-center gap-2 md:gap-4 md:ml-0 absolute left-1/2 -translate-x-1/2 md:relative md:left-auto md:translate-x-0">
          <span className="flex items-center">
            <Image
              src="/assets/logobalanca.svg"
              alt="Logo PlayBalance"
              width={26}
              height={26}
            />
          </span>
          <span className="text-base md:text-xl font-bold">
            <span className="text-green-400">Play</span>Balance
          </span>
        </Link>
        <div className="ml-auto"><NotificationsPopover /></div>
      </div>
    </header>
  )
}
