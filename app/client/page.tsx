"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Search, Star, Clock, MapPin, ChevronRight } from "lucide-react"

const categories = [
  { id: "all", label: "Tout", emoji: "🍽️" },
  { id: "Fast Food", label: "Fast Food", emoji: "🍔" },
  { id: "Burger", label: "Burger", emoji: "🍔" },
  { id: "Pizza", label: "Pizza", emoji: "🍕" },
  { id: "Tacos", label: "Tacos", emoji: "🌮" },
  { id: "Sushi", label: "Sushi", emoji: "🍣" },
  { id: "Asiatique", label: "Asiatique", emoji: "🍜" },
  { id: "Indien", label: "Indien", emoji: "🍛" },
  { id: "Libanais", label: "Libanais", emoji: "🧆" },
  { id: "Africain", label: "Africain", emoji: "🍲" },
  { id: "Méditerranéen", label: "Méditerranéen", emoji: "🥙" },
  { id: "Italien", label: "Italien", emoji: "🍝" },
  { id: "Mexicain", label: "Mexicain", emoji: "🌯" },
  { id: "Américain", label: "Américain", emoji: "🥩" },
  { id: "Fruits de mer", label: "Fruits de mer", emoji: "🦞" },
  { id: "Végétarien", label: "Végétarien", emoji: "🥗" },
  { id: "Vegan", label: "Vegan", emoji: "🌱" },
  { id: "Boulangerie", label: "Boulangerie", emoji: "🥐" },
  { id: "Pâtisserie", label: "Pâtisserie", emoji: "🍰" },
  { id: "Desserts", label: "Desserts", emoji: "🍩" },
  { id: "Café", label: "Café", emoji: "☕" },
  { id: "Smoothies & Jus", label: "Smoothies & Jus", emoji: "🥤" },
]

export default function ClientHomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [defaultAddress, setDefaultAddress] = useState<any>(null)
  const [restaurants, setRestaurants] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (profile) setUser(profile)

        const { data: addressesData } = await supabase
          .from("addresses")
          .select("*")
          .eq("user_id", authUser.id)
          .order("is_default", { ascending: false })
          .limit(1)

        if (addressesData && addressesData.length > 0) {
          setDefaultAddress(addressesData[0])
        }
      }

      const { data: restaurantsData } = await supabase
        .from("restaurants")
        .select("*")
        .order("rating", { ascending: false })

      if (restaurantsData) setRestaurants(restaurantsData)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const matchesCategory = selectedCategory === "all" ||
      restaurant.category?.toLowerCase() === selectedCategory.toLowerCase()
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">🍔</span>
          <Spinner className="w-8 h-8 text-primary" />
          <p className="text-muted-foreground">Chargement des restaurants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 py-4">

        {/* Greeting */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">
            Alors {user?.full_name?.split(" ")[0] || "Gourmand"}, t'as faim ? 🍽️
          </h1>
          <button
            onClick={() => router.push("/client/addresses")}
            className="text-muted-foreground flex items-center gap-1 mt-1 hover:text-primary transition-colors"
          >
            <MapPin className="w-4 h-4" />
            {defaultAddress
              ? `${defaultAddress.city}, ${defaultAddress.postal_code}`
              : "Ajouter une adresse"
            }
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Envie de quoi aujourd'hui ?"
            className="pl-12 h-14 rounded-2xl border-2 focus:border-primary text-base"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => router.push("/client/search")}
          />
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Catégories</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-2xl transition-all min-w-[85px] ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-lg scale-105"
                    : "bg-card border-2 border-border hover:border-primary/50"
                }`}
              >
                <span className="text-2xl">{category.emoji}</span>
                <span className="text-xs font-semibold whitespace-nowrap">{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Restaurants */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold">Restaurants populaires</h2>
              <p className="text-sm text-muted-foreground">Les plus commandés du moment</p>
            </div>
            <span className="text-sm text-primary font-semibold">
              {filteredRestaurants.length} résultats
            </span>
          </div>

          <div className="space-y-4">
            {filteredRestaurants.map((restaurant, index) => (
              <Card
                key={restaurant.id}
                className="overflow-hidden cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02] border-2"
                onClick={() => router.push(`/client/restaurant/${restaurant.id}`)}
              >
                <div className="relative h-44 bg-muted">
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
                  {!restaurant.is_open && (
                    <div className="absolute inset-0 bg-foreground/70 flex items-center justify-center">
                      <Badge variant="secondary" className="text-base px-4 py-2">
                        Fermé
                      </Badge>
                    </div>
                  )}
                  {index < 3 && restaurant.is_open && (
                    <Badge className="absolute top-3 left-3 bg-[#FFD700] text-foreground font-bold">
                      Top {index + 1}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="absolute top-3 right-3 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {restaurant.rating.toFixed(1)}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {restaurant.description || "Découvrez nos délicieux plats"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {restaurant.delivery_time}
                    </span>
                    <span className="text-muted-foreground">
                      {restaurant.delivery_fee === 0
                        ? <span className="text-emerald-600 font-semibold">Livraison gratuite</span>
                        : `${restaurant.delivery_fee.toFixed(2)} € livraison`
                      }
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {restaurant.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredRestaurants.length === 0 && (
              <div className="text-center py-12 bg-card rounded-2xl border-2 border-dashed">
                <span className="text-4xl mb-4 block">🔍</span>
                <p className="text-muted-foreground font-medium">Aucun restaurant trouvé</p>
                <p className="text-sm text-muted-foreground mt-1">Essaie une autre catégorie</p>
              </div>
            )}
          </div>
        </div>

        {/* À tester */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">À tester absolument 🔥</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Les nouveaux sur le bloc qui vont te faire craquer
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {restaurants.slice(0, 4).map((restaurant) => (
              <Card
                key={restaurant.id}
                className="min-w-[200px] overflow-hidden cursor-pointer hover:shadow-lg transition-all"
                onClick={() => router.push(`/client/restaurant/${restaurant.id}`)}
              >
                <div className="h-28 bg-muted relative">
                  {restaurant.image_url ? (
                    <img
                      src={restaurant.image_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">
                      🍽️
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm truncate">{restaurant.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">• {restaurant.delivery_time}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}