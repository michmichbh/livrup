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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, Mail, Lock, User, Phone, MapPin, AlertCircle, CheckCircle, Car, Utensils, Store } from "lucide-react"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "client"

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [postalCode, setPostalCode] = useState("")

  const [vehicleType, setVehicleType] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")

  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantAddress, setRestaurantAddress] = useState("")
  const [restaurantCity, setRestaurantCity] = useState("")
  const [restaurantPostalCode, setRestaurantPostalCode] = useState("")
  const [restaurantCategory, setRestaurantCategory] = useState("")
  const [restaurantPhone, setRestaurantPhone] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      setIsLoading(false)
      return
    }

    if (!acceptTerms) {
      setError("Vous devez accepter les conditions d'utilisation")
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/${role}`,
      },
    })

    if (authError) {
      setError(authError.message)
      setIsLoading(false)
      return
    }

    if (data.user) {
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          phone: phone,
          role: role,
        })

      if (userError) {
        console.error("Erreur user complète:", JSON.stringify(userError))
        setError(`Erreur profil: ${userError.message} (code: ${userError.code})`)
        setIsLoading(false)
        return
      }

      if (role === 'client') {
        await supabase.from('clients').insert({
          id: data.user.id,
          total_orders: 0,
          total_spent: 0,
        })

        if (address && city && postalCode) {
          await supabase.from('addresses').insert({
            user_id: data.user.id,
            label: 'Maison',
            street: address,
            city: city,
            postal_code: postalCode,
            country: 'France',
            is_default: true,
          })
        }
      }

      if (role === 'driver') {
        await supabase.from('livreurs').insert({
          id: data.user.id,
          vehicle_type: vehicleType || 'velo',
          license_number: licenseNumber || null,
          is_available: true,
          rating: 0,
          total_deliveries: 0,
          total_earnings: 0,
          documents_verified: false,
        })
      }

      if (role === 'restaurant') {
        const { error: restoError } = await supabase.from('restaurants').insert({
          owner_id: data.user.id,
          name: restaurantName,
          address: `${restaurantAddress}, ${restaurantPostalCode} ${restaurantCity}`,
          cuisine_type: [restaurantCategory || 'Autre'],
          category: restaurantCategory || 'Autre',
          phone: restaurantPhone || phone,
          is_open: false,
          rating: 0,
          delivery_fee: 2.99,
          minimum_order: 0,
          delivery_time: '30-45 min',
        })

        if (restoError) {
          console.error("Erreur restaurant complète:", JSON.stringify(restoError))
          setError(`Erreur restaurant: ${restoError.message} (code: ${restoError.code})`)
          setIsLoading(false)
          return
        }
      }

      setSuccess(true)
    }

    setIsLoading(false)
  }

  const roleConfig: Record<string, { label: string; emoji: string; subtitle: string }> = {
    client: { label: "Client", emoji: "🍔", subtitle: "Rejoins la communauté des gourmands !" },
    driver: { label: "Livreur", emoji: "🛵", subtitle: "Deviens un héros de la livraison !" },
    restaurant: { label: "Restaurant", emoji: "🍽️", subtitle: "Ouvre ton resto sur LivrUP !" },
  }

  const config = roleConfig[role] || roleConfig.client

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-2">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Bienvenue chez LivrUP !</h2>
            <p className="text-muted-foreground mb-6">
              {role === 'restaurant'
                ? "Ton compte restaurant est créé ! Connecte-toi pour gérer ton établissement."
                : "Connecte-toi pour commencer l'aventure !"}
            </p>
            <Button onClick={() => router.push(`/auth/login?role=${role}`)} className="w-full h-12 rounded-xl">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <Button variant="ghost" size="sm" onClick={() => router.push("/role-select")} className="gap-2">
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
            <CardTitle className="text-2xl">Inscription {config.label}</CardTitle>
            <CardDescription className="text-base">{config.subtitle}</CardDescription>
          </CardHeader>

          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4 pt-4">
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <FieldGroup>
                <Field>
                  <FieldLabel>Nom complet *</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Jean Dupont"
                      className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Email *</FieldLabel>
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
                  <FieldLabel>Téléphone *</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="tel"
                      placeholder="06 12 34 56 78"
                      className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                {/* ── Champs client ── */}
                {role === "client" && (
                  <>
                    <Field>
                      <FieldLabel>Adresse</FieldLabel>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="123 rue de la Livraison"
                          className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                      </div>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel>Ville</FieldLabel>
                        <Input
                          type="text"
                          placeholder="Paris"
                          className="h-12 rounded-xl border-2 focus:border-primary"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Code postal</FieldLabel>
                        <Input
                          type="text"
                          placeholder="75001"
                          className="h-12 rounded-xl border-2 focus:border-primary"
                          value={postalCode}
                          onChange={(e) => setPostalCode(e.target.value)}
                        />
                      </Field>
                    </div>
                  </>
                )}

                {/* ── Champs livreur ── */}
                {role === "driver" && (
                  <>
                    <Field>
                      <FieldLabel>Type de véhicule *</FieldLabel>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger className="h-12 rounded-xl border-2">
                          <Car className="w-4 h-4 mr-2 text-muted-foreground" />
                          <SelectValue placeholder="Choisir un véhicule" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="velo">Vélo</SelectItem>
                          <SelectItem value="scooter">Scooter</SelectItem>
                          <SelectItem value="voiture">Voiture</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Numéro de permis (si applicable)</FieldLabel>
                      <Input
                        type="text"
                        placeholder="123456789"
                        className="h-12 rounded-xl border-2 focus:border-primary"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                      />
                    </Field>
                  </>
                )}

                {/* ── Champs restaurant ── */}
                {role === "restaurant" && (
                  <>
                    <div className="pt-1 pb-1">
                      <p className="text-sm font-semibold text-violet-600 flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        Informations de votre restaurant
                      </p>
                    </div>

                    <Field>
                      <FieldLabel>Nom du restaurant *</FieldLabel>
                      <div className="relative">
                        <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Le Bon Burger"
                          className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                          value={restaurantName}
                          onChange={(e) => setRestaurantName(e.target.value)}
                          required
                        />
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel>Catégorie *</FieldLabel>
                      <Select value={restaurantCategory} onValueChange={setRestaurantCategory}>
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
                      <FieldLabel>Adresse du restaurant *</FieldLabel>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="123 rue de la Cuisine"
                          className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                          value={restaurantAddress}
                          onChange={(e) => setRestaurantAddress(e.target.value)}
                          required
                        />
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel>Ville *</FieldLabel>
                        <Input
                          type="text"
                          placeholder="Paris"
                          className="h-12 rounded-xl border-2 focus:border-primary"
                          value={restaurantCity}
                          onChange={(e) => setRestaurantCity(e.target.value)}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel>Code postal *</FieldLabel>
                        <Input
                          type="text"
                          placeholder="75001"
                          className="h-12 rounded-xl border-2 focus:border-primary"
                          value={restaurantPostalCode}
                          onChange={(e) => setRestaurantPostalCode(e.target.value)}
                          required
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel>Téléphone du restaurant</FieldLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="01 23 45 67 89"
                          className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                          value={restaurantPhone}
                          onChange={(e) => setRestaurantPhone(e.target.value)}
                        />
                      </div>
                    </Field>
                  </>
                )}

                {/* ── Mot de passe ── */}
                <Field>
                  <FieldLabel>Mot de passe *</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Minimum 6 caractères"
                      className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                <Field>
                  <FieldLabel>Confirmer le mot de passe *</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Confirmez votre mot de passe"
                      className="pl-10 h-12 rounded-xl border-2 focus:border-primary"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </Field>

                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    J&apos;accepte les{" "}
                    <span className="text-primary underline">conditions générales d&apos;utilisation</span>
                    {" "}et la{" "}
                    <span className="text-primary underline">politique de confidentialité</span>
                  </label>
                </div>
              </FieldGroup>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={isLoading}>
                {isLoading ? <Spinner className="mr-2" /> : null}
                Créer mon compte
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                Déjà un compte?{" "}
                <Link href={`/auth/login?role=${role}`} className="text-primary hover:underline font-semibold">
                  Se connecter
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Utensils className="w-12 h-12 text-primary animate-pulse" />
          <Spinner className="w-6 h-6" />
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}