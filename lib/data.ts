export interface Cliente {
  id: string
  nomeCompleto: string
  cpf: string
  rg: string
  dataNascimento: string
  telefone: string
  email: string
  endereco: string
  observacoes: string
  viagemIds: string[]
  viagemId: string | null
  status: "pago" | "pendente" | "a_confirmar"
}

export interface Viagem {
  id: string
  nome: string
  destino: string
  dataIda: string
  dataVolta: string
  valorPorPessoa: number
  capacidade: number
  status: "ativa" | "finalizada"
  tipo: "onibus" | "aviao"
}

export interface Pagamento {
  id: string
  clienteId: string
  viagemId: string
  valorTotal: number
  historico: PagamentoHistorico[]
}

export interface PagamentoHistorico {
  id: string
  valor: number
  formaPagamento: "pix" | "cartão" | "dinheiro" | "transferência"
  data: string
  observacao?: string
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "—"
  const date = new Date(dateStr + "T12:00:00")
  return new Intl.DateTimeFormat("pt-BR").format(date)
}

export function formatCPF(cpf: string): string {
  if (!cpf) return "—"
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  return phone
}

export function getValorPago(pagamento: Pagamento): number {
  return pagamento.historico.reduce((sum, h) => sum + h.valor, 0)
}

export function getValorPendente(pagamento: Pagamento): number {
  return pagamento.valorTotal - getValorPago(pagamento)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

export function isValidCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "")
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits.charAt(i)) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10) r = 0
  if (r !== parseInt(digits.charAt(9))) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits.charAt(i)) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10) r = 0
  return r === parseInt(digits.charAt(10))
}

export function isValidName(name: string): boolean {
  return /^[A-Za-z\u00C0-\u024F\s]+$/.test(name.trim())
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length === 0) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

export function unmaskPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11)
}

export function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`
}

export function unmaskCPF(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11)
}