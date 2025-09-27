export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action_type: string
          admin_user_id: string | null
          created_at: string | null
          id: number
          ip_address: string | null
          new_values: string | null
          notes: string | null
          old_values: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: number
          ip_address?: string | null
          new_values?: string | null
          notes?: string | null
          old_values?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: number
          ip_address?: string | null
          new_values?: string | null
          notes?: string | null
          old_values?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      approval_workflows: {
        Row: {
          admin_notes: string | null
          admin_user_id: string | null
          created_at: string | null
          id: number
          notes: string | null
          priority: string | null
          processed_at: string | null
          status: string | null
          target_id: number
          user_id: string | null
          workflow_type: string
        }
        Insert: {
          admin_notes?: string | null
          admin_user_id?: string | null
          created_at?: string | null
          id?: number
          notes?: string | null
          priority?: string | null
          processed_at?: string | null
          status?: string | null
          target_id: number
          user_id?: string | null
          workflow_type: string
        }
        Update: {
          admin_notes?: string | null
          admin_user_id?: string | null
          created_at?: string | null
          id?: number
          notes?: string | null
          priority?: string | null
          processed_at?: string | null
          status?: string | null
          target_id?: number
          user_id?: string | null
          workflow_type?: string
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          admin_notes: string | null
          approval_notes: string | null
          created_at: string | null
          credit_amount: number
          currency: string | null
          id: number
          mmk_amount: number | null
          new_balance: number | null
          payment_method: string | null
          payment_reference: string | null
          previous_balance: number | null
          processed_at: string | null
          status: string | null
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          approval_notes?: string | null
          created_at?: string | null
          credit_amount: number
          currency?: string | null
          id?: number
          mmk_amount?: number | null
          new_balance?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          previous_balance?: number | null
          processed_at?: string | null
          status?: string | null
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          approval_notes?: string | null
          created_at?: string | null
          credit_amount?: number
          currency?: string | null
          id?: number
          mmk_amount?: number | null
          new_balance?: number | null
          payment_method?: string | null
          payment_reference?: string | null
          previous_balance?: number | null
          processed_at?: string | null
          status?: string | null
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          credits_used: number | null
          currency: string | null
          id: number
          operator: string | null
          phone_number: string | null
          processed_at: string | null
          product_id: number | null
          quantity: number | null
          status: string | null
          total_price: number
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          credits_used?: number | null
          currency?: string | null
          id?: number
          operator?: string | null
          phone_number?: string | null
          processed_at?: string | null
          product_id?: number | null
          quantity?: number | null
          status?: string | null
          total_price: number
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          credits_used?: number | null
          currency?: string | null
          id?: number
          operator?: string | null
          phone_number?: string | null
          processed_at?: string | null
          product_id?: number | null
          quantity?: number | null
          status?: string | null
          total_price?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          credits_requested: number
          id: number
          payment_method: string
          payment_proof_file_id: number | null
          processed_at: string | null
          status: string | null
          total_cost_mmk: number
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          credits_requested: number
          id?: number
          payment_method: string
          payment_proof_file_id?: number | null
          processed_at?: string | null
          status?: string | null
          total_cost_mmk: number
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          credits_requested?: number
          id?: number
          payment_method?: string
          payment_proof_file_id?: number | null
          processed_at?: string | null
          status?: string | null
          total_cost_mmk?: number
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: number
          is_active: boolean | null
          logo: string | null
          name: string
          operator: string
          price: number
          stock_quantity: number | null
          updated_at: string | null
          validity_days: number | null
        }
        Insert: {
          admin_notes?: string | null
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          logo?: string | null
          name: string
          operator: string
          price: number
          stock_quantity?: number | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          logo?: string | null
          name?: string
          operator?: string
          price?: number
          stock_quantity?: number | null
          updated_at?: string | null
          validity_days?: number | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          credit_rate_mmk: number | null
          id: number
          kpay_account_name: string | null
          kpay_account_number: string | null
          support_email: string | null
          support_phone: string | null
          support_telegram: string | null
          updated_at: string | null
          wave_pay_account_name: string | null
          wave_pay_account_number: string | null
        }
        Insert: {
          created_at?: string | null
          credit_rate_mmk?: number | null
          id?: number
          kpay_account_name?: string | null
          kpay_account_number?: string | null
          support_email?: string | null
          support_phone?: string | null
          support_telegram?: string | null
          updated_at?: string | null
          wave_pay_account_name?: string | null
          wave_pay_account_number?: string | null
        }
        Update: {
          created_at?: string | null
          credit_rate_mmk?: number | null
          id?: number
          kpay_account_name?: string | null
          kpay_account_number?: string | null
          support_email?: string | null
          support_phone?: string | null
          support_telegram?: string | null
          updated_at?: string | null
          wave_pay_account_name?: string | null
          wave_pay_account_number?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          credits_balance: number | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          credits_balance?: number | null
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          credits_balance?: number | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
