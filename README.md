# ✈️ GestorTrip

Sistema para **gerenciamento de viagens corporativas**, desenvolvido com **Next.js + TypeScript + Electron**, focado em organização, visualização estratégica de dados e experiência moderna de usuário.

Aplicação desktop com suporte offline, sincronização de dados e arquitetura moderna baseada no ecossistema React.

---

## 📌 Sobre o Projeto

O **GestorTrip** é uma aplicação para controle e gestão de viagens, permitindo organizar deslocamentos, acompanhar informações importantes e visualizar dados estratégicos de forma clara.

O projeto foi desenvolvido com foco em:

- ⚡ Alta performance
- 🧠 Organização e visualização inteligente de dados
- 🎨 Interface moderna e responsiva
- 🔒 Tipagem forte com TypeScript
- 🧩 Componentização reutilizável
- 💻 Aplicação Desktop (Electron)
- 🌐 Funcionamento Offline com sincronização

Atualmente o projeto está em fase de **MVP funcional**.

---

## 🚀 Stacks

### 🖥️ Frontend
- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Radix UI**
- **React Hook Form**
- **Zod**
- **Recharts**
- **next-themes**
- **date-fns**
- **clsx**

### 🗄️ Banco de Dados
- **SQLite**

### 🖥️ Desktop
- **Electron**

---

## 📦 Instalação

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/ghenosec/GestorTrip.git
cd GestorTrip
```

### 2️⃣ Instale as dependências

O projeto utiliza npm:

```bash
npm install
```
Acesse
```bash
http://localhost:3000
```

### 🖥️ Executando como Aplicação Desktop
## 🔼 Build da aplicação

```bash
npm run build
npx electron .
```

### 📦 Gerando Executável (.exe)

```bash
npm run electron:build
```
O executável será gerado na pasta de build configurada pelo Electron.

## 🧠 Funcionalidades (MVP)

- ✅ Cadastro e gerenciamento de viagens
- ✅ Sistema de login
- ✅ Banco de dados local (SQLite)
- ✅ Sincronização de dados
- ✅ Interface moderna e responsiva
- ✅ Validação de formulários com Zod
- ✅ Componentes acessíveis com Radix UI
- ✅ Gráficos e visualização de dados com Recharts
- ✅ Suporte a tema Dark/Light

## 📁 Estrutura do Projeto

```bash
src/
 ├── app/
 │   ├── login/
 │   ├── primeiro-acesso/
 │
 ├── components/
 │   └── ui/
 │
 ├── electron/
 ├── hooks/
 ├── lib/
 ├── scripts/
 ├── styles/
 ├── public/
 └── build/
```

## 🛣️ Roadmap
✔️ Concluído
- Estrutura base com Next.js + TypeScript
- Criação do banco de dados
- Sistema de login
- Sincronização de dados
- Migração de PWA para aplicação Desktop com Electron

🚧 Próximos Passos

[ ] Relatórios avançados

## 👨‍💻 Autor

Desenvolvido por ghenosec.

Projeto requisitado e prático utilizando arquitetura moderna com Next.js + Electron.
