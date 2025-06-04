export type Database = {
  public: {
    Tables: {
      // ...existing code...
      credit_transactions: {
        Row: {
          id: string
          client_id: string
          amount: number
          description: string | null
          date: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          amount: number
          description?: string | null
          date?: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          amount?: number
          description?: string | null
          date?: string
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
      // ...existing code...
    }
  }
}