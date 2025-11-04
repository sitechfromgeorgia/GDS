// Database type definitions for the Georgian Distribution System
// Auto-generated from Supabase schema with custom enhancements

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Core user types
export type UserRole = 'admin' | 'restaurant' | 'driver' | 'demo'
export type OrderStatus = 'pending' | 'confirmed' | 'priced' | 'assigned' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled'
export type NotificationType = 'info' | 'success' | 'warning' | 'error'
export type DeliveryStatus = 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed' | 'cancelled'

export type Database = {
  // Allows to automatically instantiate createClient with right options
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      deliveries: {
        Row: {
          created_at: string
          delivery_time: string | null
          driver_id: string
          id: string
          notes: string | null
          order_id: string
          pickup_time: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_time?: string | null
          driver_id: string
          id?: string
          notes?: string | null
          order_id: string
          pickup_time?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_time?: string | null
          driver_id?: string
          id?: string
          notes?: string | null
          order_id?: string
          pickup_time?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_ka: string | null
          title: string
          title_ka: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_ka?: string | null
          title: string
          title_ka?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_ka?: string | null
          title?: string
          title_ka?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          order_id: string
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id: string
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_audit_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_audit_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
          order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
          order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          delivery_address: string
          delivery_notes: string | null
          driver_id: string | null
          id: string
          restaurant_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_address: string
          delivery_notes?: string | null
          driver_id?: string | null
          id?: string
          restaurant_id: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_address?: string
          delivery_notes?: string | null
          driver_id?: string | null
          id?: string
          restaurant_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_audit_log: {
        Row: {
          created_at: string
          id: string
          operation: string
          passed: boolean
          reason: string | null
          row_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          operation: string
          passed: boolean
          reason?: string | null
          row_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          operation?: string
          passed?: boolean
          reason?: string | null
          row_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policy_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          description_ka: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          name_ka: string | null
          price: number
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          description_ka?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          name_ka?: string | null
          price: number
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          description_ka?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          name_ka?: string | null
          price?: number
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      is_driver: { Args: never; Returns: boolean }
      is_restaurant: { Args: never; Returns: boolean }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

// Type helper for table rows
export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

// Type helper for inserts
export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

// Type helper for updates
export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

// Type helper for enums
export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

// Convenient aliases for common operations
export type Inserts<T extends keyof Database["public"]["Tables"]> = TablesInsert<T>
export type Updates<T extends keyof Database["public"]["Tables"]> = TablesUpdate<T>

// Specific table types for easier usage
export type Profile = Tables<"profiles">
export type Product = Tables<"products">
export type Order = Tables<"orders">
export type OrderItem = Tables<"order_items">
export type Notification = Tables<"notifications">
export type DemoSession = Tables<"demo_sessions">
export type OrderStatusHistory = Tables<"order_status_history">
export type OrderAuditLog = Tables<"order_audit_logs">
export type Delivery = Tables<"deliveries">

// Insert types
export type ProfileInsert = Inserts<"profiles">
export type ProductInsert = Inserts<"products">
export type OrderInsert = Inserts<"orders">
export type OrderItemInsert = Inserts<"order_items">
export type NotificationInsert = Inserts<"notifications">
export type DemoSessionInsert = Inserts<"demo_sessions">
export type OrderStatusHistoryInsert = Inserts<"order_status_history">
export type OrderAuditLogInsert = Inserts<"order_audit_logs">
export type DeliveryInsert = Inserts<"deliveries">

// Update types
export type ProfileUpdate = Updates<"profiles">
export type ProductUpdate = Updates<"products">
export type OrderUpdate = Updates<"orders">
export type OrderItemUpdate = Updates<"order_items">
export type NotificationUpdate = Updates<"notifications">
export type DemoSessionUpdate = Updates<"demo_sessions">
export type OrderStatusHistoryUpdate = Updates<"order_status_history">
export type OrderAuditLogUpdate = Updates<"order_audit_logs">
export type DeliveryUpdate = Updates<"deliveries">

// Extended types for complex queries
export interface OrderWithRelations extends Order {
  profiles?: {
    full_name: string
    restaurant_name?: string
  } | null
  deliveries?: Delivery[]
  order_items?: OrderItem[]
}

export interface ProductWithOrderItems extends Product {
  order_items?: OrderItem[]
}

// Constants for enums
export const Constants = {
  public: {
    Enums: {
      notification_type: ["info", "success", "warning", "error"],
      order_status: [
        "pending",
        "confirmed",
        "priced",
        "assigned",
        "out_for_delivery",
        "delivered",
        "completed",
        "cancelled",
      ],
      user_role: ["admin", "restaurant", "driver", "demo"],
    },
  },
} as const
