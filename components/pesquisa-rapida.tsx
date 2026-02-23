"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import { formatCPF, formatPhone } from "@/lib/data"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Search, User, Phone, Mail, MapPin, FileText } from "lucide-react"

export function PesquisaRapida() {
  const { clientes, getViagemById } = useStore()
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    if (query.trim().length < 2) return []

    const q = query.toLowerCase().trim()
    return clientes.filter((c) => {
      return (
        c.nomeCompleto.toLowerCase().includes(q) ||
        c.cpf.includes(q) ||
        c.rg.includes(q) ||
        c.telefone.includes(q) ||
        c.email.toLowerCase().includes(q)
      )
    })
  }, [clientes, query])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-foreground">Pesquisa Rápida</h2>
        <p className="text-sm text-muted-foreground">
          Busque por nome, CPF, RG, telefone ou email
        </p>
      </div>

      {/* Search input */}
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

      {/* Results */}
      {query.trim().length >= 2 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {results.length === 0
              ? "Nenhum resultado encontrado."
              : `${results.length} resultado${results.length > 1 ? "s" : ""} encontrado${results.length > 1 ? "s" : ""}`}
          </p>

          {results.map((c) => {
            const viagem = c.viagemId ? getViagemById(c.viagemId) : null
            return (
              <Card key={c.id} className="transition-shadow hover:shadow-md">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    {/* Name + status */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-semibold text-card-foreground">{c.nomeCompleto}</span>
                        <StatusBadge status={c.status} className="ml-2" />
                      </div>
                    </div>

                    {/* Details grid */}
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

                  {/* Trip info */}
                  {viagem && (
                    <div className="ml-12 sm:ml-0 shrink-0 rounded-md bg-muted px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Viagem:</span>{" "}
                      <span className="font-medium text-card-foreground">{viagem.nome}</span>
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
          <p className="text-sm text-muted-foreground">
            Digite pelo menos 2 caracteres para iniciar a busca
          </p>
        </div>
      )}
    </div>
  )
}
