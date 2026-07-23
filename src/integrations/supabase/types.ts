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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json | null
        }
        Relationships: []
      }
      allowance_types: {
        Row: {
          amount: number
          amount_type: string
          code: string | null
          created_at: string
          id: string
          name: string
          status: string
          taxable: boolean
          updated_at: string
        }
        Insert: {
          amount?: number
          amount_type?: string
          code?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          taxable?: boolean
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_type?: string
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          taxable?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      bank_transactions: {
        Row: {
          balance_after_transaction: number
          bank_id: string
          created_at: string
          created_by: string | null
          credit: number
          date: string
          debit: number
          description: string
          id: string
          reference_no: string | null
          remarks: string | null
          status: string
        }
        Insert: {
          balance_after_transaction?: number
          bank_id: string
          created_at?: string
          created_by?: string | null
          credit?: number
          date?: string
          debit?: number
          description: string
          id?: string
          reference_no?: string | null
          remarks?: string | null
          status?: string
        }
        Update: {
          balance_after_transaction?: number
          bank_id?: string
          created_at?: string
          created_by?: string | null
          credit?: number
          date?: string
          debit?: number
          description?: string
          id?: string
          reference_no?: string | null
          remarks?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          account_number: string | null
          account_title: string | null
          branch: string | null
          created_at: string
          current_balance: number
          id: string
          name: string
          opening_balance: number
          opening_effective_date: string | null
          opening_remarks: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_number?: string | null
          account_title?: string | null
          branch?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          name: string
          opening_balance?: number
          opening_effective_date?: string | null
          opening_remarks?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_number?: string | null
          account_title?: string | null
          branch?: string | null
          created_at?: string
          current_balance?: number
          id?: string
          name?: string
          opening_balance?: number
          opening_effective_date?: string | null
          opening_remarks?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      deduction_types: {
        Row: {
          amount: number
          amount_type: string
          code: string | null
          created_at: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          amount_type?: string
          code?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          amount_type?: string
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          bank_account_no: string | null
          bank_id: string | null
          basic_salary: number
          bps: number | null
          cnic: string | null
          created_at: string
          department: string | null
          designation: string | null
          email: string | null
          employee_code: string
          father_name: string | null
          full_name: string
          id: string
          joining_date: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          bank_account_no?: string | null
          bank_id?: string | null
          basic_salary?: number
          bps?: number | null
          cnic?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_code: string
          father_name?: string | null
          full_name: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          bank_account_no?: string | null
          bank_id?: string | null
          basic_salary?: number
          bps?: number | null
          cnic?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_code?: string
          father_name?: string | null
          full_name?: string
          id?: string
          joining_date?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          loan_type: string
          monthly_installment: number
          principal: number
          remaining_balance: number
          remarks: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          loan_type?: string
          monthly_installment?: number
          principal?: number
          remaining_balance?: number
          remarks?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          loan_type?: string
          monthly_installment?: number
          principal?: number
          remaining_balance?: number
          remarks?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          currency: string
          fiscal_year_start: string
          id: string
          logo_url: string | null
          organisation_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          fiscal_year_start?: string
          id?: string
          logo_url?: string | null
          organisation_name?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          currency?: string
          fiscal_year_start?: string
          id?: string
          logo_url?: string | null
          organisation_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_runs: {
        Row: {
          created_at: string
          employees_count: number
          id: string
          period: string
          remarks: string | null
          status: string
          total_allowances: number
          total_deductions: number
          total_gross: number
          total_net: number
          total_tax: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employees_count?: number
          id?: string
          period: string
          remarks?: string | null
          status?: string
          total_allowances?: number
          total_deductions?: number
          total_gross?: number
          total_net?: number
          total_tax?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employees_count?: number
          id?: string
          period?: string
          remarks?: string | null
          status?: string
          total_allowances?: number
          total_deductions?: number
          total_gross?: number
          total_net?: number
          total_tax?: number
          updated_at?: string
        }
        Relationships: []
      }
      pf_contributions: {
        Row: {
          created_at: string
          employee_id: string
          employee_share: number
          employer_share: number
          id: string
          period: string
          remarks: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          employee_share?: number
          employer_share?: number
          id?: string
          period: string
          remarks?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          employee_share?: number
          employer_share?: number
          id?: string
          period?: string
          remarks?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pf_contributions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_slabs: {
        Row: {
          base_tax: number
          created_at: string
          fiscal_year: string
          id: string
          max_income: number | null
          min_income: number
          rate_percent: number
          sort_order: number
        }
        Insert: {
          base_tax?: number
          created_at?: string
          fiscal_year: string
          id?: string
          max_income?: number | null
          min_income: number
          rate_percent?: number
          sort_order?: number
        }
        Update: {
          base_tax?: number
          created_at?: string
          fiscal_year?: string
          id?: string
          max_income?: number | null
          min_income?: number
          rate_percent?: number
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalc_bank_balance: { Args: { p_bank: string }; Returns: undefined }
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
