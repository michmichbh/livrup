"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Package, ChevronRight } from "lucide-react"
import type { Order } from "@/lib/types"

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmée", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "En préparation", color: "bg-orange-100 text-orange-800" },
  ready: { label: "Prête", color: "bg-purple-100 text-purple-800" },
  picked_up: { label: "En livraison", color: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Livrée", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Annulée", color: "bg-red-100 text-red-800" },
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=client")
        return
      }

      const { data } = await supabase
        .from("orders")
        .select(`
          *,
          restaurant:restaurants(*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (data) setOrders(data)
      setIsLoading(false)
    }

    fetchOrders()
  }, [router])

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
        <h1 className="text-xl font-semibold">Mes commandes</h1>
        <p className="text-sm text-muted-foreground">
          Historique et suivi de vos commandes
        </p>
      </header>

      {/* Orders list */}
      <div className="px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Aucune commande</h2>
            <p className="text-muted-foreground">
              Vous n&apos;avez pas encore passé de commande
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusLabels[order.status] || statusLabels.pending
              
              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/client/orders/${order.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {order.restaurant?.name || "Restaurant"}
                          </h3>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        <p className="text-sm font-medium mt-2">
                          {order.total_amount.toFixed(2)} €
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
