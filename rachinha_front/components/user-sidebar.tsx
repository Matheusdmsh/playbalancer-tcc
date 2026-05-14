// rachinha-front - Copia/components/user-sidebar.tsx
"use client"

import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { Calendar, MessageCircle, Users, Menu, ShieldAlert, Home } from "lucide-react"
import { cn } from "@/lib/utils"
import { RoleSwitcher } from "@/components/role-switcher"
import { useEffect, useState } from "react"
import { getCurrentUser } from "@/services/users"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"



export const userNavItems = [ // Add 'export' here
  {
    name: "Home",
    href: "/user/home",
    icon: Home,
  },
  // {
  //   name: "Dashboard",
  //   href: "/user",
  //   icon: Home,
  // },
  {
    name: "Grupos",
    href: "/user/group",
    icon: Users,
  },
  {
    name: "Agenda",
    href: "/user/booking",
    icon: Calendar,
  },
  {
    name: "Mensagens",
    href: "/user/chat",
    icon: MessageCircle,
  },
]

interface UserSidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  mobileOpen?: boolean
  onMobileOpenChange?: (open: boolean) => void
}

export function UserSidebar({ collapsed = false, onToggleCollapse, mobileOpen = false, onMobileOpenChange }: UserSidebarProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function fetchUser() {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    fetchUser()
  }, [])

  const SidebarContent = () => (
    <>
      <div className="flex items-center mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleCollapse && onToggleCollapse()}
          className="text-zinc-300 hover:text-green-400 h-10 w-full justify-start pl-2 md:flex hidden"
          aria-label={collapsed ? "Abrir menu" : "Fechar menu"}
        >
          <span className="flex h-8 w-8 items-center justify-center">
            <Menu className="h-5 w-5" />
          </span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1">
        {userNavItems.map((item) => {
          const isActive = item.href === '/user' 
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onMobileOpenChange?.(false)}
              className={cn(
                "group flex items-center justify-start gap-3 rounded-lg pl-2 pr-2 py-2 text-sm transition-colors",
                isActive ? "bg-[#04321a] text-white" : "text-zinc-400 hover:text-white hover:bg-[#04321a]"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center flex-shrink-0">
                <item.icon className={cn("h-5 w-5", isActive ? "text-green-400" : "text-zinc-400 group-hover:text-green-400")} />
              </span>
              <span
                className={cn(
                  "whitespace-nowrap overflow-hidden transition-all duration-200",
                  collapsed ? "md:absolute md:opacity-0 md:pointer-events-none" : "md:relative md:opacity-100"
                )}
              >
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
      
      <div className="mt-auto pt-4 border-t border-zinc-800">
        {user && (
          <div className="flex items-center gap-2">
            <Link
              href="/user/profile"
              onClick={() => onMobileOpenChange?.(false)}
              className={cn(
                "group flex items-center justify-start gap-3 flex-1 rounded-lg pl-2 pr-2 py-2 text-sm transition-colors",
                "hover:bg-[#04321a] hover:text-white"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center flex-shrink-0">
                <Avatar className="h-8 w-8 transition-transform group-hover:scale-105">
                  <AvatarImage src={user.photo_url} alt={user.name} />
                  <AvatarFallback>{(user.name || 'U').split(' ').map((n:any)=>n[0]).slice(0,2).join('').toUpperCase()}</AvatarFallback>
                </Avatar>
              </span>
              <span
                className={cn(
                  "whitespace-nowrap overflow-hidden transition-all duration-200 font-medium",
                  collapsed ? "md:absolute md:opacity-0 md:pointer-events-none" : "md:relative md:opacity-100"
                )}
              >
                {user.name}
              </span>
            </Link>
          </div>
        )}

        {user?.role?.includes('admin') && (
          <div className="mt-3">
            <RoleSwitcher />
          </div>
        )}

        {user?.role?.includes('rachinha') && (
          <div className="mt-3 border-t border-zinc-800/50 pt-3">
            <Link
              href="/rachinha"
              onClick={() => onMobileOpenChange?.(false)}
              className={cn(
                "group flex items-center justify-start gap-3 flex-1 rounded-lg pl-2 pr-2 py-2 text-sm transition-colors",
                "bg-red-950/30 text-red-500 hover:bg-red-900/40 hover:text-red-400"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center flex-shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </span>
              <span
                className={cn(
                  "whitespace-nowrap overflow-hidden transition-all duration-200 font-bold",
                  collapsed ? "md:w-0 md:opacity-0" : "md:w-auto md:opacity-100"
                )}
              >
                Rachinha Admin
              </span>
            </Link>
          </div>
        )}
      </div>
    </>
  )

  return (
    <>
      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="bg-black border-zinc-800 p-4 w-64 flex flex-col">
          <SheetTitle className="sr-only">Menu de navegacao do usuario</SheetTitle>
          <div className="mt-6 mb-2"></div>
          <div className="flex-1 flex flex-col min-h-0">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex sticky top-0 flex-col bg-zinc-900/40 mr-2 p-4 transition-all h-screen overflow-hidden",
        collapsed ? 'w-20' : 'w-56'
      )}>
        <SidebarContent />
      </div>
    </>
  )
}