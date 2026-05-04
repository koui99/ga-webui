import type { Metadata, Viewport } from "next"
import { Source_Sans_3, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans-app",
  display: "swap",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-app",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Generic Agent · 通用智能体",
  description: "GenericAgent 现代化 Web 工作台：流式对话，支持粘贴图片、对话流中生成图片",
}

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${sans.variable} ${mono.variable} bg-background`}>
      <body className="font-sans antialiased text-foreground">
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}

