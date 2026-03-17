"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ClienteStatus = "pago" | "pendente" | "a_confirmar"

interface StatusBadgeProps {
  status: ClienteStatus
  className?: string
  onClick?: () => void
}

export function StatusBadge({ status, className, onClick }: StatusBadgeProps) {
  const isClickable = !!onClick

  const styles: Record<ClienteStatus, string> = {
    pago:         "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    pendente:     "bg-amber-100 text-amber-800 hover:bg-amber-200",
    a_confirmar:  "bg-slate-100 text-slate-600 hover:bg-slate-200",
  }
  const labels: Record<ClienteStatus, string> = {
    pago:        "Pago",
    pendente:    "Pendente",
    a_confirmar: "A confirmar",
  }

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
        styles[status] ?? styles.a_confirmar,
        isClickable && "cursor-pointer select-none transition-colors",
        className
      )}
    >
      {labels[status] ?? "A confirmar"}
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