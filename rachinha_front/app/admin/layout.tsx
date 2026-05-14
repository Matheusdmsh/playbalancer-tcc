"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { AdminNav } from "@/components/admin-nav"
import { AdminSidebar } from "@/components/admin-sidebar"
import { EmailVerificationBanner } from "@/components/email-verification-banner"

const publicAdminRoutes: string[] = [
  '/admin/verify-email',
  '/admin/reset-password-form',
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  
  // Rotas que não exibem a navbar superior
  const isChatRoute = pathname.startsWith('/admin/chat')

  // Verifica se é uma rota pública baseada no array
  const isPublicRoute = publicAdminRoutes.some(route => pathname.startsWith(route));

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      <AdminSidebar 
        collapsed={isCollapsed} 
        onToggleCollapse={() => setIsCollapsed(v => !v)}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col min-h-0">
        {!isChatRoute && (
          <AdminNav 
            isCollapsed={isCollapsed} 
            onToggleCollapse={() => setIsCollapsed(v => !v)}
            onMobileMenuToggle={() => setMobileMenuOpen(true)}
          />
        )}
        <main className="flex-1 min-h-0 overflow-auto bg-black p-0 md:p-6">
          <EmailVerificationBanner />
          {children}
        </main>
      </div>
    </div>
  )
}
