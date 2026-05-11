"use client"

import { useState, useMemo, useCallback } from "react"
import { useStore } from "@/lib/store"
import type { Cliente } from "@/lib/data"
import {
  formatCurrency, formatDate, formatCPF, formatPhone,
  maskCPF, unmaskCPF, maskPhone, unmaskPhone,
  isValidCPF, isValidName, generateId,
  getValorPago, getValorPendente,
} from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Search, Pencil, Trash2, ChevronUp, ChevronDown, MapPin } from "lucide-react"
import { toast } from "sonner"

type SortField = "nome" | "status" | "viagem" | "valor"
type SortDir   = "asc" | "desc"

interface FormData {
  nomeCompleto: string; cpf: string; rg: string; dataNascimento: string
  telefone: string; email: string; endereco: string; observacoes: string
  viagemIds: string[]
  status: "pago" | "pendente" | "a_confirmar"
}

interface FormErrors {
  nomeCompleto?: string; cpf?: string; telefone?: string; viagemIds?: string
}

const emptyForm: FormData = {
  nomeCompleto: "", cpf: "", rg: "", dataNascimento: "",
  telefone: "", email: "", endereco: "", observacoes: "",
  viagemIds: [], status: "a_confirmar" as const,
}

export function Clientes() {
  const {
    clientes, viagens, pagamentos,
    addCliente, updateCliente, deleteCliente, openFichaCliente,
  } = useStore()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId,  setEditingId]  = useState<string | null>(null)
  const [form,       setForm]       = useState<FormData>(emptyForm)
  const [errors,     setErrors]     = useState<FormErrors>({})
  const [deleteId,   setDeleteId]   = useState<string | null>(null)
  const [busca,      setBusca]      = useState("")
  const [sortField,  setSortField]  = useState<SortField>("nome")
  const [sortDir,    setSortDir]    = useState<SortDir>("asc")
  const [filtroViagemId, setFiltroViagemId] = useState<string>("todas")
  const [filtroStatus,   setFiltroStatus]   = useState<string>("todos")
  const [cpfDuplicadoId, setCpfDuplicadoId] = useState<string | null>(null)

  function openCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(c: Cliente) {
    setEditingId(c.id)
    setForm({
      nomeCompleto:   c.nomeCompleto,
      cpf:            maskCPF(c.cpf),
      rg:             c.rg,
      dataNascimento: c.dataNascimento,
      telefone:       maskPhone(c.telefone),
      email:          c.email,
      endereco:       c.endereco,
      observacoes:    c.observacoes,
      viagemIds:      c.viagemIds ?? (c.viagemId ? [c.viagemId] : []),
      status:         c.status,
    })
    setErrors({})
    setDialogOpen(true)
  }

  function toggleViagemId(id: string) {
    setForm((prev) => {
      const has = prev.viagemIds.includes(id)
      return {
        ...prev,
        viagemIds: has
          ? prev.viagemIds.filter((v) => v !== id)
          : [...prev.viagemIds, id],
      }
    })
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!isValidName(form.nomeCompleto))
      e.nomeCompleto = "Nome inválido (somente letras e espaços)"
    if (!form.nomeCompleto.trim())
      e.nomeCompleto = "Nome é obrigatório"
    const rawCPF = unmaskCPF(form.cpf)
    if (rawCPF && !isValidCPF(rawCPF))
      e.cpf = "CPF inválido"
    const rawTel = unmaskPhone(form.telefone)
    if (rawTel && rawTel.length < 10)
      e.telefone = "Telefone inválido (mínimo 10 dígitos)"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate()) { toast.error("Corrija os campos destacados"); return }

    const rawCPF = unmaskCPF(form.cpf)

    if (!editingId && rawCPF) {
      const existente = clientes.find(
        (c) => c.cpf.replace(/\D/g, "") === rawCPF
      )
      if (existente) {
        setCpfDuplicadoId(existente.id)
        return
      }
    }

    const payload: Omit<Cliente, "id"> = {
      nomeCompleto:   form.nomeCompleto.trim(),
      cpf:            rawCPF,
      rg:             form.rg.trim(),
      dataNascimento: form.dataNascimento,
      telefone:       unmaskPhone(form.telefone),
      email:          form.email.trim(),
      endereco:       form.endereco.trim(),
      observacoes:    form.observacoes.trim(),
      viagemIds:      form.viagemIds,
      viagemId:       form.viagemIds[0] ?? null,
      viagemStatus:   {},
      status:         form.status,
    }

    if (editingId) {
      await updateCliente(editingId, payload)
      toast.success("Cliente atualizado")
    } else {
      await addCliente(payload)
      toast.success("Cliente cadastrado")
    }
    setDialogOpen(false)
  }

  function handleDelete() {
    if (deleteId) {
      deleteCliente(deleteId)
      toast.success("Cliente removido")
      setDeleteId(null)
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("asc") }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp className="h-3.5 w-3.5 opacity-30" />
    return sortDir === "asc"
      ? <ChevronUp   className="h-3.5 w-3.5" />
      : <ChevronDown className="h-3.5 w-3.5" />
  }

  const clientesFiltrados = useMemo(() => {
    let list = [...clientes]

    if (busca.trim()) {
      const q = busca.toLowerCase()
      list = list.filter(
        (c) =>
          c.nomeCompleto.toLowerCase().includes(q) ||
          c.cpf.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
          c.telefone.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
      )
    }

    if (filtroViagemId !== "todas") {
      list = list.filter((c) =>
        (c.viagemIds ?? (c.viagemId ? [c.viagemId] : [])).includes(filtroViagemId)
      )
    }

    if (filtroStatus !== "todos") {
      list = list.filter((c) => c.status === filtroStatus)
    }

    list.sort((a, b) => {
      let cmp = 0
      if (sortField === "nome") {
        cmp = a.nomeCompleto.localeCompare(b.nomeCompleto, "pt-BR")
      } else if (sortField === "status") {
        cmp = a.status.localeCompare(b.status)
      } else if (sortField === "viagem") {
        const va = (a.viagemIds ?? [])[0] ?? ""
        const vb = (b.viagemIds ?? [])[0] ?? ""
        const na = viagens.find((v) => v.id === va)?.nome ?? ""
        const nb = viagens.find((v) => v.id === vb)?.nome ?? ""
        cmp = na.localeCompare(nb, "pt-BR")
      } else if (sortField === "valor") {
        const pa = pagamentos.find((p) => p.clienteId === a.id)
        const pb = pagamentos.find((p) => p.clienteId === b.id)
        cmp = (getValorPendente(pa ?? { id: "", clienteId: "", viagemId: "", valorTotal: 0, historico: [] })) -
              (getValorPendente(pb ?? { id: "", clienteId: "", viagemId: "", valorTotal: 0, historico: [] }))
      }
      return sortDir === "asc" ? cmp : -cmp
    })

    return list
  }, [clientes, busca, filtroViagemId, filtroStatus, sortField, sortDir, viagens, pagamentos])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Clientes
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({clientesFiltrados.length} de {clientes.length})
          </span>
        </h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />Novo Cliente
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, CPF ou telefone…"
                className="pl-8"
              />
            </div>
            <Select value={filtroViagemId} onValueChange={setFiltroViagemId}>
              <SelectTrigger className="w-full sm:w-52">
                <SelectValue placeholder="Filtrar por viagem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as viagens</SelectItem>
                {viagens.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="a_confirmar">A confirmar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("nome")}
                >
                  Nome <SortIcon field="nome" />
                </button>
              </TableHead>
              <TableHead className="hidden md:table-cell">CPF</TableHead>
              <TableHead className="hidden lg:table-cell">Telefone</TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("viagem")}
                >
                  Viagem(ns) <SortIcon field="viagem" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("status")}
                >
                  Status <SortIcon field="status" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 font-medium hover:text-foreground"
                  onClick={() => handleSort("valor")}
                >
                  Pago / Total <SortIcon field="valor" />
                </button>
              </TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientesFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {clientes.length === 0
                    ? 'Nenhum cliente cadastrado. Clique em "Novo Cliente" para começar.'
                    : "Nenhum cliente encontrado com os filtros atuais."}
                </TableCell>
              </TableRow>
            ) : (
              clientesFiltrados.map((c) => {
                const pags = pagamentos.filter((p) => p.clienteId === c.id)
                const totalPago  = pags.reduce((s, p) => s + getValorPago(p), 0)
                const totalGeral = pags.reduce((s, p) => s + p.valorTotal, 0)
                const ids = c.viagemIds ?? (c.viagemId ? [c.viagemId] : [])
                const viagensDoCliente = ids
                  .map((vid) => viagens.find((v) => v.id === vid))
                  .filter(Boolean)

                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => openFichaCliente(c.id)}
                  >
                    <TableCell className="font-medium">{c.nomeCompleto}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {c.cpf ? formatCPF(c.cpf) : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {c.telefone ? formatPhone(c.telefone) : "—"}
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {viagensDoCliente.length === 0 ? (
                        <span className="text-muted-foreground text-sm">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {viagensDoCliente.map((v) => v && (
                            <Badge
                              key={v.id}
                              variant="secondary"
                              className="text-xs gap-1 whitespace-nowrap"
                            >
                              <MapPin className="h-3 w-3" />
                              {v.nome}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {(() => {
                        const ids = c.viagemIds ?? (c.viagemId ? [c.viagemId] : [])
                        if (ids.length === 0) return <StatusBadge status="a_confirmar" />
                        const statuses = ids.map((vid) => c.viagemStatus?.[vid] ?? "a_confirmar")
                        const status = statuses.every((s) => s === "pago")
                          ? "pago"
                          : statuses.some((s) => s === "pendente")
                            ? "pendente"
                            : "a_confirmar"
                        return <StatusBadge status={status} />
                      })()}
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className="text-emerald-600 font-medium">
                        {formatCurrency(totalPago)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}/ {formatCurrency(totalGeral)}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteId(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              Campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="cnome">Nome completo *</Label>
              <Input
                id="cnome"
                value={form.nomeCompleto}
                onChange={(e) => setForm((p) => ({ ...p, nomeCompleto: e.target.value }))}
                placeholder="Nome completo"
                className={errors.nomeCompleto ? "border-destructive" : ""}
              />
              {errors.nomeCompleto && (
                <p className="text-xs text-destructive">{errors.nomeCompleto}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ccpf">CPF</Label>
                <Input
                  id="ccpf"
                  value={form.cpf}
                  onChange={(e) => setForm((p) => ({ ...p, cpf: maskCPF(e.target.value) }))}
                  placeholder="000.000.000-00"
                  className={errors.cpf ? "border-destructive" : ""}
                />
                {errors.cpf && <p className="text-xs text-destructive">{errors.cpf}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="crg">RG</Label>
                <Input
                  id="crg"
                  value={form.rg}
                  onChange={(e) => setForm((p) => ({ ...p, rg: e.target.value }))}
                  placeholder="Número do RG"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cnasc">Data de nascimento</Label>
                <Input
                  id="cnasc"
                  type="date"
                  max="9999-12-31"
                  value={form.dataNascimento}
                  onChange={(e) => setForm((p) => ({ ...p, dataNascimento: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ctel">Telefone</Label>
                <Input
                  id="ctel"
                  value={form.telefone}
                  onChange={(e) => setForm((p) => ({ ...p, telefone: maskPhone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  className={errors.telefone ? "border-destructive" : ""}
                />
                {errors.telefone && (
                  <p className="text-xs text-destructive">{errors.telefone}</p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cemail">E-mail</Label>
              <Input
                id="cemail"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cend">Endereço</Label>
              <Input
                id="cend"
                value={form.endereco}
                onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="grid gap-2">
              <Label>Viagens</Label>
              {viagens.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhuma viagem cadastrada. Crie uma viagem primeiro.
                </p>
              ) : (
                <div className="flex flex-col gap-2 rounded-md border p-3 max-h-44 overflow-y-auto">
                  {viagens.map((v) => (
                    <label
                      key={v.id}
                      className="flex items-center gap-2.5 cursor-pointer hover:bg-muted/40 rounded px-1 py-0.5"
                    >
                      <Checkbox
                        checked={form.viagemIds.includes(v.id)}
                        onCheckedChange={() => toggleViagemId(v.id)}
                      />
                      <span className="text-sm leading-tight">
                        <span className="font-medium">{v.nome}</span>
                        {v.destino && (
                          <span className="text-muted-foreground"> — {v.destino}</span>
                        )}
                        {v.dataIda && (
                          <span className="text-muted-foreground">
                            {" "}({formatDate(v.dataIda)})
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {form.viagemIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {form.viagemIds.length} viagem(ns) selecionada(s)
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cobs">Observações</Label>
              <Input
                id="cobs"
                value={form.observacoes}
                onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                placeholder="Observações opcionais"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cpfDuplicadoId !== null} onOpenChange={(o) => !o && setCpfDuplicadoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>CPF já cadastrado</AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const c = clientes.find((c) => c.id === cpfDuplicadoId)
                return c
                  ? `Já existe um cliente com este CPF: ${c.nomeCompleto}. Deseja abrir os dados dele?`
                  : "Já existe um cliente com este CPF."
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCpfDuplicadoId(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (cpfDuplicadoId) {
                  setDialogOpen(false)
                  setCpfDuplicadoId(null)
                  openFichaCliente(cpfDuplicadoId)
                }
              }}
            >
              Ver cadastro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? O histórico de pagamentos deste cliente também será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}