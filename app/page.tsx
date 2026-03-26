"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Utensils } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()
  const [isAnimating, setIsAnimating] = useState(true)
  const [showTagline, setShowTagline] = useState(false)

  useEffect(() => {
    // Show tagline after logo appears
    const taglineTimer = setTimeout(() => {
      setShowTagline(true)
    }, 800)

    const timer = setTimeout(() => {
      setIsAnimating(false)
      setTimeout(() => {
        router.push("/role-select")
      }, 500)
    }, 2500)

    return () => {
      clearTimeout(timer)
      clearTimeout(taglineTimer)
    }
  }, [router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary via-primary to-orange-600 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-[#FFD700]/20 animate-pulse" />
        <div className="absolute top-1/4 right-10 w-32 h-32 rounded-full bg-white/10 animate-pulse delay-300" />
        <div className="absolute bottom-1/4 left-1/4 w-24 h-24 rounded-full bg-[#FFD700]/15 animate-pulse delay-500" />
        <div className="absolute bottom-20 right-20 w-16 h-16 rounded-full bg-white/10 animate-pulse delay-700" />
        
        {/* Floating food icons */}
        <div className="absolute top-20 right-1/4 text-4xl animate-bounce delay-100 opacity-30">🍔</div>
        <div className="absolute top-1/3 left-20 text-3xl animate-bounce delay-300 opacity-30">🍕</div>
        <div className="absolute bottom-1/3 right-16 text-4xl animate-bounce delay-500 opacity-30">🍜</div>
        <div className="absolute bottom-20 left-1/4 text-3xl animate-bounce delay-700 opacity-30">🍣</div>
      </div>

      {/* Logo container */}
      <div
        className={`flex flex-col items-center gap-6 z-10 transition-all duration-700 ${
          isAnimating ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Animated logo */}
        <div className="relative">
          <div className="w-36 h-36 rounded-full bg-white flex items-center justify-center shadow-2xl animate-bounce">
            {/* Try to load custom logo, fallback to icon */}
            <Image
              src="/logo-splash.png"
              alt="LivrUP"
              width={100}
              height={100}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <Utensils className="w-16 h-16 text-primary absolute" />
          </div>
          {/* Pulse rings */}
          <div className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" />
          <div className="absolute -inset-4 rounded-full border-2 border-[#FFD700]/30 animate-ping delay-200" />
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white tracking-tight drop-shadow-lg">
            Livr<span className="text-[#FFD700]">UP</span>
          </h1>
          <p 
            className={`text-white/90 mt-3 text-xl font-medium italic transition-all duration-500 ${
              showTagline ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Don&apos;t cook, just click
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex gap-3 mt-8">
          <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 rounded-full bg-[#FFD700] animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 rounded-full bg-white animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </main>
  )
}
