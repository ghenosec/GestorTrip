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
    capacidade       INTEGER DEFAULT 0,
    status           TEXT DEFAULT 'ativa',
    tipo             TEXT DEFAULT 'onibus',
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
    status          TEXT DEFAULT 'a_confirmar',
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (viagem_id) REFERENCES viagens(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS cliente_viagens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    viagem_id  INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    status     TEXT DEFAULT 'a_confirmar',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id, viagem_id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (viagem_id)  REFERENCES viagens(id)  ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS pagamentos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    cliente_id  INTEGER,
    viagem_id   INTEGER,
    valor_total REAL DEFAULT 0,
    historico   TEXT DEFAULT '[]',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (viagem_id)  REFERENCES viagens(id)  ON DELETE SET NULL
  );
`)

;[
  "ALTER TABLE viagens ADD COLUMN capacidade INTEGER DEFAULT 0",
  "ALTER TABLE viagens ADD COLUMN tipo TEXT DEFAULT 'onibus'",
  "ALTER TABLE cliente_viagens ADD COLUMN status TEXT DEFAULT 'a_confirmar'",
].forEach(sql => { try { db.exec(sql) } catch (_) {} })

try {
  const rows = db.prepare(
    "SELECT id, viagem_id, user_id, status FROM clientes WHERE viagem_id IS NOT NULL"
  ).all()
  const ins = db.prepare(
    "INSERT OR IGNORE INTO cliente_viagens (cliente_id, viagem_id, user_id) VALUES (?, ?, ?)"
  )
  const updStatus = db.prepare(
    "UPDATE cliente_viagens SET status=? WHERE cliente_id=? AND viagem_id=? AND status='a_confirmar'"
  )
  for (const row of rows) {
    ins.run(row.id, row.viagem_id, row.user_id)
    if (row.status && row.status !== 'a_confirmar') {
      updStatus.run(row.status, row.id, row.viagem_id)
    }
  }
} catch (_) {}

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
  return db.prepare(
    "SELECT * FROM viagens WHERE user_id = ? ORDER BY created_at DESC"
  ).all(userId)
}

function createViagem(userId, data) {
  const result = db.prepare(`
    INSERT INTO viagens (user_id, nome, destino, data_ida, data_volta, valor_por_pessoa, capacidade, status, tipo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId, data.nome, data.destino ?? "", data.data_ida ?? "", data.data_volta ?? "",
    data.valor_por_pessoa ?? 0, data.capacidade ?? 0, data.status ?? "ativa",
    data.tipo ?? "onibus"
  )
  return { success: true, id: result.lastInsertRowid }
}

function updateViagem(id, userId, data) {
  db.prepare(`
    UPDATE viagens
    SET nome=?, destino=?, data_ida=?, data_volta=?, valor_por_pessoa=?, capacidade=?, status=?, tipo=?
    WHERE id=? AND user_id=?
  `).run(
    data.nome, data.destino, data.data_ida, data.data_volta,
    data.valor_por_pessoa, data.capacidade ?? 0, data.status,
    data.tipo ?? "onibus",
    id, userId
  )
  return { success: true }
}

function deleteViagem(id, userId) {
  const tx = db.transaction(() => {
    const pags = db.prepare(
      "SELECT p.id, p.cliente_id, p.historico FROM pagamentos p WHERE p.viagem_id=? AND p.user_id=?"
    ).all(id, userId)

    for (const pag of pags) {
      let historico = []
      try { historico = JSON.parse(pag.historico ?? "[]") } catch {}
      const valorPago = historico.reduce((s, h) => s + (h.valor ?? 0), 0)
      if (valorPago === 0) {
        db.prepare("DELETE FROM pagamentos WHERE id=?").run(pag.id)
        db.prepare("UPDATE clientes SET status='pendente' WHERE id=?").run(pag.cliente_id)
      }
    }

    db.prepare("DELETE FROM cliente_viagens WHERE viagem_id=?").run(id)
    db.prepare("UPDATE clientes SET viagem_id=NULL WHERE viagem_id=? AND user_id=?").run(id, userId)
    db.prepare("DELETE FROM viagens WHERE id=? AND user_id=?").run(id, userId)
  })
  tx()
  return { success: true }
}

function getClientes(userId) {
  const clientes = db.prepare(
    "SELECT * FROM clientes WHERE user_id = ? ORDER BY nome_completo ASC"
  ).all(userId)

  const allCv = db.prepare(
    "SELECT cliente_id, viagem_id FROM cliente_viagens WHERE user_id=?"
  ).all(userId)

  const cvMap = {}
  for (const row of allCv) {
    if (!cvMap[row.cliente_id]) cvMap[row.cliente_id] = []
    cvMap[row.cliente_id].push(String(row.viagem_id))
  }

  const allCvStatus = db.prepare(
    "SELECT cliente_id, viagem_id, status FROM cliente_viagens WHERE user_id=?"
  ).all(userId)

  const cvStatusMap = {}
  for (const row of allCvStatus) {
    if (!cvStatusMap[row.cliente_id]) cvStatusMap[row.cliente_id] = {}
    cvStatusMap[row.cliente_id][String(row.viagem_id)] = row.status ?? 'a_confirmar'
  }

  return clientes.map(c => ({
    ...c,
    viagem_ids: JSON.stringify(
      cvMap[c.id] ?? (c.viagem_id ? [String(c.viagem_id)] : [])
    ),
    viagem_status: JSON.stringify(cvStatusMap[c.id] ?? {}),
  }))
}

function createCliente(userId, data) {
  const tx = db.transaction(() => {
    const viagemIds = data.viagem_ids ?? (data.viagem_id ? [String(data.viagem_id)] : [])

    const result = db.prepare(`
      INSERT INTO clientes (user_id, viagem_id, nome_completo, cpf, rg, data_nascimento,
        telefone, email, endereco, observacoes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      viagemIds[0] ?? null,
      data.nome_completo, data.cpf ?? "", data.rg ?? "",
      data.data_nascimento ?? "", data.telefone ?? "",
      data.email ?? "", data.endereco ?? "", data.observacoes ?? "",
      data.status ?? "a_confirmar"
    )

    const clienteId = result.lastInsertRowid

    for (const vid of viagemIds) {
      const viagem = db.prepare("SELECT * FROM viagens WHERE id=?").get(vid)
      if (!viagem) continue
      db.prepare(
        "INSERT OR IGNORE INTO cliente_viagens (cliente_id, viagem_id, user_id) VALUES (?,?,?)"
      ).run(clienteId, vid, userId)
      const jaExiste = db.prepare(
        "SELECT id FROM pagamentos WHERE cliente_id=? AND viagem_id=?"
      ).get(clienteId, vid)
      if (!jaExiste) {
        db.prepare(`
          INSERT INTO pagamentos (user_id, cliente_id, viagem_id, valor_total, historico)
          VALUES (?, ?, ?, ?, '[]')
        `).run(userId, clienteId, vid, viagem.valor_por_pessoa)
      }
    }

    return { success: true, id: clienteId }
  })
  return tx()
}

function updateCliente(id, userId, data) {
  const atual = db.prepare("SELECT * FROM clientes WHERE id=? AND user_id=?").get(id, userId)
  if (!atual) return { success: false, error: "Cliente não encontrado." }

  const tx = db.transaction(() => {
    db.prepare(`
      UPDATE clientes
      SET nome_completo=?, cpf=?, rg=?, data_nascimento=?,
          telefone=?, email=?, endereco=?, observacoes=?, status=?
      WHERE id=? AND user_id=?
    `).run(
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

    if (data.viagem_ids !== undefined) {
      const novosIds = data.viagem_ids.map(String)

      const existentes = db.prepare(
        "SELECT viagem_id FROM cliente_viagens WHERE cliente_id=? AND user_id=?"
      ).all(id, userId).map(r => String(r.viagem_id))

      for (const vid of existentes) {
        if (!novosIds.includes(vid)) {
          db.prepare(
            "DELETE FROM cliente_viagens WHERE cliente_id=? AND viagem_id=?"
          ).run(id, vid)
        }
      }

      for (const vid of novosIds) {
        const viagem = db.prepare("SELECT * FROM viagens WHERE id=?").get(vid)
        if (!viagem) continue
        db.prepare(
          "INSERT OR IGNORE INTO cliente_viagens (cliente_id, viagem_id, user_id) VALUES (?,?,?)"
        ).run(id, vid, userId)
        const jaExiste = db.prepare(
          "SELECT id FROM pagamentos WHERE cliente_id=? AND viagem_id=?"
        ).get(id, vid)
        if (!jaExiste) {
          db.prepare(`
            INSERT INTO pagamentos (user_id, cliente_id, viagem_id, valor_total, historico)
            VALUES (?, ?, ?, ?, '[]')
          `).run(userId, id, vid, viagem.valor_por_pessoa)
        }
      }

      db.prepare("UPDATE clientes SET viagem_id=? WHERE id=?").run(novosIds[0] ?? null, id)

    } else if (data.viagem_id !== undefined) {
      const novaId = data.viagem_id
      if (novaId && String(novaId) !== String(atual.viagem_id ?? "")) {
        const viagem = db.prepare("SELECT * FROM viagens WHERE id=?").get(novaId)
        if (viagem) {
          db.prepare(
            "INSERT OR IGNORE INTO cliente_viagens (cliente_id, viagem_id, user_id) VALUES (?,?,?)"
          ).run(id, novaId, userId)
          const jaExiste = db.prepare(
            "SELECT id FROM pagamentos WHERE cliente_id=? AND viagem_id=?"
          ).get(id, novaId)
          if (!jaExiste) {
            db.prepare(`
              INSERT INTO pagamentos (user_id, cliente_id, viagem_id, valor_total, historico)
              VALUES (?, ?, ?, ?, '[]')
            `).run(userId, id, novaId, viagem.valor_por_pessoa)
          }
        }
      }
      db.prepare("UPDATE clientes SET viagem_id=? WHERE id=?").run(novaId, id)
    }
  })
  tx()
  return { success: true }
}

function deleteCliente(id, userId) {
  db.prepare("DELETE FROM cliente_viagens WHERE cliente_id=?").run(id)
  db.prepare("DELETE FROM clientes WHERE id=? AND user_id=?").run(id, userId)
  return { success: true }
}

function addClienteToViagem(clienteId, viagemId, userId) {
  const viagem = db.prepare("SELECT * FROM viagens WHERE id=?").get(viagemId)
  if (!viagem) return { success: false, error: "Viagem não encontrada." }

  db.prepare(
    "INSERT OR IGNORE INTO cliente_viagens (cliente_id, viagem_id, user_id) VALUES (?,?,?)"
  ).run(clienteId, viagemId, userId)

  const cliente = db.prepare("SELECT * FROM clientes WHERE id=?").get(clienteId)
  if (cliente && !cliente.viagem_id) {
    db.prepare("UPDATE clientes SET viagem_id=? WHERE id=?").run(viagemId, clienteId)
  }

  const jaExiste = db.prepare(
    "SELECT id FROM pagamentos WHERE cliente_id=? AND viagem_id=?"
  ).get(clienteId, viagemId)
  if (!jaExiste) {
    db.prepare(`
      INSERT INTO pagamentos (user_id, cliente_id, viagem_id, valor_total, historico)
      VALUES (?, ?, ?, ?, '[]')
    `).run(userId, clienteId, viagemId, viagem.valor_por_pessoa)
  }

  return { success: true }
}

function removeClienteFromViagem(clienteId, viagemId, userId) {
  db.prepare(
    "DELETE FROM cliente_viagens WHERE cliente_id=? AND viagem_id=?"
  ).run(clienteId, viagemId)

  const cliente = db.prepare("SELECT * FROM clientes WHERE id=?").get(clienteId)
  if (cliente && String(cliente.viagem_id) === String(viagemId)) {
    const outro = db.prepare(
      "SELECT viagem_id FROM cliente_viagens WHERE cliente_id=? LIMIT 1"
    ).get(clienteId)
    db.prepare("UPDATE clientes SET viagem_id=? WHERE id=?").run(
      outro ? outro.viagem_id : null, clienteId
    )
  }

  return { success: true }
}

function getPagamentos(userId) {
  return db.prepare(
    "SELECT * FROM pagamentos WHERE user_id = ? ORDER BY created_at DESC"
  ).all(userId)
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
    data.cliente_id  ?? atual.cliente_id,
    data.viagem_id   ?? atual.viagem_id,
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

function updateStatusClienteViagem(clienteId, viagemId, userId, status) {
  db.prepare(
    "UPDATE cliente_viagens SET status=? WHERE cliente_id=? AND viagem_id=?"
  ).run(status, clienteId, viagemId)
  return { success: true }
}

module.exports = {
  getDbPath, backup, close,
  isFirstAccess, registerUser, loginUser,
  getViagens, createViagem, updateViagem, deleteViagem,
  getClientes, createCliente, updateCliente, deleteCliente,
  addClienteToViagem, removeClienteFromViagem,
  updateStatusClienteViagem,
  getPagamentos, createPagamento, updatePagamento, deletePagamento,
}