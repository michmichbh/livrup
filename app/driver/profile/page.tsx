"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { User, Mail, Phone, LogOut, Save, CheckCircle, Bike } from "lucide-react"

export default function DriverProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [stats, setStats] = useState({ totalDeliveries: 0, totalEarnings: 0 })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=driver")
        return
      }

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || "")
        setPhone(profileData.phone || "")
      }

      const { data: deliveries } = await supabase
        .from("orders")
        .select("id")
        .eq("driver_id", user.id)
        .eq("status", "delivered")

      const { data: earnings } = await supabase
        .from("driver_earnings")
        .select("amount")
        .eq("driver_id", user.id)

      setStats({
        totalDeliveries: deliveries?.length || 0,
        totalEarnings: earnings?.reduce((sum, e) => sum + e.amount, 0) || 0,
      })

      setIsLoading(false)
    }

    fetchData()
  }, [router])

  const handleSave = async () => {
    if (!profile) return
    setIsSaving(true)
    setSaveSuccess(false)

    const supabase = createClient()
    await supabase
      .from("users")
      .update({ full_name: fullName, phone })
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold">Mon Profil</h1>
        <p className="text-sm text-muted-foreground">
          Gérez vos informations de livreur
        </p>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mb-4">
            <Bike className="w-12 h-12 text-primary-foreground" />
          </div>
          <p className="text-lg font-semibold">{fullName || "Livreur"}</p>
          <p className="text-sm text-muted-foreground">{profile?.email}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {stats.totalDeliveries}
              </p>
              <p className="text-sm text-muted-foreground">Livraisons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">
                {stats.totalEarnings.toFixed(0)}€
              </p>
              <p className="text-sm text-muted-foreground">Gains totaux</p>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire */}
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
                    className="pl-10"
                    disabled
                  />
                </div>
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

        {/* Déconnexion */}
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