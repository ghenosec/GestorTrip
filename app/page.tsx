"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StoreProvider, useStore } from "@/lib/store"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Plane, CreditCard, Search, Settings, FileText, LogOut, Loader2 } from "lucide-react"
import { Dashboard }      from "@/components/dashboard"
import { Clientes }       from "@/components/clientes"
import { Viagens }        from "@/components/viagens"
import { Pagamentos }     from "@/components/pagamentos"
import { PesquisaRapida } from "@/components/pesquisa-rapida"
import { Configuracoes }  from "@/components/configuracoes"
import { ThemeToggle }    from "@/components/theme-toggle"
import { Relatorio }      from "@/components/relatorio"

const LOGO_BASE64 = "data:image/png;base64,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"

const navItems = [
  { id: "dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { id: "clientes",      label: "Clientes",        icon: Users },
  { id: "viagens",       label: "Viagens",         icon: Plane },
  { id: "pagamentos",    label: "Pagamentos",      icon: CreditCard },
  { id: "pesquisa",      label: "Pesquisa Rápida", icon: Search },
  { id: "relatorios",    label: "Relatórios",      icon: FileText },
  { id: "configuracoes", label: "Configurações",   icon: Settings },
]

function useAuthGuard() {
  const router = useRouter()
  const [verified, setVerified] = useState(false)
  useEffect(() => {
    const user = sessionStorage.getItem("user")
    if (!user) router.replace("/login")
    else setVerified(true)
  }, [router])
  return verified
}

function AppSidebar() {
  const { activeSection, setActiveSection } = useStore()
  const router = useRouter()

  async function handleLogout() {
    sessionStorage.removeItem("user")
    if (typeof window !== "undefined" && window.electronAPI?.clearSession) {
      await window.electronAPI.clearSession()
    }
    router.replace("/login")
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg overflow-hidden bg-sidebar-primary">
            <img
              src={LOGO_BASE64}
              alt="GestorTrip"
              className="h-9 w-9 object-cover"
            />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">GestorTrip</span>
            <span className="text-xs text-sidebar-foreground/60">Gestão de Viagens</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeSection === item.id}
                    onClick={() => setActiveSection(item.id)}
                    tooltip={item.label}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-1">
          <ThemeToggle variant="sidebar" />
          <Button variant="ghost" size="sm" onClick={handleLogout}
            className="w-full justify-start gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent">
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
          <p className="px-1 pt-1 text-xs text-sidebar-foreground/40">GestorTrip v1.0</p>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-2 py-1">
          <ThemeToggle variant="sidebar" />
          <button onClick={handleLogout} title="Sair"
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function MainContent() {
  const { activeSection, loading } = useStore()
  const sectionTitle = navItems.find((n) => n.id === activeSection)?.label ?? ""

  if (loading) {
    return (
      <SidebarInset>
        <div className="flex flex-1 items-center justify-center h-full">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4!" />
        <h1 className="text-sm font-medium text-foreground">{sectionTitle}</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {activeSection === "dashboard"     && <Dashboard />}
        {activeSection === "clientes"      && <Clientes />}
        {activeSection === "viagens"       && <Viagens />}
        {activeSection === "pagamentos"    && <Pagamentos />}
        {activeSection === "pesquisa"      && <PesquisaRapida />}
        {activeSection === "relatorios"    && <Relatorio />}
        {activeSection === "configuracoes" && <Configuracoes />}
      </main>
    </SidebarInset>
  )
}

function AppShell() {
  const verified = useAuthGuard()
  if (!verified) return null
  return (
    <SidebarProvider>
      <AppSidebar />
      <MainContent />
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  )
}