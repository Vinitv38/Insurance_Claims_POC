export interface Database {
  public: {
    Tables: {
      claims: {
        Row: {
          id: string;
          claimant_name: string;
          policy_number: string;
          claim_type: string;
          date_of_birth: string;
          age: number;
          diagnosis: string;
          status: "auto_approved" | "in_review" | "escalated" | "closed" | "pending";
          assigned_to: string;
          assigned_group: string;
          complexity_score: number;
          vector_clinical: number;
          vector_documentation: number;
          vector_discrepancy: number;
          vector_behavioral: number;
          summary: string | null;
          risk_indicators: string[] | null;
          recommended_action: string | null;
          elimination_period: string | null;
          filing_date: string;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          claimant_name: string;
          policy_number: string;
          claim_type: string;
          date_of_birth: string;
          age: number;
          diagnosis: string;
          status?: "auto_approved" | "in_review" | "escalated" | "closed" | "pending";
          assigned_to?: string;
          assigned_group?: string;
          complexity_score?: number;
          vector_clinical?: number;
          vector_documentation?: number;
          vector_discrepancy?: number;
          vector_behavioral?: number;
          summary?: string | null;
          risk_indicators?: string[] | null;
          recommended_action?: string | null;
          elimination_period?: string | null;
          filing_date?: string;
          last_updated?: string;
        };
        Update: Partial<Database["public"]["Tables"]["claims"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          claim_id: string;
          name: string;
          type: "intake" | "medical" | "discharge" | "fax" | "transcript" | "care_plan" | "statement" | "other";
          day: number;
          status: "pending" | "processed" | "flagged";
          vector_affected: "clinical" | "documentation" | "discrepancy" | "behavioral";
          extracted_text: string | null;
          ai_findings: string[] | null;
          page_info: string | null;
          flag_reason: string | null;
          json_schema: Record<string, unknown> | null;
          file_path: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          name: string;
          type: "intake" | "medical" | "discharge" | "fax" | "transcript" | "care_plan" | "statement" | "other";
          day?: number;
          status?: "pending" | "processed" | "flagged";
          vector_affected?: "clinical" | "documentation" | "discrepancy" | "behavioral";
          extracted_text?: string | null;
          ai_findings?: string[] | null;
          page_info?: string | null;
          flag_reason?: string | null;
          json_schema?: Record<string, unknown> | null;
          file_path?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      audit_history: {
        Row: {
          id: string;
          claim_id: string;
          timestamp: string;
          action: string;
          detail: string;
          user_name: string | null;
          score_change_from: number | null;
          score_change_to: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          claim_id: string;
          timestamp: string;
          action: string;
          detail: string;
          user_name?: string | null;
          score_change_from?: number | null;
          score_change_to?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["audit_history"]["Insert"]>;
      };
      skill_sets: {
        Row: {
          id: string;
          name: string;
          description: string;
          min_score: number;
          max_score: number;
          user_count: number;
          capacity_free: number;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          min_score: number;
          max_score: number;
          user_count?: number;
          capacity_free?: number;
          color?: string;
        };
        Update: Partial<Database["public"]["Tables"]["skill_sets"]["Insert"]>;
      };
      fatal_overrides: {
        Row: {
          id: string;
          condition: string;
          operator: string;
          value: string;
          and_condition: string | null;
          and_operator: string | null;
          and_value: string | null;
          then_action: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          condition: string;
          operator: string;
          value: string;
          and_condition?: string | null;
          and_operator?: string | null;
          and_value?: string | null;
          then_action: string;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["fatal_overrides"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
