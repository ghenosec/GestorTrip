"use client"

import React, { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import {
  formatCurrency,
  formatDate,
  getValorPago,
  getValorPendente,
} from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, Plus, DollarSign } from "lucide-react"
import { toast } from "sonner"

const formaLabels: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  dinheiro: "Dinheiro",
  transferencia: "Transferência",
}

export function Pagamentos() {
  const {
    pagamentos,
    clientes,
    getClienteById,
    getViagemById,
    addPagamentoHistorico,
  } = useStore()

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPagamentoId, setSelectedPagamentoId] = useState<string | null>(
    null
  )

  const [paymentForm, setPaymentForm] = useState({
    valor: "",
    formaPagamento: "pix",
    data: new Date().toISOString().split("T")[0],
    observacao: "",
  })

  function openPaymentDialog(pagamentoId: string) {
    setSelectedPagamentoId(pagamentoId)
    setPaymentForm({
      valor: "",
      formaPagamento: "pix",
      data: new Date().toISOString().split("T")[0],
      observacao: "",
    })
    setDialogOpen(true)
  }

  function handleAddPayment() {
    if (!selectedPagamentoId) return

    const valor = parseFloat(paymentForm.valor)
    if (!valor || valor <= 0) {
      toast.error("Informe um valor válido")
      return
    }

    const pagamento = pagamentos.find((p) => p.id === selectedPagamentoId)
    if (pagamento) {
      const pendente = getValorPendente(pagamento)
      if (valor > pendente) {
        toast.error(`Valor excede o pendente (${formatCurrency(pendente)})`)
        return
      }
    }

    addPagamentoHistorico(selectedPagamentoId, {
      valor,
      formaPagamento: paymentForm.formaPagamento as
        | "pix"
        | "cartão"
        | "dinheiro"
        | "transferência",
      data: paymentForm.data,
      observacao: paymentForm.observacao || undefined,
    })
    toast.success("Pagamento registrado com sucesso")
    setDialogOpen(false)
  }

  const sortedPagamentos = useMemo(() => {
    return [...pagamentos].sort((a, b) => {
      const aPendente = getValorPendente(a)
      const bPendente = getValorPendente(b)
      if (aPendente > 0 && bPendente === 0) return -1
      if (aPendente === 0 && bPendente > 0) return 1
      const aCliente = clientes.find((c) => c.id === a.clienteId)
      const bCliente = clientes.find((c) => c.id === b.clienteId)
      return (aCliente?.nomeCompleto ?? "").localeCompare(
        bCliente?.nomeCompleto ?? ""
      )
    })
  }, [pagamentos, clientes])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">Pagamentos</h2>
        <div className="text-sm text-muted-foreground">
          {pagamentos.length} registros
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Viagem</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="hidden sm:table-cell">Pago</TableHead>
              <TableHead className="hidden sm:table-cell">Pendente</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPagamentos.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  Nenhum pagamento registrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedPagamentos.map((p) => {
                const cliente = getClienteById(p.clienteId)
                const viagem = getViagemById(p.viagemId)
                const pago = getValorPago(p)
                const pendente = getValorPendente(p)
                const pct =
                  p.valorTotal > 0 ? (pago / p.valorTotal) * 100 : 0
                const isExpanded = expandedId === p.id

                return (
                  <React.Fragment key={p.id}>
                    <TableRow className="group">
                      <TableCell>
                        {p.historico.length > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              setExpandedId(isExpanded ? null : p.id)
                            }
                            aria-expanded={isExpanded}
                          >
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                            />
                            <span className="sr-only">Expandir histórico</span>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-card-foreground">
                            {cliente?.nomeCompleto ?? "---"}
                          </span>
                          <StatusBadge
                            status={pendente <= 0 ? "pago" : "pendente"}
                            className="mt-1 w-fit"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {viagem?.nome ?? "---"}
                      </TableCell>
                      <TableCell className="font-medium text-card-foreground">
                        {formatCurrency(p.valorTotal)}
                      </TableCell>
                      <TableCell className="hidden font-medium text-emerald-600 sm:table-cell">
                        {formatCurrency(pago)}
                      </TableCell>
                      <TableCell className="hidden font-medium text-amber-600 sm:table-cell">
                        {formatCurrency(pendente)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={pct} className="h-2 w-20" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {pendente > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openPaymentDialog(p.id)}
                          >
                            <DollarSign className="mr-1 h-3.5 w-3.5" />
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>

                    {isExpanded && p.historico.length > 0 && (
                      <tr>
                        <td colSpan={8} className="p-0">
                          <div className="border-t bg-muted/30 px-6 py-3">
                            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Historico de Pagamentos
                            </h4>
                            <div className="flex flex-col gap-2">
                              {p.historico.map((h) => (
                                <div
                                  key={h.id}
                                  className="flex items-center justify-between rounded-md bg-card px-3 py-2 text-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-card-foreground">
                                      {formatCurrency(h.valor)}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {formaLabels[h.formaPagamento]}
                                    </Badge>
                                    {h.observacao && (
                                      <span className="text-xs text-muted-foreground">
                                        {h.observacao}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(h.data)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
            <DialogDescription>
              Informe os dados do pagamento a ser registrado.
            </DialogDescription>
          </DialogHeader>
          {selectedPagamentoId &&
            (() => {
              const p = pagamentos.find(
                (pg) => pg.id === selectedPagamentoId
              )
              const cliente = p ? getClienteById(p.clienteId) : null
              const pendente = p ? getValorPendente(p) : 0
              return (
                <div className="flex flex-col gap-4 py-2">
                  {cliente && (
                    <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">
                        {"Cliente:"}
                      </span>{" "}
                      <span className="font-medium text-foreground">
                        {cliente.nomeCompleto}
                      </span>
                      <span className="ml-3 text-muted-foreground">
                        {"Pendente: "}
                        <span className="font-medium text-amber-600">
                          {formatCurrency(pendente)}
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="pvalor">{"Valor (R$) *"}</Label>
                    <Input
                      id="pvalor"
                      type="number"
                      min={0}
                      step={0.01}
                      max={pendente}
                      value={paymentForm.valor}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          valor: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="pforma">Forma de pagamento</Label>
                      <Select
                        value={paymentForm.formaPagamento}
                        onValueChange={(v) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            formaPagamento: v,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pix">Pix</SelectItem>
                          <SelectItem value="cartao">Cartão</SelectItem>
                          <SelectItem value="dinheiro">Dinheiro</SelectItem>
                          <SelectItem value="transferencia">
                            Transferência
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="pdata">Data</Label>
                      <Input
                        id="pdata"
                        type="date"
                        value={paymentForm.data}
                        onChange={(e) =>
                          setPaymentForm((prev) => ({
                            ...prev,
                            data: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pobs">{"Observação (opcional)"}</Label>
                    <Input
                      id="pobs"
                      value={paymentForm.observacao}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({
                          ...prev,
                          observacao: e.target.value,
                        }))
                      }
                      placeholder="Ex: Parcela 2 de 3"
                    />
                  </div>
                </div>
              )
            })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPayment}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
