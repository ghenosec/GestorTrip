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
  viagemId: string | null
  status: "pago" | "pendente"
}

export interface Viagem {
  id: string
  nome: string
  destino: string
  dataIda: string
  dataVolta: string
  valorPorPessoa: number
  status: "ativa" | "finalizada"
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
  formaPagamento: "pix" | "cartao" | "dinheiro" | "transferencia"
  data: string
  observacao?: string
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00")
  return new Intl.DateTimeFormat("pt-BR").format(date)
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
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
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits.charAt(9))) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits.charAt(i)) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== parseInt(digits.charAt(10))) return false

  return true
}

export function isValidName(name: string): boolean {
  return /^[A-Za-z\u00C0-\u024F\s]+$/.test(name.trim())
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function unmaskPhone(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11)
}

export function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function unmaskCPF(value: string): string {
  return value.replace(/\D/g, "").slice(0, 11)
}

export const viagensIniciais: Viagem[] = [
  {
    id: "v1",
    nome: "Reveillon Jericoacoara",
    destino: "Jericoacoara, CE",
    dataIda: "2026-12-28",
    dataVolta: "2027-01-03",
    valorPorPessoa: 3500,
    status: "ativa",
  },
  {
    id: "v2",
    nome: "Carnaval Salvador",
    destino: "Salvador, BA",
    dataIda: "2027-02-13",
    dataVolta: "2027-02-18",
    valorPorPessoa: 2800,
    status: "ativa",
  },
  {
    id: "v3",
    nome: "Gramado Inverno",
    destino: "Gramado, RS",
    dataIda: "2026-07-10",
    dataVolta: "2026-07-15",
    valorPorPessoa: 2200,
    status: "finalizada",
  },
  {
    id: "v4",
    nome: "Porto de Galinhas",
    destino: "Ipojuca, PE",
    dataIda: "2026-04-05",
    dataVolta: "2026-04-10",
    valorPorPessoa: 1900,
    status: "ativa",
  },
]

export const clientesIniciais: Cliente[] = [
  {
    id: "c1",
    nomeCompleto: "Ana Carolina Silva",
    cpf: "12345678901",
    rg: "1234567",
    dataNascimento: "1990-03-15",
    telefone: "11987654321",
    email: "ana.silva@email.com",
    endereco: "Rua das Flores, 123 - Sao Paulo, SP",
    observacoes: "Prefere quarto individual",
    viagemId: "v1",
    status: "pago",
  },
  {
    id: "c2",
    nomeCompleto: "Carlos Eduardo Oliveira",
    cpf: "98765432100",
    rg: "7654321",
    dataNascimento: "1985-07-22",
    telefone: "21976543210",
    email: "carlos.oliveira@email.com",
    endereco: "Av. Copacabana, 456 - Rio de Janeiro, RJ",
    observacoes: "",
    viagemId: "v1",
    status: "pendente",
  },
  {
    id: "c3",
    nomeCompleto: "Maria Fernanda Costa",
    cpf: "45678912300",
    rg: "9876543",
    dataNascimento: "1992-11-08",
    telefone: "31998765432",
    email: "maria.costa@email.com",
    endereco: "Rua da Bahia, 789 - Belo Horizonte, MG",
    observacoes: "Alergica a frutos do mar",
    viagemId: "v2",
    status: "pago",
  },
  {
    id: "c4",
    nomeCompleto: "Pedro Henrique Santos",
    cpf: "32165498700",
    rg: "3216549",
    dataNascimento: "1988-01-30",
    telefone: "41987651234",
    email: "pedro.santos@email.com",
    endereco: "Rua XV de Novembro, 321 - Curitiba, PR",
    observacoes: "",
    viagemId: "v2",
    status: "pendente",
  },
  {
    id: "c5",
    nomeCompleto: "Juliana Almeida",
    cpf: "65498732100",
    rg: "6549873",
    dataNascimento: "1995-05-12",
    telefone: "51999887766",
    email: "juliana.almeida@email.com",
    endereco: "Av. Ipiranga, 654 - Porto Alegre, RS",
    observacoes: "Viaja com crianca de 5 anos",
    viagemId: "v3",
    status: "pago",
  },
  {
    id: "c6",
    nomeCompleto: "Roberto Souza Lima",
    cpf: "78912345600",
    rg: "7891234",
    dataNascimento: "1980-09-25",
    telefone: "81998877665",
    email: "roberto.lima@email.com",
    endereco: "Rua do Sol, 987 - Recife, PE",
    observacoes: "",
    viagemId: "v4",
    status: "pendente",
  },
  {
    id: "c7",
    nomeCompleto: "Fernanda Rodrigues",
    cpf: "14725836900",
    rg: "1472583",
    dataNascimento: "1993-12-03",
    telefone: "11991234567",
    email: "fernanda.rodrigues@email.com",
    endereco: "Rua Augusta, 1500 - Sao Paulo, SP",
    observacoes: "Vegetariana",
    viagemId: "v1",
    status: "pago",
  },
  {
    id: "c8",
    nomeCompleto: "Lucas Martins Pereira",
    cpf: "25836914700",
    rg: "2583691",
    dataNascimento: "1991-06-17",
    telefone: "21987123456",
    email: "lucas.pereira@email.com",
    endereco: "Rua do Catete, 200 - Rio de Janeiro, RJ",
    observacoes: "",
    viagemId: "v4",
    status: "pago",
  },
]

export const pagamentosIniciais: Pagamento[] = [
  {
    id: "p1",
    clienteId: "c1",
    viagemId: "v1",
    valorTotal: 3500,
    historico: [
      { id: "h1", valor: 1750, formaPagamento: "pix", data: "2026-01-10" },
      { id: "h2", valor: 1750, formaPagamento: "pix", data: "2026-02-10" },
    ],
  },
  {
    id: "p2",
    clienteId: "c2",
    viagemId: "v1",
    valorTotal: 3500,
    historico: [
      { id: "h3", valor: 1000, formaPagamento: "cartao", data: "2026-01-15" },
    ],
  },
  {
    id: "p3",
    clienteId: "c3",
    viagemId: "v2",
    valorTotal: 2800,
    historico: [
      { id: "h4", valor: 2800, formaPagamento: "pix", data: "2026-02-01" },
    ],
  },
  {
    id: "p4",
    clienteId: "c4",
    viagemId: "v2",
    valorTotal: 2800,
    historico: [
      { id: "h5", valor: 700, formaPagamento: "dinheiro", data: "2026-01-20" },
      { id: "h6", valor: 700, formaPagamento: "pix", data: "2026-02-05" },
    ],
  },
  {
    id: "p5",
    clienteId: "c5",
    viagemId: "v3",
    valorTotal: 2200,
    historico: [
      { id: "h7", valor: 2200, formaPagamento: "transferencia", data: "2026-05-10" },
    ],
  },
  {
    id: "p6",
    clienteId: "c6",
    viagemId: "v4",
    valorTotal: 1900,
    historico: [
      { id: "h8", valor: 500, formaPagamento: "pix", data: "2026-03-01" },
    ],
  },
  {
    id: "p7",
    clienteId: "c7",
    viagemId: "v1",
    valorTotal: 3500,
    historico: [
      { id: "h9", valor: 1200, formaPagamento: "cartao", data: "2026-01-12" },
      { id: "h10", valor: 1200, formaPagamento: "cartao", data: "2026-02-12" },
      { id: "h11", valor: 1100, formaPagamento: "pix", data: "2026-03-12" },
    ],
  },
  {
    id: "p8",
    clienteId: "c8",
    viagemId: "v4",
    valorTotal: 1900,
    historico: [
      { id: "h12", valor: 1900, formaPagamento: "pix", data: "2026-03-15" },
    ],
  },
]
