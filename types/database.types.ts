// Generated from Supabase schema - 2025-01-21
// Run `npx supabase gen types typescript` to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_log: {
        Row: {
          id: number
          event_time: string
          table_schema: string
          table_name: string
          record_id: string | null
          operation: string
          actor_id: string | null
          record: Json | null
          old_record: Json | null
        }
        Insert: {
          id?: number
          event_time?: string
          table_schema: string
          table_name: string
          record_id?: string | null
          operation: string
          actor_id?: string | null
          record?: Json | null
          old_record?: Json | null
        }
        Update: {
          id?: number
          event_time?: string
          table_schema?: string
          table_name?: string
          record_id?: string | null
          operation?: string
          actor_id?: string | null
          record?: Json | null
          old_record?: Json | null
        }
      }
      cart_snapshots: {
        Row: {
          id: string
          restaurant_id: string | null
          product_id: string | null
          quantity: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          restaurant_id?: string | null
          product_id?: string | null
          quantity: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          restaurant_id?: string | null
          product_id?: string | null
          quantity?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      demo_sessions: {
        Row: {
          id: string
          session_id: string
          role: Database["public"]["Enums"]["user_role"]
          started_at: string | null
          ended_at: string | null
        }
        Insert: {
          id?: string
          session_id: string
          role: Database["public"]["Enums"]["user_role"]
          started_at?: string | null
          ended_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          started_at?: string | null
          ended_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          title_ka: string | null
          message: string
          message_ka: string | null
          type: Database["public"]["Enums"]["notification_type"] | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          title_ka?: string | null
          message: string
          message_ka?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          title_ka?: string | null
          message?: string
          message_ka?: string | null
          type?: Database["public"]["Enums"]["notification_type"] | null
          is_read?: boolean | null
          created_at?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          restaurantId: string | null
          restaurantName: string | null
          driverId: string | null
          status: string | null
          items: Json | null
          notes: string | null
          totalCost: number | null
          totalProfit: number | null
          createdAt: string | null
        }
        Insert: {
          id?: string
          restaurantId?: string | null
          restaurantName?: string | null
          driverId?: string | null
          status?: string | null
          items?: Json | null
          notes?: string | null
          totalCost?: number | null
          totalProfit?: number | null
          createdAt?: string | null
        }
        Update: {
          id?: string
          restaurantId?: string | null
          restaurantName?: string | null
          driverId?: string | null
          status?: string | null
          items?: Json | null
          notes?: string | null
          totalCost?: number | null
          totalProfit?: number | null
          createdAt?: string | null
        }
      }
      price_history: {
        Row: {
          id: string
          store_product_id: string
          price: number
          recorded_at: string | null
        }
        Insert: {
          id?: string
          store_product_id: string
          price: number
          recorded_at?: string | null
        }
        Update: {
          id?: string
          store_product_id?: string
          price?: number
          recorded_at?: string | null
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          unit: string
          image: string | null
          price: number | null
          isActive: boolean | null
          isPromo: boolean | null
          viewCount: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          category: string
          unit: string
          image?: string | null
          price?: number | null
          isActive?: boolean | null
          isPromo?: boolean | null
          viewCount?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          category?: string
          unit?: string
          image?: string | null
          price?: number | null
          isActive?: boolean | null
          isPromo?: boolean | null
          viewCount?: number | null
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["user_role"]
          full_name: string | null
          restaurant_name: string | null
          phone: string | null
          address: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          full_name?: string | null
          restaurant_name?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          full_name?: string | null
          restaurant_name?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      store_products: {
        Row: {
          id: string
          product_id: string
          store_id: string
          url: string
          current_price: number | null
          currency: string | null
          in_stock: boolean | null
          last_scraped_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          store_id: string
          url: string
          current_price?: number | null
          currency?: string | null
          in_stock?: boolean | null
          last_scraped_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          store_id?: string
          url?: string
          current_price?: number | null
          currency?: string | null
          in_stock?: boolean | null
          last_scraped_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          base_url: string
          logo_url: string | null
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          base_url: string
          logo_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          base_url?: string
          logo_url?: string | null
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      units: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
      }
      user_price_alerts: {
        Row: {
          id: string
          user_id: string
          product_id: string
          target_price: number
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          target_price: number
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          target_price?: number
          is_active?: boolean | null
          created_at?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: string | null
          avatar: string | null
          phone: string | null
          locationLink: string | null
          isActive: boolean | null
          created_at: string | null
          address: string | null
          working_hours: string | null
          preferred_delivery_time: string | null
          default_driver_note: string | null
          payment_method: string | null
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          role?: string | null
          avatar?: string | null
          phone?: string | null
          locationLink?: string | null
          isActive?: boolean | null
          created_at?: string | null
          address?: string | null
          working_hours?: string | null
          preferred_delivery_time?: string | null
          default_driver_note?: string | null
          payment_method?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: string | null
          avatar?: string | null
          phone?: string | null
          locationLink?: string | null
          isActive?: boolean | null
          created_at?: string | null
          address?: string | null
          working_hours?: string | null
          preferred_delivery_time?: string | null
          default_driver_note?: string | null
          payment_method?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_get_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      auth_is_driver: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      auth_is_restaurant: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      notification_type: "info" | "success" | "warning" | "error"
      order_status:
        | "pending"
        | "confirmed"
        | "priced"
        | "assigned"
        | "out_for_delivery"
        | "delivered"
        | "completed"
        | "cancelled"
      user_role: "admin" | "restaurant" | "driver" | "demo"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for Supabase client
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type Insertable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type Updatable<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T]
