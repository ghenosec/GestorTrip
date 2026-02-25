"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import type { Cliente } from "@/lib/data"
import {
  formatCPF,
  formatPhone,
  formatDate,
  isValidCPF,
  isValidName,
  isValidEmail,
  maskPhone,
  unmaskPhone,
  maskCPF,
  unmaskCPF,
} from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import { toast } from "sonner"

interface FormData {
  nomeCompleto: string
  cpf: string
  cpfDisplay: string
  rg: string
  dataNascimento: string
  telefone: string
  telefoneDisplay: string
  email: string
  endereco: string
  observacoes: string
  viagemId: string | null
  status: "pago" | "pendente"
}

const emptyForm: FormData = {
  nomeCompleto: "",
  cpf: "",
  cpfDisplay: "",
  rg: "",
  dataNascimento: "",
  telefone: "",
  telefoneDisplay: "",
  email: "",
  endereco: "",
  observacoes: "",
  viagemId: null,
  status: "pendente",
}

interface FormErrors {
  nomeCompleto?: string
  cpf?: string
  dataNascimento?: string
  telefone?: string
  email?: string
  endereco?: string
}

export function Clientes() {
  const { clientes, viagens, addCliente, updateCliente, deleteCliente, getViagemById } = useStore()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("todos")
  const [viagemFilter, setViagemFilter] = useState<string>("todas")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})

  const [deleteId, setDeleteId] = useState<string | null>(null)

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
    setEditingId(null)
    setForm(emptyForm)
    setErrors({})
    setDialogOpen(true)
  }

  function openEdit(cliente: Cliente) {
    setEditingId(cliente.id)
    setForm({
      nomeCompleto: cliente.nomeCompleto,
      cpf: cliente.cpf,
      cpfDisplay: maskCPF(cliente.cpf),
      rg: cliente.rg,
      dataNascimento: cliente.dataNascimento,
      telefone: cliente.telefone,
      telefoneDisplay: maskPhone(cliente.telefone),
      email: cliente.email,
      endereco: cliente.endereco,
      observacoes: cliente.observacoes,
      viagemId: cliente.viagemId,
      status: cliente.status,
    })
    setErrors({})
    setDialogOpen(true)
  }

  function validate(): boolean {
    const e: FormErrors = {}

    if (!form.nomeCompleto.trim()) {
      e.nomeCompleto = "Nome é obrigatório"
    } else if (!isValidName(form.nomeCompleto)) {
      e.nomeCompleto = "Nome não pode conter números"
    }

    if (!form.cpf.trim()) {
      e.cpf = "CPF é obrigatório"
    } else if (form.cpf.length !== 11) {
      e.cpf = "CPF deve ter 11 digitos"
    } else if (!isValidCPF(form.cpf)) {
      e.cpf = "CPF inválido"
    }

    if (!form.dataNascimento) {
      e.dataNascimento = "Data de nascimento é obrigatória"
    }

    if (!form.telefone.trim()) {
      e.telefone = "Telefone é obrigatório"
    } else if (form.telefone.length < 10) {
      e.telefone = "Telefone deve ter 10 ou 11 digitos"
    }

    if (form.email.trim() && !isValidEmail(form.email)) {
    e.email = "Email inválido"
}

    if (!form.endereco.trim()) {
      e.endereco = "Endereço é obrigatório"
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) {
      toast.error("Corrija os campos destacados antes de salvar")
      return
    }

    const payload: Omit<Cliente, "id"> = {
      nomeCompleto: form.nomeCompleto.trim(),
      cpf: form.cpf,
      rg: form.rg.trim(),
      dataNascimento: form.dataNascimento,
      telefone: form.telefone,
      email: form.email.trim(),
      endereco: form.endereco.trim(),
      observacoes: form.observacoes.trim(),
      viagemId: form.viagemId,
      status: form.status,
    }

    if (editingId) {
      updateCliente(editingId, payload)
      toast.success("Cliente atualizado com sucesso")
    } else {
      addCliente(payload)
      toast.success("Cliente cadastrado com sucesso")
    }
    setDialogOpen(false)
  }

  function handleDelete() {
    if (deleteId) {
      deleteCliente(deleteId)
      toast.success("Cliente removido com sucesso")
      setDeleteId(null)
    }
  }

  function handleToggleStatus(cliente: Cliente) {
    const newStatus = cliente.status === "pago" ? "pendente" : "pago"
    updateCliente(cliente.id, { status: newStatus })
    toast.success(`Status alterado para ${newStatus === "pago" ? "Pago" : "Pendente"}`)
  }

  function handleCPFChange(value: string) {
    const raw = unmaskCPF(value)
    setForm((prev) => ({ ...prev, cpf: raw, cpfDisplay: maskCPF(raw) }))
  }

  function handlePhoneChange(value: string) {
    const raw = unmaskPhone(value)
    setForm((prev) => ({ ...prev, telefone: raw, telefoneDisplay: maskPhone(raw) }))
  }

  function handleNameChange(value: string) {
    const cleaned = value.replace(/[0-9]/g, "")
    setForm((prev) => ({ ...prev, nomeCompleto: cleaned }))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-foreground">Clientes</h2>
        <Button onClick={openCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={viagemFilter} onValueChange={setViagemFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Viagem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as viagens</SelectItem>
            {viagens.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.nome}
              </SelectItem>
            ))}
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
            ) : (
              filtered.map((c) => {
                const viagem = c.viagemId ? getViagemById(c.viagemId) : null
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nomeCompleto}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {formatCPF(c.cpf)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {formatPhone(c.telefone)}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {viagem?.nome ?? "---"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={c.status}
                        onClick={() => handleToggleStatus(c)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
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

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize os dados do cliente abaixo."
                : "Preencha todos os campos obrigatórios para cadastrar o cliente."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                value={form.nomeCompleto}
                onChange={(e) => handleNameChange(e.target.value)}
                className={errors.nomeCompleto ? "border-destructive" : ""}
              />
              {errors.nomeCompleto && (
                <p className="text-xs text-destructive">{errors.nomeCompleto}</p>
              )}
            </div>

            {/* CPF & RG */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={form.cpfDisplay}
                  onChange={(e) => handleCPFChange(e.target.value)}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={errors.cpf ? "border-destructive" : ""}
                />
                {errors.cpf && (
                  <p className="text-xs text-destructive">{errors.cpf}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rg">RG</Label>
                <Input id="rg" value={form.rg} onChange={(e) => setForm((p) => ({ ...p, rg: e.target.value }))} />
              </div>
            </div>

            {/* Nascimento & Telefone */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nascimento">Data de nascimento *</Label>
                <Input
                  id="nascimento"
                  type="date"
                  max="9999-12-31"
                  value={form.dataNascimento}
                  onChange={(e) => setForm((p) => ({ ...p, dataNascimento: e.target.value }))}
                  className={errors.dataNascimento ? "border-destructive" : ""}
                />
                {errors.dataNascimento && (
                  <p className="text-xs text-destructive">{errors.dataNascimento}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={form.telefoneDisplay}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="(11) 99941-1920"
                  maxLength={15}
                  className={errors.telefone ? "border-destructive" : ""}
                />
                {errors.telefone && (
                  <p className="text-xs text-destructive">{errors.telefone}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Endereco */}
            <div className="grid gap-2">
              <Label htmlFor="endereco">Endereço *</Label>
              <Input
                id="endereco"
                value={form.endereco}
                onChange={(e) => setForm((p) => ({ ...p, endereco: e.target.value }))}
                className={errors.endereco ? "border-destructive" : ""}
              />
              {errors.endereco && (
                <p className="text-xs text-destructive">{errors.endereco}</p>
              )}
            </div>

            {/* Viagem */}
            <div className="grid gap-2">
              <Label htmlFor="viagem">Viagem vinculada</Label>
              <Select
                value={form.viagemId ?? "none"}
                onValueChange={(v) => setForm((p) => ({ ...p, viagemId: v === "none" ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma viagem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {viagens.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((p) => ({ ...p, status: v as "pago" | "pendente" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observacoes */}
            <div className="grid gap-2">
              <Label htmlFor="obs">Observações</Label>
              <Textarea
                id="obs"
                value={form.observacoes}
                onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
              Todos os pagamentos vinculados também serão removidos.
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
