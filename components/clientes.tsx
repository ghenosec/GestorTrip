"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import type { Cliente } from "@/lib/data"
import {
  formatCPF, formatPhone, formatDate,
  isValidCPF, isValidName, isValidEmail,
  maskPhone, unmaskPhone, maskCPF, unmaskCPF,
} from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Pencil, Trash2, Search, FileText, AlertCircle, ArrowRight } from "lucide-react"
import { toast } from "sonner"

interface FormData {
  nomeCompleto: string
  cpf: string; cpfDisplay: string
  rg: string
  dataNascimento: string
  telefone: string; telefoneDisplay: string
  email: string
  endereco: string
  observacoes: string
  viagemId: string | null
  status: "pago" | "pendente" | "a_confirmar"
}

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

const emptyForm: FormData = {
  nomeCompleto: "", cpf: "", cpfDisplay: "", rg: "", dataNascimento: "",
  telefone: "", telefoneDisplay: "", email: "", endereco: "", observacoes: "",
  viagemId: null, status: "a_confirmar",
}

interface FormErrors {
  nomeCompleto?: string; cpf?: string; dataNascimento?: string
  telefone?: string; email?: string; endereco?: string
}

export function Clientes() {
  const {
    clientes, viagens, addCliente, updateCliente, deleteCliente,
    getViagemById, openFichaCliente, getClientesByViagem,
  } = useStore()

  const [search,       setSearch]       = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [viagemFilter, setViagemFilter] = useState<string>("todas")
  const [dialogOpen,   setDialogOpen]   = useState(false)
  const [editingId,    setEditingId]    = useState<string | null>(null)
  const [form,         setForm]         = useState<FormData>(emptyForm)
  const [errors,       setErrors]       = useState<FormErrors>({})
  const [deleteId,     setDeleteId]     = useState<string | null>(null)
  const [cpfDuplicado, setCpfDuplicado] = useState<Cliente | null>(null)

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        search === "" ||
        c.nomeCompleto.toLowerCase().includes(q) ||
        c.cpf.includes(search.replace(/\D/g, "")) ||
        c.telefone.includes(search.replace(/\D/g, ""))
      const matchStatus = statusFilter === "todos" || c.status === statusFilter
      const matchViagem = viagemFilter === "todas" || c.viagemId === viagemFilter
      return matchSearch && matchStatus && matchViagem
    })
  }, [clientes, search, statusFilter, viagemFilter])

  function openCreate() {
    setEditingId(null); setForm(emptyForm); setErrors({}); setCpfDuplicado(null); setDialogOpen(true)
  }
  function openEdit(cliente: Cliente) {
    setEditingId(cliente.id)
    setForm({
      nomeCompleto: cliente.nomeCompleto,
      cpf: cliente.cpf, cpfDisplay: maskCPF(cliente.cpf),
      rg: cliente.rg, dataNascimento: cliente.dataNascimento,
      telefone: cliente.telefone, telefoneDisplay: maskPhone(cliente.telefone),
      email: cliente.email, endereco: cliente.endereco,
      observacoes: cliente.observacoes, viagemId: cliente.viagemId, status: cliente.status,
    })
    setErrors({}); setCpfDuplicado(null); setDialogOpen(true)
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.nomeCompleto.trim())          e.nomeCompleto = "Nome é obrigatório"
    else if (!isValidName(form.nomeCompleto)) e.nomeCompleto = "Nome não pode conter números"
    if (!form.cpf.trim())                   e.cpf = "CPF é obrigatório"
    else if (form.cpf.length !== 11)        e.cpf = "CPF deve ter 11 dígitos"
    else if (!isValidCPF(form.cpf))         e.cpf = "CPF inválido"
    if (!form.dataNascimento) {
      e.dataNascimento = "Data de nascimento é obrigatória"
    } else {
      const nasc = new Date(form.dataNascimento + "T12:00:00")
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
      const minDate = new Date(); minDate.setFullYear(minDate.getFullYear() - 120)
      if (nasc >= hoje) {
        e.dataNascimento = "Data de nascimento não pode ser hoje ou no futuro"
      } else if (nasc < minDate) {
        e.dataNascimento = "Data de nascimento inválida"
      }
    }
    if (form.telefone.trim() && form.telefone.length < 10)
      e.telefone = "Telefone deve ter 10 ou 11 dígitos"
    if (form.email.trim() && !isValidEmail(form.email)) e.email = "Email inválido"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (cpfDuplicado) {
      toast.error(`CPF já pertence a ${cpfDuplicado.nomeCompleto}. Verifique a ficha do cliente.`)
      return
    }
    if (!validate()) { toast.error("Corrija os campos destacados antes de salvar"); return }

    if (form.viagemId) {
      const viagem = viagens.find((v) => v.id === form.viagemId)
      if (viagem && viagem.capacidade > 0) {
        const jaInscritos = getClientesByViagem(form.viagemId)
        const inscritosValidos = editingId
          ? jaInscritos.filter((c) => c.id !== editingId)
          : jaInscritos
        if (inscritosValidos.length >= viagem.capacidade) {
          toast.error(`A viagem "${viagem.nome}" está lotada (${viagem.capacidade}/${viagem.capacidade} vagas)`)
          return
        }
      }
    }

    const payload: Omit<Cliente, "id"> = {
      nomeCompleto: form.nomeCompleto.trim(), cpf: form.cpf, rg: form.rg.trim(),
      dataNascimento: form.dataNascimento, telefone: form.telefone, email: form.email.trim(),
      endereco: form.endereco.trim(), observacoes: form.observacoes.trim(),
      viagemId: form.viagemId, status: form.status,
    }
    if (editingId) { updateCliente(editingId, payload); toast.success("Cliente atualizado") }
    else           { addCliente(payload);               toast.success("Cliente cadastrado") }
    setDialogOpen(false)
  }

  function handleDelete() {
    if (deleteId) { deleteCliente(deleteId); toast.success("Cliente removido"); setDeleteId(null) }
  }

  function handleToggleStatus(cliente: Cliente) {
    const ciclo: Record<string, "pago" | "pendente" | "a_confirmar"> = {
      a_confirmar: "pendente",
      pendente:    "pago",
      pago:        "a_confirmar",
    }
    const newStatus = ciclo[cliente.status] ?? "a_confirmar"
    const label = { pago: "Pago", pendente: "Pendente", a_confirmar: "A confirmar" }
    updateCliente(cliente.id, { status: newStatus })
    toast.success(`Status alterado para ${label[newStatus]}`)
  }

  function handleCPFInput(value: string) {
    const raw = unmaskCPF(value)
    setForm((p) => ({ ...p, cpf: raw, cpfDisplay: maskCPF(raw) }))
    if (raw.length === 11 && isValidCPF(raw)) {
      const existente = clientes.find(
        (c) => c.cpf === raw && c.id !== editingId
      )
      setCpfDuplicado(existente ?? null)
    } else {
      setCpfDuplicado(null)
    }
  }

  function irParaDuplicado() {
    if (!cpfDuplicado) return
    setDialogOpen(false)
    setCpfDuplicado(null)
    setTimeout(() => openFichaCliente(cpfDuplicado.id), 150)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CPF ou telefone..."
            value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="a_confirmar">A confirmar</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>
        <Select value={viagemFilter} onValueChange={setViagemFilter}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Viagem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as viagens</SelectItem>
            {viagens.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden md:table-cell">CPF</TableHead>
              <TableHead className="hidden lg:table-cell">Telefone</TableHead>
              <TableHead className="hidden xl:table-cell">Viagem</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : filtered.map((c) => {
              const viagem = c.viagemId ? getViagemById(c.viagemId) : null
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <button
                      onClick={() => openFichaCliente(c.id)}
                      className="font-medium text-left hover:text-primary hover:underline transition-colors"
                    >
                      {c.nomeCompleto}
                    </button>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{formatCPF(c.cpf)}</TableCell>
                  <TableCell className="hidden lg:table-cell text-sm">{c.telefone ? formatPhone(c.telefone) : "—"}</TableCell>
                  <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                    {viagem?.nome ?? "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} onClick={() => handleToggleStatus(c)} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        title="Ver ficha completa"
                        onClick={() => openFichaCliente(c.id)}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => setDeleteId(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Atualize os dados do cliente abaixo." : "Preencha os campos obrigatórios (*)."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input id="nome" value={form.nomeCompleto}
                onChange={(e) => setForm((p) => ({ ...p, nomeCompleto: e.target.value.replace(/[0-9]/g, "") }))}
                className={errors.nomeCompleto ? "border-destructive" : ""} />
              {errors.nomeCompleto && <p className="text-xs text-destructive">{errors.nomeCompleto}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" value={form.cpfDisplay}
                  onChange={(e) => handleCPFInput(e.target.value)}
                  placeholder="000.000.000-00" maxLength={14}
                  className={cpfDuplicado ? "border-amber-500 focus-visible:ring-amber-500" : errors.cpf ? "border-destructive" : ""} />
                {errors.cpf && !cpfDuplicado && <p className="text-xs text-destructive">{errors.cpf}</p>}
                {cpfDuplicado && (
                  <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                          CPF já cadastrado
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-500">
                          Este CPF pertence a <strong>{cpfDuplicado.nomeCompleto}</strong>
                          {cpfDuplicado.viagemId
                            ? <> — vinculado a uma viagem</>
                            : <> — sem viagem vinculada</>
                          }
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={irParaDuplicado}
                      className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 transition-colors w-fit"
                    >
                      Ver ficha do cliente
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" value={form.rg}
                  onChange={(e) => setForm((p) => ({ ...p, rg: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nasc">Data de nascimento *</Label>
                <Input id="nasc" type="date"
                  max={getMaxNascimento()}
                  min={getMinNascimento()}
                  value={form.dataNascimento}
                  onChange={(e) => setForm((p) => ({ ...p, dataNascimento: e.target.value }))}
                  className={errors.dataNascimento ? "border-destructive" : ""} />
                {errors.dataNascimento && <p className="text-xs text-destructive">{errors.dataNascimento}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tel">Telefone</Label>
                <Input id="tel" value={form.telefoneDisplay}
                  onChange={(e) => {
                    const raw = unmaskPhone(e.target.value)
                    setForm((p) => ({ ...p, telefone: raw, telefoneDisplay: maskPhone(raw) }))
                  }}
                  placeholder="(11) 99941-1920" maxLength={15}
                  className={errors.telefone ? "border-destructive" : ""} />
                {errors.telefone && <p className="text-xs text-destructive">{errors.telefone}</p>}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={errors.email ? "border-destructive" : ""} />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">Endereço</Label>
              <Input id="end" value={form.endereco}
                onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="viagem">Viagem vinculada</Label>
              <Select value={form.viagemId ?? "none"}
                onValueChange={(v) => setForm((p) => ({ ...p, viagemId: v === "none" ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione uma viagem" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {viagens.map((v) => <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v as "pago" | "pendente" | "a_confirmar" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a_confirmar">A confirmar</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea id="obs" value={form.observacoes}
                onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>{editingId ? "Salvar" : "Cadastrar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita. Todos os pagamentos vinculados também serão removidos.
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