"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Bike, Package, DollarSign, MapPin, ChevronRight, Phone, Star, Navigation, CheckCircle, XCircle } from "lucide-react"
import { MessageCircle } from "lucide-react"

export default function DriverDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [assignedOrder, setAssignedOrder] = useState<any>(null)
  const [activeDelivery, setActiveDelivery] = useState<any>(null)
  const [stats, setStats] = useState({ todayDeliveries: 0, todayEarnings: 0, totalDeliveries: 0, rating: 0 })
  const [isOnline, setIsOnline] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=driver")
        return
      }

      setUserId(user.id)

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileData) setProfile(profileData)

      const { data: livreurData } = await supabase
        .from("livreurs")
        .select("*")
        .eq("id", user.id)
        .single()

      if (livreurData) setIsOnline(livreurData.is_available ?? true)

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayDeliveries } = await supabase
        .from("orders")
        .select("id")
        .eq("driver_id", user.id)
        .eq("status", "delivered")
        .gte("updated_at", today.toISOString())

      const { data: todayEarnings } = await supabase
        .from("driver_earnings")
        .select("amount")
        .eq("driver_id", user.id)
        .gte("created_at", today.toISOString())

      const { data: totalDeliveries } = await supabase
        .from("orders")
        .select("id")
        .eq("driver_id", user.id)
        .eq("status", "delivered")

      const { data: livreurStats } = await supabase
        .from("livreurs")
        .select("rating, total_earnings")
        .eq("id", user.id)
        .single()

      setStats({
        todayDeliveries: todayDeliveries?.length || 0,
        todayEarnings: todayEarnings?.reduce((sum, e) => sum + e.amount, 0) || 0,
        totalDeliveries: totalDeliveries?.length || 0,
        rating: livreurStats?.rating || 0,
      })

      setIsLoading(false)

      const interval = setInterval(async () => {
        const { data: assignedData } = await supabase
          .from("orders")
          .select(`*, restaurant:restaurants(*), client:users!orders_client_id_fkey(*), order_items(*, dish:dishes(*))`)
          .eq("driver_id", user.id)
          .is("driver_accepted", null)
          .in("status", ["pending", "confirmed", "preparing", "ready", "picked_up"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        setAssignedOrder(assignedData || null)

        const { data: activeData } = await supabase
          .from("orders")
          .select(`*, restaurant:restaurants(*), client:users!orders_client_id_fkey(*)`)
          .eq("driver_id", user.id)
          .eq("driver_accepted", true)
          .in("status", ["pending", "confirmed", "preparing", "ready", "picked_up"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single()

        setActiveDelivery(activeData || null)
      }, 3000)

      return () => clearInterval(interval)
    }

    fetchData()
  }, [router])

  useEffect(() => {
    if (!userId || !isOnline) return

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const supabase = createClient()
          await supabase
            .from("livreurs")
            .update({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
            .eq("id", userId)
        },
        (err) => console.error("GPS error:", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [userId, isOnline])

  const handleToggleOnline = async (value: boolean) => {
    if (!userId) return
    setIsOnline(value)
    const supabase = createClient()
    await supabase
      .from("livreurs")
      .update({ is_available: value })
      .eq("id", userId)
  }

  const handleAcceptOrder = async () => {
    if (!assignedOrder || !userId) return
    setActionLoading(true)
    const supabase = createClient()

    await supabase
      .from("orders")
      .update({ driver_accepted: true })
      .eq("id", assignedOrder.id)

    await supabase.from("notifications").insert({
      user_id: assignedOrder.client_id,
      title: "Livreur assigné ! 🛵",
      message: `${profile?.full_name} a accepté votre commande et viendra la récupérer`,
      type: "order",
      data: { order_id: assignedOrder.id },
      is_read: false,
    })

    setActiveDelivery({ ...assignedOrder, driver_accepted: true })
    setAssignedOrder(null)
    setActionLoading(false)
  }

  const handleRefuseOrder = async () => {
    if (!assignedOrder || !userId) return
    setActionLoading(true)
    const supabase = createClient()

    await supabase.rpc("refuse_order", {
      order_id: assignedOrder.id,
      refusing_driver_id: userId,
    })

    const { data: updatedOrder } = await supabase
      .from("orders")
      .select("driver_id, status")
      .eq("id", assignedOrder.id)
      .single()

    if (updatedOrder?.status === "cancelled") {
      await supabase.from("notifications").insert({
        user_id: assignedOrder.client_id,
        title: "Commande annulée 😔",
        message: "Aucun livreur disponible. Votre commande a été annulée.",
        type: "order",
        data: { order_id: assignedOrder.id },
        is_read: false,
      })
    } else if (updatedOrder?.driver_id) {
      await supabase.from("notifications").insert({
        user_id: updatedOrder.driver_id,
        title: "Nouvelle livraison ! 🛵",
        message: `Commande chez ${assignedOrder.restaurant?.name}`,
        type: "delivery",
        data: { order_id: assignedOrder.id },
        is_read: false,
      })
    }

    setAssignedOrder(null)
    setActionLoading(false)
  }

  const handlePickedUp = async () => {
    if (!activeDelivery || !userId) return
    setActionLoading(true)
    const supabase = createClient()

    await supabase
      .from("orders")
      .update({ status: "picked_up", updated_at: new Date().toISOString() })
      .eq("id", activeDelivery.id)

    await supabase.from("notifications").insert({
      user_id: activeDelivery.client_id,
      title: "Commande en route ! 🚀",
      message: `${profile?.full_name} a récupéré votre commande et est en route !`,
      type: "order",
      data: { order_id: activeDelivery.id },
      is_read: false,
    })

    setActiveDelivery({ ...activeDelivery, status: "picked_up" })
    setActionLoading(false)
  }

  const handleDelivered = async () => {
    if (!activeDelivery || !userId) return
    setActionLoading(true)
    const supabase = createClient()

    await supabase
      .from("orders")
      .update({ status: "delivered", updated_at: new Date().toISOString() })
      .eq("id", activeDelivery.id)

    const earnings = activeDelivery.delivery_fee || activeDelivery.restaurant?.delivery_fee || 2.99

    await supabase.from("driver_earnings").insert({
      driver_id: userId,
      order_id: activeDelivery.id,
      amount: earnings,
    })

    const { data: livreurData } = await supabase
      .from("livreurs")
      .select("total_earnings, total_deliveries")
      .eq("id", userId)
      .single()

    if (livreurData) {
      await supabase
        .from("livreurs")
        .update({
          total_earnings: (livreurData.total_earnings || 0) + earnings,
          total_deliveries: (livreurData.total_deliveries || 0) + 1,
          is_available: true,
        })
        .eq("id", userId)
    }

    await supabase.from("notifications").insert({
      user_id: activeDelivery.client_id,
      title: "Commande livrée ! 🎉",
      message: "Votre commande a été livrée. Bon appétit ! N'oubliez pas de noter votre livreur.",
      type: "order",
      data: { order_id: activeDelivery.id },
      is_read: false,
    })

    setActiveDelivery(null)
    setIsOnline(true)
    setActionLoading(false)
    window.location.reload()
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed": return "En attente de préparation"
      case "preparing": return "En cours de préparation 👨‍🍳"
      case "ready": return "Prête à récupérer ! 📦"
      case "picked_up": return "En route vers le client 🛵"
      default: return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-blue-100 text-blue-700"
      case "preparing": return "bg-orange-100 text-orange-700"
      case "ready": return "bg-green-100 text-green-700"
      case "picked_up": return "bg-emerald-100 text-emerald-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">🛵</span>
          <Spinner className="w-8 h-8 text-emerald-600" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="px-4 py-4">

        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">
              Alors {profile?.full_name?.split(" ")[0] || "Livreur"}, t'es chaud pour livrer ? 🛵
            </h1>
            <p className="text-muted-foreground">Les clients ont faim, grouille-toi !</p>
          </div>
        </div>

        <Card className={`mb-5 border-2 ${isOnline ? "border-emerald-500 bg-emerald-50" : "border-muted"}`}>
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isOnline ? "bg-emerald-500" : "bg-muted"}`}>
                <Bike className={`w-6 h-6 ${isOnline ? "text-white" : "text-muted-foreground"}`} />
              </div>
              <div>
                <p className="font-bold text-lg">{isOnline ? "Disponible" : "Hors ligne"}</p>
                <p className="text-sm text-muted-foreground">
                  {isOnline ? "Tu reçois des commandes" : "Active toi pour recevoir des courses"}
                </p>
              </div>
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
              className="data-[state=checked]:bg-emerald-500"
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-4 gap-3 mb-5">
          <div className="bg-card rounded-2xl p-3 text-center border-2">
            <Package className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.todayDeliveries}</p>
            <p className="text-[10px] text-muted-foreground">Courses</p>
          </div>
          <div className="bg-card rounded-2xl p-3 text-center border-2">
            <DollarSign className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.todayEarnings.toFixed(0)}€</p>
            <p className="text-[10px] text-muted-foreground">Gains</p>
          </div>
          <div className="bg-card rounded-2xl p-3 text-center border-2">
            <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.rating.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Note</p>
          </div>
          <div className="bg-card rounded-2xl p-3 text-center border-2">
            <Bike className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <p className="text-xl font-bold">{stats.totalDeliveries}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>

        {assignedOrder && (
          <Card className="mb-5 border-2 border-yellow-400 bg-yellow-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl">📦</span>
                Nouvelle commande !
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white rounded-xl p-3 border">
                <p className="font-bold">{assignedOrder.restaurant?.name}</p>
                <p className="text-sm text-muted-foreground">{assignedOrder.restaurant?.address}</p>
              </div>

              <div className="bg-white rounded-xl p-3 border">
                <p className="text-sm font-semibold mb-2">Articles :</p>
                {assignedOrder.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.dish?.name}</span>
                    <span>{(item.unit_price * item.quantity).toFixed(2)} €</span>
                  </div>
                ))}
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{assignedOrder.total_amount?.toFixed(2)} €</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-3 border flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Livraison à</p>
                  <p className="text-sm font-medium">{assignedOrder.delivery_address}</p>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 flex items-center justify-between">
                <span className="text-sm font-medium">Vos gains</span>
                <span className="font-bold text-emerald-600 text-lg">
                  +{assignedOrder.delivery_fee?.toFixed(2) || "2.99"} €
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-red-200 text-red-500 hover:bg-red-50"
                  onClick={handleRefuseOrder}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner className="w-4 h-4" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Refuser
                </Button>
                <Button
                  className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleAcceptOrder}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Accepter
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeDelivery && !assignedOrder && (
          <Card className="mb-5 border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-white" />
                </div>
                Livraison en cours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(activeDelivery.status)}`}>
                {getStatusLabel(activeDelivery.status)}
              </span>

              <div className="bg-white rounded-xl p-3 border">
                <p className="font-bold">{activeDelivery.restaurant?.name}</p>
                <p className="text-sm text-muted-foreground">{activeDelivery.restaurant?.address}</p>
              </div>

              <div className="flex items-center justify-between bg-white rounded-xl p-3 border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-lg">👤</div>
                  <div>
                    <p className="font-semibold text-sm">{activeDelivery.client?.full_name || "Client"}</p>
                    <p className="text-xs text-muted-foreground">{activeDelivery.client?.phone || "Pas de tel"}</p>
                  </div>
                </div>
                <Button size="icon" variant="outline" className="rounded-full">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => router.push(`/driver/chat/${activeDelivery.id}`)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </div>

              <div className="bg-white rounded-xl p-3 border flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 mt-0.5" />
                <p className="text-sm">{activeDelivery.delivery_address}</p>
              </div>

              {activeDelivery.status === "ready" && (
                <Button
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  onClick={handlePickedUp}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner className="w-4 h-4 mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                  J'ai récupéré la commande
                </Button>
              )}

              {activeDelivery.status === "picked_up" && (
                <Button
                  className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleDelivered}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner className="w-4 h-4 mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Commande livrée !
                </Button>
              )}

              {["confirmed", "preparing"].includes(activeDelivery.status) && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                  <p className="text-sm text-blue-700 font-medium">
                    ⏳ En attente de la préparation du restaurant...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!assignedOrder && !activeDelivery && isOnline && (
          <Card className="border-2 border-dashed mb-5">
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">📦</span>
              <p className="font-semibold mb-1">Pas de commande pour l'instant</p>
              <p className="text-sm text-muted-foreground">Reste connecté, ça va arriver !</p>
            </CardContent>
          </Card>
        )}

        {!isOnline && (
          <Card className="border-2 border-dashed mb-5">
            <CardContent className="py-12 text-center">
              <span className="text-4xl mb-4 block">😴</span>
              <h3 className="font-bold text-lg mb-2">Tu es hors ligne</h3>
              <p className="text-muted-foreground text-sm mb-4">Active ton statut pour recevoir des courses !</p>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleToggleOnline(true)}>
                Passer en ligne
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <Card className="cursor-pointer hover:shadow-md transition-all border-2" onClick={() => router.push("/driver/earnings")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <span className="font-bold">Mes gains</span>
                  <p className="text-sm text-muted-foreground">Voir le détail</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-all border-2" onClick={() => router.push("/driver/deliveries")}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <span className="font-bold">Historique</span>
                  <p className="text-sm text-muted-foreground">Tes livraisons passées</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}