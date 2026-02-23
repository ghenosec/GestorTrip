"use client"

import React, { createContext, useContext, useState, useCallback, useMemo } from "react"
import type { Cliente, Viagem, Pagamento, PagamentoHistorico } from "./data"
import {
  clientesIniciais,
  viagensIniciais,
  pagamentosIniciais,
  generateId,
  getValorPago,
} from "./data"

interface StoreContextType {
  clientes: Cliente[]
  viagens: Viagem[]
  pagamentos: Pagamento[]

  activeSection: string
  setActiveSection: (section: string) => void

  addCliente: (cliente: Omit<Cliente, "id">) => void
  updateCliente: (id: string, cliente: Partial<Cliente>) => void
  deleteCliente: (id: string) => void

  addViagem: (viagem: Omit<Viagem, "id">) => void
  updateViagem: (id: string, viagem: Partial<Viagem>) => void
  deleteViagem: (id: string) => void

  addPagamento: (pagamento: Omit<Pagamento, "id">) => void
  addPagamentoHistorico: (pagamentoId: string, historico: Omit<PagamentoHistorico, "id">) => void

  getClientesByViagem: (viagemId: string) => Cliente[]
  getPagamentoByCliente: (clienteId: string) => Pagamento | undefined
  getViagemById: (viagemId: string) => Viagem | undefined
  getClienteById: (clienteId: string) => Cliente | undefined
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciais)
  const [viagens, setViagens] = useState<Viagem[]>(viagensIniciais)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>(pagamentosIniciais)
  const [activeSection, setActiveSection] = useState("dashboard")

  const addCliente = useCallback((data: Omit<Cliente, "id">) => {
    const newCliente: Cliente = { ...data, id: generateId() }
    setClientes((prev) => [...prev, newCliente])

    if (data.viagemId) {
      const viagem = viagensIniciais.find((v) => v.id === data.viagemId)
      if (viagem) {
        setPagamentos((prev) => [
          ...prev,
          {
            id: generateId(),
            clienteId: newCliente.id,
            viagemId: data.viagemId!,
            valorTotal: viagem.valorPorPessoa,
            historico: [],
          },
        ])
      }
    }
  }, [])

  const updateCliente = useCallback((id: string, data: Partial<Cliente>) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }, [])

  const deleteCliente = useCallback((id: string) => {
    setClientes((prev) => prev.filter((c) => c.id !== id))
    setPagamentos((prev) => prev.filter((p) => p.clienteId !== id))
  }, [])

  const addViagem = useCallback((data: Omit<Viagem, "id">) => {
    const newViagem: Viagem = { ...data, id: generateId() }
    setViagens((prev) => [...prev, newViagem])
  }, [])

  const updateViagem = useCallback((id: string, data: Partial<Viagem>) => {
    setViagens((prev) => prev.map((v) => (v.id === id ? { ...v, ...data } : v)))
  }, [])

  const deleteViagem = useCallback((id: string) => {
    setViagens((prev) => prev.filter((v) => v.id !== id))
    setClientes((prev) => prev.map((c) => (c.viagemId === id ? { ...c, viagemId: null } : c)))
    setPagamentos((prev) => prev.filter((p) => p.viagemId !== id))
  }, [])

  const addPagamento = useCallback((data: Omit<Pagamento, "id">) => {
    setPagamentos((prev) => [...prev, { ...data, id: generateId() }])
  }, [])

  const addPagamentoHistorico = useCallback(
    (pagamentoId: string, historico: Omit<PagamentoHistorico, "id">) => {
      setPagamentos((prev) =>
        prev.map((p) => {
          if (p.id !== pagamentoId) return p

          const updatedPagamento = {
            ...p,
            historico: [...p.historico, { ...historico, id: generateId() }],
          }
          const totalPago = getValorPago(updatedPagamento)
          if (totalPago >= p.valorTotal) {
            setClientes((prevClientes) =>
              prevClientes.map((c) =>
                c.id === p.clienteId ? { ...c, status: "pago" as const } : c
              )
            )
          }

          return updatedPagamento
        })
      )
    },
    []
  )

  const getClientesByViagem = useCallback(
    (viagemId: string) => clientes.filter((c) => c.viagemId === viagemId),
    [clientes]
  )

  const getPagamentoByCliente = useCallback(
    (clienteId: string) => pagamentos.find((p) => p.clienteId === clienteId),
    [pagamentos]
  )

  const getViagemById = useCallback(
    (viagemId: string) => viagens.find((v) => v.id === viagemId),
    [viagens]
  )

  const getClienteById = useCallback(
    (clienteId: string) => clientes.find((c) => c.id === clienteId),
    [clientes]
  )

  const value = useMemo(
    () => ({
      clientes,
      viagens,
      pagamentos,
      activeSection,
      setActiveSection,
      addCliente,
      updateCliente,
      deleteCliente,
      addViagem,
      updateViagem,
      deleteViagem,
      addPagamento,
      addPagamentoHistorico,
      getClientesByViagem,
      getPagamentoByCliente,
      getViagemById,
      getClienteById,
    }),
    [
      clientes,
      viagens,
      pagamentos,
      activeSection,
      addCliente,
      updateCliente,
      deleteCliente,
      addViagem,
      updateViagem,
      deleteViagem,
      addPagamento,
      addPagamentoHistorico,
      getClientesByViagem,
      getPagamentoByCliente,
      getViagemById,
      getClienteById,
    ]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used inside StoreProvider")
  return ctx
}
