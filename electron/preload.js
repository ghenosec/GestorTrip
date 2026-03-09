const { contextBridge, ipcRenderer } = require("electron")


contextBridge.exposeInMainWorld("electronAPI", {
  
  onUpdateDownloaded: (cb) =>
    ipcRenderer.on("update-downloaded", (_, info) => cb(info)),
  installUpdate: () => ipcRenderer.send("install-update"),

  checkLicense:    ()           => ipcRenderer.invoke("license:check"),
  activateLicense: (licenseKey) => ipcRenderer.invoke("license:activate", licenseKey),

  isFirstAccess: ()            => ipcRenderer.invoke("auth:isFirstAccess"),
  register:      (email, pass) => ipcRenderer.invoke("auth:register", email, pass),
  login:         (email, pass) => ipcRenderer.invoke("auth:login", email, pass),

  saveSession:  (user) => ipcRenderer.invoke("session:save", user),
  loadSession:  ()     => ipcRenderer.invoke("session:load"),
  clearSession: ()     => ipcRenderer.invoke("session:clear"),

  getTheme: ()      => ipcRenderer.invoke("theme:get"),
  setTheme: (theme) => ipcRenderer.invoke("theme:set", theme),

  exportDb: () => ipcRenderer.invoke("db:export"),
  importDb: () => ipcRenderer.invoke("db:import"),
  exportExcel: (data) => ipcRenderer.invoke("export:excel", data),

  gerarRelatorio: (htmlContent) => ipcRenderer.invoke("relatorio:gerar", htmlContent),

  getViagens:    (userId)           => ipcRenderer.invoke("viagens:get", userId),
  createViagem:  (userId, data)     => ipcRenderer.invoke("viagens:create", userId, data),
  updateViagem:  (id, userId, data) => ipcRenderer.invoke("viagens:update", id, userId, data),
  deleteViagem:  (id, userId)       => ipcRenderer.invoke("viagens:delete", id, userId),

  getClientes:   (userId)           => ipcRenderer.invoke("clientes:get", userId),
  createCliente: (userId, data)     => ipcRenderer.invoke("clientes:create", userId, data),
  updateCliente: (id, userId, data) => ipcRenderer.invoke("clientes:update", id, userId, data),
  deleteCliente: (id, userId)       => ipcRenderer.invoke("clientes:delete", id, userId),

  getPagamentos:   (userId)           => ipcRenderer.invoke("pagamentos:get", userId),
  createPagamento: (userId, data)     => ipcRenderer.invoke("pagamentos:create", userId, data),
  updatePagamento: (id, userId, data) => ipcRenderer.invoke("pagamentos:update", id, userId, data),
  deletePagamento: (id, userId)       => ipcRenderer.invoke("pagamentos:delete", id, userId),
})