import { supabase } from "./supabase";
import { claimStatusFor, type ParsedAssessment } from "./ltc-assessment";

function assessmentRowId(executionId: string) {
  return `live-${executionId}`;
}

export type WorkflowMode = "new" | "delta";

const WORKFLOW_NAME: Record<WorkflowMode, string> = { new: "LTC New", delta: "Delta" };

export async function saveLiveAssessment(
  claimId: string,
  executionId: string,
  parsed: ParsedAssessment,
  mode: WorkflowMode = "new"
): Promise<string> {
  const id = assessmentRowId(executionId);

  const existing = await supabase.from("assessments").select("id").eq("id", id).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return id;

  const claim = await supabase.from("claims").select("complexity_score").eq("id", claimId).single();
  if (claim.error) throw new Error(`Claim ${claimId} not found: ${claim.error.message}`);
  const previousScore = claim.data.complexity_score as number;

  const docs = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("claim_id", claimId);
  if (docs.error) throw docs.error;

  const newDocs = mode === "delta" ? await documentsSinceLastAssessment(claimId) : [];

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const aiOutputMd = parsed.scoringManifestMd
    ? `${parsed.briefingMd}\n\n---\n\n${parsed.scoringManifestMd}`
    : parsed.briefingMd;

  const insert = await supabase.from("assessments").insert({
    id,
    claim_id: claimId,
    label: mode === "delta" ? "Delta Review" : "Live AI Assessment",
    assessment_date: today,
    trigger:
      mode === "delta"
        ? `New documents: ${newDocs.map((d) => d.name).join(", ") || "none"} (Delta workflow)`
        : "Initial Intake (LTC New workflow)",
    complexity_score: parsed.complexityScore,
    vector_clinical: parsed.vectors.clinical,
    vector_documentation: parsed.vectors.documentation,
    vector_discrepancy: parsed.vectors.discrepancy,
    vector_behavioral: parsed.vectors.behavioral,
    vector_clinical_label: parsed.tags.clinical,
    vector_documentation_label: parsed.tags.documentation,
    vector_discrepancy_label: parsed.tags.discrepancy,
    vector_behavioral_label: parsed.tags.behavioral,
    system_recommendation: parsed.recommendation,
    score_driver: parsed.scoreDriver || null,
    routing_rationale: parsed.routingRationale || null,
    contract_status: parsed.contractStatus || null,
    elimination_period: parsed.eliminationPeriod || null,
    exclusions: parsed.exclusions || null,
    summary: parsed.summary || null,
    risk_indicators: parsed.riskIndicators.length ? parsed.riskIndicators : null,
    recommended_action: parsed.recommendedAction || null,
    documents_analyzed: docs.count ?? 0,
    clinical_profile_md: parsed.clinicalProfileMd || null,
    ai_output_md: aiOutputMd,
  });
  if (insert.error) {
    if (insert.error.code === "23505") return id;
    throw insert.error;
  }

  const update = await supabase
    .from("claims")
    .update({
      status: claimStatusFor(parsed.recommendation),
      complexity_score: parsed.complexityScore,
      vector_clinical: parsed.vectors.clinical,
      vector_documentation: parsed.vectors.documentation,
      vector_discrepancy: parsed.vectors.discrepancy,
      vector_behavioral: parsed.vectors.behavioral,
      assigned_to: parsed.assignedTo,
      assigned_group: parsed.assignedGroup,
      risk_indicators: parsed.riskIndicators.length ? parsed.riskIndicators : null,
      recommended_action: parsed.recommendedAction || null,
      last_updated: today,
    })
    .eq("id", claimId);
  if (update.error) throw update.error;

  const audit = await supabase.from("audit_history").insert({
    claim_id: claimId,
    timestamp: now.toISOString(),
    action: mode === "delta" ? "Delta Review Completed" : "AI Assessment Completed",
    detail: `${WORKFLOW_NAME[mode]} workflow (execution ${executionId}): score ${previousScore} → ${parsed.complexityScore}, ${parsed.recommendation}, routed to ${parsed.assignedTo} (${parsed.assignedGroup}). Tags: ${parsed.tags.clinical} / ${parsed.tags.documentation} / ${parsed.tags.discrepancy} / ${parsed.tags.behavioral}.`,
    user_name: "Agentic Studio",
    score_change_from: previousScore,
    score_change_to: parsed.complexityScore,
  });
  if (audit.error) throw audit.error;

  return id;
}

// Documents uploaded after the claim's latest assessment, i.e. what the Delta workflow has to review.
export async function documentsSinceLastAssessment(
  claimId: string
): Promise<{ id: string; name: string; status: string; flag_reason: string | null }[]> {
  const latest = await supabase
    .from("assessments")
    .select("id, created_at")
    .eq("claim_id", claimId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest.error) throw latest.error;
  if (!latest.data) throw new Error(`Claim ${claimId} has no assessment yet, so there is no baseline for a delta review`);

  const docs = await supabase
    .from("documents")
    .select("id, name, status, flag_reason, created_at")
    .eq("claim_id", claimId)
    .gt("created_at", latest.data.created_at)
    .order("created_at", { ascending: true });
  if (docs.error) throw docs.error;
  return docs.data || [];
}
