"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Bell, Package, Bike, CheckCircle, XCircle, ChefHat } from "lucide-react"

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (data) setNotifications(data)
    setIsLoading(false)
  }

  useEffect(() => {
    fetchNotifications()

    // Rafraîchissement toutes les 10 secondes
    const interval = setInterval(fetchNotifications, 3000)
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    const supabase = createClient()
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  const getIcon = (type: string, title: string) => {
    if (title.includes("livrée") || title.includes("Livrée")) return CheckCircle
    if (title.includes("livreur") || title.includes("Livreur") || title.includes("🛵")) return Bike
    if (title.includes("préparation") || title.includes("🍳")) return ChefHat
    if (title.includes("annulée") || title.includes("refusée")) return XCircle
    return Package
  }

  const getIconColor = (title: string) => {
    if (title.includes("annulée") || title.includes("refusée")) return "bg-red-500"
    if (title.includes("livrée") || title.includes("Livrée")) return "bg-green-500"
    if (title.includes("livreur") || title.includes("🛵")) return "bg-emerald-500"
    if (title.includes("préparation")) return "bg-orange-500"
    return "bg-primary"
  }

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (minutes < 1) return "À l'instant"
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days} jour${days > 1 ? "s" : ""}`
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleNotifClick = (notif: any) => {
    markRead(notif.id)
    if (notif.data?.order_id) {
      router.push(`/client/orders/${notif.data.order_id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-primary px-4 py-4 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-white/80">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 text-sm"
            onClick={markAllRead}
          >
            Tout lire
          </Button>
        )}
      </header>

      <div className="px-4 py-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">Pas de notification</p>
            <p className="text-muted-foreground text-sm mt-1">
              Tu seras notifié des nouveautés ici
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const Icon = getIcon(notif.type, notif.title)
            const iconColor = getIconColor(notif.title)
            return (
              <Card
                key={notif.id}
                className={`transition-all cursor-pointer hover:shadow-md ${
                  !notif.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""
                }`}
                onClick={() => handleNotifClick(notif)}
              >
                <CardContent className="p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full ${iconColor} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold text-sm ${!notif.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {notif.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {getTimeAgo(notif.created_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}