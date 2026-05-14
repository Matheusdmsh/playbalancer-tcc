"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { userNavItems } from "@/components/user-sidebar"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-[60] border-t border-[#083818] bg-[#021003]/95 backdrop-blur">
      <div className="flex items-center justify-around h-16 pt-2 pb-[env(safe-area-inset-bottom)]">
        {userNavItems.map((item) => {
          const isActive = item.href === "/user"
            ? pathname === item.href
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-1 text-xs",
                isActive ? "text-green-400" : "text-zinc-400"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-green-400" : "text-zinc-400")} />
              <span className="leading-none">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>,
    document.body
  )
}
