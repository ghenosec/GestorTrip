const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("path")

let db
let mainWindow

function createWindow(htmlFile) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "GestorTrip",
    icon: path.join(__dirname, "./build/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  })

  mainWindow.loadFile(path.join(__dirname, "../out", htmlFile))

  mainWindow.once("ready-to-show", () => {
    mainWindow.show()
    // mainWindow.webContents.openDevTools() // descomente para debug
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
    filePath = filePath.replace(outDirNoSlash, "").replace(/^\//, "")

    if (!path.extname(filePath)) {
      filePath = filePath
        ? path.join(filePath, "index.html")
        : "index.html"
    }

    mainWindow.loadFile(path.join(outDir, filePath))
  })
}

app.whenReady().then(() => {
  db = require("./database")

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

  const firstAccess = db.isFirstAccess()
  const startFile = firstAccess
    ? "primeiro-acesso/index.html"
    : "login/index.html"

  createWindow(startFile)
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})