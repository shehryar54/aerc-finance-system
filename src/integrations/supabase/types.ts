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
      account_heads: {
        Row: {
          bank_id: string | null
          code: string | null
          created_at: string
          id: string
          name: string
          status: string
          type: Database["public"]["Enums"]["account_head_type"]
          updated_at: string
        }
        Insert: {
          bank_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name: string
          status?: string
          type: Database["public"]["Enums"]["account_head_type"]
          updated_at?: string
        }
        Update: {
          bank_id?: string | null
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          status?: string
          type?: Database["public"]["Enums"]["account_head_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_heads_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
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
      payment_vouchers: {
        Row: {
          amount: number
          bank_tx_id: string | null
          created_at: string
          created_by: string | null
          credit_head_id: string
          debit_head_id: string
          description: string | null
          director_approved_at: string | null
          director_approved_by: string | null
          id: string
          paid_at: string | null
          paid_by: string | null
          payment_method: string
          purpose: string
          reference_no: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          remarks: string | null
          requires_vc: boolean
          status: Database["public"]["Enums"]["voucher_status"]
          updated_at: string
          vc_approved_at: string | null
          vc_approved_by: string | null
          vendor_id: string | null
          voucher_date: string
          voucher_no: string
        }
        Insert: {
          amount: number
          bank_tx_id?: string | null
          created_at?: string
          created_by?: string | null
          credit_head_id: string
          debit_head_id: string
          description?: string | null
          director_approved_at?: string | null
          director_approved_by?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string
          purpose: string
          reference_no?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          remarks?: string | null
          requires_vc?: boolean
          status?: Database["public"]["Enums"]["voucher_status"]
          updated_at?: string
          vc_approved_at?: string | null
          vc_approved_by?: string | null
          vendor_id?: string | null
          voucher_date?: string
          voucher_no: string
        }
        Update: {
          amount?: number
          bank_tx_id?: string | null
          created_at?: string
          created_by?: string | null
          credit_head_id?: string
          debit_head_id?: string
          description?: string | null
          director_approved_at?: string | null
          director_approved_by?: string | null
          id?: string
          paid_at?: string | null
          paid_by?: string | null
          payment_method?: string
          purpose?: string
          reference_no?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          remarks?: string | null
          requires_vc?: boolean
          status?: Database["public"]["Enums"]["voucher_status"]
          updated_at?: string
          vc_approved_at?: string | null
          vc_approved_by?: string | null
          vendor_id?: string | null
          voucher_date?: string
          voucher_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_vouchers_bank_tx_id_fkey"
            columns: ["bank_tx_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_vouchers_credit_head_id_fkey"
            columns: ["credit_head_id"]
            isOneToOne: false
            referencedRelation: "account_heads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_vouchers_debit_head_id_fkey"
            columns: ["debit_head_id"]
            isOneToOne: false
            referencedRelation: "account_heads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_vouchers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      salary_formulas: {
        Row: {
          description: string | null
          expression: string
          id: string
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          description?: string | null
          expression: string
          id?: string
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          description?: string | null
          expression?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      salary_records: {
        Row: {
          allowances: Json
          bank_account_no: string | null
          bank_id: string | null
          basic_pay: number
          created_at: string
          deductions: Json
          employee_id: string
          gross_pay: number
          id: string
          leave_deduction: number
          leaves: Json
          manual_deductions: Json
          net_pay: number
          paid_at: string | null
          period_month: number
          period_year: number
          remarks: string | null
          status: string
          total_deductions: number
          updated_at: string
          working_days: number
        }
        Insert: {
          allowances?: Json
          bank_account_no?: string | null
          bank_id?: string | null
          basic_pay?: number
          created_at?: string
          deductions?: Json
          employee_id: string
          gross_pay?: number
          id?: string
          leave_deduction?: number
          leaves?: Json
          manual_deductions?: Json
          net_pay?: number
          paid_at?: string | null
          period_month: number
          period_year: number
          remarks?: string | null
          status?: string
          total_deductions?: number
          updated_at?: string
          working_days?: number
        }
        Update: {
          allowances?: Json
          bank_account_no?: string | null
          bank_id?: string | null
          basic_pay?: number
          created_at?: string
          deductions?: Json
          employee_id?: string
          gross_pay?: number
          id?: string
          leave_deduction?: number
          leaves?: Json
          manual_deductions?: Json
          net_pay?: number
          paid_at?: string | null
          period_month?: number
          period_year?: number
          remarks?: string | null
          status?: string
          total_deductions?: number
          updated_at?: string
          working_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_records_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_records_employee_id_fkey"
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
      vendors: {
        Row: {
          account_title: string | null
          address: string | null
          bank_account_no: string | null
          bank_name: string | null
          contact_number: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          ntn: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_title?: string | null
          address?: string | null
          bank_account_no?: string | null
          bank_name?: string | null
          contact_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          ntn?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          account_title?: string | null
          address?: string | null
          bank_account_no?: string | null
          bank_name?: string | null
          contact_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          ntn?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      voucher_approvals: {
        Row: {
          action: string
          actor_name: string | null
          actor_role: Database["public"]["Enums"]["approval_role"]
          created_at: string
          id: string
          remarks: string | null
          voucher_id: string
        }
        Insert: {
          action: string
          actor_name?: string | null
          actor_role: Database["public"]["Enums"]["approval_role"]
          created_at?: string
          id?: string
          remarks?: string | null
          voucher_id: string
        }
        Update: {
          action?: string
          actor_name?: string | null
          actor_role?: Database["public"]["Enums"]["approval_role"]
          created_at?: string
          id?: string
          remarks?: string | null
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_approvals_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "payment_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      recalc_bank_balance: { Args: { p_bank: string }; Returns: undefined }
    }
    Enums: {
      account_head_type:
        | "expense"
        | "asset"
        | "liability"
        | "income"
        | "equity"
        | "bank"
      approval_role:
        | "payroll_officer"
        | "director"
        | "vice_chancellor"
        | "admin"
      voucher_status:
        | "draft"
        | "pending_director"
        | "pending_vc"
        | "approved"
        | "paid"
        | "rejected"
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
      account_head_type: [
        "expense",
        "asset",
        "liability",
        "income",
        "equity",
        "bank",
      ],
      approval_role: [
        "payroll_officer",
        "director",
        "vice_chancellor",
        "admin",
      ],
      voucher_status: [
        "draft",
        "pending_director",
        "pending_vc",
        "approved",
        "paid",
        "rejected",
      ],
    },
  },
} as const
