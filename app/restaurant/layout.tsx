"use client"

import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Home, ShoppingBag, UtensilsCrossed, User, Bell, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { icon: Home, label: "Dashboard", href: "/restaurant" },
  { icon: ShoppingBag, label: "Commandes", href: "/restaurant/orders" },
  { icon: UtensilsCrossed, label: "Menu", href: "/restaurant/menu" },
  { icon: User, label: "Profil", href: "/restaurant/profile" },
]

export default function RestaurantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-violet-600 px-4 py-3 flex items-center justify-between shadow-md">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push("/restaurant")}
        >
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
            <Image
              src="/logo-nav.png"
              alt="LivrUP"
              width={28}
              height={28}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <Utensils className="w-5 h-5 text-violet-600 absolute" />
          </div>
          <div>
            <span className="text-xl font-bold text-white">
              Livr<span className="text-[#FFD700]">UP</span>
            </span>
            <span className="text-xs text-white/80 ml-2">Restaurant</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFD700] rounded-full" />
        </Button>
      </header>

      {children}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? "text-violet-600 bg-violet-50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}