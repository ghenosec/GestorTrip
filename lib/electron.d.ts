export {}

declare global {
  interface Window {
    electronAPI: {

      exportExcel: (data: {
        clientes:   Record<string, unknown>[]
        viagens:    Record<string, unknown>[]
        pagamentos: Record<string, unknown>[]
      }) => Promise<{ success?: boolean; canceled?: boolean; error?: string }>

      onUpdateDownloaded: (cb: (info: { version: string }) => void) => void
      installUpdate: () => void
      checkForUpdates: () => Promise<{ hasUpdate: boolean; version?: string; current?: string; error?: string }>

      checkLicense:    () => Promise<boolean>
      activateLicense: (licenseKey: string) => Promise<{ success: boolean; message?: string }>

      isFirstAccess: () => Promise<boolean>
      register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
      login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: { id: number; email: string } }>

      saveSession:  (user: { id: number; email: string }) => Promise<void>
      loadSession:  () => Promise<{ id: number; email: string } | null>
      clearSession: () => Promise<void>

      getTheme: () => Promise<"dark" | "light">
      setTheme: (theme: "dark" | "light" | "system") => Promise<void>

      exportDb: () => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>
      importDb: () => Promise<{ success: boolean; canceled?: boolean; error?: string }>

      gerarRelatorio: (htmlContent: string) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>

      gerarWord: (data: {
        titulo: string
        linhas: string[]
      }) => Promise<{ success: boolean; canceled?: boolean; path?: string; error?: string }>

      getViagens:   (userId: number) => Promise<Record<string, unknown>[]>
      createViagem: (userId: number, data: Record<string, unknown>) => Promise<{ success: boolean; id?: number }>
      updateViagem: (id: number, userId: number, data: Record<string, unknown>) => Promise<{ success: boolean }>
      deleteViagem: (id: number, userId: number) => Promise<{ success: boolean }>

      getClientes:   (userId: number) => Promise<Record<string, unknown>[]>
      createCliente: (userId: number, data: Record<string, unknown>) => Promise<{ success: boolean; id?: number }>
      updateCliente: (id: number, userId: number, data: Record<string, unknown>) => Promise<{ success: boolean }>
      deleteCliente: (id: number, userId: number) => Promise<{ success: boolean }>

      updateStatusClienteViagem: (clienteId: number, viagemId: number, userId: number, status: string) => Promise<{ success: boolean }>

      addClienteToViagem:    (clienteId: number, viagemId: number, userId: number) => Promise<{ success: boolean; error?: string }>
      removeClienteFromViagem: (clienteId: number, viagemId: number, userId: number) => Promise<{ success: boolean; error?: string }>

      getPagamentos:   (userId: number) => Promise<Record<string, unknown>[]>
      createPagamento: (userId: number, data: Record<string, unknown>) => Promise<{ success: boolean; id?: number }>
      updatePagamento: (id: number, userId: number, data: Record<string, unknown>) => Promise<{ success: boolean }>
      deletePagamento: (id: number, userId: number) => Promise<{ success: boolean }>
    }
  }
}