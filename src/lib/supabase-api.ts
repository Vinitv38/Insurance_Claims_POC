import { supabase } from "./supabase";
import type {
  ClaimCase,
  Document,
  AuditEntry,
  SkillSet,
  FatalOverride,
} from "@/store/claims-store";

/* ===== HELPERS: DB Row <-> App Model ===== */

function dbRowToClaim(
  row: Record<string, unknown>,
  documents: Document[],
  auditHistory: AuditEntry[]
): ClaimCase {
  return {
    id: row.id as string,
    claimantName: row.claimant_name as string,
    policyNumber: row.policy_number as string,
    claimType: row.claim_type as string,
    dateOfBirth: row.date_of_birth as string,
    age: row.age as number,
    diagnosis: row.diagnosis as string,
    status: row.status as ClaimCase["status"],
    assignedTo: row.assigned_to as string,
    assignedGroup: row.assigned_group as string,
    complexityScore: row.complexity_score as number,
    vectors: {
      clinical: row.vector_clinical as number,
      documentation: row.vector_documentation as number,
      discrepancy: row.vector_discrepancy as number,
      behavioral: row.vector_behavioral as number,
    },
    documents,
    auditHistory,
    summary: (row.summary as string) || undefined,
    riskIndicators: (row.risk_indicators as string[]) || undefined,
    recommendedAction: (row.recommended_action as string) || undefined,
    eliminationPeriod: (row.elimination_period as string) || undefined,
    filingDate: row.filing_date as string,
    lastUpdated: row.last_updated as string,
  };
}

function dbRowToDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Document["type"],
    day: row.day as number,
    status: row.status as Document["status"],
    vectorAffected: row.vector_affected as Document["vectorAffected"],
    extractedText: (row.extracted_text as string) || undefined,
    aiFindings: (row.ai_findings as string[]) || undefined,
    pageInfo: (row.page_info as string) || undefined,
    flagReason: (row.flag_reason as string) || undefined,
    jsonSchema: (row.json_schema as Record<string, unknown>) || undefined,
    filePath: (row.file_path as string) || undefined,
    aiInterpretedMd: (row.ai_interpreted_md as string) || undefined,
  };
}

function dbRowToAuditEntry(row: Record<string, unknown>): AuditEntry {
  const entry: AuditEntry = {
    timestamp: row.timestamp as string,
    action: row.action as string,
    detail: row.detail as string,
  };
  if (row.user_name) entry.user = row.user_name as string;
  if (row.score_change_from != null && row.score_change_to != null) {
    entry.scoreChange = {
      from: row.score_change_from as number,
      to: row.score_change_to as number,
    };
  }
  return entry;
}

function dbRowToSkillSet(row: Record<string, unknown>): SkillSet {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    minScore: row.min_score as number,
    maxScore: row.max_score as number,
    userCount: row.user_count as number,
    capacityFree: row.capacity_free as number,
    color: row.color as string,
  };
}

function dbRowToFatalOverride(row: Record<string, unknown>): FatalOverride {
  return {
    id: row.id as string,
    condition: row.condition as string,
    operator: row.operator as string,
    value: row.value as string,
    andCondition: (row.and_condition as string) || undefined,
    andOperator: (row.and_operator as string) || undefined,
    andValue: (row.and_value as string) || undefined,
    thenAction: row.then_action as string,
    isActive: row.is_active as boolean,
  };
}

/* ===== FETCH OPERATIONS ===== */

export async function fetchAllClaims(): Promise<ClaimCase[]> {
  const { data: claimsData, error: claimsError } = await supabase
    .from("claims")
    .select("*")
    .order("created_at", { ascending: true });

  if (claimsError) throw claimsError;
  if (!claimsData || claimsData.length === 0) return [];

  const claimIds = claimsData.map((c) => c.id);

  const [docsResult, auditResult] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .in("claim_id", claimIds)
      .order("day", { ascending: true }),
    supabase
      .from("audit_history")
      .select("*")
      .in("claim_id", claimIds)
      .order("timestamp", { ascending: true }),
  ]);

  if (docsResult.error) throw docsResult.error;
  if (auditResult.error) throw auditResult.error;

  const docsByClaimId: Record<string, Document[]> = {};
  for (const row of docsResult.data || []) {
    const claimId = row.claim_id as string;
    if (!docsByClaimId[claimId]) docsByClaimId[claimId] = [];
    docsByClaimId[claimId].push(dbRowToDocument(row as Record<string, unknown>));
  }

  const auditByClaimId: Record<string, AuditEntry[]> = {};
  for (const row of auditResult.data || []) {
    const claimId = row.claim_id as string;
    if (!auditByClaimId[claimId]) auditByClaimId[claimId] = [];
    auditByClaimId[claimId].push(dbRowToAuditEntry(row as Record<string, unknown>));
  }

  return claimsData.map((row) =>
    dbRowToClaim(
      row as Record<string, unknown>,
      docsByClaimId[row.id] || [],
      auditByClaimId[row.id] || []
    )
  );
}

export async function fetchClaimById(id: string): Promise<ClaimCase | null> {
  const { data: claimData, error: claimError } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .single();

  if (claimError) return null;

  const [docsResult, auditResult] = await Promise.all([
    supabase
      .from("documents")
      .select("*")
      .eq("claim_id", id)
      .order("day", { ascending: true }),
    supabase
      .from("audit_history")
      .select("*")
      .eq("claim_id", id)
      .order("timestamp", { ascending: true }),
  ]);

  const docs = (docsResult.data || []).map((r) => dbRowToDocument(r as Record<string, unknown>));
  const audit = (auditResult.data || []).map((r) => dbRowToAuditEntry(r as Record<string, unknown>));

  return dbRowToClaim(claimData as Record<string, unknown>, docs, audit);
}

export async function fetchSkillSets(): Promise<SkillSet[]> {
  const { data, error } = await supabase
    .from("skill_sets")
    .select("*")
    .order("min_score", { ascending: true });

  if (error) throw error;
  return (data || []).map((r) => dbRowToSkillSet(r as Record<string, unknown>));
}

export async function fetchFatalOverrides(): Promise<FatalOverride[]> {
  const { data, error } = await supabase
    .from("fatal_overrides")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map((r) => dbRowToFatalOverride(r as Record<string, unknown>));
}

/* ===== MUTATION OPERATIONS ===== */

export async function insertClaim(claim: ClaimCase): Promise<ClaimCase> {
  const { error: claimError } = await supabase.from("claims").insert({
    id: claim.id,
    claimant_name: claim.claimantName,
    policy_number: claim.policyNumber,
    claim_type: claim.claimType,
    date_of_birth: claim.dateOfBirth,
    age: claim.age,
    diagnosis: claim.diagnosis,
    status: claim.status,
    assigned_to: claim.assignedTo,
    assigned_group: claim.assignedGroup,
    complexity_score: claim.complexityScore,
    vector_clinical: claim.vectors.clinical,
    vector_documentation: claim.vectors.documentation,
    vector_discrepancy: claim.vectors.discrepancy,
    vector_behavioral: claim.vectors.behavioral,
    summary: claim.summary || null,
    risk_indicators: claim.riskIndicators || null,
    recommended_action: claim.recommendedAction || null,
    elimination_period: claim.eliminationPeriod || null,
    filing_date: claim.filingDate,
    last_updated: claim.lastUpdated,
  });

  if (claimError) throw claimError;

  if (claim.documents.length > 0) {
    const docRows = claim.documents.map((doc) => ({
      id: doc.id,
      claim_id: claim.id,
      name: doc.name,
      type: doc.type,
      day: doc.day,
      status: doc.status,
      vector_affected: doc.vectorAffected,
      extracted_text: doc.extractedText || null,
      ai_findings: doc.aiFindings || null,
      page_info: doc.pageInfo || null,
      flag_reason: doc.flagReason || null,
      json_schema: doc.jsonSchema || null,
    }));
    const { error: docError } = await supabase.from("documents").insert(docRows);
    if (docError) throw docError;
  }

  if (claim.auditHistory.length > 0) {
    const auditRows = claim.auditHistory.map((entry) => ({
      claim_id: claim.id,
      timestamp: entry.timestamp,
      action: entry.action,
      detail: entry.detail,
      user_name: entry.user || null,
      score_change_from: entry.scoreChange?.from ?? null,
      score_change_to: entry.scoreChange?.to ?? null,
    }));
    const { error: auditError } = await supabase.from("audit_history").insert(auditRows);
    if (auditError) throw auditError;
  }

  return claim;
}

export async function updateClaim(
  id: string,
  updates: Partial<{
    status: ClaimCase["status"];
    complexityScore: number;
    vectors: ClaimCase["vectors"];
    assignedTo: string;
    assignedGroup: string;
    lastUpdated: string;
  }>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.complexityScore !== undefined) dbUpdates.complexity_score = updates.complexityScore;
  if (updates.vectors) {
    dbUpdates.vector_clinical = updates.vectors.clinical;
    dbUpdates.vector_documentation = updates.vectors.documentation;
    dbUpdates.vector_discrepancy = updates.vectors.discrepancy;
    dbUpdates.vector_behavioral = updates.vectors.behavioral;
  }
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
  if (updates.assignedGroup !== undefined) dbUpdates.assigned_group = updates.assignedGroup;
  if (updates.lastUpdated !== undefined) dbUpdates.last_updated = updates.lastUpdated;

  const { error } = await supabase.from("claims").update(dbUpdates).eq("id", id);
  if (error) throw error;
}

export async function insertDocument(
  claimId: string,
  doc: Document
): Promise<void> {
  const { error } = await supabase.from("documents").insert({
    id: doc.id,
    claim_id: claimId,
    name: doc.name,
    type: doc.type,
    day: doc.day,
    status: doc.status,
    vector_affected: doc.vectorAffected,
    extracted_text: doc.extractedText || null,
    ai_findings: doc.aiFindings || null,
    page_info: doc.pageInfo || null,
    flag_reason: doc.flagReason || null,
    json_schema: doc.jsonSchema || null,
    file_path: doc.filePath || null,
    ai_interpreted_md: doc.aiInterpretedMd || null,
  });
  if (error) throw error;
}

export async function insertAuditEntry(
  claimId: string,
  entry: AuditEntry
): Promise<void> {
  const { error } = await supabase.from("audit_history").insert({
    claim_id: claimId,
    timestamp: entry.timestamp,
    action: entry.action,
    detail: entry.detail,
    user_name: entry.user || null,
    score_change_from: entry.scoreChange?.from ?? null,
    score_change_to: entry.scoreChange?.to ?? null,
  });
  if (error) throw error;
}

export async function insertSkillSet(skillSet: SkillSet): Promise<void> {
  const { error } = await supabase.from("skill_sets").insert({
    id: skillSet.id,
    name: skillSet.name,
    description: skillSet.description,
    min_score: skillSet.minScore,
    max_score: skillSet.maxScore,
    user_count: skillSet.userCount,
    capacity_free: skillSet.capacityFree,
    color: skillSet.color,
  });
  if (error) throw error;
}

export async function updateSkillSetInDb(
  id: string,
  updates: Partial<SkillSet>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.minScore !== undefined) dbUpdates.min_score = updates.minScore;
  if (updates.maxScore !== undefined) dbUpdates.max_score = updates.maxScore;
  if (updates.userCount !== undefined) dbUpdates.user_count = updates.userCount;
  if (updates.capacityFree !== undefined) dbUpdates.capacity_free = updates.capacityFree;
  if (updates.color !== undefined) dbUpdates.color = updates.color;

  const { error } = await supabase.from("skill_sets").update(dbUpdates).eq("id", id);
  if (error) throw error;
}

export async function deleteSkillSetFromDb(id: string): Promise<void> {
  const { error } = await supabase.from("skill_sets").delete().eq("id", id);
  if (error) throw error;
}

export async function insertFatalOverride(override: FatalOverride): Promise<void> {
  const { error } = await supabase.from("fatal_overrides").insert({
    id: override.id,
    condition: override.condition,
    operator: override.operator,
    value: override.value,
    and_condition: override.andCondition || null,
    and_operator: override.andOperator || null,
    and_value: override.andValue || null,
    then_action: override.thenAction,
    is_active: override.isActive,
  });
  if (error) throw error;
}

export async function updateFatalOverrideInDb(
  id: string,
  updates: Partial<FatalOverride>
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.condition !== undefined) dbUpdates.condition = updates.condition;
  if (updates.operator !== undefined) dbUpdates.operator = updates.operator;
  if (updates.value !== undefined) dbUpdates.value = updates.value;
  if (updates.andCondition !== undefined) dbUpdates.and_condition = updates.andCondition;
  if (updates.andOperator !== undefined) dbUpdates.and_operator = updates.andOperator;
  if (updates.andValue !== undefined) dbUpdates.and_value = updates.andValue;
  if (updates.thenAction !== undefined) dbUpdates.then_action = updates.thenAction;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

  const { error } = await supabase.from("fatal_overrides").update(dbUpdates).eq("id", id);
  if (error) throw error;
}

export async function deleteFatalOverrideFromDb(id: string): Promise<void> {
  const { error } = await supabase.from("fatal_overrides").delete().eq("id", id);
  if (error) throw error;
}

/* ===== DOCUMENT MARKDOWN UPDATE ===== */

export async function updateDocumentMarkdown(
  docId: string,
  markdown: string
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({ ai_interpreted_md: markdown })
    .eq("id", docId);
  if (error) throw error;
}

/* ===== FILE UPLOAD ===== */

export async function uploadDocumentFile(
  file: File,
  claimId: string
): Promise<string> {
  const filePath = `${claimId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from("documents")
    .upload(filePath, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}
