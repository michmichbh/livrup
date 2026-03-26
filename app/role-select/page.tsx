"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { ShoppingBag, Bike, Utensils as UtensilsIcon, ArrowRight, Utensils } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const roles = [
  {
    id: "client",
    title: "Client",
    subtitle: "J'ai faim !",
    description: "Commandez vos repas favoris et suivez votre livraison en temps réel",
    icon: ShoppingBag,
    emoji: "🍔",
    gradient: "from-primary to-orange-500",
    href: "/auth/login?role=client",
  },
  {
    id: "driver",
    title: "Livreur",
    subtitle: "Je livre !",
    description: "Gagnez de l'argent en livrant des repas dans votre ville",
    icon: Bike,
    emoji: "🛵",
    gradient: "from-emerald-500 to-teal-500",
    href: "/auth/login?role=driver",
  },
  {
    id: "restaurant",
    title: "Restaurant",
    subtitle: "Je gère mon resto !",
    description: "Gérez votre menu, vos commandes et développez votre activité",
    icon: UtensilsIcon,
    emoji: "🍽️",
    gradient: "from-primary to-purple-600",
    href: "/auth/login?role=restaurant",
  },
]

export default function RoleSelectPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/30 flex flex-col">
      {/* Header */}
      <header className="py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Image
              src="/logo-auth.png"
              alt="LivrUP"
              width={32}
              height={32}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <Utensils className="w-6 h-6 text-white absolute" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Livr</span>
            <span className="text-[#FFD700]">UP</span>
          </h1>
        </div>
        <h2 className="text-2xl font-bold text-foreground mt-6">
          Qui es-tu aujourd&apos;hui ?
        </h2>
        <p className="text-muted-foreground mt-2">Choisis ton aventure culinaire</p>
      </header>

      {/* Role cards */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md space-y-4">
          {roles.map((role, index) => (
            <Card
              key={role.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/50 overflow-hidden group"
              onClick={() => router.push(role.href)}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-3xl">{role.emoji}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{role.title}</CardTitle>
                      <span className="text-sm font-medium text-muted-foreground">
                        {role.subtitle}
                      </span>
                    </div>
                    <CardDescription className="text-sm mt-1">
                      {role.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`h-1 bg-gradient-to-r ${role.gradient} rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground px-4">
        <p>
          En continuant, vous acceptez nos{" "}
          <span className="text-primary underline cursor-pointer">conditions d&apos;utilisation</span>
        </p>
        <p className="mt-2 text-xs">
          Made with ❤️ by LivrUP Team
        </p>
      </footer>
    </main>
  )
}