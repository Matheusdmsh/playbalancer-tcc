"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { UserNav } from "@/components/user-nav"
import { UserSidebar } from "@/components/user-sidebar"
import { FeedbackButton } from "@/components/feedback-button"
import { EmailVerificationBanner } from "@/components/email-verification-banner"


// 👇 Adicione aqui as rotas que devem ser públicas, mesmo estando na pasta /user
const publicUserRoutes = [
  '/user/verify-email',
  '/user/reset-password-form',
];

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const isGroupRoute = pathname.startsWith('/user/group/')
  const isBookingRoute = pathname.startsWith('/user/booking/')

  // Verifica se a rota atual começa com alguma das rotas públicas definidas
  const isPublicRoute = publicUserRoutes.some(route => pathname.startsWith(route));

  // Se for uma rota pública, renderiza apenas o conteúdo da página, sem o layout de usuário
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Se for uma rota privada, renderiza o layout completo do dashboard do usuário
  // <FeedbackButton />
  return (
    <div className="flex min-h-screen bg-black text-white">
      <UserSidebar 
        collapsed={isCollapsed} 
        onToggleCollapse={() => setIsCollapsed(v => !v)}
        mobileOpen={mobileMenuOpen}
        onMobileOpenChange={setMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
        {(!isGroupRoute && !isBookingRoute) && (
          <UserNav 
            isCollapsed={isCollapsed} 
            onToggleCollapse={() => setIsCollapsed(v => !v)}
            onMobileMenuToggle={() => setMobileMenuOpen(true)}
          />
        )}
        {isGroupRoute || isBookingRoute ? (
          <main className="flex-1 min-h-0">
            <EmailVerificationBanner />
            {children}
          </main>
        ) : (
          <main className="flex-1 min-h-0 overflow-auto">
            <EmailVerificationBanner />
            {children}
          </main>
        )}
      </div>
    </div>
  )
}