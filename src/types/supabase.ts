export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          company: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          nif: string | null;
          nis: string | null;
          rc: string | null;
          ai: string | null;
          rib: string | null;
          notes: string | null;
          credit_balance: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          company?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          nif?: string | null;
          nis?: string | null;
          rc?: string | null;
          ai?: string | null;
          rib?: string | null;
          notes?: string | null;
          credit_balance?: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          company?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          nif?: string | null;
          nis?: string | null;
          rc?: string | null;
          ai?: string | null;
          rib?: string | null;
          notes?: string | null;
          credit_balance?: number;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      sales: {
        Row: {
          id: string;
          client_id: string;
          date: string;
          total_amount: number;
          tax_rate: number;
          transportation_fee: number | null;
          is_invoiced: boolean;
          invoice_id: string | null;
          notes: string | null;
          payment_method: 'cash' | 'bank_transfer' | 'check' | 'term';
          product_type: string;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          date: string;
          total_amount: number;
          tax_rate?: number;
          transportation_fee?: number | null;
          is_invoiced?: boolean;
          invoice_id?: string | null;
          notes?: string | null;
          payment_method?: 'cash' | 'bank_transfer' | 'check' | 'term';
          product_type: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          date?: string;
          total_amount?: number;
          tax_rate?: number;
          transportation_fee?: number | null;
          is_invoiced?: boolean;
          invoice_id?: string | null;
          notes?: string | null;
          payment_method?: 'cash' | 'bank_transfer' | 'check' | 'term';
          product_type?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      sale_items: {
        Row: {
          id: string;
          sale_id: string;
          description: string;
          product_type: string;
          coil_ref: string | null;
          coil_thickness: number | null;
          coil_width: number | null;
          top_coat_ral: string | null;
          back_coat_ral: string | null;
          coil_weight: number | null;
          input_width: number | null;
          output_width: number | null;
          thickness: number | null;
          weight: number | null;
          strips_count: number | null;
          quantity: number;
          price_per_ton: number;
          total_amount: number;
          weight_in_tons: number;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          sale_id: string;
          description: string;
          product_type: string;
          coil_ref?: string | null;
          coil_thickness?: number | null;
          coil_width?: number | null;
          top_coat_ral?: string | null;
          back_coat_ral?: string | null;
          coil_weight?: number | null;
          input_width?: number | null;
          output_width?: number | null;
          thickness?: number | null;
          weight?: number | null;
          strips_count?: number | null;
          quantity: number;
          price_per_ton: number;
          total_amount: number;
          weight_in_tons: number;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          sale_id?: string;
          description?: string;
          product_type?: string;
          coil_ref?: string | null;
          coil_thickness?: number | null;
          coil_width?: number | null;
          top_coat_ral?: string | null;
          back_coat_ral?: string | null;
          coil_weight?: number | null;
          input_width?: number | null;
          output_width?: number | null;
          thickness?: number | null;
          weight?: number | null;
          strips_count?: number | null;
          quantity?: number;
          price_per_ton?: number;
          total_amount?: number;
          weight_in_tons?: number;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          sale_id: string | null;
          client_id: string;
          bulk_payment_id: string | null;
          date: string;
          amount: number;
          method: 'cash' | 'bank_transfer' | 'check' | 'term';
          notes: string | null;
          created_at: string;
          updated_at: string | null;
          generates_credit: boolean;
        };
        Insert: {
          id?: string;
          sale_id?: string | null;
          client_id: string;
          bulk_payment_id?: string | null;
          date: string;
          amount: number;
          method: 'cash' | 'bank_transfer' | 'check' | 'term';
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
          generates_credit?: boolean;
        };
        Update: {
          id?: string;
          sale_id?: string | null;
          client_id?: string;
          bulk_payment_id?: string | null;
          date?: string;
          amount?: number;
          method?: 'cash' | 'bank_transfer' | 'check' | 'term';
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
          generates_credit?: boolean;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          client_id: string;
          amount: number;
          type: 'credit' | 'debit';
          source_type: 'payment' | 'refund' | 'manual_adjustment' | 'credit_use';
          source_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          amount: number;
          type: 'credit' | 'debit';
          source_type: 'payment' | 'refund' | 'manual_adjustment' | 'credit_use';
          source_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          amount?: number;
          type?: 'credit' | 'debit';
          source_type?: 'payment' | 'refund' | 'manual_adjustment' | 'credit_use';
          source_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      invoices: {
        Row: {
          id: string;
          client_id: string;
          date: string;
          due_date: string | null;
          invoice_number: string;
          total_amount: number;
          tax_rate: number;
          transportation_fee: number | null;
          notes: string | null;
          is_paid: boolean;
          paid_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          date: string;
          due_date?: string | null;
          invoice_number: string;
          total_amount: number;
          tax_rate?: number;
          transportation_fee?: number | null;
          notes?: string | null;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          date?: string;
          due_date?: string | null;
          invoice_number?: string;
          total_amount?: number;
          tax_rate?: number;
          transportation_fee?: number | null;
          notes?: string | null;
          is_paid?: boolean;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      bulk_payments: {
        Row: {
          id: string;
          client_id: string;
          total_amount: number;
          date: string;
          method: 'cash' | 'bank_transfer' | 'check' | 'term';
          notes: string | null;
          distribution: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          total_amount: number;
          date: string;
          method: 'cash' | 'bank_transfer' | 'check' | 'term';
          notes?: string | null;
          distribution?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          total_amount?: number;
          date?: string;
          method: 'cash' | 'bank_transfer' | 'check' | 'term';
          notes?: string | null;
          distribution?: Json | null;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          company_address: string;
          company_phone: string;
          company_email: string;
          company_nif: string | null;
          company_nis: string | null;
          company_rc: string | null;
          company_ai: string | null;
          company_rib: string | null;
          company_logo: string | null;
          language: 'en' | 'fr';
          theme: 'light' | 'dark';
          currency: string;
          notifications: boolean;
          dark_mode: boolean;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          company_address: string;
          company_phone: string;
          company_email: string;
          company_nif?: string | null;
          company_nis?: string | null;
          company_rc?: string | null;
          company_ai?: string | null;
          company_rib?: string | null;
          company_logo?: string | null;
          language?: 'en' | 'fr';
          theme?: 'light' | 'dark';
          currency?: string;
          notifications?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          company_address?: string;
          company_phone?: string;
          company_email?: string;
          company_nif?: string | null;
          company_nis?: string | null;
          company_rc?: string | null;
          company_ai?: string | null;
          company_rib?: string | null;
          company_logo?: string | null;
          language?: 'en' | 'fr';
          theme?: 'light' | 'dark';
          currency?: string;
          notifications?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string | null;
        };
      };
    };
  };
}