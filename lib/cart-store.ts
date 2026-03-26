"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, MenuItem, Restaurant } from './types'

interface CartState {
  items: CartItem[]
  restaurant: Restaurant | null
  addItem: (item: MenuItem, restaurant: Restaurant) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurant: null,
      
      addItem: (item: MenuItem, restaurant: Restaurant) => {
        const { items, restaurant: currentRestaurant } = get()
        
        // If adding from a different restaurant, clear cart first
        if (currentRestaurant && currentRestaurant.id !== restaurant.id) {
          set({ items: [], restaurant: null })
        }
        
        const existingItem = items.find(i => i.id === item.id)
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
            restaurant,
          })
        } else {
          set({
            items: [...items, { ...item, quantity: 1 }],
            restaurant,
          })
        }
      },
      
      removeItem: (itemId: string) => {
        const { items } = get()
        const newItems = items.filter(i => i.id !== itemId)
        set({
          items: newItems,
          restaurant: newItems.length === 0 ? null : get().restaurant,
        })
      },
      
      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        
        set({
          items: get().items.map(i =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        })
      },
      
      clearCart: () => {
        set({ items: [], restaurant: null })
      },
      
      total: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },
      
      itemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: 'foodfast-cart',
    }
  )
)
