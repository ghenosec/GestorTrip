const Database = require("better-sqlite3")
const bcrypt   = require("bcryptjs")
const path     = require("path")
const { app }  = require("electron")

const dbPath = path.join(app.getPath("userData"), "gestortrip.db")
let db = new Database(dbPath)

db.pragma("journal_mode = WAL")
db.pragma("foreign_keys = ON")

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS viagens (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    nome             TEXT NOT NULL,
    destino          TEXT DEFAULT '',
    data_ida         TEXT DEFAULT '',
    data_volta       TEXT DEFAULT '',
    valor_por_pessoa REAL DEFAULT 0,
    status           TEXT DEFAULT 'ativa',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS clientes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    viagem_id       INTEGER,
    nome_completo   TEXT NOT NULL,
    cpf             TEXT DEFAULT '',
    rg              TEXT DEFAULT '',
    data_nascimento TEXT DEFAULT '',
    telefone        TEXT DEFAULT '',
    email           TEXT DEFAULT '',
    endereco        TEXT DEFAULT '',
    observacoes     TEXT DEFAULT '',
    status          TEXT DEFAULT 'pendente',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS pagamentos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    cliente_id  INTEGER,
    viagem_id   INTEGER,
    valor_total REAL DEFAULT 0,
    historico   TEXT DEFAULT '[]',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE SET NULL
  );
`)

function getDbPath() { return dbPath }
function backup(destPath) { db.backup(destPath) }
function close() { try { db.close() } catch {} }

function isFirstAccess() {
  return db.prepare("SELECT COUNT(*) as count FROM users").get().count === 0
}

function registerUser(email, password) {
  if (!email || !password) return { success: false, error: "Dados inválidos." }
  try {
    const hash   = bcrypt.hashSync(password, 10)
    const result = db.prepare("INSERT INTO users (email, password) VALUES (?, ?)").run(email, hash)
    return { success: true, id: result.lastInsertRowid }
  } catch (e) {
    if (e.message.includes("UNIQUE")) return { success: false, error: "E-mail já cadastrado." }
    return { success: false, error: "Erro ao criar conta." }
  }
}

function loginUser(email, password) {
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email)
  if (!user)                                        return { success: false, error: "E-mail não encontrado." }
  if (!bcrypt.compareSync(password, user.password)) return { success: false, error: "Senha incorreta." }
  return { success: true, user: { id: user.id, email: user.email } }
}

function getViagens(userId) {
  return db.prepare("SELECT * FROM viagens WHERE user_id = ? ORDER BY created_at DESC").all(userId)
}

function createViagem(userId, data) {
  const result = db.prepare(`
    INSERT INTO viagens (user_id, nome, destino, data_ida, data_volta, valor_por_pessoa, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, data.nome, data.destino ?? "", data.data_ida ?? "", data.data_volta ?? "",
    data.valor_por_pessoa ?? 0, data.status ?? "ativa")
  return { success: true, id: result.lastInsertRowid }
}

function updateViagem(id, userId, data) {
  db.prepare(`
    UPDATE viagens SET nome=?, destino=?, data_ida=?, data_volta=?, valor_por_pessoa=?, status=?
    WHERE id=? AND user_id=?
  `).run(data.nome, data.destino, data.data_ida, data.data_volta,
    data.valor_por_pessoa, data.status, id, userId)
  return { success: true }
}

function deleteViagem(id, userId) {
  const deleteTx = db.transaction(() => {
    const pagamentosPendentes = db.prepare(`
      SELECT p.id, p.cliente_id, p.historico
      FROM pagamentos p
      WHERE p.viagem_id = ? AND p.user_id = ?
    `).all(id, userId)

    for (const pag of pagamentosPendentes) {
      let historico = []
      try { historico = JSON.parse(pag.historico ?? "[]") } catch {}
      const valorPago = historico.reduce((s, h) => s + (h.valor ?? 0), 0)

      if (valorPago === 0) {
        db.prepare("DELETE FROM pagamentos WHERE id=?").run(pag.id)
        db.prepare("UPDATE clientes SET status='pendente' WHERE id=?").run(pag.cliente_id)
      }
    }

    db.prepare("UPDATE clientes SET viagem_id=NULL WHERE viagem_id=? AND user_id=?").run(id, userId)
    db.prepare("DELETE FROM viagens WHERE id=? AND user_id=?").run(id, userId)
  })

  deleteTx()
  return { success: true }
}

// ── Clientes ─────────────────────────────────────────────────────────────
function getClientes(userId) {
  return db.prepare("SELECT * FROM clientes WHERE user_id = ? ORDER BY nome_completo ASC").all(userId)
}

function createCliente(userId, data) {
  const createTx = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO clientes (user_id, viagem_id, nome_completo, cpf, rg, data_nascimento,
        telefone, email, endereco, observacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(userId, data.viagem_id ?? null, data.nome_completo, data.cpf ?? "",
      data.rg ?? "", data.data_nascimento ?? "", data.telefone ?? "",
      data.email ?? "", data.endereco ?? "", data.observacoes ?? "",
      data.status ?? "pendente")

    const clienteId = result.lastInsertRowid

    if (data.viagem_id) {
      const viagem = db.prepare("SELECT * FROM viagens WHERE id=?").get(data.viagem_id)
      if (viagem) {
        const jaExiste = db.prepare(
          "SELECT id FROM pagamentos WHERE cliente_id=? AND viagem_id=?"
        ).get(clienteId, data.viagem_id)
        if (!jaExiste) {
          db.prepare(`
            INSERT INTO pagamentos (user_id, cliente_id, viagem_id, valor_total, historico)
            VALUES (?, ?, ?, ?, '[]')
          `).run(userId, clienteId, data.viagem_id, viagem.valor_por_pessoa)
        }
      }
    }

    return { success: true, id: clienteId }
  })

  return createTx()
}

function updateCliente(id, userId, data) {
  const atual = db.prepare("SELECT * FROM clientes WHERE id=? AND user_id=?").get(id, userId)
  if (!atual) return { success: false, error: "Cliente não encontrado." }

  const updateTx = db.transaction(() => {
    const novaViagemId = data.viagem_id !== undefined ? data.viagem_id : atual.viagem_id

    db.prepare(`
      UPDATE clientes
      SET viagem_id=?, nome_completo=?, cpf=?, rg=?, data_nascimento=?,
          telefone=?, email=?, endereco=?, observacoes=?, status=?
      WHERE id=? AND user_id=?
    `).run(
      novaViagemId,
      data.nome_completo    ?? atual.nome_completo,
      data.cpf              ?? atual.cpf,
      data.rg               ?? atual.rg,
      data.data_nascimento  ?? atual.data_nascimento,
      data.telefone         ?? atual.telefone,
      data.email            ?? atual.email,
      data.endereco         ?? atual.endereco,
      data.observacoes      ?? atual.observacoes,
      data.status           ?? atual.status,
      id, userId
    )

    const viagemAntigaId = atual.viagem_id
    const viagemNovaId   = novaViagemId

    if (viagemNovaId && viagemNovaId !== viagemAntigaId) {
      const jaExiste = db.prepare(
        "SELECT id FROM pagamentos WHERE cliente_id=? AND viagem_id=?"
      ).get(id, viagemNovaId)

      if (!jaExiste) {
        const viagem = db.prepare("SELECT * FROM viagens WHERE id=?").get(viagemNovaId)
        if (viagem) {
          db.prepare(`
            INSERT INTO pagamentos (user_id, cliente_id, viagem_id, valor_total, historico)
            VALUES (?, ?, ?, ?, '[]')
          `).run(userId, id, viagemNovaId, viagem.valor_por_pessoa)
        }
      }
    }
  })

  updateTx()
  return { success: true }
}

function deleteCliente(id, userId) {
  db.prepare("DELETE FROM clientes WHERE id=? AND user_id=?").run(id, userId)
  return { success: true }
}

// ── Pagamentos ───────────────────────────────────────────────────────────
function getPagamentos(userId) {
  return db.prepare("SELECT * FROM pagamentos WHERE user_id = ? ORDER BY created_at DESC").all(userId)
}

function createPagamento(userId, data) {
  const jaExiste = db.prepare(
    "SELECT id FROM pagamentos WHERE cliente_id=? AND viagem_id=?"
  ).get(data.cliente_id, data.viagem_id)
  if (jaExiste) return { success: true, id: jaExiste.id }

  const result = db.prepare(`
    INSERT INTO pagamentos (user_id, cliente_id, viagem_id, valor_total, historico)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, data.cliente_id ?? null, data.viagem_id ?? null,
    data.valor_total ?? 0, data.historico ?? "[]")
  return { success: true, id: result.lastInsertRowid }
}

function updatePagamento(id, userId, data) {
  const atual = db.prepare("SELECT * FROM pagamentos WHERE id=? AND user_id=?").get(id, userId)
  if (!atual) return { success: false, error: "Pagamento não encontrado." }
  db.prepare(`
    UPDATE pagamentos SET cliente_id=?, viagem_id=?, valor_total=?, historico=?
    WHERE id=? AND user_id=?
  `).run(
    data.cliente_id ?? atual.cliente_id,
    data.viagem_id  ?? atual.viagem_id,
    data.valor_total ?? atual.valor_total,
    data.historico   ?? atual.historico,
    id, userId
  )
  return { success: true }
}

function deletePagamento(id, userId) {
  db.prepare("DELETE FROM pagamentos WHERE id=? AND user_id=?").run(id, userId)
  return { success: true }
}

module.exports = {
  getDbPath, backup, close,
  isFirstAccess, registerUser, loginUser,
  getViagens, createViagem, updateViagem, deleteViagem,
  getClientes, createCliente, updateCliente, deleteCliente,
  getPagamentos, createPagamento, updatePagamento, deletePagamento,
}