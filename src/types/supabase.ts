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
          payment_method: 'cash' | 'bank_transfer' | 'check' | 'term';
          product_type: string;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          date?: string;
          total_amount?: number;
          payment_method?: 'cash' | 'bank_transfer' | 'check' | 'term';
          product_type?: string;
          created_at?: string;
          updated_at?: string | null;
        };
      };
      payments: {
        Row: {
          id: string;
          sale_id: string;
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
          sale_id: string;
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
          sale_id?: string;
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
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
} 