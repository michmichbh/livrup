"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field"
import { Plus, Pencil, Trash2, X, Check, UtensilsCrossed, ImageIcon } from "lucide-react"

export default function RestaurantMenuPage() {
  const router = useRouter()
  const [dishes, setDishes] = useState<any[]>([])
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingDish, setEditingDish] = useState<any | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")

  // Champs formulaire
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [category, setCategory] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [isAvailable, setIsAvailable] = useState(true)

  const categories = ["all", ...Array.from(new Set(dishes.map((d) => d.category).filter(Boolean)))]

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login?role=restaurant")
        return
      }

      const { data: restoData } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .single()

      if (!restoData) {
        setIsLoading(false)
        return
      }

      setRestaurantId(restoData.id)
      await loadDishes(restoData.id)
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const loadDishes = async (restoId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from("dishes")
      .select("*")
      .eq("restaurant_id", restoId)
      .order("category")

    if (data) setDishes(data)
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice("")
    setCategory("")
    setImageUrl("")
    setIsAvailable(true)
    setEditingDish(null)
    setShowForm(false)
  }

  const openEdit = (dish: any) => {
    setEditingDish(dish)
    setName(dish.name)
    setDescription(dish.description || "")
    setPrice(dish.price.toString())
    setCategory(dish.category || "")
    setImageUrl(dish.image_url || "")
    setIsAvailable(dish.is_available)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!name || !price || !category || !restaurantId) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      restaurant_id: restaurantId,
      name,
      description: description || null,
      price: parseFloat(price),
      category,
      image_url: imageUrl || null,
      is_available: isAvailable,
    }

    if (editingDish) {
      await supabase.from("dishes").update(payload).eq("id", editingDish.id)
    } else {
      await supabase.from("dishes").insert(payload)
    }

    await loadDishes(restaurantId)
    resetForm()
    setSaving(false)
  }

  const handleDelete = async (dishId: string) => {
    if (!restaurantId) return
    setDeletingId(dishId)
    const supabase = createClient()
    await supabase.from("dishes").delete().eq("id", dishId)
    setDishes((prev) => prev.filter((d) => d.id !== dishId))
    setDeletingId(null)
  }

  const toggleAvailability = async (dish: any) => {
    const supabase = createClient()
    await supabase
      .from("dishes")
      .update({ is_available: !dish.is_available })
      .eq("id", dish.id)
    setDishes((prev) =>
      prev.map((d) => (d.id === dish.id ? { ...d, is_available: !d.is_available } : d))
    )
  }

  const filteredDishes = selectedCategory === "all"
    ? dishes
    : dishes.filter((d) => d.category === selectedCategory)

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-bounce">🍽️</span>
          <Spinner className="w-8 h-8 text-violet-600" />
          <p className="text-muted-foreground">Chargement du menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="px-4 py-4">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold">Menu</h1>
            <p className="text-sm text-muted-foreground">{dishes.length} plat{dishes.length > 1 ? "s" : ""}</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="bg-violet-600 hover:bg-violet-700 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>

        {/* Formulaire ajout/édition */}
        {showForm && (
          <Card className="mb-5 border-2 border-violet-200 bg-violet-50/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">
                  {editingDish ? "Modifier le plat" : "Nouveau plat"}
                </h2>
                <button onClick={resetForm}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <FieldGroup>
                <Field>
                  <FieldLabel>Nom du plat *</FieldLabel>
                  <Input
                    placeholder="Ex: Burger Classic"
                    className="h-12 rounded-xl border-2 focus:border-violet-400"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Field>

                <Field>
                  <FieldLabel>Description</FieldLabel>
                  <Input
                    placeholder="Ingrédients, allergènes..."
                    className="h-12 rounded-xl border-2 focus:border-violet-400"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel>Prix (€) *</FieldLabel>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="9.90"
                      className="h-12 rounded-xl border-2 focus:border-violet-400"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </Field>

                  <Field>
                    <FieldLabel>Catégorie *</FieldLabel>
                    <Input
                      placeholder="Burgers, Pizzas..."
                      className="h-12 rounded-xl border-2 focus:border-violet-400"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel>URL image</FieldLabel>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="https://..."
                      className="pl-10 h-12 rounded-xl border-2 focus:border-violet-400"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>
                </Field>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border-2">
                  <span className="text-sm font-medium">Disponible à la commande</span>
                  <button
                    type="button"
                    onClick={() => setIsAvailable(!isAvailable)}
                    className={`w-12 h-6 rounded-full transition-all ${
                      isAvailable ? "bg-violet-600" : "bg-gray-300"
                    } relative`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      isAvailable ? "left-7" : "left-1"
                    }`} />
                  </button>
                </div>
              </FieldGroup>

              <Button
                className="w-full mt-4 bg-violet-600 hover:bg-violet-700 h-12 rounded-xl"
                onClick={handleSave}
                disabled={saving || !name || !price || !category}
              >
                {saving ? <Spinner className="w-4 h-4 mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                {editingDish ? "Enregistrer les modifications" : "Ajouter le plat"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Filtre catégories */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide -mx-4 px-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-violet-600 text-white shadow-md"
                    : "bg-card border-2 border-border"
                }`}
              >
                {cat === "all" ? "Tout" : cat}
              </button>
            ))}
          </div>
        )}

        {/* Liste plats */}
        {filteredDishes.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-dashed">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Aucun plat dans cette catégorie</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Ajouter" pour créer votre premier plat
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDishes.map((dish) => (
              <Card key={dish.id} className={`border-2 overflow-hidden ${!dish.is_available ? "opacity-60" : ""}`}>
                <CardContent className="p-0">
                  <div className="flex gap-3 p-3">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold truncate">{dish.name}</h3>
                          {dish.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {dish.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-violet-600">
                            {dish.price.toFixed(2)} €
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {dish.category}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Toggle dispo */}
                          <button
                            onClick={() => toggleAvailability(dish)}
                            className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${
                              dish.is_available
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {dish.is_available ? "Dispo" : "Indispo"}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => openEdit(dish)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-violet-100 text-violet-600 transition-all"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(dish.id)}
                            disabled={deletingId === dish.id}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-100 text-red-500 transition-all"
                          >
                            {deletingId === dish.id
                              ? <Spinner className="w-4 h-4" />
                              : <Trash2 className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}