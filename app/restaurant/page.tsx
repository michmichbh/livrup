"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { ShoppingBag, TrendingUp, Clock, ChevronRight, UtensilsCrossed, Star, Euro } from "lucide-react"

export default function RestaurantDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<any>(null)
  const [pendingOrders, setPendingOrders] = useState<any[]>([])
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    totalOrders: 0,
    rating: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

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

      if (profileData) setProfile(profileData)

      const { data: restoData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })

      if (restoData && restoData.length > 0) {
        setRestaurants(restoData)
        const first = restoData[0]
        setSelectedRestaurant(first)

        const { data: ordersData } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("restaurant_id", first.id)
          .in("status", ["pending", "confirmed", "preparing"])
          .order("created_at", { ascending: false })
          .limit(10)

        if (ordersData) setPendingOrders(ordersData)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: todayData } = await supabase
          .from("orders")
          .select("total_amount")
          .eq("restaurant_id", first.id)
          .eq("status", "delivered")
          .gte("created_at", today.toISOString())

        const { data: totalData } = await supabase
          .from("orders")
          .select("id")
          .eq("restaurant_id", first.id)
          .eq("status", "delivered")

        setStats({
          todayOrders: todayData?.length || 0,
          todayRevenue: todayData?.reduce((sum, o) => sum + o.total_amount, 0) || 0,
          totalOrders: totalData?.length || 0,
          rating: first.rating || 0,
        })
      }

      setIsLoading(false)
    }

    fetchData()
  }, [])

  const toggleRestaurantOpen = async (isOpen: boolean) => {
    if (!selectedRestaurant) return
    const supabase = createClient()
    await supabase
      .from("restaurants")
      .update({ is_open: isOpen })
      .eq("id", selectedRestaurant.id)
    setSelectedRestaurant({ ...selectedRestaurant, is_open: isOpen })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-700"
      case "confirmed": return "bg-blue-100 text-blue-700"
      case "preparing": return "bg-orange-100 text-orange-700"
      default: return "bg-gray-100 text-gray-700"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "En attente"
      case "confirmed": return "Confirmée"
      case "preparing": return "En préparation"
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">🍽️</span>
          <Spinner className="w-8 h-8 text-violet-600" />
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <span className="text-6xl mb-4">🏪</span>
        <h2 className="text-2xl font-bold mb-2">Aucun restaurant</h2>
        <p className="text-muted-foreground mb-6">
          Vous n'avez pas encore de restaurant enregistré.
        </p>
        <Button onClick={() => router.push("/restaurant/profile")}>
          Créer mon restaurant
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 py-4">

        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold">
            Alors {profile?.full_name?.split(" ")[0] || "Chef"}, la cuisine est prête ? 👨‍🍳
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Les commandes arrivent, t'as intérêt à être chaud ! 🔥
          </p>
        </div>

        {/* Sélecteur de restaurant */}
        {restaurants.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
            {restaurants.map((resto) => (
              <button
                key={resto.id}
                onClick={() => setSelectedRestaurant(resto)}
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

        {/* Carte restaurant + toggle */}
        {selectedRestaurant && (
          <Card className="mb-5 border-2 border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-lg">{selectedRestaurant.name}</h2>
                  <p className="text-sm text-muted-foreground">{selectedRestaurant.address}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{selectedRestaurant.rating?.toFixed(1) || "0.0"}</span>
                    <Badge variant="outline" className="text-xs">{selectedRestaurant.category}</Badge>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Switch
                    checked={selectedRestaurant.is_open}
                    onCheckedChange={toggleRestaurantOpen}
                    className="data-[state=checked]:bg-violet-600"
                  />
                  <span className={`text-xs font-semibold ${selectedRestaurant.is_open ? "text-green-600" : "text-red-500"}`}>
                    {selectedRestaurant.is_open ? "Ouvert" : "Fermé"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commandes aujourd'hui</p>
                  <p className="text-2xl font-bold">{stats.todayOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Euro className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Revenus aujourd'hui</p>
                  <p className="text-2xl font-bold">{stats.todayRevenue.toFixed(0)}€</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total commandes</p>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Star className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Note moyenne</p>
                  <p className="text-2xl font-bold">{stats.rating.toFixed(1)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commandes en cours */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Commandes en cours</h2>
            <button
              onClick={() => router.push("/restaurant/orders")}
              className="text-sm text-violet-600 font-semibold flex items-center gap-1"
            >
              Voir tout <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="text-center py-10 bg-card rounded-2xl border-2 border-dashed">
              <span className="text-4xl mb-3 block">😴</span>
              <p className="text-muted-foreground font-medium">Aucune commande en cours</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedRestaurant?.is_open ? "En attente de commandes..." : "Votre restaurant est fermé"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <Card
                  key={order.id}
                  className="border-2 cursor-pointer hover:shadow-md transition-all"
                  onClick={() => router.push("/restaurant/orders")}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">
                        Commande #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-semibold text-foreground">{order.total_amount?.toFixed(2)} €</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Raccourcis */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-1 border-2 hover:border-violet-300 hover:bg-violet-50"
            onClick={() => router.push("/restaurant/menu")}
          >
            <UtensilsCrossed className="w-5 h-5 text-violet-600" />
            <span className="text-xs font-medium">Gérer le menu</span>
          </Button>
          <Button
            variant="outline"
            className="h-16 flex flex-col gap-1 border-2 hover:border-violet-300 hover:bg-violet-50"
            onClick={() => router.push("/restaurant/orders")}
          >
            <ShoppingBag className="w-5 h-5 text-violet-600" />
            <span className="text-xs font-medium">Voir commandes</span>
          </Button>
        </div>

      </div>
    </div>
  )
}