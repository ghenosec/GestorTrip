import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import { ElectronThemeProvider } from "@/components/electron-theme-provider"
import './globals.css'

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'GestorTrip - Gestão de Viagens',
  description: 'Sistema de gestão para agências de viagens. Gerencie clientes, viagens e pagamentos em um só lugar.',
  icons: {
    icon: [
      { url: '/globo.png', media: '(prefers-color-scheme: light)' },
      { url: '/globo.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#4338ca',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geist.className} font-sans antialiased`}>
        <ElectronThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
          <Analytics />
        </ElectronThemeProvider>
      </body>
    </html>
  )
}