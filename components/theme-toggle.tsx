"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "sidebar" | "page"
  className?: string
}

export function ThemeToggle({ variant = "sidebar", className }: ThemeToggleProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  function handleToggle() {
    const next = resolvedTheme === "dark" ? "light" : "dark"
    setTheme(next)
    if (typeof window !== "undefined" && window.electronAPI?.setTheme) {
      window.electronAPI.setTheme(next)
    }
  }

  if (!mounted) return null

  const isDark = resolvedTheme === "dark"

  if (variant === "page") {
    return (
      <button
        onClick={handleToggle}
        title={isDark ? "Modo claro" : "Modo escuro"}
        className={cn(
          "absolute top-4 right-4 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
          className
        )}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      title={isDark ? "Modo claro" : "Modo escuro"}
      className={cn(
        "w-full justify-start gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        "group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        className
      )}
    >
      {isDark ? <Sun className="h-3.5 w-3.5 shrink-0" /> : <Moon className="h-3.5 w-3.5 shrink-0" />}
      <span className="group-data-[collapsible=icon]:hidden">
        {isDark ? "Modo claro" : "Modo escuro"}
      </span>
    </Button>
  )
}