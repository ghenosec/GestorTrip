"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "pago" | "pendente"
  className?: string
  onClick?: () => void
}

export function StatusBadge({ status, className, onClick }: StatusBadgeProps) {
  const isClickable = !!onClick

  return (
    <Badge
      variant="secondary"
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        "font-medium text-xs",
        status === "pago"
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
          : "bg-amber-100 text-amber-800 hover:bg-amber-200",
        isClickable && "cursor-pointer select-none transition-colors",
        className
      )}
    >
      {status === "pago" ? "Pago" : "Pendente"}
    </Badge>
  )
}

interface ViagemStatusBadgeProps {
  status: "ativa" | "finalizada"
  className?: string
}

export function ViagemStatusBadge({ status, className }: ViagemStatusBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-medium text-xs",
        status === "ativa"
          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
          : "bg-red-100 text-red-800 hover:bg-red-100",
        className
      )}
    >
      {status === "ativa" ? "Ativa" : "Finalizada"}
    </Badge>
  )
}
