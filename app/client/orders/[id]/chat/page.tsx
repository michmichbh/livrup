"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Send } from "lucide-react"

export default function ClientChatPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string

  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [userId, setUserId] = useState<string | null>(null)
  const [driver, setDriver] = useState<any>(null)
  const [order, setOrder] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [shouldScroll, setShouldScroll] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: orderData } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single()

      if (orderData) {
        setOrder(orderData)
        if (orderData.driver_id) {
          const { data: driverData } = await supabase
            .from("users")
            .select("id, full_name")
            .eq("id", orderData.driver_id)
            .single()
          if (driverData) setDriver(driverData)
        }
      }

      const loadMessages = async () => {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: true })

        if (msgs) {
          const senderIds = [...new Set(msgs.map((m) => m.sender_id))]
          const { data: users } = await supabase
            .from("users")
            .select("id, full_name")
            .in("id", senderIds)

          const usersMap = Object.fromEntries((users || []).map((u) => [u.id, u.full_name]))
          const msgsWithNames = msgs.map((m) => ({ ...m, sender_name: usersMap[m.sender_id] || "Inconnu" }))
          setMessages(msgsWithNames)
        }
      }

      await loadMessages()
      setShouldScroll(true)
      setIsLoading(false)

      const interval = setInterval(loadMessages, 3000)
      return () => clearInterval(interval)
    }

    load()
  }, [orderId])

  useEffect(() => {
    if (shouldScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      setShouldScroll(false)
    }
  }, [messages, shouldScroll])

  const sendMessage = async () => {
    if (!newMessage.trim() || !userId || sending) return
    setSending(true)

    const supabase = createClient()
    await supabase.from("messages").insert({
      order_id: orderId,
      sender_id: userId,
      content: newMessage.trim(),
    })

    setNewMessage("")
    setShouldScroll(true)
    setSending(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getTimeLabel = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-primary px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
            🛵
          </div>
          <div>
            <p className="font-bold text-white text-sm">
              {driver?.full_name || "Votre livreur"}
            </p>
            <p className="text-white/70 text-xs">
              Commande #{order?.order_number?.slice(-6) || orderId.slice(-6)}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-32">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">💬</span>
            <p className="text-muted-foreground font-medium">Aucun message pour l'instant</p>
            <p className="text-sm text-muted-foreground mt-1">
              Envoyez un message à votre livreur
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === userId
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                {!isMe && (
                  <p className="text-xs text-muted-foreground px-1">
                    {msg.sender_name}
                  </p>
                )}
                <div className={`px-4 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                }`}>
                  {msg.content}
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  {getTimeLabel(msg.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Envoyer un message..."
            className="flex-1 h-12 rounded-2xl border-2 focus:border-primary"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            size="icon"
            className="w-12 h-12 rounded-2xl flex-shrink-0"
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? <Spinner className="w-4 h-4" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}