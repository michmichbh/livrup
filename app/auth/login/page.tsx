"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Mail, Lock, AlertCircle, Utensils } from "lucide-react"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "client"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user.id)
        .single()

      if (profile) {
        router.push(`/${profile.role}`)
      } else {
        await supabase.from("users").upsert({
          id: data.user.id,
          email: data.user.email!,
          role,
        }, { onConflict: 'id' })
        router.push(`/${role}`)
      }
    }
  }

  const roleConfig: Record<string, { label: string; emoji: string; subtitle: string }> = {
    client: { label: "Client", emoji: "🍔", subtitle: "Prêt à te régaler ?" },
    driver: { label: "Livreur", emoji: "🛵", subtitle: "On t'attend pour livrer !" },
    restaurant: { label: "Restaurant", emoji: "🍽️", subtitle: "Gérez votre établissement !" },
  }

  const config = roleConfig[role] || roleConfig.client

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/role-select")}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">
            <span className="text-primary">Livr</span>
            <span className="text-[#FFD700]">UP</span>
          </span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <Card className="w-full max-w-md border-2">
          <CardHeader className="text-center pb-2">
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-orange-500 mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Image
                src="/logo-auth.png"
                alt="LivrUP"
                width={50}
                height={50}
                className="object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <span className="text-4xl absolute">{config.emoji}</span>
            </div>
            <CardTitle className="text-2xl">Connexion {config.label}</CardTitle>
            <CardDescription className="text-base">
              {config.subtitle}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="votre@email.com"
                      className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Mot de passe</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Votre mot de passe"
                      className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </Field>
              </FieldGroup>

              <div className="text-right">
                <Link href="#" className="text-sm text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" /> : null}
                Se connecter
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                Pas encore de compte?{" "}
                <Link
                  href={`/auth/register?role=${role}`}
                  className="text-primary hover:underline font-semibold"
                >
                  S&apos;inscrire
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Utensils className="w-12 h-12 text-primary animate-pulse" />
          <Spinner className="w-6 h-6" />
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}