import type React from "react"
import { Roboto_Mono } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import localFont from "next/font/local"
import ClientLayout from "@/components/client-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
})

const rebelGrotesk = localFont({
  src: "../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    template: "%s – M.O.N.K.Y OS",
    default: "M.O.N.K.Y OS",
  },
  description: "The ultimate OS for rebels. Making the web for brave individuals.",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preload" href="/fonts/Rebels-Fett.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased dark`}>
        <ClientLayout>
          <ProtectedRoute>
            {children}
          </ProtectedRoute>
        </ClientLayout>
      </body>
    </html>
  )
}
