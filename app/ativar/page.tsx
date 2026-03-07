"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  KeyRound, Loader2, ShieldCheck,
  CheckCircle2, MessageCircle, ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"

const WHATSAPP_URL =
  "https://api.whatsapp.com/send?phone=5544998091901&text=Oi%2C%20preciso%20de%20ajuda%20para%20ativar%20minha%20licen%C3%A7a%20do%20GestorTrip!"

export default function AtivarPage() {
  const router = useRouter()
  const [key, setKey]         = useState("")
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  function handleKeyChange(value: string) {
    const digits = value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    let formatted = ""
    if (digits.length <= 2)       formatted = digits
    else if (digits.length <= 7)  formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`
    else if (digits.length <= 12) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 7)}-${digits.slice(7)}`
    else                          formatted = `${digits.slice(0, 2)}-${digits.slice(2, 7)}-${digits.slice(7, 12)}-${digits.slice(12, 17)}`
    setKey(formatted)
    setError("")
  }

  async function handleActivate() {
    if (!key.trim()) { setError("Digite a chave de licença."); return }
    const finalKey = key.trim().toUpperCase()
    if (!/^GT-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/.test(finalKey)) {
      setError("Formato inválido. A chave deve seguir o padrão: GT-XXXXX-XXXXX-XXXXX")
      return
    }
    if (typeof window.electronAPI === "undefined") {
      setSuccess(true)
      setTimeout(() => router.replace("/primeiro-acesso"), 1800)
      return
    }
    setLoading(true)
    setError("")
    try {
      const result = await window.electronAPI.activateLicense(finalKey)
      if (result.success) {
        setSuccess(true)
        setTimeout(async () => {
          const firstAccess = await window.electronAPI.isFirstAccess()
          router.replace(firstAccess ? "/primeiro-acesso" : "/login")
        }, 1800)
      } else {
        setError(result.message ?? "Erro ao ativar licença.")
      }
    } catch {
      setError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <ThemeToggle variant="page" />
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <Logo size={48} />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">GestorTrip</h1>
            <p className="text-sm text-muted-foreground">Gestão de Viagens</p>
          </div>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">Ativar licença</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Digite a chave de licença recebida para ativar o GestorTrip.
            </p>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {success ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Licença ativada com sucesso!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Abrindo o aplicativo…</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="license-key" className="text-xs font-medium">Chave de licença</Label>
                  <Input
                    id="license-key"
                    placeholder="GT-XXXXX-XXXXX-XXXXX"
                    value={key}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    disabled={loading}
                    className="h-9 text-sm font-mono tracking-wider"
                    maxLength={20}
                    onKeyDown={(e) => e.key === "Enter" && handleActivate()}
                  />
                  <p className="text-xs text-muted-foreground">Formato: GT-XXXXX-XXXXX-XXXXX</p>
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                    <p className="text-xs text-destructive">{error}</p>
                  </div>
                )}

                <Button onClick={handleActivate} disabled={loading} className="h-9 w-full text-sm font-medium">
                  {loading ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Verificando…</span>
                  ) : (
                    <span className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" />Ativar licença</span>
                  )}
                </Button>

                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">precisa de ajuda?</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <Button
                  variant="outline"
                  className="h-9 w-full gap-2 text-sm border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:border-emerald-500/30"
                  onClick={() => window.open(WHATSAPP_URL, "_blank")}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Falar no WhatsApp
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          GestorTrip v1.0 — A ativação requer conexão com a internet apenas uma vez.
        </p>
      </div>
    </div>
  )
}