"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Search, Star, Clock, X } from "lucide-react"
import type { Restaurant } from "@/lib/types"

export default function SearchPage() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Restaurant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    const searchRestaurants = async () => {
      if (!query.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      const supabase = createClient()

      const { data } = await supabase
        .from("restaurants")
        .select("*")
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
        .order("rating", { ascending: false })
        .limit(20)

      if (data) setResults(data)
      setIsLoading(false)
    }

    const debounce = setTimeout(searchRestaurants, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSearch = (searchTerm: string) => {
    setQuery(searchTerm)
    
    // Save to recent searches
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("recentSearches", JSON.stringify(updated))
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("recentSearches")
  }

  return (
    <div className="min-h-screen">
      {/* Search header */}
      <header className="p-4 border-b border-border sticky top-0 bg-background z-10">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher restaurants, cuisines..."
            className="pl-12 pr-10 h-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2"
              onClick={() => setQuery("")}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      <div className="px-4 py-6">
        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <Spinner className="w-8 h-8 text-primary" />
          </div>
        )}

        {/* Results */}
        {!isLoading && query && results.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {results.length} résultat(s) pour &quot;{query}&quot;
            </p>
            {results.map((restaurant) => (
              <Card
                key={restaurant.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  handleSearch(query)
                  router.push(`/client/restaurant/${restaurant.id}`)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                      {restaurant.image_url ? (
                        <img
                          src={restaurant.image_url}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {restaurant.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {restaurant.rating.toFixed(1)}
                        </Badge>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {restaurant.delivery_time}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && query && results.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Aucun résultat pour &quot;{query}&quot;
            </p>
          </div>
        )}

        {/* Recent searches */}
        {!query && recentSearches.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recherches récentes</h2>
              <button
                className="text-sm text-primary"
                onClick={clearRecentSearches}
              >
                Effacer
              </button>
            </div>
            <div className="space-y-2">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  className="w-full text-left px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  onClick={() => setQuery(search)}
                >
                  <div className="flex items-center gap-3">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span>{search}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!query && recentSearches.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Recherchez vos restaurants préférés
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
