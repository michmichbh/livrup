"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, MapPin, Clock, Star, CheckCircle, Package, Bike, XCircle } from "lucide-react"
import dynamic from "next/dynamic"
import { MessageCircle } from "lucide-react"

// Import dynamique pour éviter les erreurs SSR avec Leaflet
const MapComponent = dynamic(
  () => import("@/app/client/orders/[id]/MapComponent"),
  { ssr: false }
)

const STATUS_STEPS = [
  { key: "pending", label: "Commande envoyée", icon: "📤" },
  { key: "confirmed", label: "Acceptée par le restaurant", icon: "✅" },
  { key: "preparing", label: "En préparation", icon: "👨‍🍳" },
  { key: "ready", label: "Prête pour la livraison", icon: "📦" },
  { key: "picked_up", label: "En route vers vous", icon: "🛵" },
  { key: "delivered", label: "Livrée !", icon: "🎉" },
]

const STATUS_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  preparing: 2,
  ready: 3,
  picked_up: 4,
  delivered: 5,
  cancelled: -1,
}

export default function OrderTrackingPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string

  const [order, setOrder] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showRating, setShowRating] = useState(false)
  const [ratingDriver, setRatingDriver] = useState(0)
  const [ratingRestaurant, setRatingRestaurant] = useState(0)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)
  const intervalRef = useRef<any>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      const supabase = createClient()

      const { data: orderData } = await supabase
        .from("orders")
        .select(`
          *,
          restaurant:restaurants(*),
          order_items(*, dish:dishes(name, price)),
          client:users!orders_client_id_fkey(full_name, phone)
        `)
        .eq("id", orderId)
        .single()

      if (orderData) {
        setOrder(orderData)

        if (orderData.driver_id) {
          const { data: driverData } = await supabase
            .from("users")
            .select("*")
            .eq("id", orderData.driver_id)
            .single()

          if (driverData) setDriver(driverData)

          const { data: livreurData } = await supabase
            .from("livreurs")
            .select("latitude, longitude, rating")
            .eq("id", orderData.driver_id)
            .single()

          if (livreurData?.latitude && livreurData?.longitude) {
            setDriverLocation({ lat: livreurData.latitude, lng: livreurData.longitude })
          }
        }

        if (orderData.status === "delivered") {
          setShowRating(true)
        }
      }

      setIsLoading(false)
    }

    fetchOrder()

    // Refresh toutes les 10 secondes
    intervalRef.current = setInterval(async () => {
      const supabase = createClient()

      const { data: orderData } = await supabase
        .from("orders")
        .select(`*, restaurant:restaurants(*), order_items(*, dish:dishes(name, price))`)
        .eq("id", orderId)
        .single()

      if (orderData) {
        setOrder(orderData)
        if (orderData.status === "delivered") {
          setShowRating(true)
          clearInterval(intervalRef.current)
        }
      }

      if (orderData?.driver_id) {
        const { data: livreurData } = await supabase
          .from("livreurs")
          .select("latitude, longitude")
          .eq("id", orderData.driver_id)
          .single()

        if (livreurData?.latitude && livreurData?.longitude) {
          setDriverLocation({ lat: livreurData.latitude, lng: livreurData.longitude })
        }

        // Charger infos driver si pas encore fait
        if (!driver) {
          const { data: driverData } = await supabase
            .from("users")
            .select("*")
            .eq("id", orderData.driver_id)
            .single()
          if (driverData) setDriver(driverData)
        }
      }
    }, 3000)

    return () => clearInterval(intervalRef.current)
  }, [orderId])

  const handleSubmitRating = async () => {
    if (!order) return
    setSubmittingRating(true)
    const supabase = createClient()

    // Sauvegarder les notes sur la commande
    await supabase
      .from("orders")
      .update({
        client_rating_driver: ratingDriver || null,
        client_rating_restaurant: ratingRestaurant || null,
      })
      .eq("id", order.id)

    // Mettre à jour la note du restaurant
    if (ratingRestaurant > 0 && order.restaurant_id) {
      const { data: restoData } = await supabase
        .from("restaurants")
        .select("rating, total_reviews")
        .eq("id", order.restaurant_id)
        .single()

      if (restoData) {
        const totalReviews = (restoData.total_reviews || 0) + 1
        const newRating = ((restoData.rating || 0) * (totalReviews - 1) + ratingRestaurant) / totalReviews
        await supabase
          .from("restaurants")
          .update({ rating: newRating, total_reviews: totalReviews })
          .eq("id", order.restaurant_id)
      }
    }

    // Mettre à jour la note du livreur
    if (ratingDriver > 0 && order.driver_id) {
      const { data: livreurData } = await supabase
        .from("livreurs")
        .select("rating, total_deliveries")
        .eq("id", order.driver_id)
        .single()

      if (livreurData) {
        const totalDeliveries = (livreurData.total_deliveries || 0) + 1
        const newRating = ((livreurData.rating || 0) * (totalDeliveries - 1) + ratingDriver) / totalDeliveries
        await supabase
          .from("livreurs")
          .update({ rating: newRating })
          .eq("id", order.driver_id)
      }
    }

    setRatingSubmitted(true)
    setSubmittingRating(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">🛵</span>
          <Spinner className="w-8 h-8 text-primary" />
          <p className="text-muted-foreground">Chargement de votre commande...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <span className="text-6xl mb-4">😕</span>
        <p className="text-xl font-semibold mb-2">Commande introuvable</p>
        <Button onClick={() => router.push("/client")}>Retour à l'accueil</Button>
      </div>
    )
  }

  const currentStep = STATUS_INDEX[order.status] ?? 0
  const isCancelled = order.status === "cancelled"

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="p-4 border-b border-border flex items-center gap-4 sticky top-0 bg-background z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Suivi de commande</h1>
          <p className="text-xs text-muted-foreground">
            #{order.order_number || order.id.slice(-6).toUpperCase()}
          </p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">

        {/* Commande annulée */}
        {isCancelled && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-700">Commande annulée</p>
                <p className="text-sm text-red-600">Votre commande a été annulée.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Carte GPS Leaflet — uniquement si livreur en route */}
        {order.status === "picked_up" && driverLocation && (
          <Card className="border-2 border-emerald-200 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bike className="w-5 h-5 text-emerald-600" />
                Livreur en route
                <span className="ml-auto flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-emerald-600 font-normal">En direct</span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64">
                <MapComponent
                  lat={driverLocation.lat}
                  lng={driverLocation.lng}
                  driverName={driver?.full_name || "Votre livreur"}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Étapes de suivi */}
        {!isCancelled && (
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Statut de votre commande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {STATUS_STEPS.map((step, index) => {
                  const isDone = index <= currentStep
                  const isCurrent = index === currentStep
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isDone
                          ? "bg-primary text-white shadow-md"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {isDone
                          ? <CheckCircle className="w-5 h-5" />
                          : <span className="text-base">{step.icon}</span>
                        }
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-primary font-semibold animate-pulse">En cours...</p>
                        )}
                      </div>
                      {isCurrent && (
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Infos restaurant */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                🍽️
              </div>
              <div>
                <p className="font-bold">{order.restaurant?.name}</p>
                <p className="text-sm text-muted-foreground">{order.restaurant?.address}</p>
              </div>
            </div>
            <div className="space-y-1 border-t pt-3">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.dish?.name || "Article"}</span>
                  <span className="text-muted-foreground">
                    {(item.unit_price * item.quantity).toFixed(2)} €
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">
                  {order.total_amount?.toFixed(2) || order.total?.toFixed(2)} €
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Infos livreur */}
        {driver && (
          <Card className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">
                🛵
              </div>
              <div className="flex-1">
                <p className="font-bold">{driver.full_name}</p>
                <p className="text-sm text-muted-foreground">{driver.phone || "Livreur assigné"}</p>
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                Votre livreur
              </Badge>
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl border-primary text-primary"
                onClick={() => router.push(`/client/orders/${orderId}/chat`)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Adresse livraison */}
        <Card className="border-2">
          <CardContent className="p-4 flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Livraison à</p>
              <p className="font-medium">{order.delivery_address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Notation */}
        {showRating && !ratingSubmitted && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                Notez votre expérience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Note restaurant */}
              <div>
                <p className="text-sm font-semibold mb-2">🍽️ {order.restaurant?.name}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatingRestaurant(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= ratingRestaurant
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Note livreur */}
              {driver && (
                <div>
                  <p className="text-sm font-semibold mb-2">🛵 {driver.full_name}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatingDriver(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= ratingDriver
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 rounded-xl"
                onClick={handleSubmitRating}
                disabled={submittingRating || (ratingRestaurant === 0 && ratingDriver === 0)}
              >
                {submittingRating ? (
                  <Spinner className="w-4 h-4 mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Envoyer mes notes
              </Button>
            </CardContent>
          </Card>
        )}

        {ratingSubmitted && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-green-700">Merci pour votre avis !</p>
              <p className="text-sm text-green-600">Vos notes ont bien été enregistrées.</p>
            </CardContent>
          </Card>
        )}

        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-2"
          onClick={() => router.push("/client")}
        >
          Retour à l'accueil
        </Button>

      </div>
    </div>
  )
}