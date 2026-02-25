"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { StoreProvider, useStore } from "@/lib/store"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Earth,
  CreditCard,
  Search,
  LogOut,
  Loader2,
} from "lucide-react"
import { Dashboard } from "@/components/dashboard"
import { Clientes } from "@/components/clientes"
import { Viagens } from "@/components/viagens"
import { Pagamentos } from "@/components/pagamentos"
import { PesquisaRapida } from "@/components/pesquisa-rapida"
import { ThemeToggle } from "@/components/theme-toggle"

const navItems = [
  { id: "dashboard",  label: "Dashboard",      icon: LayoutDashboard },
  { id: "clientes",   label: "Clientes",        icon: Users },
  { id: "viagens",    label: "Viagens",         icon: Earth },
  { id: "pagamentos", label: "Pagamentos",      icon: CreditCard },
  { id: "pesquisa",   label: "Pesquisa Rápida", icon: Search },
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

  function handleLogout() {
    sessionStorage.removeItem("user")
    router.replace("/login")
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Earth className="h-5 w-5" />
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
        {/* Sidebar expandida */}
        <div className="group-data-[collapsible=icon]:hidden flex flex-col gap-1">
          <ThemeToggle variant="sidebar" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </Button>
          <p className="px-1 pt-1 text-xs text-sidebar-foreground/40">GestorTrip v1.0</p>
        </div>

        {/* Sidebar colapsada */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center gap-2 py-1">
          <ThemeToggle variant="sidebar" />
          <button
            onClick={handleLogout}
            title="Sair"
            className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
          >
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
        {activeSection === "dashboard"  && <Dashboard />}
        {activeSection === "clientes"   && <Clientes />}
        {activeSection === "viagens"    && <Viagens />}
        {activeSection === "pagamentos" && <Pagamentos />}
        {activeSection === "pesquisa"   && <PesquisaRapida />}
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