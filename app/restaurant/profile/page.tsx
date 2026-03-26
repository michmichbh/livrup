"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, Store, Clock, Euro, Star, LogOut, Pencil, Check, X } from "lucide-react"

export default function RestaurantProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editingResto, setEditingResto] = useState(false)
  const [saving, setSaving] = useState(false)

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  const [restoName, setRestoName] = useState("")
  const [restoAddress, setRestoAddress] = useState("")
  const [restoCategory, setRestoCategory] = useState("")
  const [restoPhone, setRestoPhone] = useState("")
  const [restoDeliveryFee, setRestoDeliveryFee] = useState("")
  const [restoDeliveryTime, setRestoDeliveryTime] = useState("")
  const [restoDescription, setRestoDescription] = useState("")
  const [restoImageUrl, setRestoImageUrl] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=restaurant")
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

      const { data: restoData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (restoData && restoData.length > 0) {
        setRestaurants(restoData)
        loadRestoFields(restoData[0])
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  const loadRestoFields = (resto: any) => {
    setSelectedRestaurant(resto)
    setRestoName(resto.name || "")
    setRestoAddress(resto.address || "")
    setRestoCategory(resto.category || "")
    setRestoPhone(resto.phone || "")
    setRestoDeliveryFee(resto.delivery_fee?.toString() || "")
    setRestoDeliveryTime(resto.delivery_time || "")
    setRestoDescription(resto.description || "")
    setRestoImageUrl(resto.image_url || "")
  }

  const saveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase.from("users").update({ full_name: fullName, phone }).eq("id", profile.id)
    setProfile({ ...profile, full_name: fullName, phone })
    setEditingProfile(false)
    setSaving(false)
  }

  const saveResto = async () => {
    if (!selectedRestaurant) return
    setSaving(true)
    const supabase = createClient()
    const updated = {
      name: restoName,
      address: restoAddress,
      category: restoCategory,
      phone: restoPhone,
      delivery_fee: parseFloat(restoDeliveryFee) || 0,
      delivery_time: restoDeliveryTime,
      description: restoDescription,
      image_url: restoImageUrl || null,
    }
    await supabase.from("restaurants").update(updated).eq("id", selectedRestaurant.id)
    setRestaurants((prev) =>
      prev.map((r) => (r.id === selectedRestaurant.id ? { ...r, ...updated } : r))
    )
    setSelectedRestaurant({ ...selectedRestaurant, ...updated })
    setEditingResto(false)
    setSaving(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/role-select")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">👤</span>
          <Spinner className="w-8 h-8 text-violet-600" />
          <p className="text-muted-foreground">Chargement du profil...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 py-4">
        <h1 className="text-2xl font-bold mb-5">Profil</h1>

        {/* ── Profil personnel ── */}
        <Card className="mb-4 border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
                  <span className="text-2xl">👨‍🍳</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">{profile?.full_name || "Chef"}</h2>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
              </div>
              {!editingProfile ? (
                <button
                  onClick={() => setEditingProfile(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-violet-100 text-violet-600 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-600 text-white"
                  >
                    {saving ? <Spinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditingProfile(false)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {editingProfile ? (
              <FieldGroup>
                <Field>
                  <FieldLabel>Nom complet</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-10 h-12 rounded-xl border-2 focus:border-violet-400"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel>Téléphone</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-10 h-12 rounded-xl border-2 focus:border-violet-400"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </Field>
              </FieldGroup>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{profile?.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{profile?.phone || "Non renseigné"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Sélecteur restaurant si plusieurs ── */}
        {restaurants.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
            {restaurants.map((resto) => (
              <button
                key={resto.id}
                onClick={() => { loadRestoFields(resto); setEditingResto(false) }}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedRestaurant?.id === resto.id
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-card border-2 border-border"
                }`}
              >
                {resto.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Infos restaurant ── */}
        {selectedRestaurant && (
          <Card className="mb-4 border-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Store className="w-5 h-5 text-violet-600" />
                  <h2 className="font-bold text-lg">Mon Restaurant</h2>
                </div>
                {!editingResto ? (
                  <button
                    onClick={() => setEditingResto(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-violet-100 text-violet-600 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={saveResto}
                      disabled={saving}
                      className="w-9 h-9 rounded-xl flex items-center justify-center bg-violet-600 text-white"
                    >
                      {saving ? <Spinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setEditingResto(false)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {editingResto ? (
                <FieldGroup>
                  <Field>
                    <FieldLabel>Nom du restaurant</FieldLabel>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10 h-12 rounded-xl border-2 focus:border-violet-400"
                        value={restoName}
                        onChange={(e) => setRestoName(e.target.value)}
                      />
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel>Description</FieldLabel>
                    <Input
                      className="h-12 rounded-xl border-2 focus:border-violet-400"
                      placeholder="Décrivez votre restaurant..."
                      value={restoDescription}
                      onChange={(e) => setRestoDescription(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Catégorie</FieldLabel>
                    <Select value={restoCategory} onValueChange={setRestoCategory}>
                      <SelectTrigger className="h-12 rounded-xl border-2">
                        <SelectValue placeholder="Type de cuisine" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="Fast Food">🍔 Fast Food</SelectItem>
                        <SelectItem value="Burger">🍔 Burger</SelectItem>
                        <SelectItem value="Pizza">🍕 Pizza</SelectItem>
                        <SelectItem value="Tacos">🌮 Tacos</SelectItem>
                        <SelectItem value="Sushi">🍣 Sushi</SelectItem>
                        <SelectItem value="Asiatique">🍜 Asiatique</SelectItem>
                        <SelectItem value="Indien">🍛 Indien</SelectItem>
                        <SelectItem value="Libanais">🧆 Libanais</SelectItem>
                        <SelectItem value="Africain">🍲 Africain</SelectItem>
                        <SelectItem value="Méditerranéen">🥙 Méditerranéen</SelectItem>
                        <SelectItem value="Italien">🍝 Italien</SelectItem>
                        <SelectItem value="Mexicain">🌯 Mexicain</SelectItem>
                        <SelectItem value="Américain">🥩 Américain</SelectItem>
                        <SelectItem value="Fruits de mer">🦞 Fruits de mer</SelectItem>
                        <SelectItem value="Végétarien">🥗 Végétarien</SelectItem>
                        <SelectItem value="Vegan">🌱 Vegan</SelectItem>
                        <SelectItem value="Boulangerie">🥐 Boulangerie</SelectItem>
                        <SelectItem value="Pâtisserie">🍰 Pâtisserie</SelectItem>
                        <SelectItem value="Desserts">🍩 Desserts</SelectItem>
                        <SelectItem value="Café">☕ Café</SelectItem>
                        <SelectItem value="Smoothies & Jus">🥤 Smoothies & Jus</SelectItem>
                        <SelectItem value="Autre">🍽️ Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel>Adresse</FieldLabel>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10 h-12 rounded-xl border-2 focus:border-violet-400"
                        value={restoAddress}
                        onChange={(e) => setRestoAddress(e.target.value)}
                      />
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel>Téléphone</FieldLabel>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        className="pl-10 h-12 rounded-xl border-2 focus:border-violet-400"
                        value={restoPhone}
                        onChange={(e) => setRestoPhone(e.target.value)}
                      />
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field>
                      <FieldLabel>Frais livraison (€)</FieldLabel>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10 h-12 rounded-xl border-2 focus:border-violet-400"
                          value={restoDeliveryFee}
                          onChange={(e) => setRestoDeliveryFee(e.target.value)}
                        />
                      </div>
                    </Field>
                    <Field>
                      <FieldLabel>Temps livraison</FieldLabel>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          className="pl-10 h-12 rounded-xl border-2 focus:border-violet-400"
                          placeholder="30-45 min"
                          value={restoDeliveryTime}
                          onChange={(e) => setRestoDeliveryTime(e.target.value)}
                        />
                      </div>
                    </Field>
                  </div>
                  <Field>
                    <FieldLabel>URL image</FieldLabel>
                    <Input
                      className="h-12 rounded-xl border-2 focus:border-violet-400"
                      placeholder="https://..."
                      value={restoImageUrl}
                      onChange={(e) => setRestoImageUrl(e.target.value)}
                    />
                  </Field>
                </FieldGroup>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Store className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{selectedRestaurant.name}</span>
                    <Badge variant="outline" className="text-xs">{selectedRestaurant.category}</Badge>
                  </div>
                  {selectedRestaurant.description && (
                    <p className="text-sm text-muted-foreground pl-7">{selectedRestaurant.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedRestaurant.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedRestaurant.phone || "Non renseigné"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedRestaurant.delivery_time || "30-45 min"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Euro className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedRestaurant.delivery_fee?.toFixed(2)} € frais de livraison</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>{selectedRestaurant.rating?.toFixed(1) || "0.0"} / 5</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Déconnexion ── */}
        <Button
          variant="outline"
          className="w-full h-12 border-2 border-red-200 text-red-500 hover:bg-red-50 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </Button>

      </div>
    </div>
  )
}