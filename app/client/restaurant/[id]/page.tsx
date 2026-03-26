// @ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Star, Clock, Plus, Minus, ShoppingBag, Info } from "lucide-react"

export default function RestaurantPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  
  // AJOUT : Les états manquants
  const [restaurant, setRestaurant] = useState<any>(null)
  const [dishes, setDishes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const { items, addItem, updateQuantity, total, itemCount } = useCartStore()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      
      // Chercher le restaurant
      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single()
      
      if (restaurantData) setRestaurant(restaurantData)

      // Chercher les plats
      const { data: dishesData } = await supabase
        .from("dishes")
        .select("*")
        .eq("restaurant_id", id)
        .eq("is_available", true)
        .order("category")
      
      if (dishesData) setDishes(dishesData)
      setIsLoading(false)
    }

    fetchData()
  }, [id])

  const getItemQuantity = (itemId: string) => {
    const cartItem = items.find(i => i.id === itemId)
    return cartItem?.quantity || 0
  }

  const handleAddItem = (dish: any) => {
    if (restaurant) {
      addItem({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        image_url: dish.image_url,
        restaurant_id: restaurant.id,
        restaurant_name: restaurant.name,
      }, restaurant)
    }
  }

  const handleUpdateQuantity = (itemId: string, change: number) => {
    const currentQty = getItemQuantity(itemId)
    const newQty = currentQty + change
    if (newQty >= 0) {
      updateQuantity(itemId, newQty)
    }
  }

  // Grouper par catégorie (CORRECTION : ajout du check)
  const groupedDishes = (dishes || []).reduce((acc, dish) => {
    const category = dish.category || "Autres"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(dish)
    return acc
  }, {} as Record<string, any[]>)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">🍽️</span>
          <Spinner className="w-8 h-8 text-primary" />
          <p className="text-muted-foreground">Chargement du menu...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <span className="text-6xl mb-4">😕</span>
        <p className="text-xl font-semibold mb-2">Restaurant non trouvé</p>
        <p className="text-muted-foreground mb-6">Ce restaurant n'existe pas ou a été supprimé</p>
        <Button onClick={() => router.push("/client/home")}>
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header image */}
      <div className="relative h-56 bg-muted">
        {restaurant.image_url ? (
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-primary/10 to-primary/5">
            🍽️
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
        
        {/* Back button */}
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full shadow-lg"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Restaurant info overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-2xl font-bold drop-shadow-lg">{restaurant.name}</h1>
          {restaurant.description && (
            <p className="text-sm text-white/90 line-clamp-2 mt-1 drop-shadow">
              {restaurant.description}
            </p>
          )}
        </div>
      </div>

      {/* Restaurant details */}
      <div className="px-4 py-4 border-b border-border bg-background sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            {restaurant.rating?.toFixed(1) || "N/A"}
            <span className="text-xs text-muted-foreground ml-1">
              ({restaurant.total_reviews || 0})
            </span>
          </Badge>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {restaurant.delivery_time || "30-40 min"}
          </span>
          <span className="text-sm text-muted-foreground">
            {restaurant.delivery_fee === 0 
              ? <span className="text-emerald-600 font-semibold">Livraison gratuite</span>
              : `${restaurant.delivery_fee?.toFixed(2)} € livraison`
            }
          </span>
          <Badge variant={restaurant.is_open ? "default" : "secondary"}>
            {restaurant.is_open ? "Ouvert" : "Fermé"}
          </Badge>
        </div>
        {restaurant.minimum_order > 0 && (
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Commande minimum : {restaurant.minimum_order.toFixed(2)} €
          </p>
        )}
      </div>

      {/* Menu */}
      <div className="px-4 py-6">
        {Object.entries(groupedDishes).map(([category, categoryDishes]) => (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-bold mb-4 capitalize sticky top-24 bg-background py-2 z-5">
              {category}
            </h2>
            <div className="space-y-3">
              {categoryDishes.map((dish: any) => {
                const quantity = getItemQuantity(dish.id)
                
                return (
                  <Card key={dish.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-0">
                      <div className="flex gap-3 p-3">
                        {/* Item details */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="font-semibold text-base truncate">{dish.name}</h3>
                            {dish.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {dish.description}
                              </p>
                            )}
                            {dish.is_popular && (
                              <Badge variant="secondary" className="mt-2 text-xs">
                                ⭐ Populaire
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-lg text-primary">
                              {dish.price.toFixed(2)} €
                            </span>
                            
                            {quantity === 0 ? (
                              <Button
                                size="sm"
                                onClick={() => handleAddItem(dish)}
                                disabled={!restaurant.is_open}
                                className="shadow-sm"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="w-8 h-8"
                                  onClick={() => handleUpdateQuantity(dish.id, -1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-8 text-center font-bold">
                                  {quantity}
                                </span>
                                <Button
                                  size="icon"
                                  className="w-8 h-8"
                                  onClick={() => handleUpdateQuantity(dish.id, 1)}
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Item image */}
                        {dish.image_url && (
                          <div className="w-28 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={dish.image_url}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}

        {dishes.length === 0 && (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">📋</span>
            <p className="text-xl font-semibold mb-2">Menu en construction</p>
            <p className="text-muted-foreground">
              Ce restaurant n'a pas encore ajouté de plats à son menu
            </p>
          </div>
        )}
      </div>

      {/* Cart summary bar */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <button
            className="w-full bg-primary text-primary-foreground rounded-2xl p-4 shadow-2xl hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => router.push("/client/cart")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <p className="font-semibold">{itemCount} article{itemCount > 1 ? 's' : ''}</p>
                  <p className="text-xs text-primary-foreground/80">Voir le panier</p>
                </div>
              </div>
              <span className="font-bold text-xl">{total().toFixed(2)} €</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}