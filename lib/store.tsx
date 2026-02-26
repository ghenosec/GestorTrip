"use client"

import React, {
  createContext, useContext, useState, useCallback, useMemo, useEffect,
} from "react"
import type { Cliente, Viagem, Pagamento, PagamentoHistorico } from "./data"
import { generateId, getValorPago } from "./data"

interface StoreContextType {
  clientes: Cliente[]
  viagens: Viagem[]
  pagamentos: Pagamento[]
  loading: boolean
  activeSection: string
  setActiveSection: (section: string) => void
  addCliente: (cliente: Omit<Cliente, "id">) => Promise<void>
  updateCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>
  deleteCliente: (id: string) => Promise<void>
  addViagem: (viagem: Omit<Viagem, "id">) => Promise<void>
  updateViagem: (id: string, viagem: Partial<Viagem>) => Promise<void>
  deleteViagem: (id: string) => Promise<void>
  addPagamento: (pagamento: Omit<Pagamento, "id" | "historico">) => Promise<void>
  addPagamentoHistorico: (pagamentoId: string, historico: Omit<PagamentoHistorico, "id">) => Promise<void>
  deletePagamento: (id: string) => Promise<void>
  getClientesByViagem: (viagemId: string) => Cliente[]
  getPagamentoByCliente: (clienteId: string) => Pagamento | undefined
  getViagemById: (viagemId: string) => Viagem | undefined
  getClienteById: (clienteId: string) => Cliente | undefined
  reloadAll: () => Promise<void>
}

function getUserId(): number {
  if (typeof window === "undefined") return 0
  try {
    const raw = sessionStorage.getItem("user")
    return raw ? JSON.parse(raw).id : 0
  } catch { return 0 }
}

function hasElectron(): boolean {
  return typeof window !== "undefined" && typeof window.electronAPI !== "undefined"
}

function rowToCliente(row: Record<string, unknown>): Cliente {
  return {
    id: String(row.id),
    nomeCompleto: String(row.nome_completo ?? ""),
    cpf: String(row.cpf ?? ""),
    rg: String(row.rg ?? ""),
    dataNascimento: String(row.data_nascimento ?? ""),
    telefone: String(row.telefone ?? ""),
    email: String(row.email ?? ""),
    endereco: String(row.endereco ?? ""),
    observacoes: String(row.observacoes ?? ""),
    viagemId: row.viagem_id ? String(row.viagem_id) : null,
    status: (row.status as "pago" | "pendente") ?? "pendente",
  }
}

function rowToViagem(row: Record<string, unknown>): Viagem {
  return {
    id: String(row.id),
    nome: String(row.nome ?? ""),
    destino: String(row.destino ?? ""),
    dataIda: String(row.data_ida ?? ""),
    dataVolta: String(row.data_volta ?? ""),
    valorPorPessoa: Number(row.valor_por_pessoa ?? 0),
    status: (row.status as "ativa" | "finalizada") ?? "ativa",
  }
}

function rowToHistorico(row: Record<string, unknown>): PagamentoHistorico {
  return {
    id: String(row.id),
    valor: Number(row.valor ?? 0),
    formaPagamento: (row.forma_pagamento as PagamentoHistorico["formaPagamento"]) ?? "pix",
    data: String(row.data ?? ""),
    observacao: row.observacao ? String(row.observacao) : undefined,
  }
}

function rowToPagamento(row: Record<string, unknown>): Pagamento {
  let historico: PagamentoHistorico[] = []
  try {
    const raw = row.historico
    if (typeof raw === "string" && raw) historico = JSON.parse(raw).map(rowToHistorico)
    else if (Array.isArray(raw))        historico = raw.map(rowToHistorico)
  } catch { historico = [] }
  return {
    id: String(row.id),
    clienteId: String(row.cliente_id ?? ""),
    viagemId: String(row.viagem_id ?? ""),
    valorTotal: Number(row.valor_total ?? 0),
    historico,
  }
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes]     = useState<Cliente[]>([])
  const [viagens, setViagens]       = useState<Viagem[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeSection, setActiveSection] = useState("dashboard")

  const reloadAll = useCallback(async () => {
    const userId = getUserId()
    if (!hasElectron()) {
      setClientes([]); setViagens([]); setPagamentos([])
      setLoading(false); return
    }
    try {
      const [rawViagens, rawClientes, rawPagamentos] = await Promise.all([
        window.electronAPI.getViagens(userId),
        window.electronAPI.getClientes(userId),
        window.electronAPI.getPagamentos(userId),
      ])
      setViagens((rawViagens   ?? []).map(rowToViagem))
      setClientes((rawClientes ?? []).map(rowToCliente))
      setPagamentos((rawPagamentos ?? []).map(rowToPagamento))
    } catch (err) {
      console.error("[Store] Erro ao carregar dados:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { reloadAll() }, [reloadAll])

  const addCliente = useCallback(async (data: Omit<Cliente, "id">) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setClientes((prev) => [...prev, { ...data, id: generateId() }]); return
    }
    await window.electronAPI.createCliente(userId, {
      nome_completo:   data.nomeCompleto,
      cpf:             data.cpf,
      rg:              data.rg,
      data_nascimento: data.dataNascimento,
      telefone:        data.telefone,
      email:           data.email,
      endereco:        data.endereco,
      observacoes:     data.observacoes,
      viagem_id:       data.viagemId ? Number(data.viagemId) : null,
      status:          data.status,
    })
    await reloadAll()
  }, [reloadAll])

  const updateCliente = useCallback(async (id: string, data: Partial<Cliente>) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c))); return
    }
    await window.electronAPI.updateCliente(Number(id), userId, {
      nome_completo:   data.nomeCompleto,
      cpf:             data.cpf,
      rg:              data.rg,
      data_nascimento: data.dataNascimento,
      telefone:        data.telefone,
      email:           data.email,
      endereco:        data.endereco,
      observacoes:     data.observacoes,
      viagem_id:       data.viagemId !== undefined
                         ? (data.viagemId ? Number(data.viagemId) : null)
                         : undefined,
      status:          data.status,
    })
    await reloadAll()
  }, [reloadAll])

  const deleteCliente = useCallback(async (id: string) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setClientes((prev) => prev.filter((c) => c.id !== id))
      setPagamentos((prev) => prev.filter((p) => p.clienteId !== id))
      return
    }
    await window.electronAPI.deleteCliente(Number(id), userId)
    await reloadAll()
  }, [reloadAll])

  const addViagem = useCallback(async (data: Omit<Viagem, "id">) => {
    const userId = getUserId()
    if (!hasElectron()) { setViagens((prev) => [...prev, { ...data, id: generateId() }]); return }
    await window.electronAPI.createViagem(userId, {
      nome: data.nome, destino: data.destino, data_ida: data.dataIda,
      data_volta: data.dataVolta, valor_por_pessoa: data.valorPorPessoa, status: data.status,
    })
    await reloadAll()
  }, [reloadAll])

  const updateViagem = useCallback(async (id: string, data: Partial<Viagem>) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setViagens((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v))); return
    }
    const atual = viagens.find((v) => v.id === id)
    if (!atual) return
    const merged = { ...atual, ...data }
    await window.electronAPI.updateViagem(Number(id), userId, {
      nome: merged.nome, destino: merged.destino, data_ida: merged.dataIda,
      data_volta: merged.dataVolta, valor_por_pessoa: merged.valorPorPessoa, status: merged.status,
    })
    await reloadAll()
  }, [viagens, reloadAll])

  const deleteViagem = useCallback(async (id: string) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setViagens((prev) => prev.filter((v) => v.id !== id))
      setClientes((prev) => prev.map((c) => (c.viagemId === id ? { ...c, viagemId: null } : c)))
      setPagamentos((prev) => prev.filter((p) => p.viagemId !== id))
      return
    }
    await window.electronAPI.deleteViagem(Number(id), userId)
    await reloadAll()
  }, [reloadAll])

  const addPagamento = useCallback(async (data: Omit<Pagamento, "id" | "historico">) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setPagamentos((prev) => [...prev, { ...data, id: generateId(), historico: [] }]); return
    }
    await window.electronAPI.createPagamento(userId, {
      cliente_id: Number(data.clienteId), viagem_id: Number(data.viagemId),
      valor_total: data.valorTotal, historico: "[]",
    })
    await reloadAll()
  }, [reloadAll])

  const addPagamentoHistorico = useCallback(
    async (pagamentoId: string, novoHistorico: Omit<PagamentoHistorico, "id">) => {
      const userId = getUserId()
      const pagamento = pagamentos.find((p) => p.id === pagamentoId)
      if (!pagamento) return

      if (!hasElectron()) {
        setPagamentos((prev) => prev.map((p) => {
          if (p.id !== pagamentoId) return p
          const updated = { ...p, historico: [...p.historico, { ...novoHistorico, id: generateId() }] }
          if (getValorPago(updated) >= p.valorTotal)
            setClientes((prev2) => prev2.map((c) =>
              c.id === p.clienteId ? { ...c, status: "pago" as const } : c))
          return updated
        }))
        return
      }

      const historicoAtualizado: PagamentoHistorico[] = [
        ...pagamento.historico,
        { ...novoHistorico, id: generateId() },
      ]
      const totalPago = historicoAtualizado.reduce((s, h) => s + h.valor, 0)

      await window.electronAPI.updatePagamento(Number(pagamentoId), userId, {
        cliente_id:  Number(pagamento.clienteId),
        viagem_id:   Number(pagamento.viagemId),
        valor_total: pagamento.valorTotal,
        historico:   JSON.stringify(historicoAtualizado),
      })

      if (totalPago >= pagamento.valorTotal) {
        await window.electronAPI.updateCliente(Number(pagamento.clienteId), userId, { status: "pago" })
      }

      await reloadAll()
    },
    [pagamentos, reloadAll]
  )

  const deletePagamento = useCallback(async (id: string) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setPagamentos((prev) => prev.filter((p) => p.id !== id)); return
    }
    await window.electronAPI.deletePagamento(Number(id), userId)
    await reloadAll()
  }, [reloadAll])

  const getClientesByViagem   = useCallback((viagemId: string) => clientes.filter((c) => c.viagemId === viagemId), [clientes])
  const getPagamentoByCliente = useCallback((clienteId: string) => pagamentos.find((p) => p.clienteId === clienteId), [pagamentos])
  const getViagemById         = useCallback((viagemId: string) => viagens.find((v) => v.id === viagemId), [viagens])
  const getClienteById        = useCallback((clienteId: string) => clientes.find((c) => c.id === clienteId), [clientes])

  const value = useMemo(() => ({
    clientes, viagens, pagamentos, loading, activeSection, setActiveSection,
    addCliente, updateCliente, deleteCliente,
    addViagem, updateViagem, deleteViagem,
    addPagamento, addPagamentoHistorico, deletePagamento,
    getClientesByViagem, getPagamentoByCliente, getViagemById, getClienteById,
    reloadAll,
  }), [
    clientes, viagens, pagamentos, loading, activeSection,
    addCliente, updateCliente, deleteCliente,
    addViagem, updateViagem, deleteViagem,
    addPagamento, addPagamentoHistorico, deletePagamento,
    getClientesByViagem, getPagamentoByCliente, getViagemById, getClienteById,
    reloadAll,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside StoreProvider")
  return ctx
}