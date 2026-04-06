"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { AuthBrandDisplay } from "@/components/auth-brand-display"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signIn } from "@/lib/auth-client"
import { useT } from "@/lib/i18n"
import { cn } from "@/lib/utils"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const t = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const redirectTarget = searchParams.get("redirect")
  const nextPath =
    redirectTarget?.startsWith("/") && !redirectTarget.startsWith("//") ? redirectTarget : "/"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await signIn.email({
      email,
      password,
      fetchOptions: {
        onRequest: () => setLoading(true),
        onResponse: () => setLoading(false),
        onError: (ctx) => {
          toast.error(ctx.error.message || t.auth.loginFailed)
        },
        onSuccess: () => {
          toast.success(t.auth.loginSuccess)
          window.location.href = nextPath
        },
      },
    })
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="font-bold text-2xl">{t.auth.loginTitle}</h1>
                <p className="text-balance text-muted-foreground">{t.auth.loginSubtitle}</p>
              </div>
              <Field>
                <FieldLabel htmlFor="email">{t.auth.email}</FieldLabel>
                <Input
                  disabled={loading}
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="m@example.com"
                  required
                  type="email"
                  value={email}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">{t.auth.password}</FieldLabel>
                <Input
                  disabled={loading}
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </Field>
              <Field>
                <Button className="w-full" disabled={loading} type="submit">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t.auth.loginButton}
                </Button>
              </Field>
              <div className="text-center text-sm text-muted-foreground">
                {t.auth.noAccount}
                <button
                  className="ml-1 underline underline-offset-4 hover:text-foreground"
                  onClick={async (e) => {
                    e.preventDefault()
                    try {
                      const res = await fetch("/api/check-registration")
                      const data = await res.json()
                      if (data.allowed) {
                        router.push(
                          `/signup${nextPath === "/" ? "" : `?redirect=${encodeURIComponent(nextPath)}`}`
                        )
                      } else {
                        toast.error(data.message || t.auth.registrationClosed)
                      }
                    } catch {
                      toast.error(t.auth.registrationCheckFailed)
                    }
                  }}
                  type="button"
                >
                  {t.auth.goSignup}
                </button>
              </div>
            </FieldGroup>
          </form>
          <AuthBrandDisplay />
        </CardContent>
      </Card>
    </div>
  )
}
