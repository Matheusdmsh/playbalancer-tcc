import type React from "react"
import type { Metadata } from "next"
import { Inter, Rajdhani } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"


const inter = Inter({ subsets: ["latin"] })
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-card-display",
})

export const metadata: Metadata = {
  title: "PlayBalance",
  description: "Organize partidas, monte times equilibrados e gerencie sua turma esportiva.",
  icons: {
    icon: "/assets/logobalanca.svg",
  },
    
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} ${rajdhani.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
