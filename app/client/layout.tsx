"use client"

import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { Home, Search, ShoppingBag, ClipboardList, User, Bell, Utensils } from "lucide-react"
import { useCartStore } from "@/lib/cart-store"
import { Button } from "@/components/ui/button"

const navItems = [
  { icon: Home, label: "Accueil", href: "/client" },
  { icon: Search, label: "Recherche", href: "/client/search" },
  { icon: ShoppingBag, label: "Panier", href: "/client/cart" },
  { icon: ClipboardList, label: "Commandes", href: "/client/orders" },
  { icon: User, label: "Profil", href: "/client/profile" },
]

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const itemCount = useCartStore((state) => state.itemCount())

  // Don't show top bar on restaurant detail page
  const showTopBar = !pathname.includes("/restaurant/")

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top navigation bar */}
      {showTopBar && (
        <header className="sticky top-0 z-50 bg-primary px-4 py-3 flex items-center justify-between shadow-md">
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => router.push("/client")}
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
              <Utensils className="w-5 h-5 text-primary absolute" />
            </div>
            <span className="text-xl font-bold text-white">
              Livr<span className="text-[#FFD700]">UP</span>
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 relative"
            onClick={() => router.push("/client/notifications")}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#FFD700] rounded-full" />
          </Button>
        </header>
      )}

      {children}

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-2 safe-area-inset-bottom z-50">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isCart = item.href === "/client/cart"
            
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                <span className="text-xs font-medium">{item.label}</span>
                
                {isCart && itemCount > 0 && (
                  <span className="absolute -top-1 right-0 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
