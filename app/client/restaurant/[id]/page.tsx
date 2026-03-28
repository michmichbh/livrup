// @ts-nocheck
"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { ArrowLeft, Star, Clock, Plus, Minus, ShoppingBag, X, MapPin, Phone } from "lucide-react"

export default function RestaurantPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()

  const [restaurant, setRestaurant] = useState<any>(null)
  const [dishes, setDishes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [selectedDish, setSelectedDish] = useState<any>(null)

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { items, addItem, updateQuantity, total, itemCount } = useCartStore()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: restaurantData } = await supabase
        .from("restaurants")
        .select("*")
        .eq("id", id)
        .single()

      if (restaurantData) setRestaurant(restaurantData)

      const { data: dishesData } = await supabase
        .from("dishes")
        .select("*")
        .eq("restaurant_id", id)
        .eq("is_available", true)
        .order("category")

      if (dishesData) {
        setDishes(dishesData)
        const firstCategory = dishesData[0]?.category || ""
        setSelectedCategory(firstCategory)
      }

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
    if (newQty >= 0) updateQuantity(itemId, newQty)
  }

  const groupedDishes = dishes.reduce((acc, dish) => {
    const category = dish.category || "Autres"
    if (!acc[category]) acc[category] = []
    acc[category].push(dish)
    return acc
  }, {} as Record<string, any[]>)

  const categories = Object.keys(groupedDishes)

  const scrollToCategory = (cat: string) => {
    setSelectedCategory(cat)
    const el = categoryRefs.current[cat]
    if (el) {
      const offset = 140
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: "smooth" })
    }
  }

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
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32">

      {/* Grande photo hero */}
      <div className="relative h-64 bg-muted">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <Button
          variant="secondary"
          size="icon"
          className="absolute top-4 left-4 rounded-full shadow-lg"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="absolute bottom-4 left-4 right-4 text-white">
          <h1 className="text-3xl font-bold drop-shadow-lg">{restaurant.name}</h1>
          <Badge
            variant={restaurant.is_open ? "default" : "secondary"}
            className="mt-2"
          >
            {restaurant.is_open ? "✅ Ouvert" : "❌ Fermé"}
          </Badge>
        </div>
      </div>

      {/* Infos complètes du restaurant */}
      <div className="px-4 py-4 bg-background border-b border-border">

        {/* Description complète */}
        {restaurant.description && (
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            {restaurant.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3 mb-3">
          <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-xl">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-sm">{restaurant.rating?.toFixed(1) || "N/A"}</span>
            <span className="text-xs text-muted-foreground">({restaurant.total_reviews || 0} avis)</span>
          </div>

          <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl">
            <Clock className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">{restaurant.delivery_time || "30-45 min"}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-xl">
            <ShoppingBag className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">
              {restaurant.delivery_fee === 0
                ? "Livraison gratuite"
                : `${restaurant.delivery_fee?.toFixed(2)} € livraison`}
            </span>
          </div>
        </div>

        {/* Adresse & téléphone */}
        <div className="space-y-1.5">
          {restaurant.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0 text-primary" />
              <span>{restaurant.address}</span>
            </div>
          )}
          {restaurant.phone && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
              <span>{restaurant.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bannière catégories — sticky collée juste en dessous des infos */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-background border-b border-border shadow-sm">
          <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="px-4 py-4">
        {categories.map((category) => (
          <div
            key={category}
            ref={(el) => { categoryRefs.current[category] = el }}
            className="mb-8"
          >
            <h2 className="text-lg font-bold mb-4 capitalize">{category}</h2>
            <div className="space-y-3">
              {groupedDishes[category].map((dish: any) => {
                const quantity = getItemQuantity(dish.id)

                return (
                  <Card
                    key={dish.id}
                    className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedDish(dish)}
                  >
                    <CardContent className="p-0">
                      <div className="flex gap-3 p-3">
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="font-semibold text-base">{dish.name}</h3>
                            {dish.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {dish.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-lg text-primary">
                              {dish.price.toFixed(2)} €
                            </span>

                            {quantity === 0 ? (
                              <Button
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); handleAddItem(dish) }}
                                disabled={!restaurant.is_open}
                                className="shadow-sm"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                              </Button>
                            ) : (
                              <div
                                className="flex items-center gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="w-8 h-8"
                                  onClick={() => handleUpdateQuantity(dish.id, -1)}
                                >
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <span className="w-8 text-center font-bold">{quantity}</span>
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
            <p className="text-muted-foreground">Ce restaurant n'a pas encore de plats</p>
          </div>
        )}
      </div>

      {/* Modal plat */}
      {selectedDish && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedDish(null)}
        >
          <div
            className="bg-background w-full max-w-lg rounded-t-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image grande */}
            {selectedDish.image_url && (
              <div className="h-56 w-full overflow-hidden">
                <img
                  src={selectedDish.image_url}
                  alt={selectedDish.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-5">
              {/* Fermer */}
              <button
                onClick={() => setSelectedDish(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              <div className="flex items-start justify-between mb-2">
                <h2 className="text-xl font-bold flex-1 pr-4">{selectedDish.name}</h2>
                <span className="text-2xl font-bold text-primary">
                  {selectedDish.price.toFixed(2)} €
                </span>
              </div>

              {selectedDish.description && (
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {selectedDish.description}
                </p>
              )}

              <Badge variant="outline" className="mb-4">{selectedDish.category}</Badge>

              {/* Boutons quantité ou ajouter */}
              {getItemQuantity(selectedDish.id) === 0 ? (
                <Button
                  className="w-full h-12 rounded-xl text-base font-semibold"
                  onClick={() => {
                    handleAddItem(selectedDish)
                    setSelectedDish(null)
                  }}
                  disabled={!restaurant.is_open}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Ajouter au panier — {selectedDish.price.toFixed(2)} €
                </Button>
              ) : (
                <div className="flex items-center justify-between bg-muted rounded-xl p-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="w-11 h-11 rounded-xl"
                    onClick={() => handleUpdateQuantity(selectedDish.id, -1)}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="font-bold text-xl">
                    {getItemQuantity(selectedDish.id)}
                  </span>
                  <Button
                    size="icon"
                    className="w-11 h-11 rounded-xl"
                    onClick={() => handleUpdateQuantity(selectedDish.id, 1)}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barre panier */}
      {itemCount > 0 && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
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
                  <p className="font-semibold">{itemCount} article{itemCount > 1 ? "s" : ""}</p>
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
