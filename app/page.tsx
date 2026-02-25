"use client"

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
import {
  LayoutDashboard,
  Users,
  Plane,
  CreditCard,
  Search,
  Loader2,
} from "lucide-react"
import { Dashboard } from "@/components/dashboard"
import { Clientes } from "@/components/clientes"
import { Viagens } from "@/components/viagens"
import { Pagamentos } from "@/components/pagamentos"
import { PesquisaRapida } from "@/components/pesquisa-rapida"

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "viagens", label: "Viagens", icon: Plane },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
  { id: "pesquisa", label: "Pesquisa Rapida", icon: Search },
]

function AppSidebar() {
  const { activeSection, setActiveSection } = useStore()

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Plane className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-semibold text-sm">GestorTrip</span>
            <span className="text-xs text-sidebar-foreground/60">
              Gestão de Viagens
            </span>
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
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
        <div className="text-xs text-sidebar-foreground/50">
          GestorTrip v1.0
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

function MainContent() {
  const { activeSection, loading } = useStore()
   if (loading) {
    return (
      <SidebarInset>
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </SidebarInset>
    )
  }

  const sectionTitle = navItems.find((n) => n.id === activeSection)?.label ?? ""

  return (
    <SidebarInset>
      <header className="flex h-14 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4!" />
        <h1 className="text-sm font-medium text-foreground">{sectionTitle}</h1>
      </header>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        {activeSection === "dashboard" && <Dashboard />}
        {activeSection === "clientes" && <Clientes />}
        {activeSection === "viagens" && <Viagens />}
        {activeSection === "pagamentos" && <Pagamentos />}
        {activeSection === "pesquisa" && <PesquisaRapida />}
      </main>
    </SidebarInset>
  )
}

export default function Page() {
  return (
    <StoreProvider>
      <SidebarProvider>
        <AppSidebar />
        <MainContent />
      </SidebarProvider>
    </StoreProvider>
  )
}
