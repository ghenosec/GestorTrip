"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"

type Status = { type: "success" | "error"; message: string } | null

export function Configuracoes() {
  const [exportStatus, setExportStatus] = useState<Status>(null)
  const [importStatus, setImportStatus] = useState<Status>(null)
  const [exporting, setExporting]       = useState(false)
  const [importing, setImporting]       = useState(false)

  async function handleExport() {
    setExporting(true)
    setExportStatus(null)
    try {
      const result = await window.electronAPI.exportDb()
      if (result.canceled) { setExporting(false); return }
      if (result.success) {
        setExportStatus({ type: "success", message: `Backup salvo com sucesso.` })
      } else {
        setExportStatus({ type: "error", message: result.error ?? "Erro ao exportar." })
      }
    } catch {
      setExportStatus({ type: "error", message: "Erro inesperado ao exportar." })
    } finally {
      setExporting(false)
    }
  }

  async function handleImport() {
    setImporting(true)
    setImportStatus(null)
    try {
      const result = await window.electronAPI.importDb()
      if (result.canceled) { setImporting(false); return }
      if (result.success) {
        setImportStatus({ type: "success", message: "Banco importado com sucesso. Reinicie o app para garantir que tudo seja recarregado." })
      } else {
        setImportStatus({ type: "error", message: result.error ?? "Erro ao importar." })
      }
    } catch {
      setImportStatus({ type: "error", message: "Erro inesperado ao importar." })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground">Configurações</h2>
        <p className="text-sm text-muted-foreground">Gerencie seus dados e preferências</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Backup dos dados</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Exporte o banco de dados para salvar uma cópia de segurança. Em caso de troca de computador,
            instale o GestorTrip no novo dispositivo e importe o arquivo de backup para restaurar todos os seus dados.
          </p>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Exportar banco de dados</p>
                <p className="text-xs text-muted-foreground">Salva um arquivo .db com todos os seus dados</p>
              </div>
              <Button size="sm" onClick={handleExport} disabled={exporting} className="shrink-0 gap-2">
                {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Exportar
              </Button>
            </div>
            {exportStatus && (
              <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
                exportStatus.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}>
                {exportStatus.type === "success"
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                }
                {exportStatus.message}
              </div>
            )}
          </div>

          <div className="border-t" />

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Importar banco de dados</p>
                <p className="text-xs text-muted-foreground dark:text-amber-400">
                  ⚠ Substitui todos os dados atuais pelo arquivo importado
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleImport} disabled={importing} className="shrink-0 gap-2">
                {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                Importar
              </Button>
            </div>
            {importStatus && (
              <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
                importStatus.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-destructive/30 bg-destructive/5 text-destructive"
              }`}>
                {importStatus.type === "success"
                  ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  : <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                }
                {importStatus.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}