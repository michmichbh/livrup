"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, CreditCard, CheckCircle, AlertCircle, Bike, Banknote, Smartphone, ChevronRight } from "lucide-react"

const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", icon: CreditCard, description: "Visa, Mastercard..." },
  { id: "cash", label: "Espèces", icon: Banknote, description: "Paiement à la livraison" },
  { id: "mobile", label: "Paiement mobile", icon: Smartphone, description: "Orange Money, Wave..." },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, restaurant, total, clearCart } = useCartStore()

  const [address, setAddress] = useState("")
  const [notes, setNotes] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("card")
  const [drivers, setDrivers] = useState<any[]>([])
  const [selectedDriver, setSelectedDriver] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  const deliveryFee = restaurant?.delivery_fee || 0
  const subtotal = total()
  const grandTotal = subtotal + deliveryFee

  useEffect(() => {
    const fetchDrivers = async () => {
      const supabase = createClient()
      const { data: availableDrivers } = await supabase
        .from("livreurs")
        .select("*, user:users(*)")
        .eq("is_available", true)

      if (availableDrivers) setDrivers(availableDrivers)
      setIsLoadingDrivers(false)
    }

    const fetchAddress = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: addressData } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single()

      if (addressData) {
        setAddress(`${addressData.street}, ${addressData.postal_code} ${addressData.city}`)
      }
    }

    fetchDrivers()
    fetchAddress()
  }, [])

  const handleSubmitOrder = async () => {
    if (!address.trim()) {
      setError("Veuillez entrer une adresse de livraison")
      return
    }

    if (items.length === 0 || !restaurant) {
      setError("Votre panier est vide")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=client")
        return
      }

      // Récupérer le owner_id du restaurant
      const { data: restoData } = await supabase
        .from("restaurants")
        .select("owner_id")
        .eq("id", restaurant.id)
        .single()

      const orderNumber = `ORD-${Date.now()}`

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          client_id: user.id,
          restaurant_id: restaurant.id,
          driver_id: null,
          livreur_id: null,
          preferred_driver_id: selectedDriver?.id || null,
          status: "pending",
          total_amount: grandTotal,
          total: grandTotal,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          delivery_address: address,
          notes: notes || null,
          client_notes: notes || null,
          payment_method: paymentMethod,
          payment_status: "pending",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Créer les articles
      const orderItems = items.map((item) => ({
        order_id: order.id,
        dish_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Notification au restaurant uniquement
      if (restoData?.owner_id) {
        await supabase.from("notifications").insert({
          user_id: restoData.owner_id,
          title: "Nouvelle commande ! 🎉",
          message: `Vous avez reçu une nouvelle commande de ${grandTotal.toFixed(2)} €`,
          type: "order",
          data: { order_id: order.id },
          is_read: false,
        })
      }

      setOrderId(order.id)
      setOrderSuccess(true)
      clearCart()
    } catch (err: any) {
      setError(`Erreur: ${err.message}`)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (orderSuccess && orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md border-2">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Commande envoyée ! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Votre commande a été envoyée au restaurant. Vous recevrez une notification dès qu'elle est acceptée.
            </p>
            <div className="space-y-3">
              <Button
                className="w-full h-12 rounded-xl"
                onClick={() => router.push(`/client/orders/${orderId}`)}
              >
                Suivre ma commande
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => router.push("/client")}
              >
                Retour à l&apos;accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (items.length === 0) {
    router.push("/client/cart")
    return null
  }

  return (
    <div className="min-h-screen pb-36">
      <header className="p-4 border-b border-border flex items-center gap-4 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-semibold">Finaliser la commande</h1>
      </header>

      <div className="px-4 py-6 space-y-5">
        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 text-destructive">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Adresse */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Adresse de livraison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Adresse complète *</FieldLabel>
                <Input
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  className="h-12 rounded-xl border-2 focus:border-primary"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Instructions (optionnel)</FieldLabel>
                <Input
                  placeholder="Code porte, étage, interphone..."
                  className="h-12 rounded-xl border-2 focus:border-primary"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Livreur */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bike className="w-5 h-5 text-primary" />
              Choisir un livreur
              <Badge variant="outline" className="text-xs ml-auto">
                {drivers.length} disponible{drivers.length > 1 ? "s" : ""}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDrivers ? (
              <div className="flex items-center justify-center py-6">
                <Spinner className="w-6 h-6 text-primary" />
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-6">
                <span className="text-3xl mb-2 block">😔</span>
                <p className="text-sm text-muted-foreground">Aucun livreur disponible</p>
                <p className="text-xs text-muted-foreground mt-1">Assignation automatique</p>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedDriver(null)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    selectedDriver === null
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Bike className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Assignation automatique</p>
                      <p className="text-xs text-muted-foreground">Le premier livreur disponible</p>
                    </div>
                    {selectedDriver === null && (
                      <CheckCircle className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </div>
                </button>

                {drivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedDriver?.id === driver.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-lg">🛵</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{driver.user?.full_name || "Livreur"}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground capitalize">{driver.vehicle_type}</span>
                          {driver.rating > 0 && (
                            <span className="text-xs text-yellow-600">⭐ {driver.rating.toFixed(1)}</span>
                          )}
                          <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200">
                            Disponible
                          </Badge>
                        </div>
                      </div>
                      {selectedDriver?.id === driver.id && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paiement */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Méthode de paiement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    paymentMethod === method.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <method.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Résumé */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ChevronRight className="w-5 h-5 text-primary" />
              Résumé de la commande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium mb-3">{restaurant?.name}</p>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 mt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span>{deliveryFee.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{grandTotal.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4">
        <Button
          className="w-full h-12 text-base rounded-xl font-semibold"
          onClick={handleSubmitOrder}
          disabled={isLoading}
        >
          {isLoading ? <Spinner className="mr-2" /> : null}
          Confirmer la commande — {grandTotal.toFixed(2)} €
        </Button>
      </div>
    </div>
  )
}