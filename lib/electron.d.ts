export {}

declare global {
  interface Window {
    electronAPI: {
      isFirstAccess: () => Promise<boolean>
      register: (email: string, password: string) => Promise<{
        success: boolean
        error?: string
      }>
      login: (email: string, password: string) => Promise<{
        success: boolean
        error?: string
        user?: { id: number; email: string }
      }>

      getTheme: () => Promise<"dark" | "light">
      setTheme: (theme: "dark" | "light" | "system") => Promise<void>

      getViagens: (userId: number) => Promise<Record<string, unknown>[]>
      createViagem: (userId: number, data: Record<string, unknown>) => Promise<{ success: boolean; id?: number }>
      updateViagem: (id: number, userId: number, data: Record<string, unknown>) => Promise<{ success: boolean }>
      deleteViagem: (id: number, userId: number) => Promise<{ success: boolean }>

      getClientes: (userId: number) => Promise<Record<string, unknown>[]>
      createCliente: (userId: number, data: Record<string, unknown>) => Promise<{ success: boolean; id?: number }>
      updateCliente: (id: number, userId: number, data: Record<string, unknown>) => Promise<{ success: boolean }>
      deleteCliente: (id: number, userId: number) => Promise<{ success: boolean }>

      getPagamentos: (userId: number) => Promise<Record<string, unknown>[]>
      createPagamento: (userId: number, data: Record<string, unknown>) => Promise<{ success: boolean; id?: number }>
      updatePagamento: (id: number, userId: number, data: Record<string, unknown>) => Promise<{ success: boolean }>
      deletePagamento: (id: number, userId: number) => Promise<{ success: boolean }>
    }
  }
}