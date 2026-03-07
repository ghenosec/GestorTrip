require("dotenv").config({ path: require("path").join(__dirname, "../.env.local") })
const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require("electron")
const path = require("path")
const fs   = require("fs")
const os   = require("os")
const crypto = require("crypto")

console.log("LICENSE_API_URL:", process.env.LICENSE_API_URL)

let db
let mainWindow

function getDeviceFingerprint() {
  const raw = `${os.hostname()}|${os.userInfo().username}|${os.platform()}|${os.arch()}`
  return crypto.createHash("sha256").update(raw).digest("hex")
}

function getLicensePath() {
  return path.join(app.getPath("userData"), "license.json")
}

function isLicenseActivated() {
  try {
    const licensePath = getLicensePath()
    if (!fs.existsSync(licensePath)) return false
    const data = JSON.parse(fs.readFileSync(licensePath, "utf8"))
    return data.activated === true && typeof data.license === "string"
  } catch {
    return false
  }
}

function saveLicense(licenseKey) {
  const data = {
    license:   licenseKey,
    activated: true,
    device:    getDeviceFingerprint(),
    activatedAt: new Date().toISOString(),
  }
  fs.writeFileSync(getLicensePath(), JSON.stringify(data, null, 2))
}

function createWindow(htmlFile) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "GestorTrip",
    icon: path.join(__dirname, "../public/favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  mainWindow.loadFile(path.join(__dirname, "../out", htmlFile))

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (!targetUrl.startsWith("file://")) return

    event.preventDefault()

    const outDir = path.join(__dirname, "../out")
    const outDirNorm = outDir.replace(/\\/g, "/")

    let filePath = targetUrl
      .replace(/\\/g, "/")
      .replace(/^file:\/\/\/?/, "")
      .replace(/^[A-Za-z]:\//, "")

    const outDirNoSlash = outDirNorm.replace(/^[A-Za-z]:\//, "")

    filePath = filePath
      .replace(outDirNoSlash, "")
      .replace(/^\//, "")

    if (!path.extname(filePath))
      filePath = filePath
        ? path.join(filePath, "index.html")
        : "index.html"

    mainWindow.loadFile(path.join(outDir, filePath))
  })
}

app.whenReady().then(() => {
  db = require("./database")
  const dbPath = db.getDbPath()

  ipcMain.handle("theme:get", () =>
    nativeTheme.shouldUseDarkColors ? "dark" : "light"
  )
  ipcMain.handle("theme:set", (_, theme) => {
    if (theme === "dark")       nativeTheme.themeSource = "dark"
    else if (theme === "light") nativeTheme.themeSource = "light"
    else                        nativeTheme.themeSource = "system"
  })

  const sessionPath = path.join(app.getPath("userData"), "session.json")

  ipcMain.handle("session:save", (_, user) => {
    try { fs.writeFileSync(sessionPath, JSON.stringify(user)) } catch {}
  })
  ipcMain.handle("session:load", () => {
    try {
      if (fs.existsSync(sessionPath))
        return JSON.parse(fs.readFileSync(sessionPath, "utf8"))
    } catch {}
    return null
  })
  ipcMain.handle("session:clear", () => {
    try {
      if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath)
    } catch {}
  })

  ipcMain.handle("db:export", async () => {
    const { canceled, filePath: destPath } = await dialog.showSaveDialog(mainWindow, {
      title: "Exportar banco de dados",
      defaultPath: `gestortrip-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters: [{ name: "Banco de dados SQLite", extensions: ["db"] }],
    })
    if (canceled || !destPath) return { success: false, canceled: true }
    try {
      db.backup(destPath)
      return { success: true, path: destPath }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle("db:import", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: "Importar banco de dados",
      filters: [{ name: "Banco de dados SQLite", extensions: ["db"] }],
      properties: ["openFile"],
    })
    if (canceled || !filePaths[0]) return { success: false, canceled: true }
    try {
      db.close()
      fs.copyFileSync(filePaths[0], dbPath)
      delete require.cache[require.resolve("./database")]
      db = require("./database")
      return { success: true }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle("relatorio:gerar", async (_, htmlContent) => {
    const { canceled, filePath: destPath } = await dialog.showSaveDialog(mainWindow, {
      title: "Salvar Relatório PDF",
      defaultPath: `relatorio-gestortrip-${new Date().toISOString().slice(0, 10)}.pdf`,
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    })
    if (canceled || !destPath) return { success: false, canceled: true }

    let win = null
    try {
      win = new BrowserWindow({
        show: false,
        webPreferences: {
          javascript: true,
          nodeIntegration: false,
          contextIsolation: true,
        },
      })

      await new Promise((resolve, reject) => {
        win.webContents.once("did-finish-load", resolve)
        win.webContents.once("did-fail-load", (_, errCode, errDesc) =>
          reject(new Error(`Falha ao carregar HTML: ${errDesc} (${errCode})`))
        )
        win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(htmlContent))
      })

      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: "A4",
        marginType: "default",
        landscape: false,
      })

      fs.writeFileSync(destPath, pdfBuffer)
      return { success: true, path: destPath }
    } catch (e) {
      return { success: false, error: String(e) }
    } finally {
      if (win && !win.isDestroyed()) win.close()
    }
  })

  ipcMain.handle("license:check", () => isLicenseActivated())

ipcMain.handle("license:activate", async (_, licenseKey) => {
  const device = getDeviceFingerprint()

  if (!/^GT-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(licenseKey)) {
    return { success: false, message: "Formato de chave inválido." }
  }

  const API_URL = "https://gestortrip-licenses.gestortrip.workers.dev/activate"

  return new Promise((resolve) => {
    const { net } = require("electron")
    const request = net.request({
      method: "POST",
      url: API_URL,
    })

    request.setHeader("Content-Type", "application/json")

    let body = ""
    request.on("response", (response) => {
      response.on("data", (chunk) => { body += chunk.toString() })
      response.on("end", () => {
        try {
          const data = JSON.parse(body)
          console.log("API response:", data)

          if (data.status === "success") {
            saveLicense(licenseKey)
            resolve({ success: true })
          } else {
            const msgs = {
              invalid_license:      "Chave de licença inválida.",
              license_already_used: "Esta chave já foi utilizada em outro dispositivo.",
              invalid_device:       "Erro ao identificar o dispositivo.",
            }
            resolve({
              success: false,
              message: msgs[data.message] ?? "Erro ao ativar licença. Tente novamente.",
            })
          }
        } catch (e) {
          console.error("Parse error:", e.message, "body:", body)
          resolve({ success: false, message: "Resposta inválida do servidor." })
        }
      })
    })

    request.on("error", (e) => {
      console.error("net.request error:", e.message)
      resolve({ success: false, message: "Não foi possível conectar ao servidor de licenças. Verifique sua conexão." })
    })

    request.write(JSON.stringify({ license: licenseKey, device }))
    request.end()
  })
})

  ipcMain.handle("auth:isFirstAccess", () => db.isFirstAccess())
  ipcMain.handle("auth:register", (_, email, pass) => db.registerUser(email, pass))
  ipcMain.handle("auth:login",    (_, email, pass) => db.loginUser(email, pass))

  ipcMain.handle("viagens:get",    (_, userId)           => db.getViagens(userId))
  ipcMain.handle("viagens:create", (_, userId, data)     => db.createViagem(userId, data))
  ipcMain.handle("viagens:update", (_, id, userId, data) => db.updateViagem(id, userId, data))
  ipcMain.handle("viagens:delete", (_, id, userId)       => db.deleteViagem(id, userId))

  ipcMain.handle("clientes:get",    (_, userId)           => db.getClientes(userId))
  ipcMain.handle("clientes:create", (_, userId, data)     => db.createCliente(userId, data))
  ipcMain.handle("clientes:update", (_, id, userId, data) => db.updateCliente(id, userId, data))
  ipcMain.handle("clientes:delete", (_, id, userId)       => db.deleteCliente(id, userId))

  ipcMain.handle("pagamentos:get",    (_, userId)           => db.getPagamentos(userId))
  ipcMain.handle("pagamentos:create", (_, userId, data)     => db.createPagamento(userId, data))
  ipcMain.handle("pagamentos:update", (_, id, userId, data) => db.updatePagamento(id, userId, data))
  ipcMain.handle("pagamentos:delete", (_, id, userId)       => db.deletePagamento(id, userId))

  if (!isLicenseActivated()) {
    createWindow("ativar/index.html")
  } else {
    const firstAccess = db.isFirstAccess()
    const startFile = firstAccess ? "primeiro-acesso/index.html" : "login/index.html"
    createWindow(startFile)
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})