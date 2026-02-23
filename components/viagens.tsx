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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"

const emptyViagem: Omit<Viagem, "id"> = {
  nome: "",
  destino: "",
  dataIda: "",
  dataVolta: "",
  valorPorPessoa: 0,
  status: "ativa",
}

interface FormErrors {
  nome?: string
  destino?: string
  dataIda?: string
  dataVolta?: string
  valorPorPessoa?: string
}

export function Viagens() {
  const {
    viagens,
    clientes,
    pagamentos,
    addViagem,
    updateViagem,
    deleteViagem,
    getClientesByViagem,
  } = useStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyViagem)
  const [errors, setErrors] = useState<FormErrors>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyViagem)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(viagem: Viagem) {
    setEditingId(viagem.id)
    setForm({
      nome: viagem.nome,
      destino: viagem.destino,
      dataIda: viagem.dataIda,
      dataVolta: viagem.dataVolta,
      valorPorPessoa: viagem.valorPorPessoa,
      status: viagem.status,
    })
    setErrors({})
    setDialogOpen(true)
  }

  function validate(): boolean {
    const e: FormErrors = {}

    if (!form.nome.trim()) e.nome = "Nome da viagem e obrigatório"
    if (!form.destino.trim()) e.destino = "Destino e obrigatório"
    if (!form.dataIda) e.dataIda = "Data de ida e obrigatória"
    if (!form.dataVolta) e.dataVolta = "Data de volta e obrigatória"
    if (form.dataIda && form.dataVolta && form.dataVolta < form.dataIda) {
      e.dataVolta = "Data de volta deve ser após a data de ida"
    }
    if (!form.valorPorPessoa || form.valorPorPessoa <= 0) {
      e.valorPorPessoa = "Valor por pessoa deve ser maior que zero"
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) {
      toast.error("Corrija os campos destacados antes de salvar")
      return
    }
    if (editingId) {
      updateViagem(editingId, form)
      toast.success("Viagem atualizada com sucesso")
    } else {
      addViagem(form)
      toast.success("Viagem criada com sucesso")
    }
    setDialogOpen(false)
  }

  function handleDelete() {
    if (deleteId) {
      deleteViagem(deleteId)
      toast.success("Viagem removida com sucesso")
      setDeleteId(null)
    }
  }

  function updateForm(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const viagemStats = useMemo(() => {
    const map: Record<string, { total: number; pagos: number; pendentes: number; arrecadado: number; valorTotal: number }> = {}
    for (const v of viagens) {
      const vClientes = clientes.filter((c) => c.viagemId === v.id)
      const vPagamentos = pagamentos.filter((p) => p.viagemId === v.id)
      const arrecadado = vPagamentos.reduce((s, p) => s + getValorPago(p), 0)
      const valorTotal = vPagamentos.reduce((s, p) => s + p.valorTotal, 0)
      map[v.id] = {
        total: vClientes.length,
        pagos: vClientes.filter((c) => c.status === "pago").length,
        pendentes: vClientes.filter((c) => c.status === "pendente").length,
        arrecadado,
        valorTotal,
      }
    }
    return map
  }, [viagens, clientes, pagamentos])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">Viagens</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Viagem
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {viagens.map((v) => {
          const stats = viagemStats[v.id]
          const pct = stats?.valorTotal > 0 ? (stats.arrecadado / stats.valorTotal) * 100 : 0
          const linkedClientes = getClientesByViagem(v.id)
          const isExpanded = expandedId === v.id

          return (
            <Card key={v.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-base font-semibold text-card-foreground">
                    {v.nome}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {v.destino}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(v.dataIda)} - {formatDate(v.dataVolta)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ViagemStatusBadge status={v.status} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(v)}>
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(v.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 pt-0">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-card-foreground font-medium">{stats?.total ?? 0}</span>
                    <span className="text-muted-foreground">clientes</span>
                  </span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-emerald-600 font-medium">{stats?.pagos ?? 0} pagos</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="text-amber-600 font-medium">{stats?.pendentes ?? 0} pendentes</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Valor por pessoa: <span className="font-medium text-card-foreground">{formatCurrency(v.valorPorPessoa)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {formatCurrency(stats?.arrecadado ?? 0)} / {formatCurrency(stats?.valorTotal ?? 0)}
                    </span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>

                {linkedClientes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-muted-foreground hover:text-card-foreground"
                    onClick={() => setExpandedId(isExpanded ? null : v.id)}
                    aria-expanded={isExpanded}
                  >
                    <span>Ver clientes ({linkedClientes.length})</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </Button>
                )}
                {isExpanded && linkedClientes.length > 0 && (
                  <div className="flex flex-col gap-2 border-t pt-3">
                    {linkedClientes.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
                      >
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
          {"Nenhuma viagem cadastrada. Clique em \"Nova Viagem\" para comecar."}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Viagem" : "Nova Viagem"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize os dados da viagem abaixo."
                : "Preencha todos os campos obrigatorios para criar a viagem."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="vnome">Nome da viagem *</Label>
              <Input
                id="vnome"
                value={form.nome}
                onChange={(e) => updateForm("nome", e.target.value)}
                placeholder="Ex: Reveillon Jericoacoara"
                className={errors.nome ? "border-destructive" : ""}
              />
              {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vdest">Destino *</Label>
              <Input
                id="vdest"
                value={form.destino}
                onChange={(e) => updateForm("destino", e.target.value)}
                placeholder="Ex: Jericoacoara, CE"
                className={errors.destino ? "border-destructive" : ""}
              />
              {errors.destino && <p className="text-xs text-destructive">{errors.destino}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vida">Data de ida *</Label>
                <Input
                  id="vida"
                  type="date"
                  max="9999-12-31"
                  value={form.dataIda}
                  onChange={(e) => updateForm("dataIda", e.target.value)}
                  className={errors.dataIda ? "border-destructive" : ""}
                />
                {errors.dataIda && <p className="text-xs text-destructive">{errors.dataIda}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vvolta">Data de volta *</Label>
                <Input
                  id="vvolta"
                  type="date"
                  max="9999-12-31"
                  value={form.dataVolta}
                  onChange={(e) => updateForm("dataVolta", e.target.value)}
                  className={errors.dataVolta ? "border-destructive" : ""}
                />
                {errors.dataVolta && <p className="text-xs text-destructive">{errors.dataVolta}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vvalor">Valor por pessoa (R$) *</Label>
                <Input
                  id="vvalor"
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.valorPorPessoa || ""}
                  onChange={(e) => updateForm("valorPorPessoa", parseFloat(e.target.value) || 0)}
                  className={errors.valorPorPessoa ? "border-destructive" : ""}
                />
                {errors.valorPorPessoa && <p className="text-xs text-destructive">{errors.valorPorPessoa}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="vstatus">Status</Label>
                <Select value={form.status} onValueChange={(v) => updateForm("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">Ativa</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Salvar" : "Criar Viagem"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta viagem? Os clientes vinculados serao desvinculados e os pagamentos serao removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
