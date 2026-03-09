"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Upload, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react"

type Status = { type: "success" | "error"; message: string } | null

export function Configuracoes() {
  const { reloadAll, clientes, viagens, pagamentos } = useStore()

  const [exportStatus,  setExportStatus]  = useState<Status>(null)
  const [importStatus,  setImportStatus]  = useState<Status>(null)
  const [excelStatus,   setExcelStatus]   = useState<Status>(null)
  const [exporting,     setExporting]     = useState(false)
  const [importing,     setImporting]     = useState(false)
  const [exportingXlsx, setExportingXlsx] = useState(false)

  async function handleExport() {
    setExporting(true)
    setExportStatus(null)
    try {
      const result = await window.electronAPI.exportDb()
      if (result.canceled) { setExporting(false); return }
      setExportStatus(
        result.success
          ? { type: "success", message: "Backup salvo com sucesso." }
          : { type: "error",   message: result.error ?? "Erro ao exportar." }
      )
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
        await reloadAll()
        setImportStatus({ type: "success", message: "Banco importado e dados recarregados com sucesso!" })
      } else {
        setImportStatus({ type: "error", message: result.error ?? "Erro ao importar." })
      }
    } catch {
      setImportStatus({ type: "error", message: "Erro inesperado ao importar." })
    } finally {
      setImporting(false)
    }
  }

  async function handleExportExcel() {
    setExportingXlsx(true)
    setExcelStatus(null)
    try {
      const clientesData = clientes.map((c) => ({
        "Nome Completo":    c.nomeCompleto,
        "CPF":              c.cpf,
        "RG":               c.rg,
        "Data Nascimento":  c.dataNascimento,
        "Telefone":         c.telefone,
        "Email":            c.email,
        "Endereço":         c.endereco,
        "Observações":      c.observacoes,
        "Status":           c.status,
      }))

      const viagensData = viagens.map((v) => ({
        "Nome":             v.nome,
        "Destino":          v.destino,
        "Data Ida":         v.dataIda,
        "Data Volta":       v.dataVolta,
        "Valor por Pessoa": v.valorPorPessoa,
        "Status":           v.status,
        "Clientes":         clientes.filter((c) => c.viagemId === v.id).length,
      }))

      const pagamentosData = pagamentos.flatMap((p) => {
        const cliente = clientes.find((c) => c.id === p.clienteId)
        const viagem  = viagens.find((v) => v.id === p.viagemId)
        if (p.historico.length === 0) {
          return [{
            "Cliente":         cliente?.nomeCompleto ?? p.clienteId,
            "Viagem":          viagem?.destino       ?? p.viagemId,
            "Valor Total":     p.valorTotal,
            "Valor":           0,
            "Forma Pagamento": "-",
            "Data":            "-",
            "Observação":      "",
          }]
        }
        return p.historico.map((h) => ({
          "Cliente":         cliente?.nomeCompleto ?? p.clienteId,
          "Viagem":          viagem?.destino       ?? p.viagemId,
          "Valor Total":     p.valorTotal,
          "Valor":           h.valor,
          "Forma Pagamento": h.formaPagamento,
          "Data":            h.data,
          "Observação":      h.observacao ?? "",
        }))
      })

      const result = await window.electronAPI.exportExcel({
        clientes:   clientesData,
        viagens:    viagensData,
        pagamentos: pagamentosData,
      })

      if (result.canceled) { setExportingXlsx(false); return }
      setExcelStatus(
        result.success
          ? { type: "success", message: "Planilha Excel exportada com sucesso!" }
          : { type: "error",   message: result.error ?? "Erro ao exportar Excel." }
      )
    } catch (e) {
      console.error("EXCEL ERROR:", e)
      setExcelStatus({ type: "error", message: "Erro inesperado ao gerar Excel." })
    } finally {
      setExportingXlsx(false)
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
            {exportStatus && <StatusMessage status={exportStatus} />}
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
            {importStatus && <StatusMessage status={importStatus} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Exportar para Excel</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gera uma planilha <strong>.xlsx</strong> com três abas: <em>Clientes</em>, <em>Viagens</em> e <em>Pagamentos</em>.
            Útil para análises externas ou compartilhamento.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Exportar planilha completa</p>
                <p className="text-xs text-muted-foreground">Clientes, Viagens e Pagamentos em abas separadas</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={exportingXlsx} className="shrink-0 gap-2">
                {exportingXlsx
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <FileSpreadsheet className="h-3.5 w-3.5" />
                }
                Exportar Excel
              </Button>
            </div>
            {excelStatus && <StatusMessage status={excelStatus} />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Sobre o aplicativo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-xs text-muted-foreground leading-relaxed">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">GestorTrip v1.0</p>
            <p>Sistema de Gestão de Viagens</p>
          </div>
          <div className="border-t my-2" />
          <p>© 2026 Ghenosec. Todos os direitos reservados.</p>
          <p>
            Este software é licenciado, não vendido.
            O uso é permitido apenas conforme os termos da licença.
            É proibida a engenharia reversa, descompilação ou redistribuição.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function StatusMessage({ status }: { status: { type: "success" | "error"; message: string } }) {
  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2 text-xs ${
      status.type === "success"
        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        : "border-destructive/30 bg-destructive/5 text-destructive"
    }`}>
      {status.type === "success"
        ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        : <AlertCircle  className="h-3.5 w-3.5 shrink-0 mt-0.5" />
      }
      {status.message}
    </div>
  )
}