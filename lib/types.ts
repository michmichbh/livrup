export type UserRole = 'client' | 'driver' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Restaurant {
  id: string
  name: string
  description: string | null
  image_url: string | null
  address: string
  category: string
  rating: number
  delivery_time: string
  delivery_fee: number
  is_open: boolean
  owner_id: string | null
  created_at: string
}

export interface MenuItem {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  is_available: boolean
  created_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'

export interface Order {
  id: string
  user_id: string
  restaurant_id: string
  driver_id: string | null
  status: OrderStatus
  total_amount: number
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
  notes: string | null
  created_at: string
  updated_at: string
  restaurant?: Restaurant
  profile?: Profile
  driver?: Profile
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  menu_item?: MenuItem
}

export interface DriverEarning {
  id: string
  driver_id: string
  order_id: string
  amount: number
  created_at: string
  order?: Order
}

export interface CartItem extends MenuItem {
  quantity: number
}
