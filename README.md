# ✈️ GestorTrip

Sistema desktop para **gerenciamento completo de viagens**, desenvolvido com **Next.js + TypeScript + Electron**, focado em organização, controle financeiro e visualização estratégica de dados.

A aplicação funciona **100% offline após ativação**, utilizando banco de dados local **SQLite** e arquitetura moderna baseada no ecossistema **React**.

---

# 📌 Sobre o Projeto

O **GestorTrip** é uma aplicação desktop voltada para **agências de turismo, organizadores de excursões e gestores de viagens**, permitindo controlar clientes, viagens e pagamentos de forma simples e centralizada.

O sistema foi projetado para funcionar **localmente**, garantindo:

- ⚡ Alta performance  
- 📴 Funcionamento offline  
- 🗄️ Banco de dados local seguro  
- 🎨 Interface moderna  
- 🔒 Tipagem forte com TypeScript  
- 🧩 Arquitetura modular baseada em componentes  
- 💻 Distribuição como aplicativo desktop  

O projeto está atualmente em **fase de MVP funcional**.

---

# 🚀 Stacks Utilizadas

## 🖥️ Frontend

- **Next.js 16**
- **React 19**
- **TypeScript**
- **TailwindCSS 4**
- **shadcn/ui**
- **Radix UI**
- **React Hook Form**
- **Zod**
- **date-fns**
- **Recharts**
- **Lucide Icons**
- **Sonner (toast notifications)**
- **next-themes** (Dark / Light mode)
- **clsx + tailwind-merge**

---

## 🗄️ Banco de Dados

- **SQLite**
- **better-sqlite3**

Banco de dados totalmente **local**, sem necessidade de servidor.

---

## 🖥️ Desktop

- **Electron**
- **electron-builder**
- **electron-updater**
- **electron-log**

Permite gerar instaladores nativos para **Windows**.

---

## 📊 Exportação de Dados

- **ExcelJS**

Exportação de relatórios e dados em **.xlsx** para Excel.

---

## ☁️ Licenciamento

- **Cloudflare Workers** — API de ativação de licenças  
- **Cloudflare D1** — banco de dados de licenças

---

## 🔄 Atualizações Automáticas

- **electron-updater**
- **Cloudflare R2 Object Storage**

Permite atualização automática do aplicativo quando o usuário estiver conectado à internet.

---

# 🧠 Funcionalidades

## 👥 Clientes

- Cadastro completo de clientes  
- CPF, telefone e endereço  
- Vinculação a viagens  
- Controle de pagamento  
- Busca rápida  

---

## ✈️ Viagens

- Cadastro de viagens  
- Destino e datas  
- Valor por pessoa  
- Status da viagem  
- Vinculação automática de clientes  

---

## 💰 Pagamentos

- Registro de pagamentos  
- Pagamentos parciais ou totais  
- Histórico por cliente  
- Formas de pagamento:
  - PIX  
  - Cartão  
  - Dinheiro  
  - Transferência  

- Cálculo automático de:
  - valor pago  
  - valor pendente  

---

## 📊 Dashboard

Indicadores em tempo real:

- Total de clientes  
- Total de viagens  
- Receita esperada  
- Receita recebida  
- Taxa de inadimplência  

Gráficos com **Recharts** para análise visual.

---

## 📑 Relatórios

- Exportação em **PDF**
- Exportação em **Excel (.xlsx)**

Filtros por período:

- Mensal  
- Trimestral  
- Semestral  
- Anual  

Relatórios incluem:

- KPIs  
- Tabela de viagens  
- Tabela de clientes  
- Indicadores financeiros  

---

## ⚙️ Sistema

- Login com sessão persistente  
- Dark / Light mode  
- Backup do banco de dados  
- Restauração de backup  
- Sistema de licenciamento por chave  
- Funcionamento offline após ativação  
- Atualizações automáticas  

---

# 📁 Estrutura do Projeto


gestortrip/
│
├── app/
│ ├── ativar/
│ ├── login/
│ ├── primeiro-acesso/
│ ├── layout.tsx
│ └── page.tsx
│
├── components/
│ ├── ui/
│ ├── dashboard.tsx
│ ├── clientes.tsx
│ ├── viagens.tsx
│ ├── pagamentos.tsx
│ ├── relatorio.tsx
│ ├── configuracoes.tsx
│ ├── pesquisa-rapida.tsx
│ ├── update-banner.tsx
│ ├── theme-toggle.tsx
│ └── logo.tsx
│
├── electron/
│ ├── main.js
│ ├── preload.js
│ └── database.js
│
├── lib/
│ ├── store.tsx
│ ├── data.ts
│ └── electron.d.ts
│
├── hooks/
├── styles/
├── public/
│
├── scripts/
│ └── post-build.js
│
├── out/ # build estático do Next.js
├── dist/ # instaladores gerados pelo electron-builder
│
└── package.json


---

# 🔑 Sistema de Licenciamento

O GestorTrip utiliza ativação por chave única no formato: `GT-XXXXX-XXXXX-XXXXX`.

### Fluxo de ativação

1. Usuário instala o aplicativo  
2. Ao abrir pela primeira vez, o sistema verifica `license.json`  
3. Caso não exista, abre tela de ativação  
4. Usuário insere a chave  
5. App valida via **Cloudflare Worker**  
6. Se válida, salva licença localmente  

Após ativação, o sistema passa a funcionar **totalmente offline**.

Cada chave pode ser ativada **apenas em um dispositivo**.
Trocou de computador? Só requisitar outra chave e importar o banco de dados.

---

# 🛣️ Roadmap

## ✅ Concluído

- Next.js + TypeScript  
- Banco SQLite local  
- CRUD completo de clientes, viagens e pagamentos  
- Dashboard com gráficos  
- Exportação de relatórios  
- Aplicação Desktop com Electron  
- Backup e restauração de dados  
- Dark / Light mode  
- Sistema de licenciamento  
- Atualização automática  
- Estrutura modular de componentes  

---

# 👨‍💻 Autor

Desenvolvido por **ghenosec**.

Projeto focado em arquitetura moderna utilizando **Next.js + Electron**, com objetivo de criar uma solução robusta e profissional para gestão de viagens.

---

# 📄 Licença

Este software é **proprietário**.

Todos os direitos reservados.  
É proibida a reprodução, distribuição ou modificação sem autorização do autor.

© GestorTrip — All Rights Reserved