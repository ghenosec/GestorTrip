# ✈️ GestorTrip

Sistema para **gerenciamento de viagens**, desenvolvido com **Next.js + TypeScript + Electron**, focado em organização, controle financeiro e visualização estratégica de dados com experiência moderna de usuário.

Aplicação desktop com funcionamento **100% offline** após ativação, banco de dados local e arquitetura moderna baseada no ecossistema React.

---

## 📌 Sobre o Projeto

O **GestorTrip** é uma aplicação desktop para agências e organizadores de viagens, permitindo gerenciar clientes, viagens, pagamentos e gerar relatórios completos em PDF — tudo de forma local, sem depender de internet no dia a dia.

O projeto foi desenvolvido com foco em:

- ⚡ Alta performance e resposta imediata
- 🧠 Organização e visualização inteligente de dados
- 🎨 Interface moderna com suporte a Dark/Light mode
- 🔒 Tipagem forte com TypeScript
- 🧩 Componentização reutilizável
- 💻 Aplicação Desktop via Electron
- 📴 Funcionamento 100% Offline após ativação
- 🔑 Sistema de licenciamento por chave de ativação

Atualmente o projeto está em fase de **MVP funcional**.

---

## 🚀 Stacks

### 🖥️ Frontend
- **Next.js** — framework React com export estático
- **React**
- **TypeScript**
- **Tailwind CSS** — estilização utilitária
- **shadcn/ui + Radix UI** — componentes acessíveis
- **Recharts** — gráficos e visualização de dados
- **next-themes** — suporte a Dark/Light mode
- **date-fns** — manipulação de datas
- **Zod** — validação de esquemas
- **clsx + tailwind-merge** — utilitários de classe

### 🗄️ Banco de Dados
- **SQLite** via **better-sqlite3** — banco local, sem servidor

### 🖥️ Desktop
- **Electron** — empacotamento como aplicação nativa
- **electron-builder** — geração de instaladores (.exe, .dmg)

### ☁️ Licenciamento
- **Cloudflare Workers** — API de ativação de licenças
- **Cloudflare D1** — banco de dados de licenças (SQLite na nuvem)

---

## 🧠 Funcionalidades

### Clientes
- ✅ Cadastro completo com CPF, telefone e endereço
- ✅ Vinculação de clientes a viagens
- ✅ Controle de status (pago / pendente)
- ✅ Busca e pesquisa rápida

### Viagens
- ✅ Cadastro de viagens com destino, datas e valor por pessoa
- ✅ Controle de status (ativa / finalizada)
- ✅ Vinculação automática de clientes e pagamentos
- ✅ Exclusão em cascata com preservação de histórico financeiro

### Pagamentos
- ✅ Registro de pagamentos parcelados ou totais
- ✅ Histórico completo por cliente com forma de pagamento (PIX, Cartão, Dinheiro, Transferência)
- ✅ Cálculo automático de valor pago e valor pendente
- ✅ Exclusão de registros de pagamento

### Dashboard
- ✅ KPIs em tempo real (total de clientes, viagens, receita)
- ✅ Gráfico de receita por viagem (total esperado vs recebido)
- ✅ Indicadores de inadimplência e taxa de recebimento

### Relatórios
- ✅ Exportação de relatórios em PDF
- ✅ Filtros por período: mensal, trimestral, semestral e anual
- ✅ Relatório com capa, KPIs, tabela de viagens e tabela de clientes
- ✅ Gerado localmente via Electron (sem dependência de serviço externo)

### Sistema
- ✅ Login com sessão persistente ("manter conectado")
- ✅ Suporte a Dark / Light mode
- ✅ Backup e restauração do banco de dados
- ✅ Sistema de licença por chave de ativação (uso único por dispositivo)
- ✅ Ativação online com funcionamento offline após primeiro acesso

---

## 📁 Estrutura do Projeto

```
GestorTrip/
├── app/
│   ├── ativar/           # Tela de ativação de licença
│   ├── login/            # Tela de login
│   ├── primeiro-acesso/  # Cadastro inicial
│   ├── layout.tsx
│   └── page.tsx          # Shell principal da aplicação
│
├── components/
│   ├── ui/               # Componentes shadcn/ui
│   ├── dashboard.tsx
│   ├── clientes.tsx
│   ├── viagens.tsx
│   ├── pagamentos.tsx
│   ├── pesquisa-rapida.tsx
│   ├── relatorio.tsx
│   ├── configuracoes.tsx
│   ├── logo.tsx          # Logo embutida em base64
│   └── theme-toggle.tsx
│
├── electron/
│   ├── main.js           # Processo principal Electron
│   ├── preload.js        # Bridge segura IPC
│   └── database.js       # Operações SQLite
│
├── lib/
│   ├── store.tsx         # Contexto global de estado
│   ├── data.ts           # Tipos e utilitários de dados
│   └── electron.d.ts     # Tipagens da API Electron
│
├── license-api/          # Cloudflare Worker de licenças
│   ├── src/index.js      # Worker com endpoint /activate
│   ├── schema.sql        # Schema do banco D1
│   └── wrangler.toml     # Configuração do Worker
│
├── hooks/
├── styles/
├── public/
├── out/                  # Build estático Next.js (gerado)
└── build/                # Instaladores Electron (gerado)
```

---

## 🔑 Sistema de Licenciamento

O GestorTrip utiliza um sistema de ativação por chave única no formato `GT-XXXXX-XXXXX-XXXXX`.

**Fluxo de ativação:**
1. Cliente instala o app e abre pela primeira vez
2. App verifica se existe `license.json` em `AppData/Roaming/GestorTrip/`
3. Se não existir, exibe a tela de ativação
4. Cliente insere a chave — app valida online via Cloudflare Workers
5. Chave válida → `license.json` é salvo localmente
6. A partir daí, o app funciona **100% offline**

Cada chave só pode ser ativada **uma vez** em um único dispositivo. Reativação no mesmo dispositivo é permitida (para reinstalações).

---

## 🛣️ Roadmap

### ✅ Concluído
- Estrutura base com Next.js + TypeScript
- Banco de dados SQLite local com better-sqlite3
- Sistema de autenticação com sessão persistente
- CRUD completo de Clientes, Viagens e Pagamentos
- Dashboard com KPIs e gráficos
- Exportação de relatórios em PDF (mensal, trimestral, semestral, anual)
- Migração de PWA para aplicação Desktop com Electron
- Backup e restauração do banco de dados
- Dark / Light mode
- Sistema de licenciamento com Cloudflare Workers + D1
- Logo e identidade visual personalizada

### 🔜 Próximas versões
- [ ] Notificações de pagamentos vencendo
- [ ] Múltiplos usuários por instalação
- [ ] Exportação de dados em Excel
- [ ] Histórico de alterações por registro

---

## 👨‍💻 Autor

Desenvolvido por **ghenosec**.

Projeto prático utilizando arquitetura moderna com Next.js + Electron, com foco em experiência de usuário e robustez de dados para uso profissional.

---

## 📄 Licença

Este é um software proprietário. Todos os direitos reservados.  
Uso, reprodução ou distribuição não autorizados são estritamente proibidos.

> This project is proprietary software. All rights reserved.  
> Unauthorized use, reproduction, or distribution is strictly prohibited.