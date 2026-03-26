require("dotenv").config({ path: require("path").join(__dirname, "../.env.local") })

const { app, BrowserWindow, ipcMain, nativeTheme, dialog } = require("electron")
const path    = require("path")
const fs      = require("fs")
const os      = require("os")
const crypto  = require("crypto")
const { autoUpdater } = require("electron-updater")
const ExcelJS = require("exceljs")
const { Menu } = require("electron")
Menu.setApplicationMenu(null)

autoUpdater.logger = require("electron-log")
autoUpdater.logger.transports.file.level = "info"
autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true

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
    license:     licenseKey,
    activated:   true,
    device:      getDeviceFingerprint(),
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

  mainWindow.setMenuBarVisibility(false)
  mainWindow.setAutoHideMenuBar(true)

  mainWindow.loadFile(path.join(__dirname, "../out", htmlFile))

  mainWindow.once("ready-to-show", () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.once("did-finish-load", () => {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {})
    }, 3000)
  })

  autoUpdater.on("update-downloaded", (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-downloaded", { version: info.version })
    }
  })

  mainWindow.webContents.on("will-navigate", (event, targetUrl) => {
    if (!targetUrl.startsWith("file://")) return
    event.preventDefault()

    const outDir        = path.join(__dirname, "../out")
    const outDirNorm    = outDir.replace(/\\/g, "/")
    let filePath        = targetUrl
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

  const LICENSE_API_URL =
    process.env.LICENSE_API_URL ||
    require("../package.json").license_api_url

  ipcMain.handle("theme:get", () =>
    nativeTheme.shouldUseDarkColors ? "dark" : "light"
  )
  ipcMain.handle("theme:set", (_, theme) => {
    if      (theme === "dark")  nativeTheme.themeSource = "dark"
    else if (theme === "light") nativeTheme.themeSource = "light"
    else                        nativeTheme.themeSource = "system"
  })

  ipcMain.on("install-update", () => autoUpdater.quitAndInstall())

  ipcMain.handle("updater:check", async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      if (!result) return { hasUpdate: false }
      const current = app.getVersion()
      const latest  = result.updateInfo.version
      const hasUpdate = latest !== current
      return { hasUpdate, version: latest, current }
    } catch (e) {
      return { hasUpdate: false, error: String(e) }
    }
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
      title:       "Exportar banco de dados",
      defaultPath: `gestortrip-backup-${new Date().toISOString().slice(0, 10)}.db`,
      filters:     [{ name: "Banco de dados SQLite", extensions: ["db"] }],
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
      title:      "Importar banco de dados",
      filters:    [{ name: "Banco de dados SQLite", extensions: ["db"] }],
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

  ipcMain.handle("export:excel", async (_, { clientes, viagens, pagamentos }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title:       "Exportar planilha Excel",
      defaultPath: `GestorTrip_${new Date().toISOString().slice(0, 10)}.xlsx`,
      filters:     [{ name: "Excel", extensions: ["xlsx"] }],
    })
    if (canceled || !filePath) return { canceled: true }

    try {
      const wb = new ExcelJS.Workbook()
      wb.creator = "GestorTrip"
      wb.created = new Date()

      const headerStyle = {
        font:      { bold: true, color: { argb: "FFFFFFFF" } },
        fill:      { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } },
        alignment: { horizontal: "center", vertical: "middle" },
        border:    { bottom: { style: "thin", color: { argb: "FF1E3A5F" } } },
      }

      function buildSheet(workbook, name, rows) {
        const ws = workbook.addWorksheet(name)
        if (!rows || rows.length === 0) { ws.addRow(["Sem dados"]); return }
        const keys = Object.keys(rows[0])
        ws.columns = keys.map((k) => ({
          header: k, key: k,
          width: Math.max(k.length + 4, 16),
        }))
        const headerRow = ws.getRow(1)
        headerRow.height = 22
        keys.forEach((_, i) => {
          const cell = headerRow.getCell(i + 1)
          cell.font      = headerStyle.font
          cell.fill      = headerStyle.fill
          cell.alignment = headerStyle.alignment
          cell.border    = headerStyle.border
        })
        rows.forEach((row, ri) => {
          const dataRow = ws.addRow(row)
          dataRow.height = 18
          if (ri % 2 === 1) {
            dataRow.eachCell((cell) => {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F7FA" } }
            })
          }
        })
        ws.columns.forEach((col) => {
          let maxLen = col.header?.length ?? 10
          col.eachCell({ includeEmpty: false }, (cell) => {
            const len = cell.value ? String(cell.value).length : 0
            if (len > maxLen) maxLen = len
          })
          col.width = Math.min(maxLen + 4, 50)
        })
      }

      buildSheet(wb, "Clientes",   clientes)
      buildSheet(wb, "Viagens",    viagens)
      buildSheet(wb, "Pagamentos", pagamentos)

      await wb.xlsx.writeFile(filePath)
      return { success: true }
    } catch (e) {
      return { success: false, error: e.message }
    }
  })

  ipcMain.handle("relatorio:gerar", async (_, htmlContent) => {
    const { canceled, filePath: destPath } = await dialog.showSaveDialog(mainWindow, {
      title:       "Salvar Relatório PDF",
      defaultPath: `relatorio-gestortrip-${new Date().toISOString().slice(0, 10)}.pdf`,
      filters:     [{ name: "PDF", extensions: ["pdf"] }],
    })
    if (canceled || !destPath) return { success: false, canceled: true }

    let win = null
    try {
      win = new BrowserWindow({
        show: false,
        webPreferences: { javascript: true, nodeIntegration: false, contextIsolation: true },
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

  ipcMain.handle("word:gerar", async (_, { titulo, linhas }) => {
    const { canceled, filePath: destPath } = await dialog.showSaveDialog(mainWindow, {
      title:       "Salvar lista de passageiros",
      defaultPath: `${titulo.replace(/[/\\:*?"<>|]/g, "-")}.docx`,
      filters:     [{ name: "Word", extensions: ["docx"] }],
    })
    if (canceled || !destPath) return { success: false, canceled: true }

    try {
      const {
        Document, Packer, Paragraph, TextRun, AlignmentType,
        HeadingLevel, convertInchesToTwip, PageOrientation,
      } = require("docx")

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top:    convertInchesToTwip(1),
                  bottom: convertInchesToTwip(1),
                  left:   convertInchesToTwip(1.2),
                  right:  convertInchesToTwip(1.2),
                },
              },
            },
            children: [
              new Paragraph({
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.LEFT,
                spacing: { after: 320 },
                children: [
                  new TextRun({
                    text: titulo,
                    bold: true,
                    size: 28,
                    font: "Calibri",
                  }),
                ],
              }),

              ...linhas.map(
                (linha) =>
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    spacing: { after: 120 },
                    children: [
                      new TextRun({
                        text: linha,
                        size: 24,
                        font: "Calibri",
                      }),
                    ],
                  })
              ),
            ],
          },
        ],
      })

      const buffer = await Packer.toBuffer(doc)
      fs.writeFileSync(destPath, buffer)
      return { success: true, path: destPath }
    } catch (e) {
      console.error("[word:gerar]", e)
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle("license:check", () => isLicenseActivated())

  ipcMain.handle("license:activate", async (_, licenseKey) => {
    const device = getDeviceFingerprint()

    if (!/^GT-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(licenseKey)) {
      return { success: false, message: "Formato de chave inválido." }
    }

    if (!LICENSE_API_URL) {
      console.error("LICENSE_API_URL não definida")
      return { success: false, message: "Configuração do servidor ausente. Contate o suporte." }
    }

    return new Promise((resolve) => {
      const { net } = require("electron")
      const request = net.request({ method: "POST", url: LICENSE_API_URL })
      request.setHeader("Content-Type", "application/json")

      let body = ""
      request.on("response", (response) => {
        response.on("data",  (chunk) => { body += chunk.toString() })
        response.on("end", () => {
          try {
            const data = JSON.parse(body)
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
        resolve({ success: false, message: "Não foi possível conectar ao servidor de licenças." })
      })

      request.write(JSON.stringify({ license: licenseKey, device }))
      request.end()
    })
  })

  ipcMain.handle("auth:isFirstAccess", ()            => db.isFirstAccess())
  ipcMain.handle("auth:register",      (_, e, p)     => db.registerUser(e, p))
  ipcMain.handle("auth:login",         (_, e, p)     => db.loginUser(e, p))

  ipcMain.handle("viagens:get",    (_, userId)           => db.getViagens(userId))
  ipcMain.handle("viagens:create", (_, userId, data)     => db.createViagem(userId, data))
  ipcMain.handle("viagens:update", (_, id, userId, data) => db.updateViagem(id, userId, data))
  ipcMain.handle("viagens:delete", (_, id, userId)       => db.deleteViagem(id, userId))

  ipcMain.handle("clientes:get",    (_, userId)           => db.getClientes(userId))
  ipcMain.handle("clientes:create", (_, userId, data)     => db.createCliente(userId, data))
  ipcMain.handle("clientes:update", (_, id, userId, data) => db.updateCliente(id, userId, data))
  ipcMain.handle("clientes:delete", (_, id, userId)       => db.deleteCliente(id, userId))

  ipcMain.handle("clientes:addToViagem",     (_, clienteId, viagemId, userId) =>
    db.addClienteToViagem(clienteId, viagemId, userId)
  )
  ipcMain.handle("clientes:removeFromViagem", (_, clienteId, viagemId, userId) =>
    db.removeClienteFromViagem(clienteId, viagemId, userId)
  )

  ipcMain.handle("pagamentos:get",    (_, userId)           => db.getPagamentos(userId))
  ipcMain.handle("pagamentos:create", (_, userId, data)     => db.createPagamento(userId, data))
  ipcMain.handle("pagamentos:update", (_, id, userId, data) => db.updatePagamento(id, userId, data))
  ipcMain.handle("pagamentos:delete", (_, id, userId)       => db.deletePagamento(id, userId))

  if (!isLicenseActivated()) {
    createWindow("ativar/index.html")
  } else {
    const firstAccess = db.isFirstAccess()
    createWindow(firstAccess ? "primeiro-acesso/index.html" : "login/index.html")
  }
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})