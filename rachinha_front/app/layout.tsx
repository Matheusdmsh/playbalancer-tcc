import type React from "react"
import type { Metadata } from "next"
import { Inter, Rajdhani } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import Script from "next/script"
import { GoogleOAuthProvider } from "@react-oauth/google"


const inter = Inter({ subsets: ["latin"] })
const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-card-display",
})

export const metadata: Metadata = {
  title: "Rachinha - Organize rachas e reserva de Quadras",
  description: "Organize seus rachas, encontre e reserve quadras esportivas perto de você",
  icons: {
    icon: "/assets/logo.svg",
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
        <Script
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/auth/js/appleid.auth.js"
          strategy="afterInteractive"
        />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <GoogleOAuthProvider clientId="305125317838-3igdlb4t8qmfkeeo993gg5ufo828359g.apps.googleusercontent.com">
            {children}
          </GoogleOAuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
