"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { User, Mail, Phone, LogOut, Save, CheckCircle } from "lucide-react"

export default function ClientProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=client")
        return
      }

      // CORRECTION : Chercher dans la table "users" au lieu de "profiles"
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (data) {
        setProfile(data)
        setFullName(data.full_name || "")
        setPhone(data.phone || "")
      }
      setIsLoading(false)
    }

    fetchProfile()
  }, [router])

  const handleSave = async () => {
    if (!profile) return

    setIsSaving(true)
    setSaveSuccess(false)

    const supabase = createClient()
    
    // CORRECTION : Update dans "users" au lieu de "profiles"
    await supabase
      .from("users")
      .update({
        full_name: fullName,
        phone,
      })
      .eq("id", profile.id)

    setIsSaving(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/role-select")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="p-4 border-b border-border bg-background sticky top-0 z-10">
        <h1 className="text-xl font-semibold">Mon Profil</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations personnelles
        </p>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Profile avatar */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-primary-foreground">
              {fullName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <p className="text-lg font-semibold">{fullName || "Utilisateur"}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        {/* Profile form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Nom complet</FieldLabel>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Votre nom"
                    className="pl-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel>Email</FieldLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    value={profile?.email || ""}
                    className="pl-10 bg-muted"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  L'email ne peut pas être modifié
                </p>
              </Field>

              <Field>
                <FieldLabel>Téléphone</FieldLabel>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="tel"
                    placeholder="Votre numéro"
                    className="pl-10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </Field>
            </FieldGroup>

            <Button
              className="w-full mt-6"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Spinner className="mr-2" />
              ) : saveSuccess ? (
                <CheckCircle className="w-4 h-4 mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saveSuccess ? "Enregistré !" : "Enregistrer"}
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}