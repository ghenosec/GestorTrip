"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import { formatCPF, formatPhone, formatCurrency, getValorPago, getValorPendente, maskPhone, maskCPF, unmaskPhone, unmaskCPF } from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Search, User, Phone, Mail, MapPin, FileText, Pencil } from "lucide-react"
import type { Cliente } from "@/lib/data"

type ClienteEditForm = Omit<Cliente, "id" | "status">

export function PesquisaRapida() {
  const { clientes, viagens, getViagemById, updateCliente } = useStore()
  const [query,   setQuery]   = useState("")
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [saving,  setSaving]  = useState(false)

  const [form, setForm] = useState<ClienteEditForm>({
    nomeCompleto: "", cpf: "", rg: "", dataNascimento: "",
    telefone: "", email: "", endereco: "", observacoes: "",
    viagemIds: [],
    viagemId: null,
    viagemStatus: {},
  })

  const results = useMemo(() => {
    if (query.trim().length < 2) return []
    const q = query.toLowerCase().trim()
    return clientes.filter((c) =>
      c.nomeCompleto.toLowerCase().includes(q) ||
      c.cpf.includes(q) || c.rg.includes(q) ||
      c.telefone.includes(q) || c.email.toLowerCase().includes(q)
    )
  }, [clientes, query])

  function openEdit(c: Cliente) {
    setForm({
      nomeCompleto:   c.nomeCompleto,
      cpf:            c.cpf,
      rg:             c.rg,
      dataNascimento: c.dataNascimento,
      telefone:       c.telefone,
      email:          c.email,
      endereco:       c.endereco,
      observacoes:    c.observacoes,
      viagemIds:      c.viagemIds ?? (c.viagemId ? [c.viagemId] : []),
      viagemId:       c.viagemId,
      viagemStatus:   c.viagemStatus ?? {},
    })
    setEditing(c)
  }

  async function handleSave() {
    if (!editing) return
    setSaving(true)
    try {
      await updateCliente(editing.id, {
        ...form,
        cpf:      unmaskCPF(form.cpf),
        telefone: unmaskPhone(form.telefone),
      })
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const viagensAtivas = viagens.filter((v) => v.status === "ativa")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Pesquisa Rápida</h2>
        <p className="text-sm text-muted-foreground">Busque por nome, CPF, RG, telefone ou email</p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Digite para buscar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 pl-12 text-base"
          autoFocus
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {results.length === 0
              ? "Nenhum resultado encontrado."
              : `${results.length} resultado${results.length > 1 ? "s" : ""} encontrado${results.length > 1 ? "s" : ""}`}
          </p>

          {results.map((c) => {
            const ids = c.viagemIds ?? (c.viagemId ? [c.viagemId] : [])
            const viagensDoCliente = ids
              .map((id) => getViagemById(id))
              .filter(Boolean)

            return (
              <Card
                key={c.id}
                className="cursor-pointer transition-shadow hover:shadow-md hover:border-primary/40"
                onClick={() => openEdit(c)}
              >
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-card-foreground">{c.nomeCompleto}</span>
                        <StatusBadge status={c.status} className="ml-2" />
                      </div>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>

                    <div className="ml-12 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span>CPF: {formatCPF(c.cpf)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span>RG: {c.rg || "---"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{formatPhone(c.telefone)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{c.email || "---"}</span>
                      </div>
                      {c.endereco && (
                        <div className="flex items-center gap-2 text-muted-foreground sm:col-span-2">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>{c.endereco}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {viagensDoCliente.length > 0 && (
                    <div className="ml-12 sm:ml-0 shrink-0 flex flex-wrap gap-1">
                      {viagensDoCliente.map((v) => v && (
                        <span
                          key={v.id}
                          className="rounded-md bg-muted px-3 py-2 text-sm whitespace-nowrap"
                        >
                          <span className="text-muted-foreground">Viagem:</span>{" "}
                          <span className="font-medium text-card-foreground">{v.nome}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {query.trim().length < 2 && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-16 text-center">
          <Search className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Digite pelo menos 2 caracteres para iniciar a busca</p>
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">Editar Cliente</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">Nome completo</Label>
              <Input
                value={form.nomeCompleto}
                onChange={(e) => setForm((f) => ({ ...f, nomeCompleto: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">CPF</Label>
              <Input
                value={maskCPF(form.cpf)}
                onChange={(e) => setForm((f) => ({ ...f, cpf: unmaskCPF(e.target.value) }))}
                placeholder="000.000.000-00"
                className="h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">RG</Label>
              <Input
                value={form.rg}
                onChange={(e) => setForm((f) => ({ ...f, rg: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Data de nascimento</Label>
              <Input
                type="date"
                value={form.dataNascimento}
                onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Telefone</Label>
              <Input
                value={maskPhone(form.telefone)}
                onChange={(e) => setForm((f) => ({ ...f, telefone: unmaskPhone(e.target.value) }))}
                placeholder="(00) 00000-0000"
                className="h-9 text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">Endereço</Label>
              <Input
                value={form.endereco}
                onChange={(e) => setForm((f) => ({ ...f, endereco: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>

            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">Observações</Label>
              <Input
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                className="h-9 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label className="text-xs">Viagens</Label>
              {viagensAtivas.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma viagem ativa.</p>
              ) : (
                <div className="flex flex-col gap-1.5 rounded-md border p-2 max-h-36 overflow-y-auto">
                  {viagensAtivas.map((v) => {
                    const marcado = form.viagemIds.includes(v.id)
                    return (
                      <label
                        key={v.id}
                        className="flex items-center gap-2 cursor-pointer rounded px-1 py-0.5 hover:bg-muted/40 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => {
                            setForm((f) => {
                              const ids = marcado
                                ? f.viagemIds.filter((id) => id !== v.id)
                                : [...f.viagemIds, v.id]
                              return { ...f, viagemIds: ids, viagemId: ids[0] ?? null }
                            })
                          }}
                          className="accent-primary"
                        />
                        <span className="font-medium">{v.nome}</span>
                        {v.destino && (
                          <span className="text-muted-foreground">— {v.destino}</span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
