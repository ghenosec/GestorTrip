"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Earth, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function PrimeiroAcessoPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function validate() {
    if (!email || !password || !confirm) return "Preencha todos os campos."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Digite um e-mail válido."
    if (password.length < 6) return "A senha deve ter pelo menos 6 caracteres."
    if (password !== confirm) return "As senhas não coincidem."
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    setError("")

    try {
      if (typeof window.electronAPI === "undefined") {
        await new Promise((r) => setTimeout(r, 600))
        sessionStorage.setItem("user", JSON.stringify({ id: 1, email }))
        router.replace("/")
        return
      }

      const reg = await window.electronAPI.register(email, password)
      if (!reg.success) { setError(reg.error ?? "Erro ao criar conta."); return }

      const login = await window.electronAPI.login(email, password)
      if (login.success && login.user) {
        sessionStorage.setItem("user", JSON.stringify(login.user))
        router.replace("/")
      } else {
        router.replace("/login")
      }
    } catch {
      setError("Não foi possível conectar ao banco de dados.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      {/* Botão de tema no canto */}
      <ThemeToggle variant="page" />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Earth className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">GestorTrip</h1>
            <p className="text-sm text-muted-foreground">Gestão de Viagens</p>
          </div>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-medium text-foreground">Criar sua conta</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Primeira abertura — configure seu acesso. Isso só aparece uma vez.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email" className="text-xs font-medium">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); setError("") }}
                  disabled={loading} className="h-9 text-sm" />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-xs font-medium">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres" value={password}
                    onChange={(e) => { setPassword(e.target.value); setError("") }}
                    disabled={loading} className="h-9 pr-9 text-sm" />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm" className="text-xs font-medium">Confirmar senha</Label>
                <div className="relative">
                  <Input id="confirm" type={showConfirm ? "text" : "password"}
                    placeholder="Repita a senha" value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setError("") }}
                    disabled={loading} className="h-9 pr-9 text-sm" />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="mt-1 h-9 w-full text-sm font-medium">
                {loading
                  ? <span className="flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Criando conta…</span>
                  : "Criar conta e entrar"
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">GestorTrip v1.0</p>
      </div>
    </div>
  )
}