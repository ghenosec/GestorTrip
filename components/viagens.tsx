"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import type { Viagem } from "@/lib/data"
import { formatCurrency, formatDate, getValorPago } from "@/lib/data"
import { StatusBadge, ViagemStatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, MapPin, Calendar, Users, ChevronDown, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

const emptyViagem: Omit<Viagem, "id"> = {
  nome: "", destino: "", dataIda: "", dataVolta: "",
  valorPorPessoa: 0, capacidade: 0, status: "ativa",
}

interface FormErrors {
  nome?: string; destino?: string; dataIda?: string
  dataVolta?: string; valorPorPessoa?: string; capacidade?: string
}

export function Viagens() {
  const {
    viagens, clientes, pagamentos,
    addViagem, updateViagem, deleteViagem, getClientesByViagem, openFichaCliente,
  } = useStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [form,       setForm]       = useState(emptyViagem)
  const [errors,     setErrors]     = useState<FormErrors>({})
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null); setForm(emptyViagem); setErrors({}); setDialogOpen(true)
  }
  function openEdit(viagem: Viagem) {
    setEditingId(viagem.id)
    setForm({
      nome: viagem.nome, destino: viagem.destino, dataIda: viagem.dataIda,
      dataVolta: viagem.dataVolta, valorPorPessoa: viagem.valorPorPessoa,
      capacidade: viagem.capacidade ?? 0, status: viagem.status,
    })
    setErrors({}); setDialogOpen(true)
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.nome.trim())    e.nome    = "Nome da viagem é obrigatório"
    if (!form.destino.trim()) e.destino = "Destino é obrigatório"
    if (!form.dataIda)        e.dataIda = "Data de ida é obrigatória"
    if (!form.dataVolta)      e.dataVolta = "Data de volta é obrigatória"
    if (form.dataIda && form.dataVolta && form.dataVolta < form.dataIda)
      e.dataVolta = "Data de volta deve ser após a data de ida"
    if (!form.valorPorPessoa || form.valorPorPessoa <= 0)
      e.valorPorPessoa = "Valor por pessoa deve ser maior que zero"
    if (form.capacidade < 0)
      e.capacidade = "Capacidade não pode ser negativa"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) { toast.error("Corrija os campos destacados antes de salvar"); return }
    if (editingId) { updateViagem(editingId, form); toast.success("Viagem atualizada") }
    else           { addViagem(form);               toast.success("Viagem criada") }
    setDialogOpen(false)
  }

  function handleDelete() {
    if (deleteId) { deleteViagem(deleteId); toast.success("Viagem removida"); setDeleteId(null) }
  }

  function upd(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleCapacidadeChange(raw: string) {
    const val = parseInt(raw)
    if (isNaN(val) || val < 0) {
      upd("capacidade", 0)
    } else {
      upd("capacidade", val)
    }
  }

  const viagemStats = useMemo(() => {
    const map: Record<string, {
      total: number; pagos: number; pendentes: number; aConfirmar: number;
      arrecadado: number; valorTotal: number
    }> = {}
    for (const v of viagens) {
      const vC = clientes.filter((c) => c.viagemId === v.id)
      const vP = pagamentos.filter((p) => p.viagemId === v.id)
      map[v.id] = {
        total:       vC.length,
        pagos:       vC.filter((c) => c.status === "pago").length,
        pendentes:   vC.filter((c) => c.status === "pendente").length,
        aConfirmar:  vC.filter((c) => c.status === "a_confirmar").length,
        arrecadado:  vP.reduce((s, p) => s + getValorPago(p), 0),
        valorTotal:  vP.reduce((s, p) => s + p.valorTotal, 0),
      }
    }
    return map
  }, [viagens, clientes, pagamentos])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">Viagens</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />Nova Viagem
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {viagens.map((v) => {
          const st          = viagemStats[v.id]
          const pctFinanc   = st?.valorTotal > 0 ? (st.arrecadado / st.valorTotal) * 100 : 0
          const capacidade  = v.capacidade ?? 0
          const confirmados = st?.total ?? 0
          const temCap      = capacidade > 0
          const lotada      = temCap && confirmados >= capacidade
          const quaseLotada = temCap && !lotada && confirmados >= capacidade * 0.9

          const pctOcup     = temCap ? Math.min((confirmados / capacidade) * 100, 100) : null
          const vagasLivres = temCap ? capacidade - confirmados : null
          const linkedCli   = getClientesByViagem(v.id)
          const isExpanded  = expandedId === v.id

          return (
            <Card key={v.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base font-semibold text-card-foreground">
                    {v.nome}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />{v.destino}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(v.dataIda)} — {formatDate(v.dataVolta)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ViagemStatusBadge status={v.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(v.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-3 pt-0">
                {temCap && (
                  <div className="flex flex-col gap-1.5 rounded-lg bg-muted/40 px-3 py-2.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 font-medium text-card-foreground">
                        <Users className="h-3.5 w-3.5 text-indigo-500" />
                        Ocupação
                      </span>
                      <div className="flex items-center gap-2">
                        {lotada && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0">
                            Lotada
                          </Badge>
                        )}
                        {quaseLotada && (
                          <Badge className="text-xs px-1.5 py-0 bg-amber-500/15 text-amber-600 border-amber-300">
                            <AlertTriangle className="h-3 w-3 mr-1" />Quase lotada
                          </Badge>
                        )}
                        <span className="font-bold text-card-foreground">
                          {confirmados}
                          <span className="font-normal text-muted-foreground">/{capacidade}</span>
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={pctOcup ?? 0}
                      className={`h-2 ${
                        lotada        ? "[&>div]:bg-red-500"
                        : quaseLotada ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-indigo-500"
                      }`}
                    />
                    <p className="text-xs text-muted-foreground">
                      {lotada
                        ? "Sem vagas disponíveis"
                        : vagasLivres !== null
                          ? `${vagasLivres} vaga${vagasLivres !== 1 ? "s" : ""} disponível`
                          : ""}
                    </p>
                  </div>
                )}

                {!temCap && (
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium text-card-foreground">{st?.total ?? 0}</span>
                      <span className="text-muted-foreground">clientes</span>
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-emerald-600 font-medium">{st?.pagos ?? 0} pagos</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-amber-600 font-medium">{st?.pendentes ?? 0} pendentes</span>
                    {(st?.aConfirmar ?? 0) > 0 && (
                      <>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-slate-500 font-medium">{st.aConfirmar} a confirmar</span>
                      </>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Valor/pessoa: <span className="font-medium text-card-foreground">{formatCurrency(v.valorPorPessoa)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(st?.arrecadado ?? 0)} / {formatCurrency(st?.valorTotal ?? 0)}
                    </span>
                  </div>
                  <Progress value={pctFinanc} className="h-2" />
                </div>

                {linkedCli.length > 0 && (
                  <Button variant="ghost" size="sm"
                    className="w-full justify-between text-muted-foreground hover:text-card-foreground"
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                    <span>Ver clientes ({linkedCli.length})</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </Button>
                )}
                {isExpanded && linkedCli.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t pt-3">
                    {linkedCli.map((c) => (
                      <div key={c.id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => openFichaCliente(c.id)}>
                        <span className="font-medium text-card-foreground">{c.nomeCompleto}</span>
                        <StatusBadge status={c.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {viagens.length === 0 && (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12 text-muted-foreground">
          Nenhuma viagem cadastrada. Clique em "Nova Viagem" para começar.
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Viagem" : "Nova Viagem"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize os dados da viagem abaixo." : "Preencha os campos para criar a viagem."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="vnome">Nome da viagem *</Label>
              <Input id="vnome" value={form.nome}
                onChange={(e) => upd("nome", e.target.value)}
                placeholder="Ex: Reveillon Jericoacoara"
                className={errors.nome ? "border-destructive" : ""} />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vdest">Destino *</Label>
              <Input id="vdest" value={form.destino}
                onChange={(e) => upd("destino", e.target.value)}
                placeholder="Ex: Jericoacoara, CE"
                className={errors.destino ? "border-destructive" : ""} />
              {errors.destino && <p className="text-xs text-destructive">{errors.destino}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vida">Data de ida *</Label>
                <Input id="vida" type="date" max="9999-12-31" value={form.dataIda}
                  onChange={(e) => upd("dataIda", e.target.value)}
                  className={errors.dataIda ? "border-destructive" : ""} />
                {errors.dataIda && <p className="text-xs text-destructive">{errors.dataIda}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vvolta">Data de volta *</Label>
                <Input id="vvolta" type="date" min={form.dataIda || undefined} value={form.dataVolta}
                  onChange={(e) => upd("dataVolta", e.target.value)}
                  className={errors.dataVolta ? "border-destructive" : ""} />
                {errors.dataVolta && <p className="text-xs text-destructive">{errors.dataVolta}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vvalor">Valor por pessoa (R$) *</Label>
                <Input id="vvalor" type="number" min={0} step={0.01}
                  value={form.valorPorPessoa || ""}
                  onChange={(e) => upd("valorPorPessoa", parseFloat(e.target.value) || 0)}
                  className={errors.valorPorPessoa ? "border-destructive" : ""} />
                {errors.valorPorPessoa && <p className="text-xs text-destructive">{errors.valorPorPessoa}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vcap">Capacidade (vagas)</Label>
                <Input id="vcap" type="number" min={0} step={1}
                  value={form.capacidade === 0 ? "" : form.capacidade}
                  onChange={(e) => handleCapacidadeChange(e.target.value)}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value)
                    if (isNaN(val) || val < 0) upd("capacidade", 0)
                  }}
                  placeholder="0 = sem limite"
                  className={errors.capacidade ? "border-destructive" : ""} />
                <p className="text-xs text-muted-foreground">0 = sem limite definido</p>
                {errors.capacidade && <p className="text-xs text-destructive">{errors.capacidade}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vstatus">Status</Label>
              <Select value={form.status} onValueChange={(v) => upd("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativa">Ativa</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Criar Viagem"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Os clientes vinculados serão desvinculados e os pagamentos removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}