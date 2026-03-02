"use client"

import { useState, useMemo } from "react"
import { useStore } from "@/lib/store"
import { formatCurrency, getValorPago, getValorPendente } from "@/lib/data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { FileDown, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Periodo = "mensal" | "trimestral" | "semestral" | "anual"

const PERIODO_LABEL: Record<Periodo, string> = {
  mensal:      "Mensal (últimos 30 dias)",
  trimestral:  "Trimestral (últimos 3 meses)",
  semestral:   "Semestral (últimos 6 meses)",
  anual:       "Anual (últimos 12 meses)",
}

const PERIODO_DIAS: Record<Periodo, number> = {
  mensal: 30, trimestral: 90, semestral: 180, anual: 365,
}

function subtractDays(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function fmtBR(date: Date) {
  return date.toLocaleDateString("pt-BR")
}

function fmtStrBR(str: string) {
  if (!str) return "—"
  return new Date(str + "T12:00:00").toLocaleDateString("pt-BR")
}

function fmtCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function Relatorio() {
  const { clientes, viagens, pagamentos } = useStore()
  const [periodo, setPeriodo] = useState<Periodo>("mensal")
  const [gerando, setGerando] = useState(false)

  const dataInicio = useMemo(() => subtractDays(PERIODO_DIAS[periodo]), [periodo])
  const dataFim    = useMemo(() => new Date(), [])

  const dados = useMemo(() => {
    const viagensPeriodo = viagens.filter(v => {
      if (!v.dataIda) return false
      return new Date(v.dataIda + "T12:00:00") >= dataInicio
    })
    const viagensIds = new Set(viagensPeriodo.map(v => v.id))
    const pagsPeriodo = pagamentos.filter(p => viagensIds.has(p.viagemId))

    const totalReceber  = pagsPeriodo.reduce((s, p) => s + p.valorTotal, 0)
    const totalRecebido = pagsPeriodo.reduce((s, p) => s + getValorPago(p), 0)
    const totalPendente = pagsPeriodo.reduce((s, p) => s + getValorPendente(p), 0)
    const clientesVinculados = new Set(pagsPeriodo.map(p => p.clienteId)).size
    const clientesPagos      = pagsPeriodo.filter(p => getValorPendente(p) <= 0.01).length
    const clientesPendentes  = pagsPeriodo.filter(p => getValorPendente(p) > 0.01).length
    const taxaRecebimento    = totalReceber > 0 ? Math.round((totalRecebido / totalReceber) * 100) : 0

    return {
      viagensPeriodo,
      pagsPeriodo,
      totalReceber, totalRecebido, totalPendente,
      clientesVinculados, clientesPagos, clientesPendentes,
      viagensAtivas:      viagensPeriodo.filter(v => v.status === "ativa").length,
      viagensFinalizadas: viagensPeriodo.filter(v => v.status === "finalizada").length,
      taxaRecebimento,
      totalClientes: clientes.length,
    }
  }, [clientes, viagens, pagamentos, dataInicio])

  function buildHTML(): string {
    const now   = new Date()
    const label = PERIODO_LABEL[periodo]

    const viagensRows = dados.viagensPeriodo.map(v => {
      const pags      = pagamentos.filter(p => p.viagemId === v.id)
      const recebido  = pags.reduce((s, p) => s + getValorPago(p), 0)
      const total     = pags.reduce((s, p) => s + p.valorTotal, 0)
      const qtd       = clientes.filter(c => c.viagemId === v.id).length
      const pct       = total > 0 ? Math.round((recebido / total) * 100) : 0
      const statusCls = v.status === "ativa" ? "badge-blue" : "badge-gray"
      const statusTxt = v.status === "ativa" ? "Ativa" : "Finalizada"
      return `<tr>
        <td>${v.nome}</td>
        <td>${v.destino || "—"}</td>
        <td>${fmtStrBR(v.dataIda)}</td>
        <td>${fmtStrBR(v.dataVolta)}</td>
        <td style="text-align:center">${qtd}</td>
        <td>${formatCurrency(v.valorPorPessoa)}</td>
        <td>${formatCurrency(total)}</td>
        <td class="green">${formatCurrency(recebido)}</td>
        <td class="${pct === 100 ? "green" : "amber"}" style="text-align:center">${pct}%</td>
        <td><span class="badge ${statusCls}">${statusTxt}</span></td>
      </tr>`
    }).join("")

    const clientesRows = clientes.map(c => {
      const viagem = c.viagemId ? viagens.find(v => v.id === c.viagemId) : null
      const pag    = pagamentos.find(p => p.clienteId === c.id)
      const pago   = pag ? getValorPago(pag) : 0
      const total  = pag ? pag.valorTotal : 0
      const cls    = c.status === "pago" ? "badge-green" : "badge-amber"
      const txt    = c.status === "pago" ? "Pago" : "Pendente"
      return `<tr>
        <td>${c.nomeCompleto}</td>
        <td>${c.cpf ? fmtCPF(c.cpf) : "—"}</td>
        <td>${c.telefone || "—"}</td>
        <td>${viagem?.nome ?? "—"}</td>
        <td class="${c.status === "pago" ? "green" : "amber"}">${formatCurrency(pago)} / ${formatCurrency(total)}</td>
        <td><span class="badge ${cls}">${txt}</span></td>
      </tr>`
    }).join("")

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<style>
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Segoe UI',Arial,sans-serif; background:#fff; color:#1a1a2e; font-size:11px; }

  /* ── Capa ── */
  .cover {
    background: linear-gradient(135deg,#090d16 0%,#0d1528 55%,#12203e 100%);
    color:#fff; 
    padding:52px 48px;
    border-radius:12px;
    margin-bottom:24px;
  }
  .cover-brand { display:flex; align-items:center; gap:12px; margin-bottom:36px; }
  .cover-icon  { width:48px; height:48px; background:rgba(59,130,246,.22); border-radius:12px;
                  display:flex; align-items:center; justify-content:center; font-size:24px; }
  .cover-name  { font-size:24px; font-weight:700; letter-spacing:-.5px; }
  .cover-name span { color:#60a5fa; }
  .cover h1    { font-size:34px; font-weight:800; letter-spacing:-1px; margin-bottom:6px; }
  .cover-sub   { font-size:13px; color:rgba(255,255,255,.6); margin-bottom:28px; }
  .cover-meta  { display:flex; gap:36px; flex-wrap:wrap; }
  .meta-item label { display:block; font-size:9px; color:rgba(255,255,255,.45);
                     text-transform:uppercase; letter-spacing:.8px; margin-bottom:3px; }
  .meta-item span  { font-size:13px; font-weight:600; color:rgba(255,255,255,.9); }

  /* ── Conteúdo ── */
  .content { padding:30px 40px; }

  /* ── KPIs ── */
  .kpi-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
  .kpi {
    background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;
    padding:14px 16px; display:flex; flex-direction:column; gap:3px;
  }
  .kpi-label { font-size:9px; text-transform:uppercase; letter-spacing:.8px; color:#64748b; font-weight:600; }
  .kpi-val   { font-size:20px; font-weight:800; color:#0f172a; }
  .kpi-val.blue   { color:#2563eb; }
  .kpi-val.green  { color:#059669; }
  .kpi-val.amber  { color:#d97706; }
  .kpi-val.indigo { color:#4f46e5; }

  /* ── Resumo ── */
  .summary {
    background:linear-gradient(135deg,#f0f9ff,#e0f2fe);
    border:1px solid #bae6fd; border-radius:10px;
    padding:18px 24px; margin-bottom:28px;
    display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;
  }
  .sum-item { text-align:center; }
  .sum-item label { display:block; font-size:9px; text-transform:uppercase;
                    letter-spacing:.7px; color:#0369a1; margin-bottom:3px; }
  .sum-item span  { font-size:18px; font-weight:800; color:#0c4a6e; }

  /* ── Seções ── */
  .section       { margin-bottom:32px; }
  .section-title {
    font-size:12px; font-weight:700; color:#0f172a;
    border-left:3px solid #3b82f6; padding-left:9px; margin-bottom:12px;
  }

  /* ── Tabelas ── */
  table { width:100%; border-collapse:collapse; font-size:10px; }
  thead th {
    background:#0d1528; color:rgba(255,255,255,.85);
    padding:7px 9px; text-align:left;
    font-size:9px; font-weight:600; text-transform:uppercase; letter-spacing:.6px;
  }
  thead th:first-child { border-radius:6px 0 0 6px; }
  thead th:last-child  { border-radius:0 6px 6px 0; }
  tbody td { padding:6px 9px; border-bottom:1px solid #f1f5f9; color:#334155; vertical-align:middle; }
  tbody tr:last-child td { border-bottom:none; }
  tbody tr:nth-child(even) td { background:#f8fafc; }
  td.green { color:#059669; font-weight:600; }
  td.amber { color:#d97706; font-weight:600; }

  /* ── Badges ── */
  .badge {
    display:inline-block; padding:2px 8px; border-radius:99px;
    font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; white-space:nowrap;
  }
  .badge-blue  { background:#dbeafe; color:#1d4ed8; }
  .badge-gray  { background:#f1f5f9; color:#64748b; }
  .badge-green { background:#d1fae5; color:#065f46; }
  .badge-amber { background:#fef3c7; color:#92400e; }

  /* ── Rodapé ── */
  .footer {
    margin-top:36px; padding-top:14px; border-top:1px solid #e2e8f0;
    display:flex; justify-content:space-between; color:#94a3b8; font-size:9px;
  }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>

<!-- Capa -->
<div class="cover">
  <div class="cover-brand">
    <div class="cover-icon">🌍</div>
    <div class="cover-name">Gestor<span>Trip</span></div>
  </div>
  <h1>Relatório de Gestão</h1>
  <p class="cover-sub">${label}</p>
  <div class="cover-meta">
    <div class="meta-item">
      <label>Período</label>
      <span>${fmtBR(dataInicio)} — ${fmtBR(dataFim)}</span>
    </div>
    <div class="meta-item">
      <label>Gerado em</label>
      <span>${now.toLocaleString("pt-BR")}</span>
    </div>
    <div class="meta-item">
      <label>Total de clientes</label>
      <span>${dados.totalClientes} cadastrados</span>
    </div>
  </div>
</div>

<div class="content">

  <!-- KPIs -->
  <div class="kpi-grid">
    <div class="kpi"><span class="kpi-label">Viagens no período</span><span class="kpi-val indigo">${dados.viagensPeriodo.length}</span></div>
    <div class="kpi"><span class="kpi-label">Clientes vinculados</span><span class="kpi-val blue">${dados.clientesVinculados}</span></div>
    <div class="kpi"><span class="kpi-label">Clientes pagos</span><span class="kpi-val green">${dados.clientesPagos}</span></div>
    <div class="kpi"><span class="kpi-label">Clientes pendentes</span><span class="kpi-val amber">${dados.clientesPendentes}</span></div>
    <div class="kpi"><span class="kpi-label">Total a receber</span><span class="kpi-val blue">${formatCurrency(dados.totalReceber)}</span></div>
    <div class="kpi"><span class="kpi-label">Total recebido</span><span class="kpi-val green">${formatCurrency(dados.totalRecebido)}</span></div>
    <div class="kpi"><span class="kpi-label">Ainda pendente</span><span class="kpi-val amber">${formatCurrency(dados.totalPendente)}</span></div>
    <div class="kpi"><span class="kpi-label">Taxa de recebimento</span><span class="kpi-val green">${dados.taxaRecebimento}%</span></div>
  </div>

  <!-- Resumo financeiro -->
  <div class="summary">
    <div class="sum-item"><label>Viagens ativas</label><span>${dados.viagensAtivas}</span></div>
    <div class="sum-item"><label>Viagens finalizadas</label><span>${dados.viagensFinalizadas}</span></div>
    <div class="sum-item">
      <label>Ticket médio por cliente</label>
      <span>${dados.clientesVinculados > 0 ? formatCurrency(dados.totalReceber / dados.clientesVinculados) : "R$ 0,00"}</span>
    </div>
    <div class="sum-item"><label>Receita recebida</label><span>${formatCurrency(dados.totalRecebido)}</span></div>
  </div>

  <!-- Viagens do período -->
  <div class="section">
    <div class="section-title">Viagens do período</div>
    ${dados.viagensPeriodo.length === 0
      ? `<p style="color:#94a3b8;font-size:11px;padding:10px 0">Nenhuma viagem com data de ida neste período.</p>`
      : `<table>
          <thead><tr>
            <th>Nome</th><th>Destino</th><th>Ida</th><th>Volta</th>
            <th>Clientes</th><th>Valor/pessoa</th><th>Total</th><th>Recebido</th><th>%</th><th>Status</th>
          </tr></thead>
          <tbody>${viagensRows}</tbody>
        </table>`
    }
  </div>

  <!-- Todos os clientes -->
  <div class="section">
    <div class="section-title">Clientes cadastrados</div>
    <table>
      <thead><tr>
        <th>Nome</th><th>CPF</th><th>Telefone</th><th>Viagem</th><th>Pago / Total</th><th>Status</th>
      </tr></thead>
      <tbody>${clientesRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <span>GestorTrip — Sistema de Gestão de Viagens</span>
    <span>Gerado em ${now.toLocaleString("pt-BR")}</span>
  </div>

</div>
</body>
</html>`
  }

  async function handleGerar() {
    if (typeof window === "undefined" || !window.electronAPI?.gerarRelatorio) {
      toast.error("Função disponível apenas no aplicativo instalado")
      return
    }
    setGerando(true)
    try {
      const result = await window.electronAPI.gerarRelatorio(buildHTML())
      if (result.canceled) return
      if (result.success) toast.success("Relatório salvo com sucesso!")
      else toast.error(result.error ?? "Erro ao gerar relatório")
    } catch {
      toast.error("Erro inesperado ao gerar relatório")
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Relatórios</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gere um PDF completo com resumo de viagens, clientes e financeiro.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Período de referência</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PERIODO_LABEL) as Periodo[]).map(p => (
                <SelectItem key={p} value={p}>{PERIODO_LABEL[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            De <strong className="text-foreground">{fmtBR(dataInicio)}</strong> até <strong className="text-foreground">{fmtBR(dataFim)}</strong>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Prévia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Viagens",           value: dados.viagensPeriodo.length,         color: "text-indigo-500" },
              { label: "Clientes vinculados",value: dados.clientesVinculados,            color: "text-blue-500"   },
              { label: "Pagos",             value: dados.clientesPagos,                 color: "text-emerald-500"},
              { label: "Pendentes",         value: dados.clientesPendentes,             color: "text-amber-500"  },
              { label: "Total a receber",   value: formatCurrency(dados.totalReceber),  color: "text-blue-500"   },
              { label: "Total recebido",    value: formatCurrency(dados.totalRecebido), color: "text-emerald-500"},
              { label: "Ainda pendente",    value: formatCurrency(dados.totalPendente), color: "text-amber-500"  },
              { label: "Taxa recebimento",  value: `${dados.taxaRecebimento}%`,         color: "text-emerald-500"},
            ].map(item => (
              <div key={item.label} className="rounded-lg border bg-card p-3 flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className={`text-base font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleGerar} disabled={gerando} className="w-full sm:w-auto gap-2 self-start">
        {gerando
          ? <><Loader2 className="h-4 w-4 animate-spin" />Gerando PDF…</>
          : <><FileDown className="h-4 w-4" />Gerar e salvar PDF</>
        }
      </Button>
    </div>
  )
}