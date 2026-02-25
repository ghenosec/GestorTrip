"use client"

import { ThemeProvider } from "next-themes"
import { useEffect } from "react"
import type { ReactNode } from "react"

function ElectronThemeSync() {
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!window.electronAPI?.getTheme) return

    window.electronAPI.getTheme().then((theme) => {
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(theme)
    })
  }, [])

  return null
}

export function ElectronThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ElectronThemeSync />
      {children}
    </ThemeProvider>
  )
}