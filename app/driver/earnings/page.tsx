"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { DollarSign, TrendingUp, Calendar, Package } from "lucide-react"
import type { DriverEarning } from "@/lib/types"

export default function DriverEarningsPage() {
  const router = useRouter()
  const [earnings, setEarnings] = useState<DriverEarning[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEarnings = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=driver")
        return
      }

      const { data } = await supabase
        .from("driver_earnings")
        .select(`
          *,
          order:orders(
            *,
            restaurant:restaurants(*)
          )
        `)
        .eq("driver_id", user.id)
        .order("created_at", { ascending: false })

      if (data) setEarnings(data)
      setIsLoading(false)
    }

    fetchEarnings()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  // Calculate stats
  const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayEarnings = earnings
    .filter(e => new Date(e.created_at) >= today)
    .reduce((sum, e) => sum + e.amount, 0)

  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekEarnings = earnings
    .filter(e => new Date(e.created_at) >= weekStart)
    .reduce((sum, e) => sum + e.amount, 0)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEarnings = earnings
    .filter(e => new Date(e.created_at) >= monthStart)
    .reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-primary px-4 pt-6 pb-8 rounded-b-3xl">
        <h1 className="text-xl font-bold text-primary-foreground mb-6">Mes gains</h1>
        
        <div className="bg-primary-foreground/20 rounded-2xl p-6 text-center">
          <DollarSign className="w-8 h-8 text-primary-foreground mx-auto mb-2" />
          <p className="text-4xl font-bold text-primary-foreground">
            {totalEarnings.toFixed(2)} €
          </p>
          <p className="text-primary-foreground/80 text-sm">Gains totaux</p>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {todayEarnings.toFixed(0)}€
              </p>
              <p className="text-xs text-muted-foreground">Aujourd&apos;hui</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {weekEarnings.toFixed(0)}€
              </p>
              <p className="text-xs text-muted-foreground">Cette semaine</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {monthEarnings.toFixed(0)}€
              </p>
              <p className="text-xs text-muted-foreground">Ce mois</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Résumé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Livraisons totales</span>
                <span className="font-semibold">{earnings.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Gain moyen/livraison</span>
                <span className="font-semibold">
                  {earnings.length > 0 
                    ? (totalEarnings / earnings.length).toFixed(2) 
                    : "0.00"
                  } €
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings history */}
        <div>
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Historique des gains
          </h2>

          {earnings.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun gain enregistré
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {earnings.map((earning) => (
                <Card key={earning.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {earning.order?.restaurant?.name || "Livraison"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(earning.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-green-600">
                        +{earning.amount.toFixed(2)} €
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
