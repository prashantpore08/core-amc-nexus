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
      admins: {
        Row: {
          contact_number: string | null
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          contact_number?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          contact_number?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_admins: {
        Row: {
          admin_id: string
          client_id: string
          id: string
        }
        Insert: {
          admin_id: string
          client_id: string
          id?: string
        }
        Update: {
          admin_id?: string
          client_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_admins_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_admins_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          amc_end_date: string | null
          amc_start_date: string | null
          client_name: string | null
          client_poc_contact_number: string | null
          client_poc_name: string | null
          contact: string | null
          cost_for_year: number | null
          created_at: string
          domain: string | null
          email: string | null
          id: string
          logo_url: string | null
          payment_term: Database["public"]["Enums"]["payment_term"] | null
          poc_email: string | null
          project_name: string | null
          project_slug: string
          project_url: string | null
          ting_poc_primary: string | null
          ting_poc_secondary: string | null
          updated_at: string
        }
        Insert: {
          amc_end_date?: string | null
          amc_start_date?: string | null
          client_name?: string | null
          client_poc_contact_number?: string | null
          client_poc_name?: string | null
          contact?: string | null
          cost_for_year?: number | null
          created_at?: string
          domain?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          payment_term?: Database["public"]["Enums"]["payment_term"] | null
          poc_email?: string | null
          project_name?: string | null
          project_slug: string
          project_url?: string | null
          ting_poc_primary?: string | null
          ting_poc_secondary?: string | null
          updated_at?: string
        }
        Update: {
          amc_end_date?: string | null
          amc_start_date?: string | null
          client_name?: string | null
          client_poc_contact_number?: string | null
          client_poc_name?: string | null
          contact?: string | null
          cost_for_year?: number | null
          created_at?: string
          domain?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          payment_term?: Database["public"]["Enums"]["payment_term"] | null
          poc_email?: string | null
          project_name?: string | null
          project_slug?: string
          project_url?: string | null
          ting_poc_primary?: string | null
          ting_poc_secondary?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_ting_poc_primary_fkey"
            columns: ["ting_poc_primary"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_ting_poc_secondary_fkey"
            columns: ["ting_poc_secondary"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
        ]
      }
      hour_requests: {
        Row: {
          client_id: string
          created_at: string
          id: string
          requested_hours: number
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          requested_hours: number
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          requested_hours?: number
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hour_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paid: number
          amount_remaining: number
          client_id: string
          created_at: string
          id: string
          payment_date: string
          payment_term: Database["public"]["Enums"]["payment_term"]
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          amount_remaining?: number
          client_id: string
          created_at?: string
          id?: string
          payment_date: string
          payment_term: Database["public"]["Enums"]["payment_term"]
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          amount_remaining?: number
          client_id?: string
          created_at?: string
          id?: string
          payment_date?: string
          payment_term?: Database["public"]["Enums"]["payment_term"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          contact: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      work_logs: {
        Row: {
          client_id: string
          created_at: string
          date: string
          end_date: string | null
          hours_consumed: number
          id: string
          start_date: string | null
          status: Database["public"]["Enums"]["work_status"] | null
          updated_at: string
          work_description: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date: string
          end_date?: string | null
          hours_consumed: number
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"] | null
          updated_at?: string
          work_description: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          end_date?: string | null
          hours_consumed?: number
          id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["work_status"] | null
          updated_at?: string
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      payment_term: "Monthly" | "Quarterly" | "Half-Yearly" | "Yearly"
      request_status: "pending" | "approved" | "rejected"
      user_role: "superadmin" | "admin" | "client"
      work_status: "pending" | "in_progress" | "completed"
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
    Enums: {
      payment_term: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"],
      request_status: ["pending", "approved", "rejected"],
      user_role: ["superadmin", "admin", "client"],
      work_status: ["pending", "in_progress", "completed"],
    },
  },
} as const
