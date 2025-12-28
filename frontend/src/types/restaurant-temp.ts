export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          category: string
          unit: string
          cost_price: number
          markup_percentage: number
          is_active: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          unit: string
          cost_price: number
          markup_percentage: number
          is_active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          unit?: string
          cost_price?: number
          markup_percentage?: number
          is_active?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          driver_id: string | null
          status:
            | 'pending'
            | 'confirmed'
            | 'priced'
            | 'out_for_delivery'
            | 'delivered'
            | 'received'
            | 'cancelled'
          delivery_address: string
          special_instructions: string | null
          total_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          driver_id?: string | null
          status?:
            | 'pending'
            | 'confirmed'
            | 'priced'
            | 'out_for_delivery'
            | 'delivered'
            | 'received'
            | 'cancelled'
          delivery_address: string
          special_instructions?: string | null
          total_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          driver_id?: string | null
          status?:
            | 'pending'
            | 'confirmed'
            | 'priced'
            | 'out_for_delivery'
            | 'delivered'
            | 'received'
            | 'cancelled'
          delivery_address?: string
          special_instructions?: string | null
          total_amount?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number | null
          total_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price?: number | null
          total_price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number | null
          total_price?: number | null
          created_at?: string
        }
      }
      order_comments: {
        Row: {
          id: string
          order_id: string
          author_id: string
          comment_text: string
          comment_type: 'general' | 'issue' | 'praise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          author_id: string
          comment_text: string
          comment_type?: 'general' | 'issue' | 'praise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          author_id?: string
          comment_text?: string
          comment_type?: 'general' | 'issue' | 'praise'
          created_at?: string
          updated_at?: string
        }
      }
      cart_snapshots: {
        Row: {
          id: string
          restaurant_id: string
          product_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          product_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          product_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
