"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, CreditCard, CheckCircle, AlertCircle, Bike, Banknote, Smartphone, ChevronRight, Lock } from "lucide-react"

const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", icon: CreditCard, description: "Visa, Mastercard..." },
  { id: "cash", label: "Espèces", icon: Banknote, description: "Paiement à la livraison" },
  { id: "mobile", label: "Paiement mobile", icon: Smartphone, description: "Orange Money, Wave..." },
]

export default function CheckoutPage() {
  const router = useRouter()

  const [cartItems, setCartItems] = useState<any[]>([])
  const [cartRestaurant, setCartRestaurant] = useState<any>(null)
  const [cartTotal, setCartTotal] = useState(0)
  const [clearCartFn, setClearCartFn] = useState<() => void>(() => () => {})
  const [cartReady, setCartReady] = useState(false)

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

  // Carte bancaire
  const [cardNumber, setCardNumber] = useState("")
  const [cardName, setCardName] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCVV, setCardCVV] = useState("")

  // Mobile money
  const [mobilePhone, setMobilePhone] = useState("")
  const [mobileOperator, setMobileOperator] = useState("orange")

  useEffect(() => {
    const { useCartStore } = require("@/lib/cart-store")
    const store = useCartStore.getState()
    setCartItems(store.items)
    setCartRestaurant(store.restaurant)
    setCartTotal(store.total())
    setClearCartFn(() => store.clearCart)
    setCartReady(true)
  }, [])

  const deliveryFee = cartRestaurant?.delivery_fee || 0
  const subtotal = cartTotal
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

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "")
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length ? parts.join(" ") : value
  }

  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, "")
    if (v.length >= 2) return v.substring(0, 2) + "/" + v.substring(2, 4)
    return v
  }

  const handleSubmitOrder = async () => {
    if (!address.trim()) {
      setError("Veuillez entrer une adresse de livraison")
      return
    }
    if (cartItems.length === 0 || !cartRestaurant) {
      setError("Votre panier est vide")
      return
    }
    if (paymentMethod === "card") {
      if (!cardNumber || !cardName || !cardExpiry || !cardCVV) {
        setError("Veuillez remplir tous les champs de la carte bancaire")
        return
      }
    }
    if (paymentMethod === "mobile" && !mobilePhone) {
      setError("Veuillez entrer votre numéro de téléphone mobile")
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

      const { data: restoData } = await supabase
        .from("restaurants")
        .select("owner_id")
        .eq("id", cartRestaurant.id)
        .single()

      const orderNumber = `ORD-${Date.now()}`

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          client_id: user.id,
          restaurant_id: cartRestaurant.id,
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
          payment_status: paymentMethod === "cash" ? "pending" : "paid",
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = cartItems.map((item) => ({
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
      clearCartFn()
    } catch (err: any) {
      setError(`Erreur: ${err.message}`)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  if (!cartReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
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
              Votre commande a été envoyée au restaurant.
            </p>
            <div className="space-y-3">
              <Button className="w-full h-12 rounded-xl" onClick={() => router.push(`/client/orders/${orderId}`)}>
                Suivre ma commande
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => router.push("/client")}>
                Retour à l&apos;accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (cartItems.length === 0) {
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
          <CardContent className="space-y-3">
            <Input
              placeholder="Ex: Rue de Paris, Djibouti"
              className="h-12 rounded-xl border-2 focus:border-primary"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <Input
              placeholder="Instructions supplémentaires..."
              className="h-12 rounded-xl border-2 focus:border-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedDriver(null)}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    selectedDriver === null ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                    {selectedDriver === null && <CheckCircle className="w-5 h-5 text-primary ml-auto" />}
                  </div>
                </button>

                {drivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriver(driver)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedDriver?.id === driver.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                        </div>
                      </div>
                      {selectedDriver?.id === driver.id && <CheckCircle className="w-5 h-5 text-primary" />}
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
          <CardContent className="space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === method.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                  {paymentMethod === method.id && <CheckCircle className="w-5 h-5 text-primary" />}
                </div>
              </button>
            ))}

            {/* Formulaire carte bancaire */}
            {paymentMethod === "card" && (
              <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-xl border-2 border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  <p className="text-xs text-green-600 font-medium">Paiement sécurisé SSL</p>
                </div>

                <Input
                  placeholder="Numéro de carte (1234 5678 9012 3456)"
                  className="h-12 rounded-xl border-2 focus:border-primary font-mono"
                  value={cardNumber}
                  maxLength={19}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                />

                <Input
                  placeholder="Nom sur la carte"
                  className="h-12 rounded-xl border-2 focus:border-primary uppercase"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    placeholder="MM/AA"
                    className="h-12 rounded-xl border-2 focus:border-primary font-mono"
                    value={cardExpiry}
                    maxLength={5}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                  />
                  <Input
                    placeholder="CVV"
                    className="h-12 rounded-xl border-2 focus:border-primary font-mono"
                    value={cardCVV}
                    maxLength={3}
                    type="password"
                    onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Accepté :</span>
                  <span className="text-xs font-bold text-blue-600">VISA</span>
                  <span className="text-xs font-bold text-red-600">Mastercard</span>
                  <span className="text-xs font-bold text-orange-500">Amex</span>
                </div>
              </div>
            )}

            {/* Formulaire mobile money */}
            {paymentMethod === "mobile" && (
              <div className="mt-4 space-y-3 p-4 bg-muted/50 rounded-xl border-2 border-primary/20">
                <p className="text-xs text-muted-foreground font-medium mb-2">Choisir l'opérateur</p>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "orange", label: "Orange Money", emoji: "🟠" },
                    { id: "wave", label: "Wave", emoji: "🔵" },
                    { id: "djib", label: "Dahabshiil", emoji: "🟢" },
                  ].map((op) => (
                    <button
                      key={op.id}
                      onClick={() => setMobileOperator(op.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        mobileOperator === op.id ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <span className="text-xl block mb-1">{op.emoji}</span>
                      <span className="text-xs font-medium">{op.label}</span>
                    </button>
                  ))}
                </div>

                <Input
                  placeholder="Numéro de téléphone (+253 77 XX XX XX)"
                  className="h-12 rounded-xl border-2 focus:border-primary"
                  value={mobilePhone}
                  onChange={(e) => setMobilePhone(e.target.value)}
                  type="tel"
                />

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-xs text-blue-700">
                    📱 Vous recevrez une notification sur votre téléphone pour confirmer le paiement de <strong>{grandTotal.toFixed(2)} €</strong>
                  </p>
                </div>
              </div>
            )}

            {/* Espèces */}
            {paymentMethod === "cash" && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  💵 Vous paierez <strong>{grandTotal.toFixed(2)} €</strong> en espèces directement au livreur à la réception de votre commande.
                </p>
              </div>
            )}
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
              <p className="text-sm text-muted-foreground font-medium mb-3">{cartRestaurant?.name}</p>
              {cartItems.map((item) => (
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
          {paymentMethod === "cash" ? "Commander — Payer à la livraison" : `Payer ${grandTotal.toFixed(2)} €`}
        </Button>
      </div>
    </div>
  )
}