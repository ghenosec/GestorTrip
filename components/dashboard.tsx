"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/lib/store"
import { formatCurrency, formatDate, getValorPago, getValorPendente } from "@/lib/data"
import {
  Users, Earth, CheckCircle2, Clock,
  Wallet, AlertTriangle, CalendarClock, MapPin, ArrowRight,
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md text-xs">
      <p className="mb-1.5 font-semibold text-popover-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 py-0.5">
          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium ml-auto pl-4 text-popover-foreground">{formatCurrency(p.value)}</span>
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

function formatYAxis(value: number): string {
  if (value === 0) return "R$ 0"
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  return `R$ ${value}`
}

function getStatusPagamento(valorTotal: number, valorPago: number): "pago" | "pendente" | "a_confirmar" {
  if (valorPago <= 0)          return "a_confirmar"
  if (valorPago >= valorTotal) return "pago"
  return "pendente"
}

export function Dashboard() {
  const { clientes, viagens, pagamentos, setActiveSection, openFichaCliente } = useStore()

  const hoje = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  const stats = useMemo(() => {
    const totalClientes      = clientes.length
    const viagensAtivas      = viagens.filter((v) => v.status === "ativa").length
    const valorTotalRecebido = pagamentos.reduce((s, p) => s + getValorPago(p), 0)

    let pagos = 0, pendentes = 0, aConfirmar = 0
    for (const p of pagamentos) {
      const status = getStatusPagamento(p.valorTotal, getValorPago(p))
      if (status === "pago")        pagos++
      else if (status === "pendente") pendentes++
      else                            aConfirmar++
    }

    return {
      totalClientes, viagensAtivas, valorTotalRecebido,
      clientesPagos: pagos,
      clientesPendentes: pendentes,
      clientesAConfirmar: aConfirmar,
    }
  }, [clientes, viagens, pagamentos])

  const proximasViagens = useMemo(() => {
    return viagens
      .filter((v) => {
        if (!v.dataIda) return false
        const dataIda = new Date(v.dataIda + "T12:00:00")
        return dataIda >= hoje && v.status === "ativa"
      })
      .sort((a, b) => a.dataIda.localeCompare(b.dataIda))
      .slice(0, 4)
  }, [viagens, hoje])

  const pendentesCriticos = useMemo(() => {
    return pagamentos
      .filter((p) => getValorPago(p) > 0 && getValorPendente(p) > 0)
      .sort((a, b) => getValorPendente(b) - getValorPendente(a))
      .slice(0, 5)
      .map((p) => {
        const cliente = clientes.find((c) => c.id === p.clienteId)
        const viagem  = viagens.find((v) => v.id === p.viagemId)
        return { pagamento: p, cliente, viagem }
      })
      .filter((x) => x.cliente)
  }, [pagamentos, clientes, viagens])

  const chartData = useMemo(() => viagens.map((v) => {
    const vPags    = pagamentos.filter((p) => p.viagemId === v.id)
    const recebido = vPags.reduce((s, p) => s + getValorPago(p), 0)
    const total    = vPags.reduce((s, p) => s + p.valorTotal, 0)
    return {
      nome: v.nome.length > 14 ? v.nome.substring(0, 14) + "…" : v.nome,
      "Total":    total,
      "Recebido": recebido,
    }
  }), [viagens, pagamentos])

  const maxValue = useMemo(() => {
    if (!chartData.length) return 100
    const max = Math.max(...chartData.map((d) => d["Total"]))
    if (max === 0) return 100
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
    return Math.ceil(max / magnitude) * magnitude
  }, [chartData])

  const pieData = useMemo(() => [
    { name: "Pagos",       value: stats.clientesPagos },
    { name: "Pendentes",   value: stats.clientesPendentes },
    { name: "A confirmar", value: stats.clientesAConfirmar },
  ], [stats])

  const PIE_COLORS = ["#059669", "#d97706", "#94a3b8"]
  const COR_TOTAL  = "#3b82f6"
  const COR_REC    = "#10b981"

  const kpis = [
    { title: "Total de Clientes", value: stats.totalClientes,                     icon: Users,         color: "text-blue-500",    bg: "bg-blue-500/10"    },
    { title: "Viagens Ativas",    value: stats.viagensAtivas,                     icon: Earth,         color: "text-indigo-500",  bg: "bg-indigo-500/10"  },
    { title: "Pagos",             value: stats.clientesPagos,                     icon: CheckCircle2,  color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Pendentes",         value: stats.clientesPendentes,                 icon: Clock,         color: "text-amber-500",   bg: "bg-amber-500/10"   },
    { title: "A confirmar",       value: stats.clientesAConfirmar,                icon: AlertTriangle, color: "text-slate-500",   bg: "bg-slate-500/10"   },
    { title: "Total Recebido",    value: formatCurrency(stats.valorTotalRecebido), icon: Wallet,        color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  function diasAte(dataIda: string): number {
    const d = new Date(dataIda + "T12:00:00")
    return Math.ceil((d.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="flex flex-col gap-2 p-4">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${kpi.bg}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <span className="text-xl font-bold text-card-foreground leading-none">{kpi.value}</span>
              <span className="text-xs text-muted-foreground leading-tight">{kpi.title}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-indigo-500" />
              Próximas Viagens
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
              onClick={() => setActiveSection("viagens")}>
              Ver todas <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-2">
            {proximasViagens.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhuma viagem ativa futura.
              </p>
            ) : proximasViagens.map((v) => {

              const confirmados = clientes.filter((c) =>
                (c.viagemIds ?? (c.viagemId ? [c.viagemId] : [])).includes(v.id)
              ).length
              const capacidade  = v.capacidade ?? 0
              const temCap      = capacidade > 0
              const pct         = temCap ? Math.min((confirmados / capacidade) * 100, 100) : null
              const dias        = diasAte(v.dataIda)
              const lotada      = temCap && confirmados >= capacidade
              const quaseLotada = temCap && !lotada && confirmados >= capacidade * 0.9

              return (
                <div key={v.id} className="flex flex-col gap-1.5 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-card-foreground leading-tight">{v.nome}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{v.destino}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge
                        variant={dias <= 7 ? "destructive" : dias <= 30 ? "outline" : "secondary"}
                        className="text-xs">
                        {dias === 0 ? "Hoje!" : dias === 1 ? "Amanhã" : `${dias} dias`}
                      </Badge>
                      {lotada && (
                        <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Lotada
                        </span>
                      )}
                      {quaseLotada && (
                        <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Quase lotada
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(v.dataIda)} → {formatDate(v.dataVolta)}</span>
                    <span className="font-medium">
                      {confirmados}{temCap ? `/${capacidade}` : ""} passageiros
                    </span>
                  </div>
                  {pct !== null && (
                    <Progress
                      value={pct}
                      className={`h-1.5 ${
                        lotada        ? "[&>div]:bg-red-500"
                        : quaseLotada ? "[&>div]:bg-amber-500"
                        : ""
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Maiores Pendências
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground"
              onClick={() => setActiveSection("pagamentos")}>
              Ver todas <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="pt-0 flex flex-col gap-2">
            {pendentesCriticos.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Tudo em dia!
              </p>
            ) : pendentesCriticos.map(({ pagamento, cliente, viagem }) => {
              const pago     = getValorPago(pagamento)
              const pendente = getValorPendente(pagamento)
              const pct      = pagamento.valorTotal > 0 ? (pago / pagamento.valorTotal) * 100 : 0

              return (
                <div key={pagamento.id}
                  className="flex flex-col gap-1.5 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => cliente && openFichaCliente(cliente.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-card-foreground truncate">
                      {cliente?.nomeCompleto}
                    </span>
                    <span className="text-sm font-bold text-amber-600 shrink-0">
                      {formatCurrency(pendente)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{viagem?.nome ?? "—"}</span>
                    <span>{formatCurrency(pago)} / {formatCurrency(pagamento.valorTotal)}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita por Viagem</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="mb-3 flex items-center gap-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: COR_TOTAL }} />
                Total esperado
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ background: COR_REC }} />
                Já recebido
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="nome" fontSize={11} tickLine={false} axisLine={false}
                    tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false}
                    tick={{ fill: "var(--muted-foreground)" }}
                    tickFormatter={formatYAxis} domain={[0, maxValue]} tickCount={5} width={68} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="Total"    fill={COR_TOTAL} radius={[4,4,0,0]} maxBarSize={36} />
                  <Bar dataKey="Recebido" fill={COR_REC}   radius={[4,4,0,0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status dos Vínculos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center pt-0">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={46} outerRadius={70}
                    paddingAngle={4} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                <span className="text-muted-foreground">Pagos ({stats.clientesPagos})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-600" />
                <span className="text-muted-foreground">Pendentes ({stats.clientesPendentes})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <span className="text-muted-foreground">A confirmar ({stats.clientesAConfirmar})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}