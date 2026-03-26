"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Clock, ChevronDown, CheckCircle, XCircle, ChefHat, Package } from "lucide-react"

const STATUS_FLOW: Record<string, string> = {
  confirmed: "preparing",
  preparing: "ready",
}

const STATUS_LABEL: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  picked_up: "Récupérée",
  delivered: "Livrée",
  cancelled: "Annulée",
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  preparing: "bg-orange-100 text-orange-700",
  ready: "bg-green-100 text-green-700",
  picked_up: "bg-teal-100 text-teal-700",
  delivered: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-600",
}

const STATUS_NEXT_LABEL: Record<string, string> = {
  confirmed: "Démarrer la préparation",
  preparing: "Marquer prête",
}

const tabs = ["En cours", "Terminées", "Annulées"]

export default function RestaurantOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [restaurantName, setRestaurantName] = useState("")
  const [activeTab, setActiveTab] = useState(0)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const loadOrders = async (restoId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(*, dish:dishes(name, price)),
        client:users!orders_client_id_fkey(full_name, phone)
      `)
      .eq("restaurant_id", restoId)
      .order("created_at", { ascending: false })

    if (data) setOrders(data)
  }

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=restaurant")
        return
      }

      const { data: restoData } = await supabase
        .from("restaurants")
        .select("id, name")
        .eq("owner_id", user.id)
        .limit(1)
        .single()

      if (!restoData) {
        setIsLoading(false)
        return
      }

      setRestaurantId(restoData.id)
      setRestaurantName(restoData.name)
      await loadOrders(restoData.id)
      setIsLoading(false)

      const interval = setInterval(() => loadOrders(restoData.id), 3000)
      return () => clearInterval(interval)
    }

    fetchData()
  }, [])

  const confirmOrder = async (order: any) => {
    setUpdating(order.id)
    const supabase = createClient()

    const driverToAssign = order.preferred_driver_id || null

    await supabase
      .from("orders")
      .update({
        status: "confirmed",
        driver_id: driverToAssign,
        livreur_id: driverToAssign,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)

    // Notif client
    await supabase.from("notifications").insert({
      user_id: order.client_id,
      title: "Commande acceptée ! ✅",
      message: `${restaurantName} a accepté votre commande. La préparation commence !`,
      type: "order",
      data: { order_id: order.id },
      is_read: false,
    })

    // Notif livreur IMMÉDIATEMENT — un seul livreur
    if (driverToAssign) {
      await supabase.from("notifications").insert({
        user_id: driverToAssign,
        title: "Nouvelle livraison ! 🛵",
        message: `Commande chez ${restaurantName} — accepte avant qu'elle parte !`,
        type: "delivery",
        data: { order_id: order.id },
        is_read: false,
      })
    } else {
      // Assignation automatique — un seul livreur disponible
      const { data: firstDriver } = await supabase
        .from("livreurs")
        .select("id")
        .eq("is_available", true)
        .limit(1)
        .single()

      if (firstDriver) {
        await supabase
          .from("orders")
          .update({
            driver_id: firstDriver.id,
            livreur_id: firstDriver.id,
          })
          .eq("id", order.id)

        await supabase.from("notifications").insert({
          user_id: firstDriver.id,
          title: "Nouvelle livraison ! 🛵",
          message: `Commande chez ${restaurantName} — accepte avant qu'elle parte !`,
          type: "delivery",
          data: { order_id: order.id },
          is_read: false,
        })
      }
    }

    setOrders((prev) =>
      prev.map((o) =>
        o.id === order.id ? { ...o, status: "confirmed", driver_id: driverToAssign } : o
      )
    )
    setUpdating(null)
  }

  const refuseOrder = async (order: any) => {
    setUpdating(order.id)
    const supabase = createClient()

    await supabase
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", order.id)

    await supabase.from("notifications").insert({
      user_id: order.client_id,
      title: "Commande refusée 😔",
      message: `${restaurantName} n'est pas en mesure d'honorer votre commande.`,
      type: "order",
      data: { order_id: order.id },
      is_read: false,
    })

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o))
    )
    setUpdating(null)
  }

  const updateStatus = async (order: any, newStatus: string) => {
    setUpdating(order.id)
    const supabase = createClient()

    await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", order.id)

    let title = ""
    let message = ""

    if (newStatus === "preparing") {
      title = "Préparation en cours 👨‍🍳"
      message = `${restaurantName} est en train de préparer votre commande !`
    } else if (newStatus === "ready") {
      title = "Commande prête ! 📦"
      message = "Votre commande est prête. Le livreur va venir la récupérer !"
    }

    if (title) {
      await supabase.from("notifications").insert({
        user_id: order.client_id,
        title,
        message,
        type: "order",
        data: { order_id: order.id },
        is_read: false,
      })
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
    )
    setUpdating(null)
  }

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 0) return ["pending", "confirmed", "preparing", "ready"].includes(o.status)
    if (activeTab === 1) return ["delivered", "picked_up"].includes(o.status)
    if (activeTab === 2) return o.status === "cancelled"
    return true
  })

  const pendingCount = orders.filter((o) => o.status === "pending").length

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">📋</span>
          <Spinner className="w-8 h-8 text-violet-600" />
          <p className="text-muted-foreground">Chargement des commandes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Commandes</h1>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse">
              {pendingCount} nouvelle{pendingCount > 1 ? "s" : ""} !
            </span>
          )}
        </div>

        <div className="flex gap-2 mb-5 bg-muted rounded-xl p-1">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === i ? "bg-white text-violet-600 shadow-sm" : "text-muted-foreground"
              }`}
            >
              {tab}
              {i === 0 && pendingCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed">
            <span className="text-4xl mb-3 block">
              {activeTab === 0 ? "😴" : activeTab === 1 ? "✅" : "❌"}
            </span>
            <p className="text-muted-foreground font-medium">
              {activeTab === 0 ? "Aucune commande en cours" : activeTab === 1 ? "Aucune commande terminée" : "Aucune commande annulée"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className={`border-2 overflow-hidden ${order.status === "pending" ? "border-yellow-400 bg-yellow-50/30" : ""}`}
              >
                <CardContent className="p-0">
                  <button
                    className="w-full p-4 text-left"
                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">
                        #{order.order_number || order.id.slice(-6).toUpperCase()}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLOR[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expandedOrder === order.id ? "rotate-180" : ""}`} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleString("fr-FR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                      </span>
                      <span className="font-semibold text-foreground text-base">
                        {order.total_amount?.toFixed(2) || order.total?.toFixed(2)} €
                      </span>
                    </div>
                  </button>

                  {expandedOrder === order.id && (
                    <div className="px-4 pb-4 border-t border-border">
                      {order.client && (
                        <div className="mt-3 flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">👤</div>
                          <div>
                            <p className="text-sm font-semibold">{order.client.full_name || "Client"}</p>
                            <p className="text-xs text-muted-foreground">{order.client.phone || "Pas de tel"}</p>
                          </div>
                        </div>
                      )}

                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground">Articles :</p>
                        {order.order_items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.dish?.name || "Article"}</span>
                            <span className="text-muted-foreground">{(item.unit_price * item.quantity).toFixed(2)} €</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-sm pt-2 border-t">
                          <span>Total</span>
                          <span>{order.total_amount?.toFixed(2) || order.total?.toFixed(2)} €</span>
                        </div>
                      </div>

                      {order.delivery_address && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-xl">
                          <p className="text-xs font-semibold text-muted-foreground">Livraison :</p>
                          <p className="text-sm">{order.delivery_address}</p>
                        </div>
                      )}

                      {(order.client_notes || order.notes) && (
                        <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                          <p className="text-xs font-semibold text-yellow-700">Note du client :</p>
                          <p className="text-sm text-yellow-800 mt-1">{order.client_notes || order.notes}</p>
                        </div>
                      )}

                      {order.status === "pending" && (
                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-red-200 text-red-500 hover:bg-red-50 h-12 rounded-xl"
                            disabled={updating === order.id}
                            onClick={() => refuseOrder(order)}
                          >
                            {updating === order.id ? <Spinner className="w-4 h-4" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Refuser
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-violet-600 hover:bg-violet-700 h-12 rounded-xl"
                            disabled={updating === order.id}
                            onClick={() => confirmOrder(order)}
                          >
                            {updating === order.id ? <Spinner className="w-4 h-4" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                            Accepter
                          </Button>
                        </div>
                      )}

                      {STATUS_FLOW[order.status] && (
                        <Button
                          className="w-full mt-4 bg-violet-600 hover:bg-violet-700 h-12 rounded-xl"
                          disabled={updating === order.id}
                          onClick={() => updateStatus(order, STATUS_FLOW[order.status])}
                        >
                          {updating === order.id ? <Spinner className="w-4 h-4 mr-2" /> : <ChefHat className="w-4 h-4 mr-2" />}
                          {STATUS_NEXT_LABEL[order.status]}
                        </Button>
                      )}

                      {order.status === "ready" && (
                        <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                          <Package className="w-4 h-4 text-green-600" />
                          <p className="text-sm text-green-700 font-medium">En attente du livreur...</p>
                        </div>
                      )}

                      {order.status === "delivered" && (
                        <div className="mt-4 flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                          <CheckCircle className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-600 font-medium">Commande livrée ✅</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}