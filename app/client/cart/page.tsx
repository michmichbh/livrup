"use client"

import { useRouter } from "next/navigation"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react"

export default function CartPage() {
  const router = useRouter()
  const { items, restaurant, updateQuantity, removeItem, clearCart, total } = useCartStore()

  const deliveryFee = restaurant?.delivery_fee || 0
  const subtotal = total()
  const grandTotal = subtotal + deliveryFee

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-4 border-b border-border flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Mon Panier</h1>
        </header>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Panier vide</h2>
          <p className="text-muted-foreground text-center mb-6">
            Ajoutez des articles depuis un restaurant pour commencer votre commande
          </p>
          <Button onClick={() => router.push("/client")}>
            Explorer les restaurants
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Mon Panier</h1>
        </div>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={clearCart}>
          <Trash2 className="w-4 h-4 mr-2" />
          Vider
        </Button>
      </header>

      {/* Restaurant info */}
      {restaurant && (
        <div className="px-4 py-4 border-b border-border">
          <p className="text-sm text-muted-foreground">Commande chez</p>
          <h2 className="font-semibold text-lg">{restaurant.name}</h2>
        </div>
      )}

      {/* Cart items */}
      <div className="px-4 py-4 space-y-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-3">
              <div className="flex gap-3">
                {/* Item image */}
                <div className="w-20 h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🍴
                    </div>
                  )}
                </div>

                {/* Item details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.price.toFixed(2)} € / unité
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="w-8 h-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">
                        {(item.price * item.quantity).toFixed(2)} €
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border px-4 py-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total</span>
            <span>{subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frais de livraison</span>
            <span>{deliveryFee.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">{grandTotal.toFixed(2)} €</span>
          </div>
        </div>

        <Button 
          className="w-full h-12 text-base"
          onClick={() => router.push("/client/checkout")}
        >
          Commander - {grandTotal.toFixed(2)} €
        </Button>
      </div>
    </div>
  )
}
