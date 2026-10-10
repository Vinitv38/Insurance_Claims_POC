import { supabase } from "./supabase";
import { claimStatusFor, type ParsedAssessment } from "./ltc-assessment";

function assessmentRowId(executionId: string) {
  return `live-${executionId}`;
}

export async function saveLiveAssessment(
  claimId: string,
  executionId: string,
  parsed: ParsedAssessment
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

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const aiOutputMd = parsed.scoringManifestMd
    ? `${parsed.briefingMd}\n\n---\n\n${parsed.scoringManifestMd}`
    : parsed.briefingMd;

  const insert = await supabase.from("assessments").insert({
    id,
    claim_id: claimId,
    label: "Live AI Assessment",
    assessment_date: today,
    trigger: "Initial Intake (LTC New workflow)",
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
    action: "AI Assessment Completed",
    detail: `LTC New workflow (execution ${executionId}): ${parsed.recommendation}, score ${parsed.complexityScore}, routed to ${parsed.assignedTo} (${parsed.assignedGroup}). Tags: ${parsed.tags.clinical} / ${parsed.tags.documentation} / ${parsed.tags.discrepancy} / ${parsed.tags.behavioral}.`,
    user_name: "Agentic Studio",
    score_change_from: previousScore,
    score_change_to: parsed.complexityScore,
  });
  if (audit.error) throw audit.error;

  return id;
}
