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
  addClienteToViagem: (clienteId: string, viagemId: string) => Promise<void>
  removeClienteFromViagem: (clienteId: string, viagemId: string) => Promise<void>
  getClientesByViagem: (viagemId: string) => Cliente[]
  getPagamentoByCliente: (clienteId: string, viagemId?: string) => Pagamento | undefined
  getViagemById: (viagemId: string) => Viagem | undefined
  getClienteById: (clienteId: string) => Cliente | undefined
  reloadAll: () => Promise<void>
  openFichaCliente: (clienteId: string) => void
  fichaClienteId: string | null
  closeFichaCliente: () => void
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
  let viagemIds: string[] = []
  try {
    const raw = row.viagem_ids
    if (typeof raw === "string" && raw) {
      viagemIds = JSON.parse(raw).map(String)
    } else if (Array.isArray(raw)) {
      viagemIds = raw.map(String)
    }
  } catch { viagemIds = [] }
  if (viagemIds.length === 0 && row.viagem_id) {
    viagemIds = [String(row.viagem_id)]
  }

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
    viagemIds,
    viagemId: viagemIds[0] ?? null,
    status: (row.status as "pago" | "pendente" | "a_confirmar") ?? "a_confirmar",
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
    capacidade: Number(row.capacidade ?? 0),
    status: (row.status as "ativa" | "finalizada") ?? "ativa",
    tipo: (row.tipo as "onibus" | "aviao") ?? "onibus",
  }
}

function rowToHistorico(row: Record<string, unknown>): PagamentoHistorico {
  return {
    id: String(row.id),
    valor: Number(row.valor ?? 0),
    formaPagamento: (row.formaPagamento ?? row.forma_pagamento) as PagamentoHistorico["formaPagamento"] ?? "pix",
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
  const [clientes,   setClientes]   = useState<Cliente[]>([])
  const [viagens,    setViagens]    = useState<Viagem[]>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loading,    setLoading]    = useState(true)
  const [activeSection, setActiveSection] = useState("dashboard")
  const [fichaClienteId, setFichaClienteId] = useState<string | null>(null)

  const openFichaCliente  = useCallback((id: string) => setFichaClienteId(id), [])
  const closeFichaCliente = useCallback(() => setFichaClienteId(null), [])

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
      setViagens((rawViagens     ?? []).map(rowToViagem))
      setClientes((rawClientes   ?? []).map(rowToCliente))
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
      viagem_ids:      data.viagemIds ?? (data.viagemId ? [data.viagemId] : []),
      status:          data.status,
    })
    await reloadAll()
  }, [reloadAll])

  const updateCliente = useCallback(async (id: string, data: Partial<Cliente>) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c))); return
    }

    const payload: Record<string, unknown> = {
      nome_completo:   data.nomeCompleto,
      cpf:             data.cpf,
      rg:              data.rg,
      data_nascimento: data.dataNascimento,
      telefone:        data.telefone,
      email:           data.email,
      endereco:        data.endereco,
      observacoes:     data.observacoes,
      status:          data.status,
    }
    if (data.viagemIds !== undefined) {
      payload.viagem_ids = data.viagemIds
    } else if (data.viagemId !== undefined) {
      payload.viagem_id = data.viagemId ? Number(data.viagemId) : null
    }

    await window.electronAPI.updateCliente(Number(id), userId, payload)
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

  const addClienteToViagem = useCallback(async (clienteId: string, viagemId: string) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setClientes((prev) => prev.map((c) => {
        if (c.id !== clienteId) return c
        const ids = [...new Set([...(c.viagemIds ?? []), viagemId])]
        return { ...c, viagemIds: ids, viagemId: ids[0] ?? null }
      }))
      return
    }
    await window.electronAPI.addClienteToViagem(Number(clienteId), Number(viagemId), userId)
    await reloadAll()
  }, [reloadAll])

  const removeClienteFromViagem = useCallback(async (clienteId: string, viagemId: string) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setClientes((prev) => prev.map((c) => {
        if (c.id !== clienteId) return c
        const ids = (c.viagemIds ?? []).filter((v) => v !== viagemId)
        return { ...c, viagemIds: ids, viagemId: ids[0] ?? null }
      }))
      return
    }
    await window.electronAPI.removeClienteFromViagem(Number(clienteId), Number(viagemId), userId)
    await reloadAll()
  }, [reloadAll])

  const addViagem = useCallback(async (data: Omit<Viagem, "id">) => {
    const userId = getUserId()
    if (!hasElectron()) { setViagens((prev) => [...prev, { ...data, id: generateId() }]); return }
    await window.electronAPI.createViagem(userId, {
      nome: data.nome, destino: data.destino,
      data_ida: data.dataIda, data_volta: data.dataVolta,
      valor_por_pessoa: data.valorPorPessoa,
      capacidade: data.capacidade ?? 0,
      status: data.status,
      tipo: data.tipo ?? "onibus",
    })
    await reloadAll()
  }, [reloadAll])

  const updateViagem = useCallback(async (id: string, data: Partial<Viagem>) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setViagens((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)))
      return
    }
    const atual = viagens.find((v) => v.id === id)
    if (!atual) return
    const merged = { ...atual, ...data }
    await window.electronAPI.updateViagem(Number(id), userId, {
      nome: merged.nome, destino: merged.destino,
      data_ida: merged.dataIda, data_volta: merged.dataVolta,
      valor_por_pessoa: merged.valorPorPessoa,
      capacidade: merged.capacidade ?? 0,
      status: merged.status,
      tipo: merged.tipo ?? "onibus",
    })
    if (data.status === "ativa" && atual.status !== "ativa") {
      const clientesDaViagem = clientes.filter(
        (c) => (c.viagemIds ?? []).includes(id) && c.status === "pago"
      )
      for (const c of clientesDaViagem) {
        await window.electronAPI.updateCliente(Number(c.id), userId, { status: "a_confirmar" })
      }
    }
    await reloadAll()
  }, [viagens, clientes, reloadAll])

  const deleteViagem = useCallback(async (id: string) => {
    const userId = getUserId()
    if (!hasElectron()) {
      setViagens((prev) => prev.filter((v) => v.id !== id))
      setClientes((prev) => prev.map((c) => {
        const ids = (c.viagemIds ?? []).filter((v) => v !== id)
        return { ...c, viagemIds: ids, viagemId: ids[0] ?? null }
      }))
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
      const userId   = getUserId()
      const pagamento = pagamentos.find((p) => p.id === pagamentoId)
      if (!pagamento) return

      if (!hasElectron()) {
        setPagamentos((prev) => {
          const next = prev.map((p) => {
            if (p.id !== pagamentoId) return p
            return { ...p, historico: [...p.historico, { ...novoHistorico, id: generateId() }] }
          })
          const updatedPag = next.find((p) => p.id === pagamentoId)!
          const outrosPags = next.filter((p) => p.clienteId === updatedPag.clienteId && p.id !== pagamentoId)
          const totalPagoAtual = getValorPago(updatedPag)
          const todasPagas = totalPagoAtual >= updatedPag.valorTotal &&
            outrosPags.every((p) => getValorPago(p) >= p.valorTotal)
          const temQualquer = totalPagoAtual > 0 || outrosPags.some((p) => getValorPago(p) > 0)
          if (todasPagas) {
            setClientes((prev2) => prev2.map((c) =>
              c.id === updatedPag.clienteId ? { ...c, status: "pago" as const } : c
            ))
          } else if (temQualquer) {
            setClientes((prev2) => prev2.map((c) =>
              c.id === updatedPag.clienteId ? { ...c, status: "pendente" as const } : c
            ))
          }
          return next
        })
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

      const outrosPags = pagamentos.filter(
        (p) => p.clienteId === pagamento.clienteId && p.id !== pagamentoId
      )
      const todasPagas = totalPago >= pagamento.valorTotal &&
        outrosPags.every((p) => {
          const pago = p.historico.reduce((s, h) => s + h.valor, 0)
          return pago >= p.valorTotal
        })
      const temQualquerPagamento = totalPago > 0 ||
        outrosPags.some((p) => p.historico.reduce((s, h) => s + h.valor, 0) > 0)

      if (todasPagas) {
        await window.electronAPI.updateCliente(Number(pagamento.clienteId), userId, { status: "pago" })
      } else if (temQualquerPagamento) {
        await window.electronAPI.updateCliente(Number(pagamento.clienteId), userId, { status: "pendente" })
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

  const getClientesByViagem = useCallback(
    (viagemId: string) =>
      clientes.filter((c) => (c.viagemIds ?? [c.viagemId].filter(Boolean)).includes(viagemId)),
    [clientes]
  )

  const getPagamentoByCliente = useCallback(
    (clienteId: string, viagemId?: string) =>
      pagamentos.find((p) =>
        p.clienteId === clienteId && (viagemId ? p.viagemId === viagemId : true)
      ),
    [pagamentos]
  )

  const getViagemById  = useCallback((vid: string) => viagens.find((v) => v.id === vid), [viagens])
  const getClienteById = useCallback((cid: string) => clientes.find((c) => c.id === cid), [clientes])

  const value = useMemo(() => ({
    clientes, viagens, pagamentos, loading, activeSection, setActiveSection,
    addCliente, updateCliente, deleteCliente,
    addViagem, updateViagem, deleteViagem,
    addPagamento, addPagamentoHistorico, deletePagamento,
    addClienteToViagem, removeClienteFromViagem,
    getClientesByViagem, getPagamentoByCliente, getViagemById, getClienteById,
    reloadAll,
    openFichaCliente, fichaClienteId, closeFichaCliente,
  }), [
    clientes, viagens, pagamentos, loading, activeSection,
    addCliente, updateCliente, deleteCliente,
    addViagem, updateViagem, deleteViagem,
    addPagamento, addPagamentoHistorico, deletePagamento,
    addClienteToViagem, removeClienteFromViagem,
    getClientesByViagem, getPagamentoByCliente, getViagemById, getClienteById,
    reloadAll,
    openFichaCliente, fichaClienteId, closeFichaCliente,
  ])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside StoreProvider")
  return ctx
}