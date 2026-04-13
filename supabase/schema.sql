-- =============================================
-- Insurance Claims POC - Supabase Schema
-- =============================================

-- Claims table (main cases)
CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  claimant_name TEXT NOT NULL,
  policy_number TEXT NOT NULL,
  claim_type TEXT NOT NULL DEFAULT 'Long-Term Care',
  date_of_birth TEXT NOT NULL,
  age INTEGER NOT NULL,
  diagnosis TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('auto_approved', 'in_review', 'escalated', 'closed', 'pending')),
  assigned_to TEXT NOT NULL DEFAULT 'Unassigned',
  assigned_group TEXT NOT NULL DEFAULT 'Queue',
  complexity_score INTEGER NOT NULL DEFAULT 0,
  vector_clinical INTEGER NOT NULL DEFAULT 0,
  vector_documentation INTEGER NOT NULL DEFAULT 0,
  vector_discrepancy INTEGER NOT NULL DEFAULT 0,
  vector_behavioral INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  risk_indicators TEXT[],
  recommended_action TEXT,
  elimination_period TEXT,
  filing_date TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  last_updated TEXT NOT NULL DEFAULT CURRENT_DATE::text,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table (per claim)
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other'
    CHECK (type IN ('intake', 'medical', 'discharge', 'fax', 'transcript', 'care_plan', 'statement', 'other')),
  day INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processed', 'flagged')),
  vector_affected TEXT NOT NULL DEFAULT 'clinical'
    CHECK (vector_affected IN ('clinical', 'documentation', 'discrepancy', 'behavioral')),
  extracted_text TEXT,
  ai_findings TEXT[],
  page_info TEXT,
  flag_reason TEXT,
  json_schema JSONB,
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit history table (per claim)
CREATE TABLE IF NOT EXISTS audit_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  claim_id TEXT NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL,
  user_name TEXT,
  score_change_from INTEGER,
  score_change_to INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skill sets table
CREATE TABLE IF NOT EXISTS skill_sets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  min_score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  user_count INTEGER NOT NULL DEFAULT 0,
  capacity_free INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#22C55E',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fatal overrides table
CREATE TABLE IF NOT EXISTS fatal_overrides (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  condition TEXT NOT NULL,
  operator TEXT NOT NULL DEFAULT '==',
  value TEXT NOT NULL,
  and_condition TEXT,
  and_operator TEXT,
  and_value TEXT,
  then_action TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_documents_claim_id ON documents(claim_id);
CREATE INDEX IF NOT EXISTS idx_audit_history_claim_id ON audit_history(claim_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_claim_type ON claims(claim_type);

-- Create storage bucket for document files
-- Note: Run this in the Supabase dashboard or via the API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);
