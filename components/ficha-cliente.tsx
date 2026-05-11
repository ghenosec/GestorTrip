"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import {
  formatCurrency, formatDate, formatCPF, formatPhone,
  getValorPago, getValorPendente,
} from "@/lib/data"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Phone, Mail, MapPin, CreditCard, CalendarDays,
  Plane, CheckCircle2, Clock, TrendingUp, Hash, Pencil, X,
} from "lucide-react"

const FORMA_LABEL: Record<string, string> = {
  pix: "Pix",
  cartão: "Cartão",
  dinheiro: "Dinheiro",
  transferência: "Transferência",
}

const FORMA_COLOR: Record<string, string> = {
  pix:            "bg-emerald-500/15 text-emerald-700",
  cartão:         "bg-blue-500/15 text-blue-700",
  dinheiro:       "bg-amber-500/15 text-amber-700",
  transferência:  "bg-indigo-500/15 text-indigo-700",
}

export function FichaCliente() {
  const { fichaClienteId, closeFichaCliente, clientes, viagens, pagamentos } = useStore()
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const cliente = useMemo(
    () => clientes.find((c) => c.id === fichaClienteId) ?? null,
    [clientes, fichaClienteId]
  )

  // todos os pagamentos do cliente (pode ter feito mais de uma viagem)
  const pagamentosCliente = useMemo(
    () => pagamentos.filter((p) => p.clienteId === fichaClienteId),
    [pagamentos, fichaClienteId]
  )

  // resumo financeiro agregado
  const resumo = useMemo(() => {
    const totalGasto   = pagamentosCliente.reduce((s, p) => s + p.valorTotal, 0)
    const totalPago    = pagamentosCliente.reduce((s, p) => s + getValorPago(p), 0)
    const totalPendente = pagamentosCliente.reduce((s, p) => s + getValorPendente(p), 0)
    const viagensFeitas = pagamentosCliente.length
    return { totalGasto, totalPago, totalPendente, viagensFeitas }
  }, [pagamentosCliente])

  if (!cliente) return null

  return (
  <>
    <Dialog open={fichaClienteId !== null} onOpenChange={(o) => !o && closeFichaCliente()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 w-full pr-2">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar com iniciais */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                {cliente.nomeCompleto.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-base font-semibold leading-tight truncate">{cliente.nomeCompleto}</span>
                <Badge
                  variant="outline"
                  className={`w-fit text-xs px-2 py-0 ${
                    cliente.status === "pago"
                      ? "bg-emerald-500/15 text-emerald-700 border-emerald-300"
                      : cliente.status === "pendente"
                        ? "bg-amber-500/15 text-amber-700 border-amber-300"
                        : "bg-slate-100 text-slate-600 border-slate-300"
                  }`}
                >
                  {cliente.status === "pago"
                    ? <><CheckCircle2 className="h-3 w-3 mr-1" />Em dia</>
                    : cliente.status === "pendente"
                      ? <><Clock className="h-3 w-3 mr-1" />Pendente</>
                      : <>A confirmar</>
                  }
                </Badge>
              </div>
            </div>
            {/* Botão editar */}
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 text-xs h-8"
              onClick={() => setEditDialogOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* ── Dados pessoais ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dados Pessoais
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {cliente.cpf && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span>CPF: <span className="text-foreground">{formatCPF(cliente.cpf)}</span></span>
              </div>
            )}
            {cliente.rg && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="h-3.5 w-3.5 shrink-0" />
                <span>RG: <span className="text-foreground">{cliente.rg}</span></span>
              </div>
            )}
            {cliente.dataNascimento && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                <span>Nasc.: <span className="text-foreground">{formatDate(cliente.dataNascimento)}</span></span>
              </div>
            )}
            {cliente.telefone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground">{formatPhone(cliente.telefone)}</span>
              </div>
            )}
            {cliente.email && (
              <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="text-foreground truncate">{cliente.email}</span>
              </div>
            )}
            {cliente.endereco && (
              <div className="flex items-start gap-2 text-muted-foreground col-span-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span className="text-foreground">{cliente.endereco}</span>
              </div>
            )}
          </div>
          {cliente.observacoes && (
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground italic">
              {cliente.observacoes}
            </div>
          )}
        </div>

        <Separator />

        {/* ── Resumo financeiro ── */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resumo Financeiro
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />Total gasto
              </span>
              <span className="text-base font-bold text-card-foreground">
                {formatCurrency(resumo.totalGasto)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />Pago
              </span>
              <span className="text-base font-bold text-emerald-600">
                {formatCurrency(resumo.totalPago)}
              </span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border p-3">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-amber-500" />Pendente
              </span>
              <span className={`text-base font-bold ${resumo.totalPendente > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {formatCurrency(resumo.totalPendente)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Plane className="h-3 w-3" />
            {resumo.viagensFeitas} viagem{resumo.viagensFeitas !== 1 ? "s" : ""} no histórico
          </div>
        </div>

        <Separator />

        {/* ── Histórico de viagens e pagamentos ── */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Histórico de Viagens
          </p>

          {pagamentosCliente.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum pagamento registrado.
            </p>
          ) : pagamentosCliente.map((pag) => {
            const viagem  = viagens.find((v) => v.id === pag.viagemId)
            const pago    = getValorPago(pag)
            const pendente = getValorPendente(pag)
            const pct     = pag.valorTotal > 0 ? (pago / pag.valorTotal) * 100 : 0

            return (
              <div key={pag.id} className="flex flex-col gap-2 rounded-lg border p-3">
                {/* Cabeçalho da viagem */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-card-foreground flex items-center gap-1.5">
                      <Plane className="h-3.5 w-3.5 text-indigo-500" />
                      {viagem?.nome ?? "Viagem removida"}
                    </span>
                    {viagem && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{viagem.destino}
                        {" · "}{formatDate(viagem.dataIda)} — {formatDate(viagem.dataVolta)}
                      </span>
                    )}
                  </div>
                  <Badge
                    className={`shrink-0 text-xs px-2 py-0 ${
                      pendente <= 0
                        ? "bg-emerald-500/15 text-emerald-700 border-emerald-300"
                        : "bg-amber-500/15 text-amber-700 border-amber-300"
                    }`}
                    variant="outline"
                  >
                    {pendente <= 0 ? "Quitado" : `Deve ${formatCurrency(pendente)}`}
                  </Badge>
                </div>

                {/* Barra de progresso financeiro */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(pago)} pagos</span>
                    <span>Total: {formatCurrency(pag.valorTotal)}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>

                {/* Histórico de entradas */}
                {pag.historico.length > 0 && (
                  <div className="flex flex-col gap-1 pt-1 border-t">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
                      <CreditCard className="h-3 w-3" />Entradas
                    </p>
                    {pag.historico.map((h) => (
                      <div key={h.id}
                        className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`rounded px-1.5 py-0.5 font-medium ${FORMA_COLOR[h.formaPagamento] ?? "bg-muted text-muted-foreground"}`}>
                            {FORMA_LABEL[h.formaPagamento] ?? h.formaPagamento}
                          </span>
                          {h.observacao && (
                            <span className="text-muted-foreground italic truncate max-w-28">
                              {h.observacao}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-muted-foreground">{formatDate(h.data)}</span>
                          <span className="font-semibold text-emerald-600">
                            +{formatCurrency(h.valor)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {pag.historico.length === 0 && (
                  <p className="text-xs text-muted-foreground italic pt-1 border-t">
                    Nenhum pagamento registrado ainda.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>

    {/* Dialog de edição inline */}
    {editDialogOpen && cliente && (
      <EditClienteDialog
        cliente={cliente}
        onClose={() => setEditDialogOpen(false)}
      />
    )}
  </>
  )
}


// ── Componente de edição embutido ──
import type { Cliente } from "@/lib/data"
import {
  maskPhone, unmaskPhone, maskCPF, unmaskCPF,
  isValidCPF, isValidName, isValidEmail,
} from "@/lib/data"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"

function getMaxNascimento(): string {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return hoje.toISOString().split("T")[0]
}
function getMinNascimento(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 120)
  return d.toISOString().split("T")[0]
}

function EditClienteDialog({
  cliente,
  onClose,
}: {
  cliente: Cliente
  onClose: () => void
}) {
  const { viagens, updateCliente } = useStore()

  const [form, setForm] = useState({
    nomeCompleto:     cliente.nomeCompleto,
    cpf:              cliente.cpf,
    cpfDisplay:       maskCPF(cliente.cpf),
    rg:               cliente.rg,
    dataNascimento:   cliente.dataNascimento,
    telefone:         cliente.telefone,
    telefoneDisplay:  maskPhone(cliente.telefone),
    email:            cliente.email,
    endereco:         cliente.endereco,
    observacoes:      cliente.observacoes,
    viagemId:         cliente.viagemId,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!form.nomeCompleto.trim())              e.nomeCompleto = "Nome é obrigatório"
    else if (!isValidName(form.nomeCompleto))   e.nomeCompleto = "Nome não pode conter números"
    if (form.cpf && form.cpf.length !== 11)     e.cpf = "CPF inválido"
    else if (form.cpf && !isValidCPF(form.cpf)) e.cpf = "CPF inválido"
    if (form.dataNascimento) {
      const nasc = new Date(form.dataNascimento + "T12:00:00")
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
      const minDate = new Date(); minDate.setFullYear(minDate.getFullYear() - 120)
      if (nasc >= hoje) {
        e.dataNascimento = "Data de nascimento não pode ser hoje ou no futuro"
      } else if (nasc < minDate) {
        e.dataNascimento = "Data de nascimento inválida"
      }
    }
    if (form.telefone && form.telefone.length < 10) e.telefone = "Telefone inválido"
    if (form.email && !isValidEmail(form.email)) e.email = "Email inválido"
    if (!form.endereco.trim())                  e.endereco = "Endereço é obrigatório"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) { toast.error("Corrija os campos destacados"); return }
    updateCliente(cliente.id, {
      nomeCompleto:   form.nomeCompleto.trim(),
      cpf:            form.cpf,
      rg:             form.rg.trim(),
      dataNascimento: form.dataNascimento,
      telefone:       form.telefone,
      email:          form.email.trim(),
      endereco:       form.endereco.trim(),
      observacoes:    form.observacoes.trim(),
      viagemId:       form.viagemId,
    })
    toast.success("Cliente atualizado com sucesso")
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Editar — {cliente.nomeCompleto.split(" ")[0]}
          </DialogTitle>
          <DialogDescription>
            Atualize os dados do cliente abaixo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome completo *</Label>
            <Input value={form.nomeCompleto}
              onChange={(e) => setForm((p) => ({ ...p, nomeCompleto: e.target.value.replace(/[0-9]/g, "") }))}
              className={errors.nomeCompleto ? "border-destructive" : ""} />
            {errors.nomeCompleto && <p className="text-xs text-destructive">{errors.nomeCompleto}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>CPF</Label>
              <Input value={form.cpfDisplay}
                onChange={(e) => {
                  const raw = unmaskCPF(e.target.value)
                  setForm((p) => ({ ...p, cpf: raw, cpfDisplay: maskCPF(raw) }))
                }}
                placeholder="000.000.000-00" maxLength={14}
                className={errors.cpf ? "border-destructive" : ""} />
              {errors.cpf && <p className="text-xs text-destructive">{errors.cpf}</p>}
            </div>
            <div className="grid gap-2">
              <Label>RG</Label>
              <Input value={form.rg}
                onChange={(e) => setForm((p) => ({ ...p, rg: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Data de nascimento</Label>
              <Input type="date"
                max={getMaxNascimento()}
                min={getMinNascimento()}
                value={form.dataNascimento}
                onChange={(e) => setForm((p) => ({ ...p, dataNascimento: e.target.value }))}
                className={errors.dataNascimento ? "border-destructive" : ""} />
              {errors.dataNascimento && <p className="text-xs text-destructive">{errors.dataNascimento}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input value={form.telefoneDisplay}
                onChange={(e) => {
                  const raw = unmaskPhone(e.target.value)
                  setForm((p) => ({ ...p, telefone: raw, telefoneDisplay: maskPhone(raw) }))
                }}
                placeholder="(11) 99999-9999" maxLength={15}
                className={errors.telefone ? "border-destructive" : ""} />
              {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={errors.email ? "border-destructive" : ""} />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Endereço *</Label>
            <Input value={form.endereco}
              onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
              className={errors.endereco ? "border-destructive" : ""} />
            {errors.endereco && <p className="text-xs text-destructive">{errors.endereco}</p>}
          </div>

          <div className="grid gap-2">
            <Label>Viagem vinculada</Label>
            <Select value={form.viagemId ?? "none"}
              onValueChange={(v) => setForm((p) => ({ ...p, viagemId: v === "none" ? null : v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhuma</SelectItem>
                {viagens.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Observações</Label>
            <Textarea value={form.observacoes}
              onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
              rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
