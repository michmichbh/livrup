"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Package, MapPin, CheckCircle } from "lucide-react"
import type { Order } from "@/lib/types"

export default function DriverDeliveriesPage() {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDeliveries = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=driver")
        return
      }

      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq("driver_id", user.id)
        .order("created_at", { ascending: false })

      if (data) setDeliveries(data)
      setIsLoading(false)
    }

    fetchDeliveries()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  const activeDeliveries = deliveries.filter(d => d.status === "picked_up")
  const completedDeliveries = deliveries.filter(d => d.status === "delivered")

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold">Mes livraisons</h1>
        <p className="text-sm text-muted-foreground">
          Historique de vos livraisons
        </p>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Active deliveries */}
        {activeDeliveries.length > 0 && (
          <div>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              En cours ({activeDeliveries.length})
            </h2>
            <div className="space-y-3">
              {activeDeliveries.map((delivery) => (
                <Card key={delivery.id} className="border-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{delivery.restaurant?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4" />
                          {delivery.delivery_address}
                        </div>
                      </div>
                      <Badge className="bg-primary text-primary-foreground">
                        En cours
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(delivery.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Completed deliveries */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Terminées ({completedDeliveries.length})
          </h2>
          
          {completedDeliveries.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucune livraison terminée
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {completedDeliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{delivery.restaurant?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                          <MapPin className="w-4 h-4" />
                          {delivery.delivery_address}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Livrée
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">
                        {new Date(delivery.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="font-medium text-primary">
                        +{delivery.restaurant?.delivery_fee?.toFixed(2) || "3.50"}€
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
