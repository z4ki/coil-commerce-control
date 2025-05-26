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
      clients: {
        Row: {
          id: string
          name: string
          company: string
          email: string
          phone: string
          address: string
          nif: string | null
          nis: string | null
          rc: string | null
          ai: string | null
          rib: string | null
          notes: string | null
          credit_balance: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          company: string
          email: string
          phone: string
          address: string
          nif?: string | null
          nis?: string | null
          rc?: string | null
          ai?: string | null
          rib?: string | null
          notes?: string | null
          credit_balance?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          company?: string
          email?: string
          phone?: string
          address?: string
          nif?: string | null
          nis?: string | null
          rc?: string | null
          ai?: string | null
          rib?: string | null
          notes?: string | null
          credit_balance?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_sales: {
        Row: {
          invoice_id: string
          sale_id: string
        }
        Insert: {
          invoice_id: string
          sale_id: string
        }
        Update: {
          invoice_id?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_sales_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_sales_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          date: string
          due_date: string
          id: string
          invoice_number: string
          is_paid: boolean
          paid_at: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          due_date: string
          id?: string
          invoice_number: string
          is_paid?: boolean
          paid_at?: string | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          due_date?: string
          id?: string
          invoice_number?: string
          is_paid?: boolean
          paid_at?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          sale_id: string
          client_id: string
          bulk_payment_id: string | null
          date: string
          amount: number
          method: string
          notes: string | null
          generates_credit: boolean
          credit_amount: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          sale_id: string
          client_id: string
          bulk_payment_id?: string | null
          date: string
          amount: number
          method: string
          notes?: string | null
          generates_credit?: boolean
          credit_amount?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          sale_id?: string
          client_id?: string
          bulk_payment_id?: string | null
          date?: string
          amount?: number
          method?: string
          notes?: string | null
          generates_credit?: boolean
          credit_amount?: number
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_bulk_payment_id_fkey"
            columns: ["bulk_payment_id"]
            isOneToOne: false
            referencedRelation: "bulk_payments"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          back_coat_ral: string | null
          coil_ref: string | null
          coil_thickness: number | null
          coil_weight: number | null
          coil_width: number | null
          description: string
          id: string
          price_per_ton: number
          quantity: number
          sale_id: string
          top_coat_ral: string | null
          total_amount: number
        }
        Insert: {
          back_coat_ral?: string | null
          coil_ref?: string | null
          coil_thickness?: number | null
          coil_weight?: number | null
          coil_width?: number | null
          description: string
          id?: string
          price_per_ton: number
          quantity: number
          sale_id: string
          top_coat_ral?: string | null
          total_amount: number
        }
        Update: {
          back_coat_ral?: string | null
          coil_ref?: string | null
          coil_thickness?: number | null
          coil_weight?: number | null
          coil_width?: number | null
          description?: string
          id?: string
          price_per_ton?: number
          quantity?: number
          sale_id?: string
          top_coat_ral?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string
          created_at: string
          date: string
          id: string
          invoice_id: string | null
          is_invoiced: boolean
          notes: string | null
          tax_rate: number
          total_amount: number
          transportation_fee: number | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          id?: string
          invoice_id?: string | null
          is_invoiced?: boolean
          notes?: string | null
          tax_rate: number
          total_amount: number
          transportation_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          invoice_id?: string | null
          is_invoiced?: boolean
          notes?: string | null
          tax_rate?: number
          total_amount?: number
          transportation_fee?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_sales_invoice"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          ai: string | null
          company_address: string
          company_email: string
          company_logo: string | null
          company_name: string
          company_phone: string
          currency: string
          id: string
          nif: string | null
          nis: string | null
          rc: string | null
          rib: string | null
          tax_rate: number
        }
        Insert: {
          ai?: string | null
          company_address: string
          company_email: string
          company_logo?: string | null
          company_name: string
          company_phone: string
          currency: string
          id?: string
          nif?: string | null
          nis?: string | null
          rc?: string | null
          rib?: string | null
          tax_rate: number
        }
        Update: {
          ai?: string | null
          company_address?: string
          company_email?: string
          company_logo?: string | null
          company_name?: string
          company_phone?: string
          currency?: string
          id?: string
          nif?: string | null
          nis?: string | null
          rc?: string | null
          rib?: string | null
          tax_rate?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          id: string
          client_id: string
          amount: number
          type: 'credit' | 'debit'
          source_type: 'payment' | 'refund' | 'manual_adjustment' | 'credit_use'
          source_id: string | null
          notes: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          amount: number
          type: 'credit' | 'debit'
          source_type: 'payment' | 'refund' | 'manual_adjustment' | 'credit_use'
          source_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          amount?: number
          type?: 'credit' | 'debit'
          source_type?: 'payment' | 'refund' | 'manual_adjustment' | 'credit_use'
          source_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_payment_with_credit: {
        Args: {
          payment_id: string
        }
        Returns: void
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
