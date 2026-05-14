"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Activity, Users, Database, Server, MessageSquare, ArrowLeft, Menu, FileText, CreditCard, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/services/users"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export const rachinhaNavItems = [
  {
    name: "Visão Geral",
    href: "/rachinha",
    icon: Activity,
  },
  {
    name: "Usuários",
    href: "/rachinha/users",
    icon: Users,
  },
  {
    name: "Conteúdo & Uso",
    href: "/rachinha/content",
    icon: Database,
  },
  {
    name: "Técnico",
    href: "/rachinha/technical",
    icon: Server,
  },
  {
    name: "Feedbacks",
    href: "/rachinha/feedbacks",
    icon: MessageSquare,
  },
  {
    name: "Transações",
    href: "/rachinha/transactions",
    icon: CreditCard,
  },
  {
    name: "Acessos do App",
    href: "/rachinha/logs",
    icon: ShieldCheck,
  },
]

export default function RachinhaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    async function verify() {
      try {
        const u = await getCurrentUser()
        if (!u?.role?.includes("rachinha")) {
          router.push("/")
        } else {
          setUser(u)
        }
      } catch (error) {
        router.push("/")
      }
    }
    verify()
  }, [router])

  const SidebarContent = () => (
    <>
      <div className="flex items-center mb-8 px-2 mt-4">
        <span className="flex items-center justify-center p-2 bg-red-600 rounded-lg mr-3 shadow-lg shadow-red-500/20">
          <Activity className="h-5 w-5 text-white" />
        </span>
        <span className="text-xl font-bold font-mono tracking-tight text-white">
          rachinha<span className="text-red-500">admin</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {rachinhaNavItems.map((item) => {
          const isActive = item.href === '/rachinha'
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center justify-start gap-4 rounded-xl px-4 py-3 text-sm transition-all font-medium",
                isActive
                  ? "bg-red-500/10 text-red-500 border border-red-500/20 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-red-500" : "text-zinc-500")} />
              {item.name}
            </Link>
          )
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-zinc-800/50 space-y-4">
        <Link
          href="/user/group"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar ao App
        </Link>

        {user && (
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
            <Avatar className="h-9 w-9 border border-zinc-700">
              <AvatarImage src={user.photo_url} />
              <AvatarFallback className="bg-zinc-800 text-xs">{(user.name || 'U').split(' ').map((n: any) => n[0]).slice(0, 2).join('').toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{user.name}</span>
              <span className="text-xs text-red-400 font-mono">acesso_root</span>
            </div>
          </div>
        )}
      </div>
    </>
  )

  if (!user) return <div className="h-screen w-screen bg-black flex items-center justify-center text-red-500 font-mono animate-pulse">Verifying credentials...</div>

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-100 selection:bg-red-500/30">
      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="bg-[#0a0a0a] border-r border-zinc-800 p-4 w-[280px] flex flex-col">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex sticky top-0 flex-col bg-[#0a0a0a] border-r border-zinc-800/80 p-5 h-screen w-[280px] shrink-0">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen">
        {/* Mobile Header purely to open the drawer */}
        <header className="md:hidden flex items-center h-16 px-4 border-b border-zinc-800/50 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-40">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="text-zinc-400">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-4 font-mono font-bold text-red-500">Rachinha | Admin</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
