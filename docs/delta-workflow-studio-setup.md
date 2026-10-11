# Delta workflow: Agentic Studio setup

The app starts the delta workflow ("LTC Continuous Claim Assessment & Delta Investigation") by itself when documents are uploaded to a claim that already has an assessment.

## App configuration

Add the delta workflow's trigger URL to `.env.local` (and to Vercel):

```
AGENT_WORKFLOW_LTC_DELTA_URL=https://agenticstudio.synechron.com/api/http-execution/trigger/<delta-workflow-id>
```

If this setting is missing, the run fails with a visible error. It does not fall back to LTC New.

## Trigger message the app sends

```json
{"claim_id": "claim-002", "new_document_ids": "doc-a,doc-b", "new_document_names": "A.pdf, B.txt"}
```

The new documents are the ones uploaded after the claim's latest assessment. All of them must be processed first.

## HTTP request nodes to change in Studio

1. **Baseline (replaces the 2 mocked "Executive Adjudication Briefing" responses)**: GET, mock off
   `https://avqdgblhhijgrphkzphq.supabase.co/rest/v1/claims?id=eq.{claim_id}&select=id,claimant_name,policy_number,status,complexity_score,assigned_to,assigned_group,assessments(label,assessment_date,complexity_score,system_recommendation,vector_clinical_label,vector_documentation_label,vector_discrepancy_label,vector_behavioral_label,ai_output_md)&assessments.order=created_at.desc&assessments.limit=1&apikey=sb_publishable_rz204oyB4hMPE4-ik4-vNg_FGctUY2E`
2. **New documents (replaces the mocked Genesys transcript)**: GET, mock off
   `https://avqdgblhhijgrphkzphq.supabase.co/rest/v1/documents?claim_id=eq.{claim_id}&id=in.({new_document_ids})&select=name,type,status,ai_interpreted_md&apikey=sb_publishable_rz204oyB4hMPE4-ik4-vNg_FGctUY2E`
3. **Document search**: replace it with the same "Doc request" HTTP node as in LTC New (all of the claim's documents).

## Output the app reads

- Executive Briefing: the **EXECUTIVE DELTA BRIEFING** template. Add one line under EXECUTIVE DELTA ALERT & ROUTING:
  `-- System Recommendation: [APPROVE CLAIM | ESCALATE | REJECT | PENDING FOR INFORMATION]`
  Without this line, and without a full Executive Adjudication Briefing in the same run, the app rejects the result.
- Scoring agent: **RECALCULATED SCORING MANIFEST** (REVISED RISK TAGS, Recalculated Complexity Score) and **DYNAMIC ROUTING DIRECTIVE** (Final Assigned Entity, Required Skillset).
- The Executive Briefing agent needs the scoring agent's output as an input source (the same issue as in LTC New).
- Each agent in the export has both the "new claim" task and the "delta" task, so a run does the full assessment as well. Removing the new-claim tasks from this flow makes it faster. The app accepts either.
