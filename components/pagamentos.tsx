"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import { formatCurrency, getValorPago, getValorPendente } from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import type { Pagamento } from "@/lib/data"

const FORMAS = ["pix", "dinheiro", "cartão", "transferência"] as const
const FORMAS_LABEL: Record<string, string> = {
  pix: "PIX",
  dinheiro: "Dinheiro",
  cartão: "Cartão",
  transferência: "Transferência",
}

export function Pagamentos() {
  const { pagamentos, clientes, viagens, addPagamentoHistorico, deletePagamento, getClienteById, getViagemById } = useStore()

  const [search, setSearch]           = useState("")
  const [viagemFilter, setViagemFilter] = useState("todas")
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  const [parcelaOpen, setParcelaOpen]     = useState(false)
  const [parcelaPagId, setParcelaPagId]   = useState<string | null>(null)
  const [parcelaValor, setParcelaValor]   = useState("")
  const [parcelaForma, setParcelaForma]   = useState<typeof FORMAS[number]>("pix")
  const [parcelaData, setParcelaData]     = useState(new Date().toISOString().slice(0, 10))
  const [parcelaObs, setParcelaObs]       = useState("")
  const [parcelaSaving, setParcelaSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return pagamentos.filter((p) => {
      const cliente = getClienteById(p.clienteId)
      const viagem  = getViagemById(p.viagemId)
      const matchSearch = q === "" ||
        (cliente?.nomeCompleto.toLowerCase().includes(q)) ||
        (viagem?.nome.toLowerCase().includes(q))
      const matchViagem = viagemFilter === "todas" || p.viagemId === viagemFilter
      return matchSearch && matchViagem
    })
  }, [pagamentos, search, viagemFilter, getClienteById, getViagemById])

  function openParcela(pagId: string) {
    setParcelaPagId(pagId)
    setParcelaValor("")
    setParcelaForma("pix")
    setParcelaData(new Date().toISOString().slice(0, 10))
    setParcelaObs("")
    setParcelaOpen(true)
  }

  async function handleSaveParcela() {
    const valor = parseFloat(parcelaValor.replace(",", "."))
    if (!parcelaPagId || isNaN(valor) || valor <= 0) {
      toast.error("Informe um valor válido"); return
    }
    const pag = pagamentos.find((p) => p.id === parcelaPagId)
    if (!pag) return
    const pendente = getValorPendente(pag)
    if (valor > pendente + 0.01) {
      toast.error(`Valor excede o pendente (${formatCurrency(pendente)})`); return
    }

    setParcelaSaving(true)
    try {
      await addPagamentoHistorico(parcelaPagId, {
        valor,
        formaPagamento: parcelaForma,
        data: parcelaData,
        observacao: parcelaObs.trim() || undefined,
      })
      toast.success("Pagamento registrado com sucesso")
      setParcelaOpen(false)
    } catch {
      toast.error("Erro ao registrar pagamento")
    } finally {
      setParcelaSaving(false)
    }
  }

  async function handleDeletePagamento() {
    if (!deleteId) return
    try {
      await deletePagamento(deleteId)
      toast.success("Registro de pagamento removido")
      setDeleteId(null)
      if (expandedId === deleteId) setExpandedId(null)
    } catch {
      toast.error("Erro ao remover pagamento")
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Pagamentos</h2>
        <span className="text-xs text-muted-foreground">{filtered.length} registros</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Buscar por cliente ou viagem..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={viagemFilter} onValueChange={setViagemFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Todas as viagens" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as viagens</SelectItem>
            {viagens.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Viagem</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead className="hidden sm:table-cell">Pendente</TableHead>
              <TableHead className="hidden lg:table-cell">Progresso</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Nenhum pagamento registrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const cliente  = getClienteById(p.clienteId)
                const viagem   = getViagemById(p.viagemId)
                const pago     = getValorPago(p)
                const pendente = getValorPendente(p)
                const pct      = p.valorTotal > 0 ? Math.round((pago / p.valorTotal) * 100) : 0
                const isExpanded = expandedId === p.id

                return (
                  <>
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {isExpanded
                            ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          }
                          <div>
                            <p className="font-medium text-sm">{cliente?.nomeCompleto ?? "—"}</p>
                            <StatusBadge status={cliente?.status ?? "pendente"} className="mt-0.5" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {viagem?.nome ?? <span className="italic text-xs">Viagem removida</span>}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{formatCurrency(p.valorTotal)}</TableCell>
                      <TableCell className="text-sm text-emerald-600 font-medium">{formatCurrency(pago)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-amber-600">{formatCurrency(pendente)}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-2 min-w-25">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {pendente > 0.01 && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => openParcela(p.id)}>
                              <Plus className="h-3 w-3" />
                              Pagar
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            title="Apagar registro de pagamento"
                            onClick={() => setDeleteId(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Linha expandida — histórico de parcelas */}
                    {isExpanded && (
                      <TableRow key={`${p.id}-hist`} className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={7} className="py-3 px-6">
                          {p.historico.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic">Nenhum pagamento realizado ainda.</p>
                          ) : (
                            <div className="flex flex-col gap-1.5">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Histórico de pagamentos</p>
                              {p.historico.map((h, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs">
                                  <span className="text-muted-foreground w-24 shrink-0">{h.data}</span>
                                  <Badge variant="secondary" className="text-xs shrink-0">
                                    {FORMAS_LABEL[h.formaPagamento] ?? h.formaPagamento}
                                  </Badge>
                                  <span className="font-semibold text-emerald-600">{formatCurrency(h.valor)}</span>
                                  {h.observacao && (
                                    <span className="text-muted-foreground truncate">{h.observacao}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal — registrar parcela */}
      <Dialog open={parcelaOpen} onOpenChange={setParcelaOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              {(() => {
                const pag = pagamentos.find((p) => p.id === parcelaPagId)
                const cliente = pag ? getClienteById(pag.clienteId) : null
                const pendente = pag ? getValorPendente(pag) : 0
                return `${cliente?.nomeCompleto ?? ""} — Pendente: ${formatCurrency(pendente)}`
              })()}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Valor pago (R$)</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
                value={parcelaValor}
                onChange={(e) => setParcelaValor(e.target.value)}
                className="h-9 text-sm"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Forma de pagamento</Label>
              <Select value={parcelaForma} onValueChange={(v) => setParcelaForma(v as typeof FORMAS[number])}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS.map((f) => (
                    <SelectItem key={f} value={f}>{FORMAS_LABEL[f]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Data do pagamento</Label>
              <Input
                type="date"
                value={parcelaData}
                onChange={(e) => setParcelaData(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Observação (opcional)</Label>
              <Input
                placeholder="Ex: entrada, 1ª parcela..."
                value={parcelaObs}
                onChange={(e) => setParcelaObs(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setParcelaOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSaveParcela} disabled={parcelaSaving}>
              {parcelaSaving ? "Salvando…" : "Confirmar pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar exclusão */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar registro de pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá permanentemente este registro e todo o histórico de pagamentos vinculado.
              O status do cliente <strong>não</strong> será alterado automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePagamento}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}