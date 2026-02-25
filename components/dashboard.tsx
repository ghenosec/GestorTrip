"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { formatCurrency, getValorPago } from "@/lib/data"
import { Users, Earth, CheckCircle2, Clock, TrendingUp, Wallet } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs text-popover-foreground">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

function CustomPieTooltip({ active, payload }: {
  active?: boolean
  payload?: { name: string; value: number }[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs text-popover-foreground">
      <span className="text-muted-foreground">{payload[0].name}: </span>
      <span className="font-medium">{payload[0].value}</span>
    </div>
  )
}

export function Dashboard() {
  const { clientes, viagens, pagamentos } = useStore()

  const stats = useMemo(() => {
    const totalClientes      = clientes.length
    const viagensAtivas      = viagens.filter((v) => v.status === "ativa").length
    const clientesPagos      = clientes.filter((c) => c.status === "pago").length
    const clientesPendentes  = clientes.filter((c) => c.status === "pendente").length
    const valorTotalReceber  = pagamentos.reduce((s, p) => s + p.valorTotal, 0)
    const valorTotalRecebido = pagamentos.reduce((s, p) => s + getValorPago(p), 0)
    return { totalClientes, viagensAtivas, clientesPagos, clientesPendentes, valorTotalReceber, valorTotalRecebido }
  }, [clientes, viagens, pagamentos])

  const chartData = useMemo(() => viagens.map((v) => {
    const vPags    = pagamentos.filter((p) => p.viagemId === v.id)
    const recebido = vPags.reduce((s, p) => s + getValorPago(p), 0)
    const total    = vPags.reduce((s, p) => s + p.valorTotal, 0)
    return {
      nome: v.nome.length > 18 ? v.nome.substring(0, 18) + "…" : v.nome,
      recebido, total,
    }
  }), [viagens, pagamentos])

  const pieData = useMemo(() => [
    { name: "Pagos",     value: stats.clientesPagos },
    { name: "Pendentes", value: stats.clientesPendentes },
  ], [stats])

  const PIE_COLORS = ["#059669", "#d97706"]

  const kpis = [
    { title: "Total de Clientes",  value: stats.totalClientes,                    icon: Users,        color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950"    },
    { title: "Viagens Ativas",     value: stats.viagensAtivas,                    icon: Earth,        color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-950" },
    { title: "Clientes Pagos",     value: stats.clientesPagos,                    icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
    { title: "Clientes Pendentes", value: stats.clientesPendentes,                icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950"  },
    { title: "Total a Receber",    value: formatCurrency(stats.valorTotalReceber),  icon: TrendingUp,   color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950"    },
    { title: "Total Recebido",     value: formatCurrency(stats.valorTotalRecebido), icon: Wallet,       color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">{kpi.title}</span>
                <span className="text-xl font-bold text-card-foreground">{kpi.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita por Viagem</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="nome" fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="var(--muted-foreground)"
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                  <Bar dataKey="total"    name="Total"    fill="var(--chart-4)" radius={[4,4,0,0]} maxBarSize={36} />
                  <Bar dataKey="recebido" name="Recebido" fill="var(--chart-1)" radius={[4,4,0,0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status dos Clientes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-600" />
                <span className="text-muted-foreground">Pagos ({stats.clientesPagos})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-amber-600" />
                <span className="text-muted-foreground">Pendentes ({stats.clientesPendentes})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}