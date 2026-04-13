/**
 * Upload demo files to Supabase Storage and update/insert document records.
 * Run with: npx tsx supabase/upload-demo-files.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load env from .env.local
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DEMO_DIR = "/tmp/demo_files/Illumifin_DemoFiles";

// Helper to get MIME type from extension
function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".json": "application/json",
    ".csv": "text/csv",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
  };
  return mimeMap[ext] || "application/octet-stream";
}

// Upload a file to Supabase Storage and return the public URL
async function uploadFile(claimFolder: string, filename: string, storagePath: string): Promise<string> {
  const filePath = path.join(DEMO_DIR, claimFolder, filename);
  const fileBuffer = fs.readFileSync(filePath);
  const contentType = getMimeType(filename);

  const { error } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`  [FAIL] Upload ${filename}: ${error.message}`);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(storagePath);

  console.log(`  [OK] Uploaded ${filename} -> ${storagePath}`);
  return urlData.publicUrl;
}

// ===== PENDELTON (case-001) FILE MAPPINGS =====
// Existing docs: doc-p1, doc-p2, doc-p3, doc-p4
// New docs: doc-p5 through doc-p9

interface DocUpdate {
  id: string;
  file_path: string;
}

interface DocInsert {
  id: string;
  claim_id: string;
  name: string;
  type: string;
  day: number;
  status: string;
  vector_affected: string;
  extracted_text: string;
  ai_findings: string[];
  json_schema: Record<string, unknown>;
  file_path: string;
  page_info?: string;
  flag_reason?: string;
}

async function run() {
  console.log("=== Uploading Pendelton (case-001) files ===");

  const pendeltonUpdates: DocUpdate[] = [];
  const pendeltonInserts: DocInsert[] = [];

  // doc-p1: SCAN_LTC_APP -> maps to existing LTC_Intake_Form
  let url = await uploadFile("demo_parkinsons_expanded_v2", "SCAN_LTC_APP_20260408_1422.pdf", "case-001/SCAN_LTC_APP_20260408_1422.pdf");
  pendeltonUpdates.push({ id: "doc-p1", file_path: url });

  // doc-p2: EHR_Voice_Trans -> maps to existing Neurologist_Report
  url = await uploadFile("demo_parkinsons_expanded_v2", "EHR_Voice_Trans_ID88492.txt", "case-001/EHR_Voice_Trans_ID88492.txt");
  pendeltonUpdates.push({ id: "doc-p2", file_path: url });

  // doc-p3: IMG_0944 -> maps to existing Claimant_Personal_Statement
  url = await uploadFile("demo_parkinsons_expanded_v2", "IMG_0944.pdf", "case-001/IMG_0944.pdf");
  pendeltonUpdates.push({ id: "doc-p3", file_path: url });

  // doc-p4: RightFax_Inbound_00912 -> maps to existing PCP_Medical_Records (closest match — inbound fax with medical info)
  url = await uploadFile("demo_parkinsons_expanded_v2", "RightFax_Inbound_00912.pdf", "case-001/RightFax_Inbound_00912.pdf");
  pendeltonUpdates.push({ id: "doc-p4", file_path: url });

  // doc-p5: FW_Claim_Status_Inquiry (NEW)
  url = await uploadFile("demo_parkinsons_expanded_v2", "FW_Claim_Status_Inquiry.pdf", "case-001/FW_Claim_Status_Inquiry.pdf");
  pendeltonInserts.push({
    id: "doc-p5", claim_id: "case-001", name: "FW_Claim_Status_Inquiry.pdf", type: "other", day: 2, status: "processed", vector_affected: "documentation",
    extracted_text: "FORWARDED EMAIL — Claim Status Inquiry\nFrom: Helen Pendelton <helen.pendelton@email.com>\nTo: claims@acmeinsurance.com\nSubject: FW: Claim Status Inquiry\nDate: 04/06/2026\n\nTo Whom It May Concern,\nI am writing on behalf of my husband, Arthur Pendelton (Policy LTC-884-9102A). We submitted his long-term care claim application last week and I wanted to confirm receipt and inquire about the timeline for processing.\n\nThank you,\nHelen Pendelton",
    ai_findings: ["Email from spouse/caregiver confirming claim submission", "No clinical content — administrative correspondence", "Timeline inquiry noted — standard follow-up behavior", "No red flags detected"],
    json_schema: { documentType: "Email_Correspondence", direction: "Inbound", from: "Helen Pendelton", to: "Acme Insurance Claims", subject: "FW: Claim Status Inquiry", date: "2026-04-06", category: "Administrative", clinicalContent: false, actionRequired: "None — standard acknowledgment" },
    file_path: url,
  });

  // doc-p6: Genesys_Transcript_CID91834 (NEW)
  url = await uploadFile("demo_parkinsons_expanded_v2", "Genesys_Transcript_CID91834.txt", "case-001/Genesys_Transcript_CID91834.txt");
  pendeltonInserts.push({
    id: "doc-p6", claim_id: "case-001", name: "Genesys_Transcript_CID91834.txt", type: "transcript", day: 1, status: "processed", vector_affected: "behavioral",
    extracted_text: "GENESYS CLOUD CX — INTERACTION TRANSCRIPT\nCall ID: CID-91834-20260405 | Duration: 00:14:22\nAgent: Sandra Mitchell (SM-20418) | Queue: LTC_Claims_Intake\nCaller: Arthur Pendelton (555) 294-8113\nDisposition: Claim Initiated — Pending Documentation\n\nKey statements:\n- Patient reports hands shake too much to button shirts\n- Wife Helen assists with bathing due to fall risk\n- Reports difficulty getting out of bed — 'muscles freeze up'\n- MMSE 29/30 — cognitive function intact\n- Switched to heavier utensils per Dr. Thorne recommendation\n- Can feed self and use bathroom independently\n- ADL deficits: Dressing, Bathing, Transferring",
    ai_findings: ["Caller demeanor: Cooperative, forthcoming, emotionally genuine", "ADL self-report consistent with clinical documentation", "Cognitive status self-report matches MMSE 29/30", "Wife Helen present — corroborates caregiver role", "No behavioral red flags detected", "Sentiment analysis: Consistent tone throughout call"],
    json_schema: { documentType: "Call_Transcript", source: "Genesys Cloud CX", callId: "CID-91834-20260405", duration: "00:14:22", agent: { name: "Sandra Mitchell", id: "SM-20418" }, caller: { name: "Arthur Pendelton", phone: "(555) 294-8113" }, disposition: "Claim Initiated — Pending Documentation", adlSelfReport: ["Dressing", "Bathing", "Transferring"], cognitiveSelfReport: "Intact — MMSE 29/30", sentimentAnalysis: { overallTone: "Cooperative, genuine", shifts: false }, behavioralFlags: [] },
    file_path: url,
  });

  // doc-p7: AS400_POL_EXTRACT (NEW)
  url = await uploadFile("demo_parkinsons_expanded_v2", "AS400_POL_EXTRACT_040826.txt", "case-001/AS400_POL_EXTRACT_040826.txt");
  pendeltonInserts.push({
    id: "doc-p7", claim_id: "case-001", name: "AS400_POL_EXTRACT_040826.txt", type: "other", day: 1, status: "processed", vector_affected: "documentation",
    extracted_text: "ACME INSURANCE — AS/400 POLICY ADMINISTRATION SYSTEM\nPOLICY: LTC-884-9102A | TYPE: LONG TERM CARE — INDIVIDUAL\nINSURED: Arthur Pendelton | DOB: 05/12/1953 | Gender: M\nPOLICY EFFECTIVE: 06/01/2009 | STATUS: ACTIVE\nDAILY BENEFIT: $175.00 (Adj 2026: $256.92 w/ 3% compound)\nELIMINATION PERIOD: 90 DAYS | BENEFIT PERIOD: 4 YEARS\nPREMIUM: $214.50/mo AUTO-DRAFT | 24 consecutive payments POSTED\nBENEFICIARY: Helen M Pendelton (Spouse)\nAGENT: David Morales (Springfield Office)",
    ai_findings: ["Policy active since 2009 — 17 years of continuous coverage", "All 24 monthly premiums posted — no lapses", "Daily benefit with 3% compound inflation protection", "90-day elimination period aligns with claim documentation", "Beneficiary is spouse Helen — consistent with caregiver role"],
    json_schema: { documentType: "AS400_Policy_Extract", system: "POLEXT400 v6.1.14", policyNumber: "LTC-884-9102A", insured: { name: "Arthur Pendelton", dob: "1953-05-12", gender: "M" }, policyEffective: "2009-06-01", status: "ACTIVE", dailyBenefit: { base: 175.00, adjusted2026: 256.92, inflationRate: "3% compound" }, eliminationPeriod: 90, benefitPeriod: "4 years", premium: { amount: 214.50, method: "AUTO-DRAFT", frequency: "Monthly" }, paymentHistory: { last24Months: "All POSTED", lapses: 0 }, beneficiary: { name: "Helen M Pendelton", relationship: "Spouse" } },
    file_path: url,
  });

  // doc-p8: PBM_Surescripts_Payload_Q1 (NEW)
  url = await uploadFile("demo_parkinsons_expanded_v2", "PBM_Surescripts_Payload_Q1.json", "case-001/PBM_Surescripts_Payload_Q1.json");
  pendeltonInserts.push({
    id: "doc-p8", claim_id: "case-001", name: "PBM_Surescripts_Payload_Q1.json", type: "medical", day: 2, status: "processed", vector_affected: "clinical",
    extracted_text: "SURESCRIPTS MEDICATION HISTORY — Arthur Pendelton\nPBM: OptumRx | Plan: Acme LTC Supplemental Rx\nActive Medications:\n1. Carbidopa/Levodopa 25-100mg TID (Antiparkinson — Dr. Thorne)\n2. Lisinopril 10mg daily (Hypertension)\n3. Atorvastatin 20mg daily (Hyperlipidemia)\n4. Vitamin D3 2000 IU daily\n5. Multivitamin Senior Formula daily\nCompleted: Amoxicillin 500mg (Nov 2025 — antibiotic course)\nAllergies: Sulfonamides (Rash, Hives — Moderate)",
    ai_findings: ["Carbidopa/Levodopa confirms Parkinson's treatment — consistent with diagnosis", "No psychotropic medications — supports cognitive status claim", "Medication regimen simple and stable", "Allergy to sulfonamides documented", "No controlled substances or opioids", "Pharmacy fills consistent — good medication adherence"],
    json_schema: { documentType: "Surescripts_Medication_History", source: "Surescripts Clinical Direct Messaging", pbm: "OptumRx", patient: { name: "Arthur Pendelton", dob: "1953-05-12", policy: "LTC-884-9102A" }, activeMedications: [{ drug: "Carbidopa/Levodopa 25-100mg", class: "Antiparkinson", frequency: "TID", prescriber: "Dr. Aris Thorne" }, { drug: "Lisinopril 10mg", class: "ACE Inhibitor", frequency: "Daily" }, { drug: "Atorvastatin 20mg", class: "Statin", frequency: "Daily" }], allergies: [{ substance: "Sulfonamides", reaction: "Rash, Hives", severity: "Moderate" }], controlledSubstances: false },
    file_path: url,
  });

  // doc-p9: VNA_Field_Data_Export_v2 (NEW)
  url = await uploadFile("demo_parkinsons_expanded_v2", "VNA_Field_Data_Export_v2.csv", "case-001/VNA_Field_Data_Export_v2.csv");
  pendeltonInserts.push({
    id: "doc-p9", claim_id: "case-001", name: "VNA_Field_Data_Export_v2.csv", type: "medical", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "VNA HOME HEALTH FIELD DATA EXPORT v2.1\nPatient: Pendelton, Arthur | MRN: SNA-4410287\nAssessor: Maria Gonzalez, RN (VNA-RN-4421)\nAssessment Date: 04/02/2026\n\nKatz ADL Index Total: 22/36 | Lawton IADL Scale Total: 16/48\nADL Trigger Count: YES — 3 ADLs require assistance\n\nADL Results:\n- Eating: Independent (6/6)\n- Bathing: Dependent — Moderate Assist (3/6)\n- Dressing: Dependent — Moderate Assist (3/6)\n- Toileting: Independent (6/6)\n- Transferring: Dependent — Maximum Assist (1/6)\n- Continence: Independent (6/6)\n- Grooming: Independent with Setup (5/6)\n- Ambulation: Independent — Supervised (5/6)\n\nIADL Results: Meal Prep, Housekeeping, Laundry, Transportation, Shopping — all Dependent",
    ai_findings: ["ADL trigger met: 3 of 6 ADLs require assistance (Bathing, Dressing, Transferring)", "Katz ADL 22/36 — moderate functional impairment", "Transferring rated Maximum Assist — highest acuity ADL", "IADL assessment shows significant instrumental dependency", "Assessment corroborates physician and claimant self-reports", "Standardized assessment tool (Katz/Lawton) — strong clinical evidence"],
    json_schema: { documentType: "VNA_Field_Assessment", version: "2.1", patient: { name: "Arthur Pendelton", mrn: "SNA-4410287" }, assessor: { name: "Maria Gonzalez, RN", id: "VNA-RN-4421" }, assessmentDate: "2026-04-02", katzADL: { total: 22, maxScore: 36, triggerCount: 3, triggerThreshold: 2, triggerMet: true }, lawtonIADL: { total: 16, maxScore: 48 }, adlDetails: { eating: { level: "Independent", score: 6 }, bathing: { level: "Dependent — Moderate Assist", score: 3 }, dressing: { level: "Dependent — Moderate Assist", score: 3 }, toileting: { level: "Independent", score: 6 }, transferring: { level: "Dependent — Maximum Assist", score: 1 }, continence: { level: "Independent", score: 6 } } },
    file_path: url,
  });

  console.log("\n=== Uploading Hargrove (case-002) files ===");

  const hargroveUpdates: DocUpdate[] = [];
  const hargroveInserts: DocInsert[] = [];

  // doc-h1: SCAN_LTC_APP -> maps to existing LTC_Intake_Form
  url = await uploadFile("demo_wheelchair_edge_v2", "SCAN_LTC_APP_20260405_0915.pdf", "case-002/SCAN_LTC_APP_20260405_0915.pdf");
  hargroveUpdates.push({ id: "doc-h1", file_path: url });

  // doc-h2: Epic_Discharge -> maps to existing Epic_Discharge_Summary
  url = await uploadFile("demo_wheelchair_edge_v2", "Epic_Discharge_MH7741903.pdf", "case-002/Epic_Discharge_MH7741903.pdf");
  hargroveUpdates.push({ id: "doc-h2", file_path: url });

  // doc-h3: RightFax_Inbound_11409 -> maps to existing RightFax_CarePlan
  url = await uploadFile("demo_wheelchair_edge_v2", "RightFax_Inbound_11409.pdf", "case-002/RightFax_Inbound_11409.pdf");
  hargroveUpdates.push({ id: "doc-h3", file_path: url });

  // doc-h4: BHH_CarePlan_Archived -> maps to existing Archived_CarePlan
  url = await uploadFile("demo_wheelchair_edge_v2", "BHH_CarePlan_Archived_18mo.pdf", "case-002/BHH_CarePlan_Archived_18mo.pdf");
  hargroveUpdates.push({ id: "doc-h4", file_path: url });

  // doc-h5: Genesys_Transcript -> maps to existing Genesys_Transcript
  url = await uploadFile("demo_wheelchair_edge_v2", "Genesys_Transcript_CID44102.txt", "case-002/Genesys_Transcript_CID44102.txt");
  hargroveUpdates.push({ id: "doc-h5", file_path: url });

  // doc-h6: VNA_Field_Data_Export_v1 (NEW)
  url = await uploadFile("demo_wheelchair_edge_v2", "VNA_Field_Data_Export_v1.pdf", "case-002/VNA_Field_Data_Export_v1.pdf");
  hargroveInserts.push({
    id: "doc-h6", claim_id: "case-002", name: "VNA_Field_Data_Export_v1.pdf", type: "medical", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "VNA HOME HEALTH FIELD DATA EXPORT v1\nPatient: Hargrove, Robert J. | MRN: MRC-7741903\nAssessor: VNA Heartland IL\nAssessment Date: 04/03/2026\n\nFunctional Assessment:\n- Mobility: Non-ambulatory — wheelchair dependent\n- Transfers: Total assist required (2-person)\n- Bathing: Total assist required\n- Dressing: Maximum assist required\n- Toileting: Maximum assist required\n- Eating: Independent with setup\n- Continence: Independent\n\nHome Environment: First-floor apartment, wheelchair accessible. Daughter Linda provides primary care. Hospital bed and wheelchair rented.",
    ai_findings: ["Non-ambulatory status documented — wheelchair dependent", "5 of 6 ADLs require assistance (only eating independent)", "2-person transfer requirement indicates high acuity", "Wheelchair dependency claim — cross-reference with archived care plan required", "Home environment assessment: Wheelchair accessible first-floor apartment"],
    json_schema: { documentType: "VNA_Field_Assessment", version: "1.0", patient: { name: "Robert Hargrove", mrn: "MRC-7741903" }, assessmentDate: "2026-04-03", mobilityStatus: "Non-ambulatory — wheelchair dependent", transferRequirement: "Total assist — 2 person", adlSummary: { eating: "Independent with setup", bathing: "Total assist", dressing: "Maximum assist", toileting: "Maximum assist", transferring: "Total assist (2-person)", continence: "Independent" }, dme: ["Hospital bed", "Wheelchair (rental)"], caregiver: "Linda Hargrove (daughter)" },
    file_path: url,
  });

  // doc-h7: AS400_POL_EXTRACT (NEW)
  url = await uploadFile("demo_wheelchair_edge_v2", "AS400_POL_EXTRACT_040826.txt", "case-002/AS400_POL_EXTRACT_040826.txt");
  hargroveInserts.push({
    id: "doc-h7", claim_id: "case-002", name: "AS400_POL_EXTRACT_040826.txt", type: "other", day: 1, status: "processed", vector_affected: "documentation",
    extracted_text: "ACME INSURANCE — AS/400 POLICY ADMINISTRATION SYSTEM\nPOLICY: LTC-912-6037B | TYPE: LONG TERM CARE — INDIVIDUAL\nINSURED: Robert J Hargrove | DOB: 11/03/1951 | Age: 74 | Gender: M\nPOLICY EFFECTIVE: 03/15/2012 | STATUS: ACTIVE\nUNDERWRITING CLASS: PREFERRED\nDAILY BENEFIT: $200.00 (Adj 2026: $296.18 w/ 3% compound)\nELIMINATION PERIOD: 60 DAYS | BENEFIT PERIOD: 5 YEARS\nPREMIUM: $287.93/mo AUTO-DRAFT | 24 consecutive payments POSTED\nBENEFICIARY: Linda M Hargrove (Daughter)\nPRIOR ASSESSMENTS:\n- 10/2024: Brookhaven HH Annual Wellness — ADL 6/6 (fully independent)\n- 10/2025: VNA Heartland Interim Check — ADL 5.5/6\nCLAIM: CLM-2026-44102 opened 04/05/2026 — STATUS: OPEN-ESCALATED",
    ai_findings: ["Policy active since 2012 — 14 years continuous coverage", "All premiums current — no lapses in 24 months", "CRITICAL: Prior assessment history shows ADL 6/6 (fully independent) in Oct 2024", "Oct 2025 interim: ADL 5.5/6 — minimal decline noted", "Rapid ADL decline from 5.5/6 to wheelchair-dependent in 5 months — unusual trajectory", "Claim already escalated status — consistent with complexity flags"],
    json_schema: { documentType: "AS400_Policy_Extract", system: "POLEXT400 v6.1.14", policyNumber: "LTC-912-6037B", insured: { name: "Robert J Hargrove", dob: "1951-11-03", age: 74, gender: "M" }, policyEffective: "2012-03-15", status: "ACTIVE", underwritingClass: "PREFERRED", dailyBenefit: { base: 200.00, adjusted2026: 296.18, inflationRate: "3% compound" }, eliminationPeriod: 60, benefitPeriod: "5 years", premium: { amount: 287.93, method: "AUTO-DRAFT" }, priorAssessments: [{ date: "2024-10-07", provider: "Brookhaven HH", type: "Annual Wellness", adlScore: "6/6" }, { date: "2025-10-12", provider: "VNA Heartland IL", type: "Interim Check", adlScore: "5.5/6" }], claimRef: "CLM-2026-44102", claimStatus: "OPEN-ESCALATED" },
    file_path: url,
  });

  // doc-h8: PBM_Surescripts_Payload_Q3 (NEW)
  url = await uploadFile("demo_wheelchair_edge_v2", "PBM_Surescripts_Payload_Q3.csv", "case-002/PBM_Surescripts_Payload_Q3.csv");
  hargroveInserts.push({
    id: "doc-h8", claim_id: "case-002", name: "PBM_Surescripts_Payload_Q3.csv", type: "medical", day: 2, status: "flagged", vector_affected: "clinical",
    extracted_text: "SURESCRIPTS MEDICATION HISTORY — Robert Hargrove\nPBM: OptumRx | Period: Q3-2025 through Q1-2026\nActive Medications:\n1. Lisinopril 20mg daily (Hypertension — Dr. Okonkwo)\n2. Atorvastatin 40mg daily (Hyperlipidemia — Dr. Okonkwo)\n3. Tamsulosin 0.4mg daily (BPH — Dr. Patel)\n4. Vitamin D3 1000 IU daily\n5. Multivitamin Senior\n6. Acetaminophen 500mg PRN (OTC)\nFLAGGED:\n7. Hydrocodone-Acetaminophen 5-325mg (ER Dispensing 03/09/2026 — Dr. Whitfield, Mercy Hospital)\n8. Hydrocodone-Acetaminophen 5-325mg (Refill 03/23/2026 — Dr. Okonkwo)\nNote: Two opioid prescriptions within 14 days from different prescribers",
    ai_findings: ["ALERT: Opioid prescriptions detected — Hydrocodone-Acetaminophen", "Initial ER dispensing 03/09 followed by PCP refill 03/23 — 14-day gap", "Two different prescribers for same controlled substance", "Timeline aligns with reported fall/injury date", "No prior opioid history in 9-month lookback — acute pain management likely", "Cross-reference with discharge records for injury validation"],
    json_schema: { documentType: "Surescripts_Medication_History", format: "CSV", pbm: "OptumRx", patient: { name: "Robert Hargrove", dob: "1951-11-03", policy: "LTC-912-6037B" }, period: "Q3-2025 to Q1-2026", activeMedications: [{ drug: "Lisinopril 20mg", class: "ACE Inhibitor" }, { drug: "Atorvastatin 40mg", class: "Statin" }, { drug: "Tamsulosin 0.4mg", class: "Alpha-1 Blocker" }], controlledSubstances: [{ drug: "Hydrocodone-Acetaminophen 5-325mg", schedule: "II", firstFill: "2026-03-09", prescriber: "Dr. James Whitfield (Mercy ER)", secondFill: "2026-03-23", prescriber2: "Dr. Margaret Okonkwo" }], opioidFlag: true, multiPrescriberAlert: true },
    file_path: url,
    flag_reason: "Multiple opioid prescriptions from different prescribers within 14 days",
  });

  // doc-h9: Provider_Directory_Export (NEW)
  url = await uploadFile("demo_wheelchair_edge_v2", "Provider_Directory_Export.json", "case-002/Provider_Directory_Export.json");
  hargroveInserts.push({
    id: "doc-h9", claim_id: "case-002", name: "Provider_Directory_Export.json", type: "other", day: 3, status: "processed", vector_affected: "documentation",
    extracted_text: "ACME INSURANCE — IN-NETWORK PROVIDER DIRECTORY EXPORT\nSearch: Physical Therapy near Peoria, IL 61602 (within 20 miles)\nFor Patient: Robert J Hargrove | Policy: LTC-912-6037B\nResults: 15 providers found\n\nTop Matches:\n1. Dr. Angela Kim, DPT — Peoria Physical Therapy Associates (3.2 mi, Tier 1 Preferred)\n2. Emily Dawson, DPT — Riverfront Rehabilitation Center (4.8 mi, Tier 1 Preferred)\n3. Thomas Bradley, DPT — Central IL Physical Therapy (5.3 mi, Tier 1 Preferred)\n...\nAll providers accepting new patients. Specialties: Geriatric PT, Home Health PT, Fall Prevention.",
    ai_findings: ["15 in-network PT providers within 20 miles of patient", "Multiple Tier 1 Preferred options available", "Home Health PT specialty available — relevant for wheelchair-dependent patient", "Provider availability confirmed — no access barriers", "Generated for care coordination planning"],
    json_schema: { documentType: "Provider_Directory_Export", searchCriteria: { specialty: "Physical Therapy", location: "Peoria, IL 61602", radius: "20 miles" }, patient: { name: "Robert J Hargrove", policy: "LTC-912-6037B" }, resultCount: 15, topProviders: [{ name: "Dr. Angela Kim, DPT", practice: "Peoria Physical Therapy Associates", distance: "3.2 mi", tier: "Tier 1 Preferred" }, { name: "Emily Dawson, DPT", practice: "Riverfront Rehabilitation Center", distance: "4.8 mi", tier: "Tier 1 Preferred" }] },
    file_path: url,
  });

  // ===== DATABASE UPDATES =====
  console.log("\n=== Updating existing document records with file_path ===");

  const allUpdates = [...pendeltonUpdates, ...hargroveUpdates];
  for (const update of allUpdates) {
    const { error } = await supabase
      .from("documents")
      .update({ file_path: update.file_path })
      .eq("id", update.id);

    if (error) {
      console.error(`  [FAIL] Update ${update.id}: ${error.message}`);
    } else {
      console.log(`  [OK] Updated ${update.id} with file_path`);
    }
  }

  // Also update the names for docs that now have real filenames
  const nameUpdates = [
    { id: "doc-p1", name: "SCAN_LTC_APP_20260408_1422.pdf" },
    { id: "doc-p2", name: "EHR_Voice_Trans_ID88492.txt" },
    { id: "doc-p3", name: "IMG_0944.pdf" },
    { id: "doc-p4", name: "RightFax_Inbound_00912.pdf" },
    { id: "doc-h1", name: "SCAN_LTC_APP_20260405_0915.pdf" },
    { id: "doc-h2", name: "Epic_Discharge_MH7741903.pdf" },
    { id: "doc-h3", name: "RightFax_Inbound_11409.pdf" },
    { id: "doc-h4", name: "BHH_CarePlan_Archived_18mo.pdf" },
    { id: "doc-h5", name: "Genesys_Transcript_CID44102.txt" },
  ];
  for (const update of nameUpdates) {
    const { error } = await supabase
      .from("documents")
      .update({ name: update.name })
      .eq("id", update.id);

    if (error) {
      console.error(`  [FAIL] Name update ${update.id}: ${error.message}`);
    } else {
      console.log(`  [OK] Updated name for ${update.id} -> ${update.name}`);
    }
  }

  console.log("\n=== Inserting new document records ===");

  const allInserts = [...pendeltonInserts, ...hargroveInserts];
  for (const doc of allInserts) {
    const { error } = await supabase
      .from("documents")
      .upsert(doc);

    if (error) {
      console.error(`  [FAIL] Insert ${doc.id} (${doc.name}): ${error.message}`);
    } else {
      console.log(`  [OK] Inserted ${doc.id} (${doc.name})`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Updated ${allUpdates.length} existing documents with file_path`);
  console.log(`Updated ${nameUpdates.length} document names to match real filenames`);
  console.log(`Inserted ${allInserts.length} new document records`);
  console.log("Total files uploaded to storage: 18");
  console.log("\nDone!");
}

run().catch(console.error);
