"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UpdateBanner() {
  const [updateInfo, setUpdateInfo] = useState<{ version: string } | null>(null)
  const [dismissed, setDismissed]   = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI?.onUpdateDownloaded) return

    window.electronAPI.onUpdateDownloaded((info) => {
      setUpdateInfo(info)
      setDismissed(false)
    })
  }, [])

  if (!updateInfo || dismissed) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-primary/20 bg-background shadow-lg">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Download className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Nova versão disponível
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Versão {updateInfo.version} baixada e pronta para instalar.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => window.electronAPI.installUpdate()}
            >
              Atualizar agora
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-3 text-muted-foreground"
              onClick={() => setDismissed(true)}
            >
              Depois
            </Button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}