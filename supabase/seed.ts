/**
 * Seed script for Supabase database.
 * Run with: npx tsx supabase/seed.ts
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
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

/* ===== MOCK DATA ===== */

const claims = [
  {
    id: "claim-001",
    claimant_name: "Arthur Pendelton",
    policy_number: "LTC-884-9102A",
    claim_type: "Long-Term Care",
    date_of_birth: "1954-03-12",
    age: 80,
    diagnosis: "Parkinson\u2019s Disease (G20)",
    status: "auto_approved",
    assigned_to: "Sarah Chen",
    assigned_group: "Junior Adjuster",
    complexity_score: 13,
    vector_clinical: 20,
    vector_documentation: 5,
    vector_discrepancy: 0,
    vector_behavioral: 5,
    summary: "80-year-old male with recently diagnosed Parkinson\u2019s Disease (Stage 3, Hoehn & Yahr). Presenting with moderate-to-severe bilateral tremors significantly impacting Activities of Daily Living: Bathing and Dressing. 90-day elimination period has been satisfied. All medical documentation is complete and internally consistent.",
    risk_indicators: [
      "None Detected. Clinical presentation matches 90-day Elimination Period requirements.",
      "All documents are complete with no missing pages.",
      "Handwritten personal statement corroborates clinical findings at 87% OCR confidence.",
      "No discrepancies found between provider records and claimant statements.",
    ],
    recommended_action: "APPROVE CLAIM. Initiate Home Health Aide scheduling per PCP referral. Medical evidence is complete and defensible. Route to Junior Adjuster (Sarah Chen) for administrative sign-off.",
    elimination_period: "90-day \u2014 SATISFIED",
    filing_date: "2026-04-01",
    last_updated: "2026-04-05",
  },
  {
    id: "claim-002",
    claimant_name: "Robert Hargrove",
    policy_number: "LTC-912-6037B",
    claim_type: "Long-Term Care",
    date_of_birth: "1951-08-22",
    age: 74,
    diagnosis: "Left Hip Contusion (S70.02XA)",
    status: "escalated",
    assigned_to: "Dr. Karen Volkov",
    assigned_group: "Tier 2 Clinical Investigator",
    complexity_score: 80,
    vector_clinical: 65,
    vector_documentation: 70,
    vector_discrepancy: 95,
    vector_behavioral: 10,
    summary: "Robert J. Hargrove, a 74-year-old male with a history of hypertension, hyperlipidemia, BPH, and bilateral knee osteoarthritis, initiated a long-term care claim following a mechanical fall at home on 03/09/2026. He self-reports new dependence on a wheelchair and need for assistance with bathing and transferring. However, medical records from the ED and subsequent PCP visit do not corroborate this sudden functional decline. The claim is further complicated by missing critical discharge documentation and the absence of a formal, post-fall ADL assessment, necessitating further investigation before benefit determination.",
    risk_indicators: [
      "CRITICAL: Narrative Conflict \u2014 Claimant self-reports wheelchair dependence but ED/PCP records show no loss of ambulation",
      "CRITICAL: Documentation Gap \u2014 Missing pages 3-4 from ED Discharge Summary",
      "WARNING: No formal ADL assessment or Plan of Care post-fall",
    ],
    recommended_action: "PENDING FOR INFORMATION. Obtain missing ED Discharge Summary pages. Request contemporaneous ADL assessment and Plan of Care from licensed practitioner.",
    elimination_period: "120 Days Elapsed / 90 Days Required",
    filing_date: "2026-04-10",
    last_updated: "2026-04-20",
  },
  {
    id: "claim-003",
    claimant_name: "Margaret Chen",
    policy_number: "LTC-776-3341C",
    claim_type: "Long-Term Care",
    date_of_birth: "1948-11-05",
    age: 77,
    diagnosis: "Alzheimer\u2019s Disease (G30.9)",
    status: "in_review",
    assigned_to: "Marcus Williams",
    assigned_group: "Senior Adjuster",
    complexity_score: 52,
    vector_clinical: 45,
    vector_documentation: 55,
    vector_discrepancy: 30,
    vector_behavioral: 40,
    summary: "77-year-old female with moderate Alzheimer\u2019s Disease. MMSE 16/30 indicates significant cognitive decline. 4 ADL deficits documented. Elimination period in progress (Day 45 of 90). Home health assessment reveals missing pharmacy medication reconciliation. Single informal caregiver (husband) providing all ADL assistance.",
    risk_indicators: [
      "WARNING: Medication management records incomplete \u2014 missing pharmacy reconciliation",
      "INFO: Elimination period in progress \u2014 Day 45 of 90",
      "INFO: Single informal caregiver \u2014 caregiver burden risk",
      "INFO: Home safety hazards documented (loose rugs, no grab bars)",
    ],
    recommended_action: "HOLD FOR REVIEW. Request pharmacy medication reconciliation. Monitor elimination period progress. Consider caregiver support assessment.",
    elimination_period: "90-day \u2014 IN PROGRESS (Day 45 of 90)",
    filing_date: "2026-04-08",
    last_updated: "2026-04-10",
  },
  {
    id: "claim-004",
    claimant_name: "William Torres",
    policy_number: "ACC-331-8820D",
    claim_type: "Accident & Health",
    date_of_birth: "1960-06-18",
    age: 65,
    diagnosis: "Cervical Spine Injury (S14.109A)",
    status: "pending",
    assigned_to: "Unassigned",
    assigned_group: "Queue",
    complexity_score: 41,
    vector_clinical: 38,
    vector_documentation: 42,
    vector_discrepancy: 15,
    vector_behavioral: 20,
    summary: "65-year-old male with cervical spine injury from motor vehicle collision. Post-surgical C5-C6 fusion. Police report confirms other party at fault. Surgical notes consistent with ER records. Standard A&H claim pathway \u2014 awaiting assignment.",
    risk_indicators: [
      "INFO: Other party at fault \u2014 confirmed by police report",
      "INFO: Surgical procedure documented and consistent",
      "INFO: Awaiting adjuster assignment",
    ],
    recommended_action: "ASSIGN TO ADJUSTER. Standard A&H claim. Verify insurance coordination with auto liability carrier. Initiate disability benefit calculation.",
    elimination_period: null,
    filing_date: "2026-04-09",
    last_updated: "2026-04-10",
  },
  {
    id: "claim-005",
    claimant_name: "Dorothy Langston",
    policy_number: "LTC-558-2219E",
    claim_type: "Long-Term Care",
    date_of_birth: "1940-02-28",
    age: 86,
    diagnosis: "Stroke / CVA (I63.9)",
    status: "in_review",
    assigned_to: "Dr. Henry Marsh",
    assigned_group: "Tier 2 Clinical Investigator",
    complexity_score: 67,
    vector_clinical: 70,
    vector_documentation: 60,
    vector_discrepancy: 45,
    vector_behavioral: 35,
    summary: "86-year-old female with CVA resulting in left-side hemiparesis and moderate expressive aphasia. All 6 ADLs affected. FIM score 42/126 indicates severe functional limitation. Son reports pre-existing care needs before stroke \u2014 prior PCP records requested.",
    risk_indicators: [
      "WARNING: Pre-existing care needs reported by family \u2014 awaiting prior PCP records",
      "INFO: FIM Score 42/126 \u2014 severe functional limitation",
      "INFO: All 6 ADLs affected \u2014 maximum impairment level",
      "INFO: Currently inpatient \u2014 not appropriate for discharge",
    ],
    recommended_action: "HOLD FOR REVIEW. Request pre-stroke PCP records to establish baseline functional status. Assess pre-existing condition impact on coverage.",
    elimination_period: "90-day \u2014 IN PROGRESS",
    filing_date: "2026-04-07",
    last_updated: "2026-04-10",
  },
  {
    id: "claim-006",
    claimant_name: "Frank Abernathy",
    policy_number: "LTC-445-9907F",
    claim_type: "Long-Term Care",
    date_of_birth: "1952-09-14",
    age: 73,
    diagnosis: "ALS (G12.21)",
    status: "auto_approved",
    assigned_to: "James Porter",
    assigned_group: "Junior Adjuster",
    complexity_score: 22,
    vector_clinical: 30,
    vector_documentation: 10,
    vector_discrepancy: 0,
    vector_behavioral: 10,
    summary: "73-year-old male with ALS (Amyotrophic Lateral Sclerosis). Progressive, life-limiting diagnosis with bulbar and limb onset. FVC 52% predicted indicates respiratory decline. Wheelchair-dependent with PEG tube for nutrition. Palliative care initiated.",
    risk_indicators: [
      "None Detected. Terminal progressive diagnosis with complete documentation.",
      "All documents consistent \u2014 no contradictions detected.",
      "Palliative care already initiated \u2014 clinical trajectory well-documented.",
    ],
    recommended_action: "APPROVE CLAIM. ALS is a progressive, terminal diagnosis. All documentation complete and consistent. Initiate maximum LTC benefit.",
    elimination_period: "90-day \u2014 SATISFIED",
    filing_date: "2026-04-06",
    last_updated: "2026-04-08",
  },
  {
    id: "claim-007",
    claimant_name: "Eleanor Voss",
    policy_number: "ACC-887-1154G",
    claim_type: "Accident & Health",
    date_of_birth: "1958-12-01",
    age: 67,
    diagnosis: "Traumatic Brain Injury (S06.309A)",
    status: "escalated",
    assigned_to: "Derek Frost",
    assigned_group: "SIU Fraud Unit",
    complexity_score: 91,
    vector_clinical: 55,
    vector_documentation: 80,
    vector_discrepancy: 90,
    vector_behavioral: 85,
    summary: "67-year-old female claiming TBI from workplace fall. Multiple significant red flags: no witnesses to fall, employee not scheduled for accident location, CCTV non-operational. Medical records reveal 3 prior ER visits for head injury in 18 months and a previous workers comp claim (2024). Behavioral analysis indicates high deception probability.",
    risk_indicators: [
      "CRITICAL: No witnesses + unscheduled location + non-operational CCTV",
      "CRITICAL: 3 prior ER visits for head injury in 18 months",
      "CRITICAL: Prior workers compensation claim (2024)",
      "WARNING: High deception probability in behavioral analysis",
      "WARNING: CT scan negative despite reported LOC",
    ],
    recommended_action: "ESCALATE TO SIU INVESTIGATION. High probability of fraudulent claim. Request CCTV maintenance records. Interview witnesses in adjacent areas. DO NOT approve pending investigation.",
    elimination_period: null,
    filing_date: "2026-04-05",
    last_updated: "2026-04-10",
  },
  {
    id: "claim-008",
    claimant_name: "Harold Kimura",
    policy_number: "LTC-662-4478H",
    claim_type: "Long-Term Care",
    date_of_birth: "1938-04-10",
    age: 88,
    diagnosis: "Dementia, Unspecified (F03.90)",
    status: "closed",
    assigned_to: "Amy Richards",
    assigned_group: "Junior Adjuster",
    complexity_score: 18,
    vector_clinical: 25,
    vector_documentation: 8,
    vector_discrepancy: 0,
    vector_behavioral: 5,
    summary: "88-year-old male with moderate-severe dementia. MMSE 12/30. 3 ADL deficits documented. Behavioral symptoms include sundowning and nighttime wandering. Granddaughter provides in-home care. Long-standing policy (14 years). All documentation complete and consistent.",
    risk_indicators: [
      "None Detected. Clear dementia diagnosis with consistent documentation.",
      "All documents complete \u2014 no contradictions.",
      "Long-standing policy holder \u2014 14 years.",
    ],
    recommended_action: "CLAIM APPROVED AND CLOSED. Benefits initiated. Standard LTC benefits package applied. Home care support coordinated with granddaughter.",
    elimination_period: "90-day \u2014 SATISFIED",
    filing_date: "2026-03-20",
    last_updated: "2026-04-02",
  },
];

const documents = [
  // Pendelton documents (Queue 1 — 10 files)
  {
    id: "doc-p1", claim_id: "claim-001", name: "SCAN_LTC_APP_20260408_1422.pdf", type: "intake", day: 1, status: "processed", vector_affected: "clinical",
    extracted_text: "Patient: Arthur Pendelton, 72M. Primary Dx: Parkinson\u2019s Disease (G20). ADL Deficits: Bathing, Dressing. Tremor severity: Moderate-to-Severe. Elimination Period: 90-day satisfied. Policy Active Since: 2017.",
    ai_findings: ["ADL deficit count: 2 of 6 \u2014 meets minimum threshold", "90-day elimination period: SATISFIED", "Clinical presentation consistent with diagnosis"],
    json_schema: { documentType: "LTC_Intake_Form", patient: { name: "Arthur Pendelton", age: 72, gender: "M" }, primaryDiagnosis: { code: "G20", description: "Parkinson\u2019s Disease" }, adlDeficits: ["Bathing", "Dressing"], tremorSeverity: "Moderate-to-Severe", eliminationPeriod: { days: 90, status: "SATISFIED" }, policyActiveSince: "2017" },
  },
  {
    id: "doc-p2", claim_id: "claim-001", name: "EHR_Voice_Trans_ID88492.txt", type: "medical", day: 2, status: "processed", vector_affected: "clinical",
    extracted_text: "NEUROLOGY CONSULTATION\nPatient: Arthur Pendelton\nDx: Parkinson\u2019s Disease, Stage 3 (Hoehn & Yahr)\nTremor: Bilateral, moderate-severe\nPostural instability: Present\nMedication: Carbidopa/Levodopa 25/100 TID\nPrognosis: Progressive. Current ADL deficits expected to increase.",
    ai_findings: ["Diagnosis confirmed by specialist", "Stage 3 PD \u2014 bilateral involvement", "Prognosis supports long-term care need", "No contradictions with intake form"],
    json_schema: { documentType: "Neurology_Consultation", patient: { name: "Arthur Pendelton", dob: "1954-03-12" }, diagnosis: "Parkinson\u2019s Disease, Stage 3 (Hoehn & Yahr)", tremorAssessment: "Bilateral, moderate-to-severe resting tremor", posturalInstability: true, medication: { name: "Carbidopa/Levodopa", dosage: "25/100", frequency: "TID" }, prognosis: "Progressive \u2014 ADL deficits expected to increase", examDate: "2026-04-03" },
  },
  {
    id: "doc-p3", claim_id: "claim-001", name: "IMG_0944.pdf", type: "statement", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "[HANDWRITTEN DOCUMENT \u2014 OCR Confidence: 87%]\n\"My name is Arthur Pendelton. I am writing to explain\nmy daily challenges. Since my Parkinson\u2019s diagnosis,\nmy hands shake so badly I cannot button my shirts\nor hold a razor to shave. My wife Helen helps me\nbathe because I am afraid of falling in the tub.\nI used to be a carpenter \u2014 now I can barely\nhold a cup of coffee. I need help and I am\ngrateful for this policy.\"",
    ai_findings: ["Handwriting recognition: 87% confidence", "Statement corroborates ADL deficits (bathing, dressing)", "Emotional tone: Genuine, consistent", "No red flags detected in narrative"],
    json_schema: { documentType: "Claimant_Personal_Statement", format: "Handwritten", ocrConfidence: 0.87, patient: { name: "Arthur Pendelton" }, adlMentioned: ["Bathing", "Dressing", "Fine motor tasks"], emotionalTone: "Genuine, consistent", redFlags: [], corroboratesIntake: true },
  },
  {
    id: "doc-p4", claim_id: "claim-001", name: "RightFax_Inbound_00912.pdf", type: "medical", day: 4, status: "processed", vector_affected: "clinical",
    extracted_text: "PRIMARY CARE RECORDS \u2014 Arthur Pendelton\nVisit: 03/15/2026\nChief Complaint: Increasing tremor, difficulty with ADLs\nExam: Bilateral resting tremor, cogwheel rigidity\nAssessment: PD progressing. Referral to home health.\nPlan: Continue current meds. OT evaluation ordered.\nAll documentation complete.",
    ai_findings: ["Records consistent with specialist report", "ADL decline trajectory documented", "Home health referral supports claim", "Documentation: COMPLETE"],
    json_schema: { documentType: "PCP_Medical_Records", patient: { name: "Arthur Pendelton" }, visitDate: "2026-03-15", chiefComplaint: "Increasing tremor, difficulty with ADLs", examination: { bilateralRestingTremor: true, cogwheelRigidity: true }, assessment: "Parkinson\u2019s Disease progressing", plan: ["Continue current medications", "OT evaluation ordered", "Referral to home health"], documentationStatus: "COMPLETE" },
  },
  {
    id: "doc-p5", claim_id: "claim-001", name: "FW_Claim_Status_Inquiry.pdf", type: "other", day: 2, status: "processed", vector_affected: "documentation",
    extracted_text: "FORWARDED EMAIL \u2014 Claim Status Inquiry\nFrom: Helen Pendelton <helen.pendelton@email.com>\nTo: claims@acmeinsurance.com\nSubject: FW: Claim Status Inquiry\nDate: 04/06/2026\n\nTo Whom It May Concern,\nI am writing on behalf of my husband, Arthur Pendelton (Policy LTC-884-9102A). We submitted his long-term care claim application last week and I wanted to confirm receipt and inquire about the timeline for processing.\n\nThank you,\nHelen Pendelton",
    ai_findings: ["Email from spouse/caregiver confirming claim submission", "No clinical content \u2014 administrative correspondence", "Timeline inquiry noted \u2014 standard follow-up behavior", "No red flags detected"],
    json_schema: { documentType: "Email_Correspondence", direction: "Inbound", from: "Helen Pendelton", to: "Acme Insurance Claims", subject: "FW: Claim Status Inquiry", date: "2026-04-06", category: "Administrative", clinicalContent: false, actionRequired: "None \u2014 standard acknowledgment" },
  },
  {
    id: "doc-p6", claim_id: "claim-001", name: "Genesys_Transcript_CID91834.txt", type: "transcript", day: 1, status: "processed", vector_affected: "behavioral",
    extracted_text: "GENESYS CLOUD CX \u2014 INTERACTION TRANSCRIPT\nCall ID: CID-91834-20260405 | Duration: 00:14:22\nAgent: Sandra Mitchell (SM-20418) | Queue: LTC_Claims_Intake\nCaller: Arthur Pendelton (555) 294-8113\nDisposition: Claim Initiated \u2014 Pending Documentation\n\nKey statements:\n- Patient reports hands shake too much to button shirts\n- Wife Helen assists with bathing due to fall risk\n- Reports difficulty getting out of bed \u2014 'muscles freeze up'\n- MMSE 29/30 \u2014 cognitive function intact\n- Switched to heavier utensils per Dr. Thorne recommendation\n- Can feed self and use bathroom independently\n- ADL deficits: Dressing, Bathing, Transferring",
    ai_findings: ["Caller demeanor: Cooperative, forthcoming, emotionally genuine", "ADL self-report consistent with clinical documentation", "Cognitive status self-report matches MMSE 29/30", "Wife Helen present \u2014 corroborates caregiver role", "No behavioral red flags detected", "Sentiment analysis: Consistent tone throughout call"],
    json_schema: { documentType: "Call_Transcript", source: "Genesys Cloud CX", callId: "CID-91834-20260405", duration: "00:14:22", agent: { name: "Sandra Mitchell", id: "SM-20418" }, caller: { name: "Arthur Pendelton", phone: "(555) 294-8113" }, disposition: "Claim Initiated \u2014 Pending Documentation", adlSelfReport: ["Dressing", "Bathing", "Transferring"], cognitiveSelfReport: "Intact \u2014 MMSE 29/30", sentimentAnalysis: { overallTone: "Cooperative, genuine", shifts: false }, behavioralFlags: [] },
  },
  {
    id: "doc-p7", claim_id: "claim-001", name: "AS400_POL_EXTRACT_040826.txt", type: "other", day: 1, status: "processed", vector_affected: "documentation",
    extracted_text: "ACME INSURANCE \u2014 AS/400 POLICY ADMINISTRATION SYSTEM\nPOLICY: LTC-884-9102A | TYPE: LONG TERM CARE \u2014 INDIVIDUAL\nINSURED: Arthur Pendelton | DOB: 05/12/1953 | Gender: M\nPOLICY EFFECTIVE: 06/01/2009 | STATUS: ACTIVE\nDAILY BENEFIT: $175.00 (Adj 2026: $256.92 w/ 3% compound)\nELIMINATION PERIOD: 90 DAYS | BENEFIT PERIOD: 4 YEARS\nPREMIUM: $214.50/mo AUTO-DRAFT | 24 consecutive payments POSTED\nBENEFICIARY: Helen M Pendelton (Spouse)\nAGENT: David Morales (Springfield Office)",
    ai_findings: ["Policy active since 2009 \u2014 17 years of continuous coverage", "All 24 monthly premiums posted \u2014 no lapses", "Daily benefit with 3% compound inflation protection", "90-day elimination period aligns with claim documentation", "Beneficiary is spouse Helen \u2014 consistent with caregiver role"],
    json_schema: { documentType: "AS400_Policy_Extract", system: "POLEXT400 v6.1.14", policyNumber: "LTC-884-9102A", insured: { name: "Arthur Pendelton", dob: "1953-05-12", gender: "M" }, policyEffective: "2009-06-01", status: "ACTIVE", dailyBenefit: { base: 175.00, adjusted2026: 256.92, inflationRate: "3% compound" }, eliminationPeriod: 90, benefitPeriod: "4 years", premium: { amount: 214.50, method: "AUTO-DRAFT", frequency: "Monthly" }, paymentHistory: { last24Months: "All POSTED", lapses: 0 }, beneficiary: { name: "Helen M Pendelton", relationship: "Spouse" } },
  },
  {
    id: "doc-p8", claim_id: "claim-001", name: "PBM_Surescripts_Payload_Q1.pdf", type: "medical", day: 2, status: "processed", vector_affected: "clinical",
    extracted_text: "SURESCRIPTS MEDICATION HISTORY \u2014 Arthur Pendelton\nPBM: OptumRx | Plan: Acme LTC Supplemental Rx\nActive Medications:\n1. Carbidopa/Levodopa 25-100mg TID (Antiparkinson \u2014 Dr. Thorne)\n2. Lisinopril 10mg daily (Hypertension)\n3. Atorvastatin 20mg daily (Hyperlipidemia)\n4. Vitamin D3 2000 IU daily\n5. Multivitamin Senior Formula daily\nCompleted: Amoxicillin 500mg (Nov 2025 \u2014 antibiotic course)\nAllergies: Sulfonamides (Rash, Hives \u2014 Moderate)",
    ai_findings: ["Carbidopa/Levodopa confirms Parkinson's treatment \u2014 consistent with diagnosis", "No psychotropic medications \u2014 supports cognitive status claim", "Medication regimen simple and stable", "Allergy to sulfonamides documented", "No controlled substances or opioids", "Pharmacy fills consistent \u2014 good medication adherence"],
    json_schema: { documentType: "Surescripts_Medication_History", source: "Surescripts Clinical Direct Messaging", pbm: "OptumRx", patient: { name: "Arthur Pendelton", dob: "1953-05-12", policy: "LTC-884-9102A" }, activeMedications: [{ drug: "Carbidopa/Levodopa 25-100mg", class: "Antiparkinson", frequency: "TID", prescriber: "Dr. Aris Thorne" }, { drug: "Lisinopril 10mg", class: "ACE Inhibitor", frequency: "Daily" }, { drug: "Atorvastatin 20mg", class: "Statin", frequency: "Daily" }], allergies: [{ substance: "Sulfonamides", reaction: "Rash, Hives", severity: "Moderate" }], controlledSubstances: false },
  },
  {
    id: "doc-p9", claim_id: "claim-001", name: "VNA_Field_Data_Export_v2.pdf", type: "medical", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "VNA HOME HEALTH FIELD DATA EXPORT v2.1\nPatient: Pendelton, Arthur | MRN: SNA-4410287\nAssessor: Maria Gonzalez, RN (VNA-RN-4421)\nAssessment Date: 04/02/2026\n\nKatz ADL Index Total: 22/36 | Lawton IADL Scale Total: 16/48\nADL Trigger Count: YES \u2014 3 ADLs require assistance\n\nADL Results:\n- Eating: Independent (6/6)\n- Bathing: Dependent \u2014 Moderate Assist (3/6)\n- Dressing: Dependent \u2014 Moderate Assist (3/6)\n- Toileting: Independent (6/6)\n- Transferring: Dependent \u2014 Maximum Assist (1/6)\n- Continence: Independent (6/6)\n- Grooming: Independent with Setup (5/6)\n- Ambulation: Independent \u2014 Supervised (5/6)\n\nIADL Results: Meal Prep, Housekeeping, Laundry, Transportation, Shopping \u2014 all Dependent",
    ai_findings: ["ADL trigger met: 3 of 6 ADLs require assistance (Bathing, Dressing, Transferring)", "Katz ADL 22/36 \u2014 moderate functional impairment", "Transferring rated Maximum Assist \u2014 highest acuity ADL", "IADL assessment shows significant instrumental dependency", "Assessment corroborates physician and claimant self-reports", "Standardized assessment tool (Katz/Lawton) \u2014 strong clinical evidence"],
    json_schema: { documentType: "VNA_Field_Assessment", version: "2.1", patient: { name: "Arthur Pendelton", mrn: "SNA-4410287" }, assessor: { name: "Maria Gonzalez, RN", id: "VNA-RN-4421" }, assessmentDate: "2026-04-02", katzADL: { total: 22, maxScore: 36, triggerCount: 3, triggerThreshold: 2, triggerMet: true }, lawtonIADL: { total: 16, maxScore: 48 }, adlDetails: { eating: { level: "Independent", score: 6 }, bathing: { level: "Dependent \u2014 Moderate Assist", score: 3 }, dressing: { level: "Dependent \u2014 Moderate Assist", score: 3 }, toileting: { level: "Independent", score: 6 }, transferring: { level: "Dependent \u2014 Maximum Assist", score: 1 }, continence: { level: "Independent", score: 6 } } },
  },
  {
    id: "doc-p10", claim_id: "claim-001", name: "Policy_Master_Arthur_LTC8849102A.pdf", type: "other", day: 1, status: "processed", vector_affected: "documentation",
    extracted_text: "ACME INSURANCE \u2014 POLICY MASTER DOCUMENT\nPolicy: LTC-884-9102A\nInsured: Arthur Pendelton\nType: Long Term Care \u2014 Individual\nEffective: 06/01/2009\nStatus: ACTIVE\nDaily Benefit: $175.00 (Adjusted 2026: $256.92)\nElimination Period: 90 Days\nBenefit Period: 4 Years",
    ai_findings: ["Policy master document confirms coverage details", "Consistent with AS400 extract", "All policy terms verified"],
    json_schema: { documentType: "Policy_Master", policyNumber: "LTC-884-9102A", insured: "Arthur Pendelton", status: "ACTIVE" },
  },
  // Hargrove documents (Queue 2 — 9 files + Policy Master)
  {
    id: "doc-h1", claim_id: "claim-002", name: "SCAN_LTC_APP_20260405_0915.pdf", type: "intake", day: 1, status: "processed", vector_affected: "clinical",
    extracted_text: "Patient: Robert Hargrove, 81M. Primary Dx: Left hip fracture (S72.001A). Secondary: Mild cognitive impairment. ADL Deficits: Bathing, Dressing, Toileting, Transferring. Elimination Period: 90-day. Policy Active Since: 2019.",
    ai_findings: ["ADL deficit count: 4 of 6", "Elimination period tracking initiated", "High-acuity clinical profile detected"],
    page_info: "3 of 3 pages verified",
    json_schema: { documentType: "LTC_Intake_Form", patient: { name: "Robert Hargrove", age: 81, gender: "M" }, primaryDiagnosis: { code: "S72.001A", description: "Left hip fracture" }, secondaryDiagnosis: { code: "G31.84", description: "Mild cognitive impairment" }, adlDeficits: ["Bathing", "Dressing", "Toileting", "Transferring"], eliminationPeriod: { days: 90, status: "IN_PROGRESS" }, policyActiveSince: "2019", pageCount: { found: 3, expected: 3, status: "COMPLETE" } },
  },
  {
    id: "doc-h2", claim_id: "claim-002", name: "Epic_Discharge_MH7741903.pdf", type: "discharge", day: 2, status: "flagged", vector_affected: "documentation",
    extracted_text: "DISCHARGE SUMMARY \u2014 Page 1 of 4\nPatient: Robert Hargrove\nAdmit Date: 03/28/2026\nDx: Left hip fracture, s/p ORIF\nComplications: Post-op delirium\n\n[PAGE 2-4 MISSING]",
    ai_findings: ["CRITICAL: Page count mismatch \u2014 Found 1 page, expected 4", "Missing surgical notes (pages 2-3)", "Missing discharge medication list (page 4)", "Document integrity: FAILED"],
    page_info: "Page 1 of 4 \u2014 INCOMPLETE",
    flag_reason: "Missing pages 2-4 of discharge summary",
    json_schema: { documentType: "Discharge_Summary", patient: { name: "Robert Hargrove" }, admitDate: "2026-03-28", diagnosis: "Left hip fracture, s/p ORIF", complications: ["Post-op delirium"], pageCount: { found: 1, expected: 4, status: "CRITICAL_MISSING_PAGES" }, missingContent: ["Surgical notes (pages 2-3)", "Discharge medication list (page 4)"], documentIntegrity: "FAILED" },
  },
  {
    id: "doc-h3", claim_id: "claim-002", name: "RightFax_Inbound_11409.pdf", type: "fax", day: 4, status: "flagged", vector_affected: "documentation",
    extracted_text: "[LOW QUALITY FAX \u2014 OCR Confidence: 62%]\nHome Care Plan \u2014 R. Hargrove\nFrequency: 3x/week PT, 2x/week OT\nGoals: Amb... [illegible] ...with walker 150ft\nDME Ordered: Hos... bed, wheel... [illegible]\nPhysician Sig: Dr. [illegible]",
    ai_findings: ["OCR confidence below threshold (62% < 85%)", "Multiple illegible segments detected", "DME order partially readable \u2014 possible wheelchair reference", "Physician signature unverifiable"],
    page_info: "Single page fax",
    flag_reason: "Low-quality fax with illegible segments",
    json_schema: { documentType: "Home_Care_Plan", source: "RightFax", ocrConfidence: 0.62, ocrThreshold: 0.85, patient: { name: "R. Hargrove" }, therapy: { physical: "3x/week", occupational: "2x/week" }, goals: "[PARTIALLY_ILLEGIBLE] Ambulation with walker 150ft", dmeOrdered: "[PARTIALLY_ILLEGIBLE] Hospital bed, wheelchair(?)", physicianSignature: "UNVERIFIABLE", illegibleSegments: 4 },
  },
  {
    id: "doc-h4", claim_id: "claim-002", name: "BHH_CarePlan_Archived_18mo.pdf", type: "care_plan", day: 4, status: "flagged", vector_affected: "discrepancy",
    extracted_text: "ARCHIVED CARE PLAN \u2014 Date: 06/15/2024\nPatient: Robert Hargrove\nMobility Status: AMBULATORY \u2014 Independent with cane\nDME: Standard cane (no wheelchair)\nLast Assessment: Patient walks 300ft independently\nNo wheelchair authorization on file.",
    ai_findings: ["DIRECT CONTRADICTION DETECTED", "Current fax references wheelchair/DME order", "Archived plan: 'Ambulatory \u2014 independent with cane'", "Mobility status change not clinically documented", "Escalation trigger: Evidence discrepancy"],
    flag_reason: "Wheelchair assertion contradicts archived care plan showing independent ambulation",
    json_schema: { documentType: "Archived_Care_Plan", archiveDate: "2024-06-15", patient: { name: "Robert Hargrove" }, mobilityStatus: "AMBULATORY", mobilityDetail: "Independent with cane", dme: { current: "Standard cane", wheelchair: false }, lastAssessment: "Patient walks 300ft independently", wheelchairAuthorization: "NONE_ON_FILE", contradictionDetected: true },
  },
  {
    id: "doc-h5", claim_id: "claim-002", name: "Genesys_Transcript_CID44102.txt", type: "transcript", day: 5, status: "flagged", vector_affected: "behavioral",
    extracted_text: "CALL TRANSCRIPT \u2014 Duration: 14:32\nAgent: \"Can you describe your daily routine?\"\nClaimant: \"I can't do anything... I need help with everything.\"\nAgent: \"Are you using any mobility devices?\"\nClaimant: \"Yes, I'm in a wheelchair full time now.\"\nAgent: \"And before the fall?\"\nClaimant: [long pause] \"I... I was getting around okay I guess.\"\n[SENTIMENT SHIFT DETECTED at 08:44]",
    ai_findings: ["Sentiment analysis: Significant hesitation at 08:44", "Claim: 'wheelchair full time' \u2014 conflicts with 2024 care plan", "Pre-injury mobility description vague/evasive", "Behavioral flag: Inconsistent narrative pattern"],
    flag_reason: "Behavioral inconsistencies detected in claimant statements",
    json_schema: { documentType: "Call_Transcript", source: "Genesys", duration: "14:32", callDate: "2026-04-20", sentimentAnalysis: { overallTone: "Distressed", shiftDetected: true, shiftTimestamp: "08:44", shiftType: "Hesitation/Evasion" }, keyStatements: [{ speaker: "Claimant", text: "I can't do anything... I need help with everything", flag: null }, { speaker: "Claimant", text: "I'm in a wheelchair full time now", flag: "CONTRADICTS_ARCHIVED_CARE_PLAN" }, { speaker: "Claimant", text: "I was getting around okay I guess", flag: "VAGUE_EVASIVE" }], behavioralFlags: ["Inconsistent narrative", "Vague pre-injury description"] },
  },
  {
    id: "doc-h6", claim_id: "claim-002", name: "VNA_Field_Data_Export_v1.pdf", type: "medical", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "VNA HOME HEALTH FIELD DATA EXPORT v1\nPatient: Hargrove, Robert J. | MRN: MRC-7741903\nAssessor: VNA Heartland IL\nAssessment Date: 04/03/2026\n\nFunctional Assessment:\n- Mobility: Non-ambulatory \u2014 wheelchair dependent\n- Transfers: Total assist required (2-person)\n- Bathing: Total assist required\n- Dressing: Maximum assist required\n- Toileting: Maximum assist required\n- Eating: Independent with setup\n- Continence: Independent\n\nHome Environment: First-floor apartment, wheelchair accessible. Daughter Linda provides primary care. Hospital bed and wheelchair rented.",
    ai_findings: ["Non-ambulatory status documented \u2014 wheelchair dependent", "5 of 6 ADLs require assistance (only eating independent)", "2-person transfer requirement indicates high acuity", "Wheelchair dependency claim \u2014 cross-reference with archived care plan required", "Home environment assessment: Wheelchair accessible first-floor apartment"],
    json_schema: { documentType: "VNA_Field_Assessment", version: "1.0", patient: { name: "Robert Hargrove", mrn: "MRC-7741903" }, assessmentDate: "2026-04-03", mobilityStatus: "Non-ambulatory \u2014 wheelchair dependent", transferRequirement: "Total assist \u2014 2 person", adlSummary: { eating: "Independent with setup", bathing: "Total assist", dressing: "Maximum assist", toileting: "Maximum assist", transferring: "Total assist (2-person)", continence: "Independent" }, dme: ["Hospital bed", "Wheelchair (rental)"], caregiver: "Linda Hargrove (daughter)" },
  },
  {
    id: "doc-h7", claim_id: "claim-002", name: "AS400_POL_EXTRACT_040826.txt", type: "other", day: 1, status: "processed", vector_affected: "documentation",
    extracted_text: "ACME INSURANCE \u2014 AS/400 POLICY ADMINISTRATION SYSTEM\nPOLICY: LTC-912-6037B | TYPE: LONG TERM CARE \u2014 INDIVIDUAL\nINSURED: Robert J Hargrove | DOB: 11/03/1951 | Age: 74 | Gender: M\nPOLICY EFFECTIVE: 03/15/2012 | STATUS: ACTIVE\nUNDERWRITING CLASS: PREFERRED\nDAILY BENEFIT: $200.00 (Adj 2026: $296.18 w/ 3% compound)\nELIMINATION PERIOD: 60 DAYS | BENEFIT PERIOD: 5 YEARS\nPREMIUM: $287.93/mo AUTO-DRAFT | 24 consecutive payments POSTED\nBENEFICIARY: Linda M Hargrove (Daughter)\nPRIOR ASSESSMENTS:\n- 10/2024: Brookhaven HH Annual Wellness \u2014 ADL 6/6 (fully independent)\n- 10/2025: VNA Heartland Interim Check \u2014 ADL 5.5/6\nCLAIM: CLM-2026-44102 opened 04/05/2026 \u2014 STATUS: OPEN-ESCALATED",
    ai_findings: ["Policy active since 2012 \u2014 14 years continuous coverage", "All premiums current \u2014 no lapses in 24 months", "CRITICAL: Prior assessment history shows ADL 6/6 (fully independent) in Oct 2024", "Oct 2025 interim: ADL 5.5/6 \u2014 minimal decline noted", "Rapid ADL decline from 5.5/6 to wheelchair-dependent in 5 months \u2014 unusual trajectory", "Claim already escalated status \u2014 consistent with complexity flags"],
    json_schema: { documentType: "AS400_Policy_Extract", system: "POLEXT400 v6.1.14", policyNumber: "LTC-912-6037B", insured: { name: "Robert J Hargrove", dob: "1951-11-03", age: 74, gender: "M" }, policyEffective: "2012-03-15", status: "ACTIVE", underwritingClass: "PREFERRED", dailyBenefit: { base: 200.00, adjusted2026: 296.18, inflationRate: "3% compound" }, eliminationPeriod: 60, benefitPeriod: "5 years", premium: { amount: 287.93, method: "AUTO-DRAFT" }, priorAssessments: [{ date: "2024-10-07", provider: "Brookhaven HH", type: "Annual Wellness", adlScore: "6/6" }, { date: "2025-10-12", provider: "VNA Heartland IL", type: "Interim Check", adlScore: "5.5/6" }], claimRef: "CLM-2026-44102", claimStatus: "OPEN-ESCALATED" },
  },
  {
    id: "doc-h8", claim_id: "claim-002", name: "PBM_Surescripts_Payload_Q3.pdf", type: "medical", day: 2, status: "flagged", vector_affected: "clinical",
    extracted_text: "SURESCRIPTS MEDICATION HISTORY \u2014 Robert Hargrove\nPBM: OptumRx | Period: Q3-2025 through Q1-2026\nActive Medications:\n1. Lisinopril 20mg daily (Hypertension \u2014 Dr. Okonkwo)\n2. Atorvastatin 40mg daily (Hyperlipidemia \u2014 Dr. Okonkwo)\n3. Tamsulosin 0.4mg daily (BPH \u2014 Dr. Patel)\n4. Vitamin D3 1000 IU daily\n5. Multivitamin Senior\n6. Acetaminophen 500mg PRN (OTC)\nFLAGGED:\n7. Hydrocodone-Acetaminophen 5-325mg (ER Dispensing 03/09/2026 \u2014 Dr. Whitfield, Mercy Hospital)\n8. Hydrocodone-Acetaminophen 5-325mg (Refill 03/23/2026 \u2014 Dr. Okonkwo)\nNote: Two opioid prescriptions within 14 days from different prescribers",
    ai_findings: ["ALERT: Opioid prescriptions detected \u2014 Hydrocodone-Acetaminophen", "Initial ER dispensing 03/09 followed by PCP refill 03/23 \u2014 14-day gap", "Two different prescribers for same controlled substance", "Timeline aligns with reported fall/injury date", "No prior opioid history in 9-month lookback \u2014 acute pain management likely", "Cross-reference with discharge records for injury validation"],
    flag_reason: "Multiple opioid prescriptions from different prescribers within 14 days",
    json_schema: { documentType: "Surescripts_Medication_History", format: "CSV", pbm: "OptumRx", patient: { name: "Robert Hargrove", dob: "1951-11-03", policy: "LTC-912-6037B" }, period: "Q3-2025 to Q1-2026", activeMedications: [{ drug: "Lisinopril 20mg", class: "ACE Inhibitor" }, { drug: "Atorvastatin 40mg", class: "Statin" }, { drug: "Tamsulosin 0.4mg", class: "Alpha-1 Blocker" }], controlledSubstances: [{ drug: "Hydrocodone-Acetaminophen 5-325mg", schedule: "II", firstFill: "2026-03-09", prescriber: "Dr. James Whitfield (Mercy ER)", secondFill: "2026-03-23", prescriber2: "Dr. Margaret Okonkwo" }], opioidFlag: true, multiPrescriberAlert: true },
  },
  {
    id: "doc-h9", claim_id: "claim-002", name: "Provider_Directory_Export.pdf", type: "other", day: 3, status: "processed", vector_affected: "documentation",
    extracted_text: "ACME INSURANCE \u2014 IN-NETWORK PROVIDER DIRECTORY EXPORT\nSearch: Physical Therapy near Peoria, IL 61602 (within 20 miles)\nFor Patient: Robert J Hargrove | Policy: LTC-912-6037B\nResults: 15 providers found\n\nTop Matches:\n1. Dr. Angela Kim, DPT \u2014 Peoria Physical Therapy Associates (3.2 mi, Tier 1 Preferred)\n2. Emily Dawson, DPT \u2014 Riverfront Rehabilitation Center (4.8 mi, Tier 1 Preferred)\n3. Thomas Bradley, DPT \u2014 Central IL Physical Therapy (5.3 mi, Tier 1 Preferred)\n...\nAll providers accepting new patients. Specialties: Geriatric PT, Home Health PT, Fall Prevention.",
    ai_findings: ["15 in-network PT providers within 20 miles of patient", "Multiple Tier 1 Preferred options available", "Home Health PT specialty available \u2014 relevant for wheelchair-dependent patient", "Provider availability confirmed \u2014 no access barriers", "Generated for care coordination planning"],
    json_schema: { documentType: "Provider_Directory_Export", searchCriteria: { specialty: "Physical Therapy", location: "Peoria, IL 61602", radius: "20 miles" }, patient: { name: "Robert J Hargrove", policy: "LTC-912-6037B" }, resultCount: 15, topProviders: [{ name: "Dr. Angela Kim, DPT", practice: "Peoria Physical Therapy Associates", distance: "3.2 mi", tier: "Tier 1 Preferred" }, { name: "Emily Dawson, DPT", practice: "Riverfront Rehabilitation Center", distance: "4.8 mi", tier: "Tier 1 Preferred" }] },
  },
  {
    id: "doc-h10", claim_id: "claim-002", name: "Policy_Master_Robert_LTC9126037B.pdf", type: "other", day: 1, status: "processed", vector_affected: "documentation",
    extracted_text: "ACME INSURANCE \u2014 POLICY MASTER DOCUMENT\nPolicy: LTC-912-6037B\nInsured: Robert J Hargrove\nType: Long Term Care \u2014 Individual\nEffective: 03/15/2012\nStatus: ACTIVE\nDaily Benefit: $200.00 (Adjusted 2026: $296.18)\nElimination Period: 60 Days\nBenefit Period: 5 Years",
    ai_findings: ["Policy master document confirms coverage details", "Consistent with AS400 extract", "All policy terms verified"],
    json_schema: { documentType: "Policy_Master", policyNumber: "LTC-912-6037B", insured: "Robert J Hargrove", status: "ACTIVE" },
  },
  // Chen documents (independent PDFs)
  {
    id: "doc-c1", claim_id: "claim-003", name: "Policy.pdf", type: "other", day: 1, status: "processed", vector_affected: "documentation",
    extracted_text: "INSURANCE POLICY DOCUMENT\nPolicy details for Margaret Chen case.\nLong Term Care \u2014 Individual Policy.\nCoverage and benefit terms outlined.",
    ai_findings: ["Policy document uploaded for claim-003", "Coverage terms to be verified"],
    json_schema: { documentType: "Policy_Document", claimId: "claim-003" },
  },
  {
    id: "doc-c2", claim_id: "claim-003", name: "Claim_Form.pdf", type: "intake", day: 1, status: "processed", vector_affected: "clinical",
    extracted_text: "CLAIM FORM\nClaim submission form for Margaret Chen.\nLong Term Care benefits claim.\nDocumentation of ADL deficits and care needs.",
    ai_findings: ["Claim form submitted for claim-003", "ADL documentation to be reviewed"],
    json_schema: { documentType: "Claim_Form", claimId: "claim-003" },
  },
  {
    id: "doc-c3", claim_id: "claim-003", name: "BEA.pdf", type: "medical", day: 2, status: "processed", vector_affected: "clinical",
    extracted_text: "BENEFIT ELIGIBILITY ASSESSMENT (BEA)\nAssessment of benefit eligibility for Margaret Chen.\nFunctional assessment and clinical evaluation results.",
    ai_findings: ["BEA document uploaded", "Eligibility assessment to be reviewed"],
    json_schema: { documentType: "Benefit_Eligibility_Assessment", claimId: "claim-003" },
  },
  {
    id: "doc-c4", claim_id: "claim-003", name: "Plan_of_Care.pdf", type: "care_plan", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "PLAN OF CARE\nCare plan for Margaret Chen.\nDetailed care instructions, therapy schedule, and provider coordination.",
    ai_findings: ["Plan of care documented", "Care coordination details to be verified"],
    json_schema: { documentType: "Plan_of_Care", claimId: "claim-003" },
  },
  {
    id: "doc-c5", claim_id: "claim-003", name: "Invoices_and_Daily_Visit_Notes.pdf", type: "medical", day: 4, status: "processed", vector_affected: "documentation",
    extracted_text: "INVOICES AND DAILY VISIT NOTES\nCaregiver visit records and billing invoices for Margaret Chen.\nDaily care activities, time logs, and service charges.",
    ai_findings: ["Invoice and visit notes documented", "Billing details to be verified against care plan"],
    json_schema: { documentType: "Invoices_and_Visit_Notes", claimId: "claim-003" },
  },
  // Torres documents
  {
    id: "doc-t1", claim_id: "claim-004", name: "AH_Intake_Form_040926.pdf", type: "intake", day: 1, status: "processed", vector_affected: "clinical",
    extracted_text: "Patient: William Torres, 65M. Accident Type: Motor Vehicle Collision. Primary Dx: Cervical Spine Injury (S14.109A). Date of Accident: 04/05/2026. Emergency Treatment: Regional Medical Center. Status: Post-surgical, C5-C6 fusion.",
    ai_findings: ["Accident report filed within 4 days \u2014 within window", "Surgical intervention documented", "MVC \u2014 standard A&H claim pathway"],
    json_schema: { documentType: "AH_Intake_Form", patient: { name: "William Torres", age: 65, gender: "M" }, accidentType: "Motor Vehicle Collision", dateOfAccident: "2026-04-05", primaryDiagnosis: { code: "S14.109A", description: "Cervical Spine Injury" }, emergencyTreatment: { facility: "Regional Medical Center", procedure: "C5-C6 fusion" } },
  },
  {
    id: "doc-t2", claim_id: "claim-004", name: "Police_Report_040526.pdf", type: "other", day: 1, status: "processed", vector_affected: "documentation",
    extracted_text: "POLICE ACCIDENT REPORT\nCase #: 2026-MVC-04417\nDate: 04/05/2026\nLocation: Intersection of Oak St & Main Ave\nVehicle 1 Driver: William Torres\nVehicle 2 Driver: Jane Morrison\nFault Determination: Vehicle 2 (Morrison) \u2014 ran red light\nInjuries Reported: Torres \u2014 neck/spine, transported to ER",
    ai_findings: ["Police report confirms accident details", "Fault: Other party (Morrison)", "Injuries consistent with diagnosis", "Report filed same day as accident"],
    json_schema: { documentType: "Police_Report", caseNumber: "2026-MVC-04417", dateOfIncident: "2026-04-05", location: "Intersection of Oak St & Main Ave", parties: [{ name: "William Torres", vehicle: 1, fault: "Not at fault" }, { name: "Jane Morrison", vehicle: 2, fault: "At fault \u2014 ran red light" }], injuriesReported: "Torres \u2014 neck/spine, transported to ER" },
  },
  {
    id: "doc-t3", claim_id: "claim-004", name: "Surgical_Notes_040726.pdf", type: "medical", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "SURGICAL NOTES \u2014 William Torres\nProcedure: Anterior Cervical Discectomy & Fusion (C5-C6)\nDate: 04/07/2026\nSurgeon: Dr. Michael Chen, MD\nFindings: Herniated disc at C5-C6 with nerve root compression\nComplications: None\nPost-op: Cervical collar x 6 weeks, PT referral",
    ai_findings: ["Surgical procedure confirmed C5-C6 fusion", "No complications noted", "Recovery plan documented", "Consistent with ER admission records"],
    json_schema: { documentType: "Surgical_Notes", patient: { name: "William Torres" }, procedure: "Anterior Cervical Discectomy & Fusion (C5-C6)", procedureDate: "2026-04-07", surgeon: "Dr. Michael Chen, MD", findings: "Herniated disc at C5-C6 with nerve root compression", complications: "None", postOpPlan: ["Cervical collar x 6 weeks", "Physical therapy referral"] },
  },
  // Langston documents
  {
    id: "doc-l1", claim_id: "claim-005", name: "LTC_Intake_Form_040726.pdf", type: "intake", day: 1, status: "processed", vector_affected: "clinical",
    extracted_text: "Patient: Dorothy Langston, 86F. Primary Dx: Stroke/CVA (I63.9). Onset: 03/20/2026. ADL Deficits: All 6 ADLs affected \u2014 Bathing, Dressing, Eating, Toileting, Transferring, Continence. Left-side hemiparesis. Speech: Moderate expressive aphasia.",
    ai_findings: ["ADL deficit count: 6 of 6 \u2014 maximum impairment", "Left-side hemiparesis documented", "Moderate expressive aphasia \u2014 communication barrier", "High-acuity clinical profile"],
    json_schema: { documentType: "LTC_Intake_Form", patient: { name: "Dorothy Langston", age: 86, gender: "F" }, primaryDiagnosis: { code: "I63.9", description: "Stroke / CVA" }, onsetDate: "2026-03-20", adlDeficits: ["Bathing", "Dressing", "Eating", "Toileting", "Transferring", "Continence"], neurologicalFindings: { hemiparesis: "Left side", aphasia: "Moderate expressive" } },
  },
  {
    id: "doc-l2", claim_id: "claim-005", name: "Rehab_Progress_Notes_040826.pdf", type: "medical", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "REHABILITATION PROGRESS NOTES\nPatient: Dorothy Langston\nFacility: Sunrise Rehab Center\nAdmit: 03/25/2026\nProgress: Minimal improvement in left-side strength\nSpeech Therapy: Moderate progress in word retrieval\nFIM Score: 42/126 (severe functional limitation)\nDischarge Plan: Not yet appropriate for discharge",
    ai_findings: ["FIM Score 42/126 \u2014 severe functional limitation", "Minimal motor recovery", "Not discharge-ready", "Consistent with stroke severity"],
    json_schema: { documentType: "Rehab_Progress_Notes", patient: { name: "Dorothy Langston" }, facility: "Sunrise Rehab Center", admitDate: "2026-03-25", fimScore: { score: 42, maxScore: 126, interpretation: "Severe functional limitation" }, motorRecovery: "Minimal", speechProgress: "Moderate \u2014 word retrieval improving", dischargeRecommendation: "Not appropriate \u2014 continued inpatient rehab" },
  },
  {
    id: "doc-l3", claim_id: "claim-005", name: "Family_Care_Agreement_041026.pdf", type: "other", day: 5, status: "flagged", vector_affected: "discrepancy",
    extracted_text: "FAMILY CARE AGREEMENT\nFamily Contact: Robert Langston (son)\nAgreement: Family will provide supplemental care\nNote: Son reports mother was 'already needing help before the stroke'\nPre-existing condition concern flagged by intake team\nPrior PCP records requested but not yet received",
    ai_findings: ["Son's statement suggests pre-existing care needs", "Pre-stroke functional status unclear", "PCP records requested \u2014 pending", "Potential pre-existing condition impact on coverage"],
    flag_reason: "Pre-existing care needs reported \u2014 prior medical records pending",
    json_schema: { documentType: "Family_Care_Agreement", patient: { name: "Dorothy Langston" }, familyContact: { name: "Robert Langston", relationship: "Son" }, supplementalCare: true, preExistingConcern: true, sonStatement: "Mother was already needing help before the stroke", pendingRecords: ["PCP records \u2014 pre-stroke functional assessment"] },
  },
  // Abernathy documents
  {
    id: "doc-a1", claim_id: "claim-006", name: "LTC_Intake_Form_040626.pdf", type: "intake", day: 1, status: "processed", vector_affected: "clinical",
    extracted_text: "Patient: Frank Abernathy, 73M. Primary Dx: ALS / Amyotrophic Lateral Sclerosis (G12.21). Onset: 2025. ADL Deficits: Bathing, Dressing, Eating (progressive). Current: Wheelchair-dependent, PEG tube for nutrition. Elimination Period: 90-day \u2014 SATISFIED.",
    ai_findings: ["ALS diagnosis confirmed \u2014 progressive motor neuron disease", "3 ADL deficits documented", "PEG tube indicates advanced stage", "Elimination period: SATISFIED"],
    json_schema: { documentType: "LTC_Intake_Form", patient: { name: "Frank Abernathy", age: 73, gender: "M" }, primaryDiagnosis: { code: "G12.21", description: "ALS / Amyotrophic Lateral Sclerosis" }, onsetYear: "2025", adlDeficits: ["Bathing", "Dressing", "Eating"], mobilityStatus: "Wheelchair-dependent", nutritionSupport: "PEG tube", eliminationPeriod: { days: 90, status: "SATISFIED" } },
  },
  {
    id: "doc-a2", claim_id: "claim-006", name: "Neurologist_Report_040726.pdf", type: "medical", day: 2, status: "processed", vector_affected: "clinical",
    extracted_text: "NEUROLOGY CONSULTATION\nPatient: Frank Abernathy\nDx: ALS (G12.21) \u2014 diagnosed 2025\nCurrent Status: Bulbar and limb onset\nFVC: 52% predicted (declining)\nSpeech: Moderate dysarthria\nMobility: Power wheelchair\nPrognosis: Progressive, life-limiting. Palliative care initiated.",
    ai_findings: ["ALS confirmed \u2014 bulbar and limb onset", "FVC 52% \u2014 respiratory decline", "Palliative care initiated", "Clear-cut clinical picture"],
    json_schema: { documentType: "Neurology_Consultation", patient: { name: "Frank Abernathy" }, diagnosis: "ALS (G12.21) \u2014 Bulbar and limb onset", respiratoryFunction: { fvc: "52% predicted", trend: "Declining" }, speech: "Moderate dysarthria", mobility: "Power wheelchair", prognosis: "Progressive, life-limiting", palliativeCare: true },
  },
  // Voss documents
  {
    id: "doc-v1", claim_id: "claim-007", name: "AH_Intake_Form_040526.pdf", type: "intake", day: 1, status: "processed", vector_affected: "clinical",
    extracted_text: "Patient: Eleanor Voss, 67F. Accident Type: Fall \u2014 reported workplace injury. Primary Dx: Traumatic Brain Injury (S06.309A). Date of Injury: 03/28/2026. ER Visit: Same day. Loss of consciousness reported (~5 min). GCS at admission: 13.",
    ai_findings: ["TBI with LOC \u2014 moderate severity", "GCS 13 at admission", "Workplace injury \u2014 workers comp interaction possible", "Requires detailed investigation"],
    json_schema: { documentType: "AH_Intake_Form", patient: { name: "Eleanor Voss", age: 67, gender: "F" }, accidentType: "Fall \u2014 workplace injury", dateOfInjury: "2026-03-28", primaryDiagnosis: { code: "S06.309A", description: "Traumatic Brain Injury" }, lossOfConsciousness: { reported: true, duration: "~5 minutes" }, glasgowComaScale: 13 },
  },
  {
    id: "doc-v2", claim_id: "claim-007", name: "Employer_Incident_Report_032826.pdf", type: "other", day: 2, status: "flagged", vector_affected: "discrepancy",
    extracted_text: "EMPLOYER INCIDENT REPORT\nCompany: Meridian Corp\nEmployee: Eleanor Voss\nDate: 03/28/2026\nLocation: Warehouse Floor B\nDescription: Employee found on floor near shelving unit\nWitnesses: NONE\nSupervisor Note: Employee was not scheduled for Warehouse Floor B\nCCTV: Camera in sector was non-operational",
    ai_findings: ["DISCREPANCY: No witnesses to fall", "Employee not scheduled for accident location", "CCTV conveniently non-operational", "Multiple circumstantial red flags for fabricated claim"],
    flag_reason: "No witnesses, unscheduled location, non-operational CCTV \u2014 potential fabrication",
    json_schema: { documentType: "Employer_Incident_Report", company: "Meridian Corp", employee: { name: "Eleanor Voss" }, incidentDate: "2026-03-28", location: "Warehouse Floor B", witnesses: [], cctvStatus: "Non-operational", supervisorNote: "Employee was not scheduled for Warehouse Floor B", redFlags: ["No witnesses", "Unscheduled location", "CCTV non-operational"] },
  },
  {
    id: "doc-v3", claim_id: "claim-007", name: "Medical_Records_040126.pdf", type: "medical", day: 4, status: "flagged", vector_affected: "discrepancy",
    extracted_text: "MEDICAL RECORDS SUMMARY \u2014 Eleanor Voss\nER Visit 1: 10/15/2024 \u2014 Head injury, fall at home\nER Visit 2: 03/02/2025 \u2014 Concussion, slip at grocery store\nER Visit 3: 09/18/2025 \u2014 Head laceration, fell down stairs\nCurrent: 03/28/2026 \u2014 TBI, workplace fall\nPattern: 4 head injuries in 18 months\nPrior Workers Comp Claim: 2024 (different employer)",
    ai_findings: ["CRITICAL: 3 prior ER visits for head injury in 18 months", "Repeated injury pattern is a strong fraud indicator", "Prior workers comp claim on file (2024)", "CT scan negative despite reported LOC \u2014 inconsistency"],
    flag_reason: "Repeated head injury pattern (4 in 18 months) + prior workers comp claim",
    json_schema: { documentType: "Medical_Records_Summary", patient: { name: "Eleanor Voss" }, priorERVisits: [{ date: "2024-10-15", reason: "Head injury, fall at home" }, { date: "2025-03-02", reason: "Concussion, slip at grocery store" }, { date: "2025-09-18", reason: "Head laceration, fell down stairs" }], currentIncident: { date: "2026-03-28", reason: "TBI, workplace fall" }, pattern: "4 head injuries in 18 months", priorWorkersComp: { year: 2024, differentEmployer: true }, ctScan: "Negative despite reported LOC" },
  },
  {
    id: "doc-v4", claim_id: "claim-007", name: "Genesys_Transcript_041026.txt", type: "transcript", day: 5, status: "flagged", vector_affected: "behavioral",
    extracted_text: "CALL TRANSCRIPT \u2014 Duration: 18:45\nAgent: \"Can you walk me through what happened?\"\nClaimant: \"I was walking past the shelves and I slipped.\"\nAgent: \"What were you doing on Warehouse Floor B?\"\nClaimant: [pause] \"I... had to check something.\"\nAgent: \"Your supervisor says you weren't scheduled there.\"\nClaimant: \"That's... they must be mistaken.\"\n[DECEPTION INDICATORS: Pauses, contradictions, deflection]\n[AI CONFIDENCE: 82% probability of deceptive narrative]",
    ai_findings: ["High deception probability (82%)", "Contradicts employer incident report", "Unable to explain presence at unscheduled location", "Behavioral pattern: Pauses, deflection, vague answers"],
    flag_reason: "High deception probability in behavioral analysis",
    json_schema: { documentType: "Call_Transcript", source: "Genesys", duration: "18:45", callDate: "2026-04-10", deceptionAnalysis: { probability: 0.82, indicators: ["Pauses", "Contradictions", "Deflection"], confidence: "HIGH" }, keyContradictions: ["Cannot explain presence at unscheduled location", "Contradicts supervisor statement"] },
  },
  // Kimura documents
  {
    id: "doc-k1", claim_id: "claim-008", name: "LTC_Intake_Form_032026.pdf", type: "intake", day: 1, status: "processed", vector_affected: "clinical",
    extracted_text: "Patient: Harold Kimura, 88M. Primary Dx: Dementia, Unspecified (F03.90). ADL Deficits: Bathing, Dressing, Toileting. Behavioral Symptoms: Sundowning, nighttime wandering. Caregiver: Yuki Tanaka (granddaughter). Elimination Period: 90-day \u2014 SATISFIED. Policy Active Since: 2012 (14 years).",
    ai_findings: ["3 ADL deficits documented", "Behavioral symptoms consistent with moderate-severe dementia", "Long-standing policy (14 years)", "Elimination period: SATISFIED"],
    json_schema: { documentType: "LTC_Intake_Form", patient: { name: "Harold Kimura", age: 88, gender: "M" }, primaryDiagnosis: { code: "F03.90", description: "Dementia, Unspecified" }, adlDeficits: ["Bathing", "Dressing", "Toileting"], behavioralSymptoms: ["Sundowning", "Nighttime wandering"], caregiver: { name: "Yuki Tanaka", relationship: "Granddaughter" }, eliminationPeriod: { days: 90, status: "SATISFIED" }, policyActiveSince: "2012" },
  },
  {
    id: "doc-k2", claim_id: "claim-008", name: "PCP_Records_032526.pdf", type: "medical", day: 3, status: "processed", vector_affected: "clinical",
    extracted_text: "PRIMARY CARE RECORDS \u2014 Harold Kimura\nVisit: 03/25/2026\nDx: Dementia, moderate-to-severe\nMMSE: 12/30\nMedications: Donepezil 10mg, Memantine 10mg\nBehavioral: Sundowning, wandering (door alarms installed)\nCaregiver: Granddaughter provides daily care\nPlan: Continue home care, safety assessment ordered",
    ai_findings: ["MMSE 12/30 \u2014 moderate-severe cognitive impairment", "Appropriate medications prescribed", "Safety measures in place (door alarms)", "Documentation: COMPLETE"],
    json_schema: { documentType: "PCP_Records", patient: { name: "Harold Kimura" }, visitDate: "2026-03-25", diagnosis: "Dementia, moderate-to-severe", cognitiveAssessment: { test: "MMSE", score: 12, maxScore: 30 }, medications: ["Donepezil 10mg", "Memantine 10mg"], behavioralManagement: { sundowning: true, wandering: true, safetyMeasures: ["Door alarms"] }, plan: ["Continue home care", "Safety assessment ordered"] },
  },
];

const auditHistory = [
  // Pendelton
  { claim_id: "claim-001", timestamp: "2026-04-01T09:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated", user_name: "System" },
  { claim_id: "claim-001", timestamp: "2026-04-01T09:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 12/100", score_change_from: 0, score_change_to: 12 },
  { claim_id: "claim-001", timestamp: "2026-04-03T14:00:00Z", action: "DOC_UPLOADED", detail: "Neurologist_Report_040326.pdf processed", user_name: "System" },
  { claim_id: "claim-001", timestamp: "2026-04-03T14:01:00Z", action: "AI_SCORING", detail: "Score updated after neurologist report", score_change_from: 12, score_change_to: 14 },
  { claim_id: "claim-001", timestamp: "2026-04-04T10:00:00Z", action: "DOC_UPLOADED", detail: "Claimant_Personal_Statement_HW_040426.pdf \u2014 Handwriting OCR processed at 87% confidence", user_name: "System" },
  { claim_id: "claim-001", timestamp: "2026-04-05T11:00:00Z", action: "DOC_UPLOADED", detail: "PCP_Medical_Records_040526.pdf processed \u2014 All documentation complete", user_name: "System" },
  { claim_id: "claim-001", timestamp: "2026-04-05T11:01:00Z", action: "AI_SCORING", detail: "Final score: 15/100 \u2014 Low complexity", score_change_from: 14, score_change_to: 15 },
  { claim_id: "claim-001", timestamp: "2026-04-05T11:02:00Z", action: "APPROVED", detail: "Claim approved after human-based review. Routed to Junior Adjuster for final sign-off.", user_name: "AI Engine" },
  // Hargrove
  { claim_id: "claim-002", timestamp: "2026-04-10T08:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated \u2014 high-acuity intake", user_name: "System" },
  { claim_id: "claim-002", timestamp: "2026-04-10T08:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 35/100", score_change_from: 0, score_change_to: 35 },
  { claim_id: "claim-002", timestamp: "2026-04-15T10:00:00Z", action: "DOC_UPLOADED", detail: "Epic_Discharge_Summary \u2014 CRITICAL: Missing pages detected", user_name: "System" },
  { claim_id: "claim-002", timestamp: "2026-04-15T10:01:00Z", action: "AI_SCORING", detail: "Score spike: Missing discharge pages 2-4", score_change_from: 35, score_change_to: 68 },
  { claim_id: "claim-002", timestamp: "2026-04-18T14:00:00Z", action: "DOC_UPLOADED", detail: "RightFax_CarePlan \u2014 Low OCR confidence (62%)", user_name: "System" },
  { claim_id: "claim-002", timestamp: "2026-04-18T14:05:00Z", action: "DISCREPANCY_DETECTED", detail: "Wheelchair reference contradicts archived care plan (independent ambulation)", user_name: "AI Engine" },
  { claim_id: "claim-002", timestamp: "2026-04-18T14:06:00Z", action: "AI_SCORING", detail: "Score updated: Discrepancy vector critical", score_change_from: 68, score_change_to: 88 },
  { claim_id: "claim-002", timestamp: "2026-04-20T09:00:00Z", action: "DOC_UPLOADED", detail: "Genesys_Transcript \u2014 Behavioral inconsistency flagged", user_name: "System" },
  { claim_id: "claim-002", timestamp: "2026-04-20T09:01:00Z", action: "AI_SCORING", detail: "Final score: 98/100 \u2014 Critical complexity", score_change_from: 88, score_change_to: 98 },
  { claim_id: "claim-002", timestamp: "2026-04-20T09:02:00Z", action: "ESCALATED", detail: "Auto-escalated to Tier 2 Clinical Investigator (Dr. Karen Volkov)", user_name: "AI Engine" },
  { claim_id: "claim-002", timestamp: "2026-04-20T09:03:00Z", action: "FATAL_OVERRIDE", detail: "Fatal override triggered: DIRECT_CONTRADICTION + Score > 90 \u2192 Tier 2 Clinical", user_name: "Rules Engine" },
  // Chen
  { claim_id: "claim-003", timestamp: "2026-04-08T10:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated", user_name: "System" },
  { claim_id: "claim-003", timestamp: "2026-04-08T10:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 38/100", score_change_from: 0, score_change_to: 38 },
  { claim_id: "claim-003", timestamp: "2026-04-09T11:00:00Z", action: "DOC_UPLOADED", detail: "Neuropsych_Evaluation_040926.pdf processed", user_name: "System" },
  { claim_id: "claim-003", timestamp: "2026-04-09T11:01:00Z", action: "AI_SCORING", detail: "Score updated after neuropsych evaluation", score_change_from: 38, score_change_to: 45 },
  { claim_id: "claim-003", timestamp: "2026-04-10T09:00:00Z", action: "DOC_UPLOADED", detail: "Home_Health_Assessment \u2014 medication records incomplete", user_name: "System" },
  { claim_id: "claim-003", timestamp: "2026-04-10T09:01:00Z", action: "AI_SCORING", detail: "Score updated: documentation gap detected", score_change_from: 45, score_change_to: 52 },
  // Torres
  { claim_id: "claim-004", timestamp: "2026-04-09T15:00:00Z", action: "CLAIM_CREATED", detail: "New A&H claim initiated \u2014 motor vehicle collision", user_name: "System" },
  { claim_id: "claim-004", timestamp: "2026-04-09T15:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 30/100", score_change_from: 0, score_change_to: 30 },
  { claim_id: "claim-004", timestamp: "2026-04-09T15:30:00Z", action: "DOC_UPLOADED", detail: "Police_Report_040526.pdf processed \u2014 fault confirmed other party", user_name: "System" },
  { claim_id: "claim-004", timestamp: "2026-04-10T10:00:00Z", action: "DOC_UPLOADED", detail: "Surgical_Notes_040726.pdf processed", user_name: "System" },
  { claim_id: "claim-004", timestamp: "2026-04-10T10:01:00Z", action: "AI_SCORING", detail: "Score updated after surgical notes review", score_change_from: 30, score_change_to: 41 },
  // Langston
  { claim_id: "claim-005", timestamp: "2026-04-07T08:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated \u2014 post-stroke", user_name: "System" },
  { claim_id: "claim-005", timestamp: "2026-04-07T08:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 48/100", score_change_from: 0, score_change_to: 48 },
  { claim_id: "claim-005", timestamp: "2026-04-08T11:00:00Z", action: "DOC_UPLOADED", detail: "Rehab_Progress_Notes processed \u2014 FIM 42/126", user_name: "System" },
  { claim_id: "claim-005", timestamp: "2026-04-08T11:01:00Z", action: "AI_SCORING", detail: "Score updated after rehab notes", score_change_from: 48, score_change_to: 58 },
  { claim_id: "claim-005", timestamp: "2026-04-10T14:00:00Z", action: "DOC_UPLOADED", detail: "Family_Care_Agreement \u2014 pre-existing concern flagged", user_name: "System" },
  { claim_id: "claim-005", timestamp: "2026-04-10T14:01:00Z", action: "AI_SCORING", detail: "Score increased: pre-existing condition concern", score_change_from: 58, score_change_to: 67 },
  { claim_id: "claim-005", timestamp: "2026-04-10T14:02:00Z", action: "DISCREPANCY_DETECTED", detail: "Son reports pre-existing care needs \u2014 prior records pending", user_name: "AI Engine" },
  // Abernathy
  { claim_id: "claim-006", timestamp: "2026-04-06T09:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated \u2014 ALS diagnosis", user_name: "System" },
  { claim_id: "claim-006", timestamp: "2026-04-06T09:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 18/100", score_change_from: 0, score_change_to: 18 },
  { claim_id: "claim-006", timestamp: "2026-04-07T10:00:00Z", action: "DOC_UPLOADED", detail: "Neurologist_Report processed \u2014 ALS confirmed", user_name: "System" },
  { claim_id: "claim-006", timestamp: "2026-04-07T10:01:00Z", action: "AI_SCORING", detail: "Score updated: clear clinical picture", score_change_from: 18, score_change_to: 22 },
  { claim_id: "claim-006", timestamp: "2026-04-08T08:00:00Z", action: "APPROVED", detail: "Claim approved after human-based review \u2014 progressive terminal diagnosis, complete documentation", user_name: "AI Engine" },
  // Voss
  { claim_id: "claim-007", timestamp: "2026-04-05T10:00:00Z", action: "CLAIM_CREATED", detail: "New A&H claim initiated \u2014 workplace fall", user_name: "System" },
  { claim_id: "claim-007", timestamp: "2026-04-05T10:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 42/100", score_change_from: 0, score_change_to: 42 },
  { claim_id: "claim-007", timestamp: "2026-04-06T14:00:00Z", action: "DOC_UPLOADED", detail: "Employer_Incident_Report \u2014 multiple red flags detected", user_name: "System" },
  { claim_id: "claim-007", timestamp: "2026-04-06T14:01:00Z", action: "DISCREPANCY_DETECTED", detail: "No witnesses, unscheduled location, non-operational CCTV", user_name: "AI Engine" },
  { claim_id: "claim-007", timestamp: "2026-04-06T14:02:00Z", action: "AI_SCORING", detail: "Score spike: circumstantial red flags", score_change_from: 42, score_change_to: 72 },
  { claim_id: "claim-007", timestamp: "2026-04-08T09:00:00Z", action: "DOC_UPLOADED", detail: "Medical_Records \u2014 prior head injury pattern detected", user_name: "System" },
  { claim_id: "claim-007", timestamp: "2026-04-08T09:01:00Z", action: "AI_SCORING", detail: "Score increased: repeated injury pattern", score_change_from: 72, score_change_to: 85 },
  { claim_id: "claim-007", timestamp: "2026-04-10T11:00:00Z", action: "DOC_UPLOADED", detail: "Genesys_Transcript \u2014 high deception probability", user_name: "System" },
  { claim_id: "claim-007", timestamp: "2026-04-10T11:01:00Z", action: "AI_SCORING", detail: "Final score: 91/100 \u2014 Critical", score_change_from: 85, score_change_to: 91 },
  { claim_id: "claim-007", timestamp: "2026-04-10T11:02:00Z", action: "ESCALATED", detail: "Auto-escalated to SIU Fraud Unit", user_name: "AI Engine" },
  { claim_id: "claim-007", timestamp: "2026-04-10T11:03:00Z", action: "FATAL_OVERRIDE", detail: "Fatal override: Repeated injury pattern + Score > 90 \u2192 SIU", user_name: "Rules Engine" },
  // Kimura
  { claim_id: "claim-008", timestamp: "2026-03-20T09:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated \u2014 dementia", user_name: "System" },
  { claim_id: "claim-008", timestamp: "2026-03-20T09:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 15/100", score_change_from: 0, score_change_to: 15 },
  { claim_id: "claim-008", timestamp: "2026-03-25T10:00:00Z", action: "DOC_UPLOADED", detail: "PCP_Records processed \u2014 MMSE 12/30", user_name: "System" },
  { claim_id: "claim-008", timestamp: "2026-03-25T10:01:00Z", action: "AI_SCORING", detail: "Score updated after PCP records", score_change_from: 15, score_change_to: 18 },
  { claim_id: "claim-008", timestamp: "2026-04-01T08:00:00Z", action: "APPROVED", detail: "Claim approved after human-based review \u2014 straightforward dementia case", user_name: "AI Engine" },
  { claim_id: "claim-008", timestamp: "2026-04-02T09:00:00Z", action: "CLAIM_CLOSED", detail: "Claim closed \u2014 benefits initiated", user_name: "Amy Richards" },
];

const skillSets = [
  { id: "skill-1", name: "Junior Adjuster", description: "Handles low-complexity, approved claims requiring administrative sign-off", min_score: 0, max_score: 30, user_count: 12, capacity_free: 68, color: "#22C55E" },
  { id: "skill-2", name: "Senior Adjuster", description: "Reviews moderate-complexity claims with minor documentation gaps", min_score: 31, max_score: 60, user_count: 8, capacity_free: 42, color: "#F59E0B" },
  { id: "skill-3", name: "Tier 2 Clinical Investigator", description: "Investigates high-complexity claims with clinical discrepancies", min_score: 61, max_score: 90, user_count: 4, capacity_free: 25, color: "#E8792B" },
  { id: "skill-4", name: "SIU Fraud Unit", description: "Handles critical-complexity claims with potential fraud indicators", min_score: 91, max_score: 100, user_count: 3, capacity_free: 33, color: "#EF4444" },
];

const assessments = [
  // Claim-001 (Pendelton) — clean case, single assessment (real EngaigeQ output)
  {
    id: "assess-p1",
    claim_id: "claim-001",
    label: "Initial Assessment",
    assessment_date: "2026-04-08",
    trigger: "Initial Intake",
    complexity_score: 13,
    vector_clinical: 10,
    vector_documentation: 5,
    vector_discrepancy: 0,
    vector_behavioral: 0,
    vector_clinical_label: "STABLE",
    vector_documentation_label: "COMPLETE",
    vector_discrepancy_label: "NO CONTRADICTION",
    vector_behavioral_label: "CALM",
    system_recommendation: "APPROVE CLAIM",
    score_driver: "All clinical, functional, and documentation criteria are met with no discrepancies or exclusions; claimant demonstrates \u22652 ADL deficits with stable medical status.",
    routing_rationale: "Complexity score of 13 falls within the Junior Adjuster threshold (0-31); Sarah Chen is underutilized (13.3% capacity) and available for immediate assignment, with no escalation triggers present.",
    contract_status: "ACTIVE + 04/08/2026 06:00:03 CST",
    elimination_period: "95 Days Elapsed / 90 Days Required",
    exclusions: "No relevant exclusions detected",
    summary: "Arthur Pendelton, an 80-year-old male with idiopathic Parkinson\u2019s disease (Hoehn and Yahr Stage II), is seeking benefits under a Comprehensive LTC - Plan B policy. The claim is supported by consistent documentation confirming moderate to maximum assistance required for bathing, dressing, and transferring, with no cognitive impairment. All policy, clinical, and procedural requirements are satisfied, and there are no discrepancies or behavioral escalation risks identified.",
    risk_indicators: [
      "No active discrepancies or critical alerts identified."
    ],
    recommended_action: "Initiate benefit payments per policy terms, retroactive to the date Elimination Period was satisfied (04/02/2026). Schedule standard 90-day clinical re-certification review; monitor for any change in ADL status or care environment.",
    confidence_pct: 96.2,
    documents_analyzed: 10,
    clinical_profile_md: "### Verified Primary Diagnoses\n- Idiopathic Parkinson\u2019s disease (Hoehn and Yahr Stage II)\n- Essential Hypertension\n- Hyperlipidemia\n\n### ADL Deficits Requiring Assistance\n- **Bathing** \u2014 Moderate hands-on assist [VNA_Field_Data_Export_v2.csv]\n- **Dressing** \u2014 Moderate hands-on assist [VNA_Field_Data_Export_v2.csv]\n- **Transferring** \u2014 Maximum hands-on assist [VNA_Field_Data_Export_v2.csv]\n\n### Cognitive Status\nNo formal cognitive impairment; MMSE 29/30, fully oriented, normal clock-drawing [EHR_Voice_Trans_ID88492.txt]\n\n### Active Care & Living Status\n- Receives skilled nursing and home health aide services via Springfield Home Health Partners\n- Lives with spouse (wife is primary informal caregiver)\n- No major DME in use; referrals for PT/OT initiated",
    ai_output_md: null,
  },
  // Claim-002 (Hargrove) — complex case, TWO assessments (real EngaigeQ output)
  {
    id: "assess-h1",
    claim_id: "claim-002",
    label: "Initial Assessment",
    assessment_date: "2026-04-10",
    trigger: "Initial Intake",
    complexity_score: 80,
    vector_clinical: 65,
    vector_documentation: 70,
    vector_discrepancy: 95,
    vector_behavioral: 10,
    vector_clinical_label: "SEVERE_DECLINE",
    vector_documentation_label: "EXPIRED_RECENCY",
    vector_discrepancy_label: "DIRECT_CONTRADICTION",
    vector_behavioral_label: "CALM",
    system_recommendation: "PENDING FOR INFORMATION",
    score_driver: "Direct contradiction between claimant self-report and medical documentation, compounded by missing critical records and lack of a contemporaneous ADL assessment.",
    routing_rationale: "The case complexity (score 80) and the presence of severe clinical volatility, direct evidence contradiction, and documentation gaps require assignment to a Tier 2 Clinical Investigator with expertise in orthopedics and mobility discrepancies. Dr. Volkov is under capacity and matches the case\u2019s risk profile, ensuring prompt and expert adjudication.",
    contract_status: "ACTIVE + 04/08/2026 06:00:03 CST",
    elimination_period: "120 Days Elapsed / 90 Days Required",
    exclusions: "No relevant exclusions detected. Family care provider flag noted; policy excludes reimbursement for services by immediate family unless through a licensed agency.",
    summary: "Robert J. Hargrove, a 74-year-old male with a history of hypertension, hyperlipidemia, BPH, and bilateral knee osteoarthritis, initiated a long-term care claim following a mechanical fall at home on 03/09/2026. He self-reports new dependence on a wheelchair and need for assistance with bathing and transferring. However, medical records from the ED and subsequent PCP visit do not corroborate this sudden functional decline. The claim is further complicated by missing critical discharge documentation and the absence of a formal, post-fall ADL assessment, necessitating further investigation before benefit determination.",
    risk_indicators: [
      "CRITICAL: Narrative Conflict \u2014 Claimant self-reports being \u201cstuck in a wheelchair\u201d and needing help with transferring (04/05/2026 Intake Form), but ED and PCP records (03/09/2026, 03/18/2026) document only superficial injury and no loss of ambulation or severe functional decline. [Intake Form vs. Epic_Discharge_MH7741903.pdf, RightFax_Inbound_11409.pdf]",
      "CRITICAL: Documentation Gap \u2014 Missing pages (3 and 4) from the ED Discharge Summary likely contain essential nursing and DME notes. No formal ADL assessment or Plan of Care post-fall is present, violating policy requirements for benefit triggers. [Epic_Discharge_MH7741903.pdf]"
    ],
    recommended_action: "Obtain and review missing pages (3 and 4) of the Epic ED Discharge Summary to clarify post-fall functional status and any DME prescriptions. Request a contemporaneous ADL assessment and Plan of Care from a licensed health care practitioner to formally certify the claimant\u2019s inability to perform 2+ ADLs, as required by policy for benefit eligibility.",
    confidence_pct: 82.1,
    documents_analyzed: 9,
    clinical_profile_md: "### Verified Primary Diagnoses\n- Essential hypertension\n- Hyperlipidemia\n- BPH\n- Bilateral knee osteoarthritis\n- Left hip contusion post-fall\n\n### ADL Deficits Requiring Assistance\n- **Bathing** \u2014 Standby/hands-on assist (claimed; not corroborated)\n- **Transferring** \u2014 Hands-on assist (claimed; not corroborated)\n- **Ambulation** \u2014 Claimed unable (wheelchair-bound); medical records indicate independent with cane pre-fall, no post-fall corroboration\n\n### Cognitive Status\nNo formal diagnosis; MMSE 28/30 in 2024; no cognitive or behavioral risks identified\n\n### Active Care & Living Status\n- Lives alone; uses shower seat, single-point cane (pre-fall), wheelchair (self-reported, not medically documented)\n- Daughter provides informal IADL support (meal prep, cleaning)",
    ai_output_md: null,
  },
  // Claim-002 (Hargrove) — Reassessment (real EngaigeQ Delta output)
  {
    id: "assess-h2",
    claim_id: "claim-002",
    label: "Reassessment",
    assessment_date: "2026-04-15",
    trigger: "Document re-upload (Complete Discharge Summary)",
    complexity_score: 59,
    vector_clinical: 65,
    vector_documentation: 25,
    vector_discrepancy: 90,
    vector_behavioral: 15,
    vector_clinical_label: "STABLE",
    vector_documentation_label: "COMPLETE",
    vector_discrepancy_label: "DIRECT_CONTRADICTION",
    vector_behavioral_label: "CALM",
    system_recommendation: "RE-ROUTED",
    score_driver: "Complexity Score decreased and claim re-routed due to closure of documentation gap and emergence of a direct clinical contradiction between hospital records and family report.",
    routing_rationale: "Assignment downgraded from Tier 2 Clinical Investigator (Dr. Karen Volkov) to Senior Adjuster (Patricia Grant) due to reduced complexity and closure of evidentiary gaps.",
    contract_status: "ACTIVE + 04/08/2026 06:00:03 CST",
    elimination_period: "120 Days Elapsed / 90 Days Required",
    exclusions: "No relevant exclusions detected. Family care provider flag noted; policy excludes reimbursement for services by immediate family unless through a licensed agency.",
    summary: "The newly appended Epic_Discharge_MH7741903_New.pdf provides a complete, final, and signed emergency department record for Robert Hargrove\u2019s 03/09/2026 encounter, including detailed clinical findings, imaging, physical therapy assessment, and discharge instructions. This closes the prior gap of missing hospital records but introduces a direct contradiction with the family\u2019s report of severe functional decline, as documented in the Genesys call transcript.",
    risk_indicators: [
      "RESOLVED: The previously missing or incomplete hospital record has been fully satisfied by the new, complete, and authenticated discharge document, eliminating the structural documentation gap that was delaying benefit activation.",
      "CRITICAL: Direct Contradiction \u2014 Hospital discharge assessment documents claimant ambulates 50 feet with a walker, minimal assistance, no wheelchair prescribed. Family reports claimant is non-weight-bearing, requires two-person transfers, and is wheelchair-dependent. This introduces a timeline conflict regarding functional status immediately post-discharge versus current state. [Epic_Discharge_MH7741903_New.pdf vs. Genesys call transcript]"
    ],
    recommended_action: "Initiate Independent Field Assessment: Do not rely solely on verbal testimony to resolve this severity clash. Immediately order a face-to-face, independent Visiting Nurse Association (VNA) evaluation at the claimant\u2019s residence to definitively assess current ADL capabilities, verify wheelchair dependence, and document actual transfer assistance needs. Fax a formal inquiry to the Primary Care Provider (Dr. Margaret Okonkwo) requesting any interim clinical notes generated between the 03/09/2026 hospital discharge and today, specifically inquiring if she formally prescribed the wheelchair the family is currently renting. Do not activate benefit payments until the VNA results are reconciled against the hospital baseline.",
    confidence_pct: 85.4,
    documents_analyzed: 10,
    clinical_profile_md: "### Newly Verified Diagnoses\nNone identified in the new evidence.\n\n### ADL Shifts\nThe hospital record documents the claimant as ambulatory with minimal assistance and no need for a wheelchair at discharge, while the family asserts a total loss of ambulation and need for two-person assistance at home. This represents a severe functional status contradiction requiring further investigation.\n\n### Active Care Updates\nNo new skilled services or DME were prescribed at discharge; specifically, a wheelchair was denied as not medically necessary. The family, however, reports renting a wheelchair and urgent need for home health aide support.",
    ai_output_md: null,
  },
];

const fatalOverrides = [
  { id: "override-1", condition: "Evidence Discrepancy", operator: "==", value: "DIRECT_CONTRADICTION", and_condition: "Total Score", and_operator: ">", and_value: "90", then_action: "Route to Tier 2 Clinical", is_active: true },
  { id: "override-2", condition: "Documentation Completeness", operator: "==", value: "CRITICAL_MISSING_PAGES", and_condition: "Clinical Vector", and_operator: ">", and_value: "60", then_action: "Hold for Manual Review", is_active: true },
  { id: "override-3", condition: "OCR Confidence", operator: "<", value: "70%", and_condition: "Document Type", and_operator: "==", and_value: "DISCHARGE_SUMMARY", then_action: "Request Re-submission", is_active: false },
];

/* ===== SEED FUNCTION ===== */

async function seed() {
  console.log("Starting database seed...\n");

  // Clear existing data (in reverse dependency order)
  console.log("Clearing existing data...");
  await supabase.from("assessments").delete().neq("id", "");
  await supabase.from("audit_history").delete().neq("id", "");
  await supabase.from("documents").delete().neq("id", "");
  await supabase.from("claims").delete().neq("id", "");
  await supabase.from("skill_sets").delete().neq("id", "");
  await supabase.from("fatal_overrides").delete().neq("id", "");
  console.log("  Done.\n");

  // Insert claims
  console.log("Inserting claims...");
  const { error: claimsError } = await supabase.from("claims").insert(claims);
  if (claimsError) {
    console.error("  Error inserting claims:", claimsError.message);
    return;
  }
  console.log(`  Inserted ${claims.length} claims.\n`);

  // Insert documents
  console.log("Inserting documents...");
  const { error: docsError } = await supabase.from("documents").insert(documents);
  if (docsError) {
    console.error("  Error inserting documents:", docsError.message);
    return;
  }
  console.log(`  Inserted ${documents.length} documents.\n`);

  // Insert audit history
  console.log("Inserting audit history...");
  const { error: auditError } = await supabase.from("audit_history").insert(auditHistory);
  if (auditError) {
    console.error("  Error inserting audit history:", auditError.message);
    return;
  }
  console.log(`  Inserted ${auditHistory.length} audit entries.\n`);

  // Insert skill sets
  console.log("Inserting skill sets...");
  const { error: skillError } = await supabase.from("skill_sets").insert(skillSets);
  if (skillError) {
    console.error("  Error inserting skill sets:", skillError.message);
    return;
  }
  console.log(`  Inserted ${skillSets.length} skill sets.\n`);

  // Insert fatal overrides
  console.log("Inserting fatal overrides...");
  const { error: overrideError } = await supabase.from("fatal_overrides").insert(fatalOverrides);
  if (overrideError) {
    console.error("  Error inserting fatal overrides:", overrideError.message);
    return;
  }
  console.log(`  Inserted ${fatalOverrides.length} fatal overrides.\n`);

  // Insert assessments
  console.log("Inserting assessments...");
  const { error: assessError } = await supabase.from("assessments").insert(assessments);
  if (assessError) {
    console.error("  Error inserting assessments:", assessError.message);
    return;
  }
  console.log(`  Inserted ${assessments.length} assessments.\n`);

  console.log("Seed complete! All data inserted successfully.");
}

seed().catch(console.error);
