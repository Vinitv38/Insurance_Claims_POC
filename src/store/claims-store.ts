import { create } from "zustand";

export interface Document {
  id: string;
  name: string;
  type: "intake" | "medical" | "discharge" | "fax" | "transcript" | "care_plan" | "statement" | "other";
  day: number;
  status: "pending" | "processed" | "flagged";
  vectorAffected: "clinical" | "documentation" | "discrepancy" | "behavioral";
  extractedText?: string;
  aiFindings?: string[];
  pageInfo?: string;
  flagReason?: string;
  jsonSchema?: Record<string, unknown>;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  detail: string;
  user?: string;
  scoreChange?: { from: number; to: number };
}

export interface ClaimCase {
  id: string;
  claimantName: string;
  policyNumber: string;
  claimType: string;
  dateOfBirth: string;
  age: number;
  diagnosis: string;
  status: "auto_approved" | "in_review" | "escalated" | "closed" | "pending";
  assignedTo: string;
  assignedGroup: string;
  complexityScore: number;
  vectors: {
    clinical: number;
    documentation: number;
    discrepancy: number;
    behavioral: number;
  };
  documents: Document[];
  auditHistory: AuditEntry[];
  summary?: string;
  riskIndicators?: string[];
  recommendedAction?: string;
  eliminationPeriod?: string;
  filingDate: string;
  lastUpdated: string;
}

export interface SkillSet {
  id: string;
  name: string;
  description: string;
  minScore: number;
  maxScore: number;
  userCount: number;
  capacityFree: number;
  color: string;
}

export interface FatalOverride {
  id: string;
  condition: string;
  operator: string;
  value: string;
  andCondition?: string;
  andOperator?: string;
  andValue?: string;
  thenAction: string;
  isActive: boolean;
}

export interface SemanticLogEntry {
  timestamp: string;
  type: "SCAN" | "EXTRACT" | "ENGINE" | "RULES" | "ALERT" | "MATCH";
  message: string;
}

interface ClaimsState {
  cases: ClaimCase[];
  selectedCaseId: string | null;
  vectorWeights: { clinical: number; documentation: number; discrepancy: number; behavioral: number };
  skillSets: SkillSet[];
  fatalOverrides: FatalOverride[];
  semanticLog: SemanticLogEntry[];
  dropPhase: number;
  isProcessing: boolean;
  activeDocumentId: string | null;
  highlightedCitation: string | null;

  selectCase: (id: string) => void;
  setVectorWeights: (weights: { clinical: number; documentation: number; discrepancy: number; behavioral: number }) => void;
  addSkillSet: (skillSet: SkillSet) => void;
  updateSkillSet: (id: string, updates: Partial<SkillSet>) => void;
  removeSkillSet: (id: string) => void;
  addFatalOverride: (override: FatalOverride) => void;
  updateFatalOverride: (id: string, updates: Partial<FatalOverride>) => void;
  removeFatalOverride: (id: string) => void;
  triggerDocumentDrop: () => void;
  setActiveDocument: (id: string | null) => void;
  setHighlightedCitation: (citation: string | null) => void;
  resetDropPhase: () => void;
  addCase: (newCase: ClaimCase) => void;
}

/* ===== PENDELTON DOCUMENTS ===== */

const pendeltonDocuments: Document[] = [
  {
    id: "doc-p1",
    name: "LTC_Intake_Form_040126.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: Arthur Pendelton, 72M. Primary Dx: Parkinson\u2019s Disease (G20). ADL Deficits: Bathing, Dressing. Tremor severity: Moderate-to-Severe. Elimination Period: 90-day satisfied. Policy Active Since: 2017.",
    aiFindings: ["ADL deficit count: 2 of 6 \u2014 meets minimum threshold", "90-day elimination period: SATISFIED", "Clinical presentation consistent with diagnosis"],
    jsonSchema: {
      documentType: "LTC_Intake_Form",
      patient: { name: "Arthur Pendelton", age: 72, gender: "M" },
      primaryDiagnosis: { code: "G20", description: "Parkinson\u2019s Disease" },
      adlDeficits: ["Bathing", "Dressing"],
      tremorSeverity: "Moderate-to-Severe",
      eliminationPeriod: { days: 90, status: "SATISFIED" },
      policyActiveSince: "2017",
    },
  },
  {
    id: "doc-p2",
    name: "Neurologist_Report_040326.pdf",
    type: "medical",
    day: 2,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "NEUROLOGY CONSULTATION\nPatient: Arthur Pendelton\nDx: Parkinson\u2019s Disease, Stage 3 (Hoehn & Yahr)\nTremor: Bilateral, moderate-severe\nPostural instability: Present\nMedication: Carbidopa/Levodopa 25/100 TID\nPrognosis: Progressive. Current ADL deficits expected to increase.",
    aiFindings: ["Diagnosis confirmed by specialist", "Stage 3 PD \u2014 bilateral involvement", "Prognosis supports long-term care need", "No contradictions with intake form"],
    jsonSchema: {
      documentType: "Neurology_Consultation",
      patient: { name: "Arthur Pendelton", dob: "1954-03-12" },
      diagnosis: "Parkinson\u2019s Disease, Stage 3 (Hoehn & Yahr)",
      tremorAssessment: "Bilateral, moderate-to-severe resting tremor",
      posturalInstability: true,
      medication: { name: "Carbidopa/Levodopa", dosage: "25/100", frequency: "TID" },
      prognosis: "Progressive \u2014 ADL deficits expected to increase",
      examDate: "2026-04-03",
    },
  },
  {
    id: "doc-p3",
    name: "Claimant_Personal_Statement_HW_040426.pdf",
    type: "statement",
    day: 3,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "[HANDWRITTEN DOCUMENT \u2014 OCR Confidence: 87%]\n\"My name is Arthur Pendelton. I am writing to explain\nmy daily challenges. Since my Parkinson\u2019s diagnosis,\nmy hands shake so badly I cannot button my shirts\nor hold a razor to shave. My wife Helen helps me\nbathe because I am afraid of falling in the tub.\nI used to be a carpenter \u2014 now I can barely\nhold a cup of coffee. I need help and I am\ngrateful for this policy.\"",
    aiFindings: ["Handwriting recognition: 87% confidence", "Statement corroborates ADL deficits (bathing, dressing)", "Emotional tone: Genuine, consistent", "No red flags detected in narrative"],
    jsonSchema: {
      documentType: "Claimant_Personal_Statement",
      format: "Handwritten",
      ocrConfidence: 0.87,
      patient: { name: "Arthur Pendelton" },
      adlMentioned: ["Bathing", "Dressing", "Fine motor tasks"],
      emotionalTone: "Genuine, consistent",
      redFlags: [],
      corroboratesIntake: true,
    },
  },
  {
    id: "doc-p4",
    name: "PCP_Medical_Records_040526.pdf",
    type: "medical",
    day: 4,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "PRIMARY CARE RECORDS \u2014 Arthur Pendelton\nVisit: 03/15/2026\nChief Complaint: Increasing tremor, difficulty with ADLs\nExam: Bilateral resting tremor, cogwheel rigidity\nAssessment: PD progressing. Referral to home health.\nPlan: Continue current meds. OT evaluation ordered.\nAll documentation complete.",
    aiFindings: ["Records consistent with specialist report", "ADL decline trajectory documented", "Home health referral supports claim", "Documentation: COMPLETE"],
    jsonSchema: {
      documentType: "PCP_Medical_Records",
      patient: { name: "Arthur Pendelton" },
      visitDate: "2026-03-15",
      chiefComplaint: "Increasing tremor, difficulty with ADLs",
      examination: { bilateralRestingTremor: true, cogwheelRigidity: true },
      assessment: "Parkinson\u2019s Disease progressing",
      plan: ["Continue current medications", "OT evaluation ordered", "Referral to home health"],
      documentationStatus: "COMPLETE",
    },
  },
];

/* ===== HARGROVE DOCUMENTS ===== */

const hargroveDocuments: Document[] = [
  {
    id: "doc-h1",
    name: "LTC_Intake_Form_041026.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: Robert Hargrove, 81M. Primary Dx: Left hip fracture (S72.001A). Secondary: Mild cognitive impairment. ADL Deficits: Bathing, Dressing, Toileting, Transferring. Elimination Period: 90-day. Policy Active Since: 2019.",
    aiFindings: ["ADL deficit count: 4 of 6", "Elimination period tracking initiated", "High-acuity clinical profile detected"],
    pageInfo: "3 of 3 pages verified",
    jsonSchema: {
      documentType: "LTC_Intake_Form",
      patient: { name: "Robert Hargrove", age: 81, gender: "M" },
      primaryDiagnosis: { code: "S72.001A", description: "Left hip fracture" },
      secondaryDiagnosis: { code: "G31.84", description: "Mild cognitive impairment" },
      adlDeficits: ["Bathing", "Dressing", "Toileting", "Transferring"],
      eliminationPeriod: { days: 90, status: "IN_PROGRESS" },
      policyActiveSince: "2019",
      pageCount: { found: 3, expected: 3, status: "COMPLETE" },
    },
  },
  {
    id: "doc-h2",
    name: "Epic_Discharge_Summary_041526.pdf",
    type: "discharge",
    day: 2,
    status: "flagged",
    vectorAffected: "documentation",
    extractedText: "DISCHARGE SUMMARY \u2014 Page 1 of 4\nPatient: Robert Hargrove\nAdmit Date: 03/28/2026\nDx: Left hip fracture, s/p ORIF\nComplications: Post-op delirium\n\n[PAGE 2-4 MISSING]",
    aiFindings: ["CRITICAL: Page count mismatch \u2014 Found 1 page, expected 4", "Missing surgical notes (pages 2-3)", "Missing discharge medication list (page 4)", "Document integrity: FAILED"],
    pageInfo: "Page 1 of 4 \u2014 INCOMPLETE",
    flagReason: "Missing pages 2-4 of discharge summary",
    jsonSchema: {
      documentType: "Discharge_Summary",
      patient: { name: "Robert Hargrove" },
      admitDate: "2026-03-28",
      diagnosis: "Left hip fracture, s/p ORIF",
      complications: ["Post-op delirium"],
      pageCount: { found: 1, expected: 4, status: "CRITICAL_MISSING_PAGES" },
      missingContent: ["Surgical notes (pages 2-3)", "Discharge medication list (page 4)"],
      documentIntegrity: "FAILED",
    },
  },
  {
    id: "doc-h3",
    name: "RightFax_CarePlan_041826.tiff",
    type: "fax",
    day: 4,
    status: "flagged",
    vectorAffected: "documentation",
    extractedText: "[LOW QUALITY FAX \u2014 OCR Confidence: 62%]\nHome Care Plan \u2014 R. Hargrove\nFrequency: 3x/week PT, 2x/week OT\nGoals: Amb... [illegible] ...with walker 150ft\nDME Ordered: Hos... bed, wheel... [illegible]\nPhysician Sig: Dr. [illegible]",
    aiFindings: ["OCR confidence below threshold (62% < 85%)", "Multiple illegible segments detected", "DME order partially readable \u2014 possible wheelchair reference", "Physician signature unverifiable"],
    pageInfo: "Single page fax",
    flagReason: "Low-quality fax with illegible segments",
    jsonSchema: {
      documentType: "Home_Care_Plan",
      source: "RightFax",
      ocrConfidence: 0.62,
      ocrThreshold: 0.85,
      patient: { name: "R. Hargrove" },
      therapy: { physical: "3x/week", occupational: "2x/week" },
      goals: "[PARTIALLY_ILLEGIBLE] Ambulation with walker 150ft",
      dmeOrdered: "[PARTIALLY_ILLEGIBLE] Hospital bed, wheelchair(?)",
      physicianSignature: "UNVERIFIABLE",
      illegibleSegments: 4,
    },
  },
  {
    id: "doc-h4",
    name: "Archived_CarePlan_2024.pdf",
    type: "care_plan",
    day: 4,
    status: "flagged",
    vectorAffected: "discrepancy",
    extractedText: "ARCHIVED CARE PLAN \u2014 Date: 06/15/2024\nPatient: Robert Hargrove\nMobility Status: AMBULATORY \u2014 Independent with cane\nDME: Standard cane (no wheelchair)\nLast Assessment: Patient walks 300ft independently\nNo wheelchair authorization on file.",
    aiFindings: ["DIRECT CONTRADICTION DETECTED", "Current fax references wheelchair/DME order", "Archived plan: 'Ambulatory \u2014 independent with cane'", "Mobility status change not clinically documented", "Escalation trigger: Evidence discrepancy"],
    flagReason: "Wheelchair assertion contradicts archived care plan showing independent ambulation",
    jsonSchema: {
      documentType: "Archived_Care_Plan",
      archiveDate: "2024-06-15",
      patient: { name: "Robert Hargrove" },
      mobilityStatus: "AMBULATORY",
      mobilityDetail: "Independent with cane",
      dme: { current: "Standard cane", wheelchair: false },
      lastAssessment: "Patient walks 300ft independently",
      wheelchairAuthorization: "NONE_ON_FILE",
      contradictionDetected: true,
    },
  },
  {
    id: "doc-h5",
    name: "Genesys_Transcript_042026.txt",
    type: "transcript",
    day: 5,
    status: "flagged",
    vectorAffected: "behavioral",
    extractedText: "CALL TRANSCRIPT \u2014 Duration: 14:32\nAgent: \"Can you describe your daily routine?\"\nClaimant: \"I can\'t do anything... I need help with everything.\"\nAgent: \"Are you using any mobility devices?\"\nClaimant: \"Yes, I\'m in a wheelchair full time now.\"\nAgent: \"And before the fall?\"\nClaimant: [long pause] \"I... I was getting around okay I guess.\"\n[SENTIMENT SHIFT DETECTED at 08:44]",
    aiFindings: ["Sentiment analysis: Significant hesitation at 08:44", "Claim: 'wheelchair full time' \u2014 conflicts with 2024 care plan", "Pre-injury mobility description vague/evasive", "Behavioral flag: Inconsistent narrative pattern"],
    flagReason: "Behavioral inconsistencies detected in claimant statements",
    jsonSchema: {
      documentType: "Call_Transcript",
      source: "Genesys",
      duration: "14:32",
      callDate: "2026-04-20",
      sentimentAnalysis: { overallTone: "Distressed", shiftDetected: true, shiftTimestamp: "08:44", shiftType: "Hesitation/Evasion" },
      keyStatements: [
        { speaker: "Claimant", text: "I can't do anything... I need help with everything", flag: null },
        { speaker: "Claimant", text: "I'm in a wheelchair full time now", flag: "CONTRADICTS_ARCHIVED_CARE_PLAN" },
        { speaker: "Claimant", text: "I was getting around okay I guess", flag: "VAGUE_EVASIVE" },
      ],
      behavioralFlags: ["Inconsistent narrative", "Vague pre-injury description"],
    },
  },
];

/* ===== CHEN DOCUMENTS ===== */

const chenDocuments: Document[] = [
  {
    id: "doc-c1",
    name: "LTC_Intake_Form_040826.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: Margaret Chen, 77F. Primary Dx: Alzheimer\u2019s Disease (G30.9). ADL Deficits: Bathing, Dressing, Eating, Toileting. Cognitive assessment: MMSE 16/30. Elimination Period: 90-day \u2014 Day 45 of 90. Policy Active Since: 2015.",
    aiFindings: ["ADL deficit count: 4 of 6 \u2014 significant impairment", "MMSE 16/30 indicates moderate cognitive decline", "Elimination period in progress (Day 45)"],
    jsonSchema: {
      documentType: "LTC_Intake_Form",
      patient: { name: "Margaret Chen", age: 77, gender: "F" },
      primaryDiagnosis: { code: "G30.9", description: "Alzheimer\u2019s Disease" },
      adlDeficits: ["Bathing", "Dressing", "Eating", "Toileting"],
      cognitiveAssessment: { test: "MMSE", score: 16, maxScore: 30 },
      eliminationPeriod: { days: 90, currentDay: 45, status: "IN_PROGRESS" },
      policyActiveSince: "2015",
    },
  },
  {
    id: "doc-c2",
    name: "Neuropsych_Evaluation_040926.pdf",
    type: "medical",
    day: 3,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "NEUROPSYCHOLOGICAL EVALUATION\nPatient: Margaret Chen\nDx: Alzheimer\u2019s Disease, Moderate Stage\nMMSE: 16/30\nMemory: Severely impaired \u2014 unable to recall 3 words after 5 minutes\nExecutive Function: Impaired\nRecommendation: 24-hour supervision recommended",
    aiFindings: ["Cognitive testing confirms moderate Alzheimer\u2019s", "Memory severely impaired", "24-hour supervision recommendation supports LTC need", "Consistent with intake assessment"],
    jsonSchema: {
      documentType: "Neuropsych_Evaluation",
      patient: { name: "Margaret Chen" },
      diagnosis: "Alzheimer\u2019s Disease, Moderate Stage",
      cognitiveTests: { mmse: { score: 16, maxScore: 30 }, memoryRecall: "Severely impaired", executiveFunction: "Impaired" },
      recommendation: "24-hour supervision recommended",
      evaluationDate: "2026-04-09",
    },
  },
  {
    id: "doc-c3",
    name: "Home_Health_Assessment_041026.pdf",
    type: "medical",
    day: 5,
    status: "flagged",
    vectorAffected: "documentation",
    extractedText: "HOME HEALTH ASSESSMENT\nPatient: Margaret Chen\nVisit Date: 04/10/2026\nCaregiver: David Chen (husband)\nHome Safety: Fall hazards noted \u2014 loose rugs, no grab bars\nCurrent Care: Husband provides all ADL assistance\nNote: Medication management records incomplete \u2014 missing pharmacy reconciliation",
    aiFindings: ["Home safety concerns documented", "Medication management records incomplete", "Caregiver burden: Single informal caregiver for all ADLs", "Pharmacy reconciliation missing \u2014 documentation gap"],
    flagReason: "Missing pharmacy medication reconciliation records",
    jsonSchema: {
      documentType: "Home_Health_Assessment",
      patient: { name: "Margaret Chen" },
      visitDate: "2026-04-10",
      caregiver: { name: "David Chen", relationship: "Husband" },
      homeSafety: { hazards: ["Loose rugs", "No grab bars"], riskLevel: "Moderate" },
      medicationManagement: { status: "INCOMPLETE", missing: "Pharmacy reconciliation" },
    },
  },
];

/* ===== TORRES DOCUMENTS ===== */

const torresDocuments: Document[] = [
  {
    id: "doc-t1",
    name: "AH_Intake_Form_040926.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: William Torres, 65M. Accident Type: Motor Vehicle Collision. Primary Dx: Cervical Spine Injury (S14.109A). Date of Accident: 04/05/2026. Emergency Treatment: Regional Medical Center. Status: Post-surgical, C5-C6 fusion.",
    aiFindings: ["Accident report filed within 4 days \u2014 within window", "Surgical intervention documented", "MVC \u2014 standard A&H claim pathway"],
    jsonSchema: {
      documentType: "AH_Intake_Form",
      patient: { name: "William Torres", age: 65, gender: "M" },
      accidentType: "Motor Vehicle Collision",
      dateOfAccident: "2026-04-05",
      primaryDiagnosis: { code: "S14.109A", description: "Cervical Spine Injury" },
      emergencyTreatment: { facility: "Regional Medical Center", procedure: "C5-C6 fusion" },
    },
  },
  {
    id: "doc-t2",
    name: "Police_Report_040526.pdf",
    type: "other",
    day: 1,
    status: "processed",
    vectorAffected: "documentation",
    extractedText: "POLICE ACCIDENT REPORT\nCase #: 2026-MVC-04417\nDate: 04/05/2026\nLocation: Intersection of Oak St & Main Ave\nVehicle 1 Driver: William Torres\nVehicle 2 Driver: Jane Morrison\nFault Determination: Vehicle 2 (Morrison) \u2014 ran red light\nInjuries Reported: Torres \u2014 neck/spine, transported to ER",
    aiFindings: ["Police report confirms accident details", "Fault: Other party (Morrison)", "Injuries consistent with diagnosis", "Report filed same day as accident"],
    jsonSchema: {
      documentType: "Police_Report",
      caseNumber: "2026-MVC-04417",
      dateOfIncident: "2026-04-05",
      location: "Intersection of Oak St & Main Ave",
      parties: [
        { name: "William Torres", vehicle: 1, fault: "Not at fault" },
        { name: "Jane Morrison", vehicle: 2, fault: "At fault \u2014 ran red light" },
      ],
      injuriesReported: "Torres \u2014 neck/spine, transported to ER",
    },
  },
  {
    id: "doc-t3",
    name: "Surgical_Notes_040726.pdf",
    type: "medical",
    day: 3,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "SURGICAL NOTES \u2014 William Torres\nProcedure: Anterior Cervical Discectomy & Fusion (C5-C6)\nDate: 04/07/2026\nSurgeon: Dr. Michael Chen, MD\nFindings: Herniated disc at C5-C6 with nerve root compression\nComplications: None\nPost-op: Cervical collar x 6 weeks, PT referral",
    aiFindings: ["Surgical procedure confirmed C5-C6 fusion", "No complications noted", "Recovery plan documented", "Consistent with ER admission records"],
    jsonSchema: {
      documentType: "Surgical_Notes",
      patient: { name: "William Torres" },
      procedure: "Anterior Cervical Discectomy & Fusion (C5-C6)",
      procedureDate: "2026-04-07",
      surgeon: "Dr. Michael Chen, MD",
      findings: "Herniated disc at C5-C6 with nerve root compression",
      complications: "None",
      postOpPlan: ["Cervical collar x 6 weeks", "Physical therapy referral"],
    },
  },
];

/* ===== LANGSTON DOCUMENTS ===== */

const langstonDocuments: Document[] = [
  {
    id: "doc-l1",
    name: "LTC_Intake_Form_040726.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: Dorothy Langston, 86F. Primary Dx: Stroke/CVA (I63.9). Onset: 03/20/2026. ADL Deficits: All 6 ADLs affected \u2014 Bathing, Dressing, Eating, Toileting, Transferring, Continence. Left-side hemiparesis. Speech: Moderate expressive aphasia.",
    aiFindings: ["ADL deficit count: 6 of 6 \u2014 maximum impairment", "Left-side hemiparesis documented", "Moderate expressive aphasia \u2014 communication barrier", "High-acuity clinical profile"],
    jsonSchema: {
      documentType: "LTC_Intake_Form",
      patient: { name: "Dorothy Langston", age: 86, gender: "F" },
      primaryDiagnosis: { code: "I63.9", description: "Stroke / CVA" },
      onsetDate: "2026-03-20",
      adlDeficits: ["Bathing", "Dressing", "Eating", "Toileting", "Transferring", "Continence"],
      neurologicalFindings: { hemiparesis: "Left side", aphasia: "Moderate expressive" },
    },
  },
  {
    id: "doc-l2",
    name: "Rehab_Progress_Notes_040826.pdf",
    type: "medical",
    day: 3,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "REHABILITATION PROGRESS NOTES\nPatient: Dorothy Langston\nFacility: Sunrise Rehab Center\nAdmit: 03/25/2026\nProgress: Minimal improvement in left-side strength\nSpeech Therapy: Moderate progress in word retrieval\nFIM Score: 42/126 (severe functional limitation)\nDischarge Plan: Not yet appropriate for discharge",
    aiFindings: ["FIM Score 42/126 \u2014 severe functional limitation", "Minimal motor recovery", "Not discharge-ready", "Consistent with stroke severity"],
    jsonSchema: {
      documentType: "Rehab_Progress_Notes",
      patient: { name: "Dorothy Langston" },
      facility: "Sunrise Rehab Center",
      admitDate: "2026-03-25",
      fimScore: { score: 42, maxScore: 126, interpretation: "Severe functional limitation" },
      motorRecovery: "Minimal",
      speechProgress: "Moderate \u2014 word retrieval improving",
      dischargeRecommendation: "Not appropriate \u2014 continued inpatient rehab",
    },
  },
  {
    id: "doc-l3",
    name: "Family_Care_Agreement_041026.pdf",
    type: "other",
    day: 5,
    status: "flagged",
    vectorAffected: "discrepancy",
    extractedText: "FAMILY CARE AGREEMENT\nFamily Contact: Robert Langston (son)\nAgreement: Family will provide supplemental care\nNote: Son reports mother was 'already needing help before the stroke'\nPre-existing condition concern flagged by intake team\nPrior PCP records requested but not yet received",
    aiFindings: ["Son's statement suggests pre-existing care needs", "Pre-stroke functional status unclear", "PCP records requested \u2014 pending", "Potential pre-existing condition impact on coverage"],
    flagReason: "Pre-existing care needs reported \u2014 prior medical records pending",
    jsonSchema: {
      documentType: "Family_Care_Agreement",
      patient: { name: "Dorothy Langston" },
      familyContact: { name: "Robert Langston", relationship: "Son" },
      supplementalCare: true,
      preExistingConcern: true,
      sonStatement: "Mother was already needing help before the stroke",
      pendingRecords: ["PCP records \u2014 pre-stroke functional assessment"],
    },
  },
];

/* ===== ABERNATHY DOCUMENTS ===== */

const abernathyDocuments: Document[] = [
  {
    id: "doc-a1",
    name: "LTC_Intake_Form_040626.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: Frank Abernathy, 73M. Primary Dx: ALS / Amyotrophic Lateral Sclerosis (G12.21). Onset: 2025. ADL Deficits: Bathing, Dressing, Eating (progressive). Current: Wheelchair-dependent, PEG tube for nutrition. Elimination Period: 90-day \u2014 SATISFIED.",
    aiFindings: ["ALS diagnosis confirmed \u2014 progressive motor neuron disease", "3 ADL deficits documented", "PEG tube indicates advanced stage", "Elimination period: SATISFIED"],
    jsonSchema: {
      documentType: "LTC_Intake_Form",
      patient: { name: "Frank Abernathy", age: 73, gender: "M" },
      primaryDiagnosis: { code: "G12.21", description: "ALS / Amyotrophic Lateral Sclerosis" },
      onsetYear: "2025",
      adlDeficits: ["Bathing", "Dressing", "Eating"],
      mobilityStatus: "Wheelchair-dependent",
      nutritionSupport: "PEG tube",
      eliminationPeriod: { days: 90, status: "SATISFIED" },
    },
  },
  {
    id: "doc-a2",
    name: "Neurologist_Report_040726.pdf",
    type: "medical",
    day: 2,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "NEUROLOGY CONSULTATION\nPatient: Frank Abernathy\nDx: ALS (G12.21) \u2014 diagnosed 2025\nCurrent Status: Bulbar and limb onset\nFVC: 52% predicted (declining)\nSpeech: Moderate dysarthria\nMobility: Power wheelchair\nPrognosis: Progressive, life-limiting. Palliative care initiated.",
    aiFindings: ["ALS confirmed \u2014 bulbar and limb onset", "FVC 52% \u2014 respiratory decline", "Palliative care initiated", "Clear-cut clinical picture"],
    jsonSchema: {
      documentType: "Neurology_Consultation",
      patient: { name: "Frank Abernathy" },
      diagnosis: "ALS (G12.21) \u2014 Bulbar and limb onset",
      respiratoryFunction: { fvc: "52% predicted", trend: "Declining" },
      speech: "Moderate dysarthria",
      mobility: "Power wheelchair",
      prognosis: "Progressive, life-limiting",
      palliativeCare: true,
    },
  },
];

/* ===== VOSS DOCUMENTS ===== */

const vossDocuments: Document[] = [
  {
    id: "doc-v1",
    name: "AH_Intake_Form_040526.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: Eleanor Voss, 67F. Accident Type: Fall \u2014 reported workplace injury. Primary Dx: Traumatic Brain Injury (S06.309A). Date of Injury: 03/28/2026. ER Visit: Same day. Loss of consciousness reported (~5 min). GCS at admission: 13.",
    aiFindings: ["TBI with LOC \u2014 moderate severity", "GCS 13 at admission", "Workplace injury \u2014 workers comp interaction possible", "Requires detailed investigation"],
    jsonSchema: {
      documentType: "AH_Intake_Form",
      patient: { name: "Eleanor Voss", age: 67, gender: "F" },
      accidentType: "Fall \u2014 workplace injury",
      dateOfInjury: "2026-03-28",
      primaryDiagnosis: { code: "S06.309A", description: "Traumatic Brain Injury" },
      lossOfConsciousness: { reported: true, duration: "~5 minutes" },
      glasgowComaScale: 13,
    },
  },
  {
    id: "doc-v2",
    name: "Employer_Incident_Report_032826.pdf",
    type: "other",
    day: 2,
    status: "flagged",
    vectorAffected: "discrepancy",
    extractedText: "EMPLOYER INCIDENT REPORT\nCompany: Meridian Corp\nEmployee: Eleanor Voss\nDate: 03/28/2026\nLocation: Warehouse Floor B\nDescription: Employee found on floor near shelving unit\nWitnesses: NONE\nSupervisor Note: Employee was not scheduled for Warehouse Floor B\nCCTV: Camera in sector was non-operational",
    aiFindings: ["DISCREPANCY: No witnesses to fall", "Employee not scheduled for accident location", "CCTV conveniently non-operational", "Multiple circumstantial red flags for fabricated claim"],
    flagReason: "No witnesses, unscheduled location, non-operational CCTV \u2014 potential fabrication",
    jsonSchema: {
      documentType: "Employer_Incident_Report",
      company: "Meridian Corp",
      employee: { name: "Eleanor Voss" },
      incidentDate: "2026-03-28",
      location: "Warehouse Floor B",
      witnesses: [],
      cctvStatus: "Non-operational",
      supervisorNote: "Employee was not scheduled for Warehouse Floor B",
      redFlags: ["No witnesses", "Unscheduled location", "CCTV non-operational"],
    },
  },
  {
    id: "doc-v3",
    name: "Medical_Records_040126.pdf",
    type: "medical",
    day: 4,
    status: "flagged",
    vectorAffected: "discrepancy",
    extractedText: "MEDICAL RECORDS \u2014 Eleanor Voss\nER Visit: 03/28/2026\nPresenting: Headache, confusion, reported LOC\nCT Scan: No acute intracranial hemorrhage\nNeuro Exam: Oriented x3, mild post-concussive symptoms\nNote: Patient has 3 prior ER visits for head injury in 18 months\nPrior Claims: Workers comp claim filed 2024 (resolved)",
    aiFindings: ["WARNING: 3 prior ER visits for head injury in 18 months", "Prior workers comp claim filed in 2024", "CT scan negative for acute hemorrhage", "Pattern of repeated head injury claims flagged"],
    flagReason: "Repeated head injury pattern \u2014 3 prior ER visits + prior workers comp claim",
    jsonSchema: {
      documentType: "Medical_Records",
      patient: { name: "Eleanor Voss" },
      erVisitDate: "2026-03-28",
      presenting: ["Headache", "Confusion", "Reported LOC"],
      imaging: { type: "CT Scan", finding: "No acute intracranial hemorrhage" },
      neuroExam: "Oriented x3, mild post-concussive symptoms",
      priorHistory: { headInjuryERVisits: 3, timeframe: "18 months", priorWorkerCompClaim: "2024 \u2014 resolved" },
    },
  },
  {
    id: "doc-v4",
    name: "Genesys_Transcript_040826.txt",
    type: "transcript",
    day: 6,
    status: "flagged",
    vectorAffected: "behavioral",
    extractedText: "CALL TRANSCRIPT \u2014 Duration: 22:15\nAgent: \"Can you walk me through what happened?\"\nClaimant: \"I was just walking and I slipped... hit my head on the shelf.\"\nAgent: \"Were there any witnesses?\"\nClaimant: \"No... I mean, I don\'t think so. It was my break time.\"\nAgent: \"Our records show you weren\'t scheduled for that area.\"\nClaimant: [long pause] \"I... I sometimes go there to check inventory.\"\n[SENTIMENT: Elevated stress markers detected throughout]",
    aiFindings: ["Elevated stress markers throughout call", "Inconsistency: Break time vs. checking inventory", "Evasive on witness question", "Behavioral pattern: High deception probability"],
    flagReason: "Behavioral analysis indicates high deception probability",
    jsonSchema: {
      documentType: "Call_Transcript",
      source: "Genesys",
      duration: "22:15",
      sentimentAnalysis: { overallStress: "Elevated", deceptionProbability: "High" },
      inconsistencies: ["Break time vs. checking inventory", "Evasive on witness question"],
    },
  },
];

/* ===== KIMURA DOCUMENTS ===== */

const kimuraDocuments: Document[] = [
  {
    id: "doc-k1",
    name: "LTC_Intake_Form_032026.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: Harold Kimura, 88M. Primary Dx: Dementia, Unspecified (F03.90). ADL Deficits: Bathing, Dressing, Eating. Caregiver: Granddaughter (lives with patient). Elimination Period: 90-day \u2014 SATISFIED. Policy Active Since: 2012.",
    aiFindings: ["ADL deficit count: 3 of 6", "Caregiver living with patient", "Elimination period: SATISFIED", "Long-standing policy \u2014 14 years"],
    jsonSchema: {
      documentType: "LTC_Intake_Form",
      patient: { name: "Harold Kimura", age: 88, gender: "M" },
      primaryDiagnosis: { code: "F03.90", description: "Dementia, Unspecified" },
      adlDeficits: ["Bathing", "Dressing", "Eating"],
      caregiver: { name: "Granddaughter", relationship: "Grandchild", livesWithPatient: true },
      eliminationPeriod: { days: 90, status: "SATISFIED" },
      policyActiveSince: "2012",
    },
  },
  {
    id: "doc-k2",
    name: "PCP_Records_032526.pdf",
    type: "medical",
    day: 3,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "PRIMARY CARE RECORDS \u2014 Harold Kimura\nVisit: 03/10/2026\nDx: Dementia with behavioral disturbance\nMMSE: 12/30 \u2014 moderate-severe\nBehavior: Sundowning, wandering at night\nMedication: Donepezil 10mg daily, Melatonin 3mg HS\nPlan: Continue home care, safety assessment ordered",
    aiFindings: ["MMSE 12/30 \u2014 moderate-severe cognitive impairment", "Behavioral symptoms consistent with dementia", "Home care plan appropriate", "Documentation: COMPLETE"],
    jsonSchema: {
      documentType: "PCP_Medical_Records",
      patient: { name: "Harold Kimura" },
      visitDate: "2026-03-10",
      diagnosis: "Dementia with behavioral disturbance",
      cognitiveAssessment: { test: "MMSE", score: 12, maxScore: 30, interpretation: "Moderate-severe" },
      behavioralSymptoms: ["Sundowning", "Wandering at night"],
      medications: [
        { name: "Donepezil", dosage: "10mg", frequency: "Daily" },
        { name: "Melatonin", dosage: "3mg", frequency: "HS" },
      ],
      plan: ["Continue home care", "Safety assessment ordered"],
    },
  },
];

/* ===== MOCK CASES ===== */

const mockCases: ClaimCase[] = [
  {
    id: "case-001",
    claimantName: "Arthur Pendelton",
    policyNumber: "LTC-884-9102A",
    claimType: "Long-Term Care",
    dateOfBirth: "1954-03-12",
    age: 72,
    diagnosis: "Parkinson\u2019s Disease (G20)",
    status: "auto_approved",
    assignedTo: "Sarah Mitchell",
    assignedGroup: "Junior Adjuster",
    complexityScore: 15,
    vectors: { clinical: 20, documentation: 5, discrepancy: 0, behavioral: 5 },
    documents: pendeltonDocuments,
    auditHistory: [
      { timestamp: "2026-04-01T09:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated", user: "System" },
      { timestamp: "2026-04-01T09:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 12/100", scoreChange: { from: 0, to: 12 } },
      { timestamp: "2026-04-03T14:00:00Z", action: "DOC_UPLOADED", detail: "Neurologist_Report_040326.pdf processed", user: "System" },
      { timestamp: "2026-04-03T14:01:00Z", action: "AI_SCORING", detail: "Score updated after neurologist report", scoreChange: { from: 12, to: 14 } },
      { timestamp: "2026-04-04T10:00:00Z", action: "DOC_UPLOADED", detail: "Claimant_Personal_Statement_HW_040426.pdf \u2014 Handwriting OCR processed at 87% confidence", user: "System" },
      { timestamp: "2026-04-05T11:00:00Z", action: "DOC_UPLOADED", detail: "PCP_Medical_Records_040526.pdf processed \u2014 All documentation complete", user: "System" },
      { timestamp: "2026-04-05T11:01:00Z", action: "AI_SCORING", detail: "Final score: 15/100 \u2014 Low complexity", scoreChange: { from: 14, to: 15 } },
      { timestamp: "2026-04-05T11:02:00Z", action: "AUTO_APPROVED", detail: "Claim auto-approved via STP engine. Routed to Junior Adjuster for final sign-off.", user: "AI Engine" },
    ],
    summary: "72-year-old male with recently diagnosed Parkinson\u2019s Disease (Stage 3, Hoehn & Yahr). Presenting with moderate-to-severe bilateral tremors significantly impacting Activities of Daily Living: Bathing and Dressing. 90-day elimination period has been satisfied. All medical documentation is complete and internally consistent.",
    riskIndicators: ["None Detected. Clinical presentation matches 90-day Elimination Period requirements.", "All documents are complete with no missing pages.", "Handwritten personal statement corroborates clinical findings at 87% OCR confidence.", "No discrepancies found between provider records and claimant statements."],
    recommendedAction: "APPROVE CLAIM. Initiate Home Health Aide scheduling per PCP referral. Medical evidence is complete and defensible. Route to Junior Adjuster (Sarah Mitchell) for administrative sign-off.",
    eliminationPeriod: "90-day \u2014 SATISFIED",
    filingDate: "2026-04-01",
    lastUpdated: "2026-04-05",
  },
  {
    id: "case-002",
    claimantName: "Robert Hargrove",
    policyNumber: "LTC-912-6037B",
    claimType: "Long-Term Care",
    dateOfBirth: "1945-08-22",
    age: 81,
    diagnosis: "Left Hip Fracture (S72.001A)",
    status: "escalated",
    assignedTo: "Dr. Karen Volkov",
    assignedGroup: "Tier 2 Clinical Investigator",
    complexityScore: 98,
    vectors: { clinical: 65, documentation: 92, discrepancy: 95, behavioral: 78 },
    documents: hargroveDocuments,
    auditHistory: [
      { timestamp: "2026-04-10T08:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated \u2014 high-acuity intake", user: "System" },
      { timestamp: "2026-04-10T08:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 35/100", scoreChange: { from: 0, to: 35 } },
      { timestamp: "2026-04-15T10:00:00Z", action: "DOC_UPLOADED", detail: "Epic_Discharge_Summary \u2014 CRITICAL: Missing pages detected", user: "System" },
      { timestamp: "2026-04-15T10:01:00Z", action: "AI_SCORING", detail: "Score spike: Missing discharge pages 2-4", scoreChange: { from: 35, to: 68 } },
      { timestamp: "2026-04-18T14:00:00Z", action: "DOC_UPLOADED", detail: "RightFax_CarePlan \u2014 Low OCR confidence (62%)", user: "System" },
      { timestamp: "2026-04-18T14:05:00Z", action: "DISCREPANCY_DETECTED", detail: "Wheelchair reference contradicts archived care plan (independent ambulation)", user: "AI Engine" },
      { timestamp: "2026-04-18T14:06:00Z", action: "AI_SCORING", detail: "Score updated: Discrepancy vector critical", scoreChange: { from: 68, to: 88 } },
      { timestamp: "2026-04-20T09:00:00Z", action: "DOC_UPLOADED", detail: "Genesys_Transcript \u2014 Behavioral inconsistency flagged", user: "System" },
      { timestamp: "2026-04-20T09:01:00Z", action: "AI_SCORING", detail: "Final score: 98/100 \u2014 Critical complexity", scoreChange: { from: 88, to: 98 } },
      { timestamp: "2026-04-20T09:02:00Z", action: "ESCALATED", detail: "Auto-escalated to Tier 2 Clinical Investigator (Dr. Karen Volkov)", user: "AI Engine" },
      { timestamp: "2026-04-20T09:03:00Z", action: "FATAL_OVERRIDE", detail: "Fatal override triggered: DIRECT_CONTRADICTION + Score > 90 \u2192 Tier 2 Clinical", user: "Rules Engine" },
    ],
    summary: "81-year-old male presenting with left hip fracture post-ORIF. Multiple critical documentation gaps and evidence discrepancies detected. Discharge summary incomplete (1 of 4 pages). Faxed care plan partially illegible. Direct contradiction between current wheelchair claim and archived ambulatory status. Behavioral analysis flags inconsistent claimant narrative.",
    riskIndicators: ["CRITICAL: Discharge summary missing pages 2-4 (surgical notes, medication list)", "CRITICAL: Direct contradiction \u2014 wheelchair claim vs. archived ambulatory independence", "WARNING: Fax OCR confidence 62% \u2014 below 85% threshold", "WARNING: Behavioral sentiment shift detected in call transcript at 08:44", "INFO: Pre-injury mobility description vague/evasive"],
    recommendedAction: "ESCALATE TO TIER 2 INVESTIGATION. Do NOT approve. Request complete discharge summary from Epic. Order independent medical examination. Flag for potential SIU referral if contradictions are not resolved.",
    eliminationPeriod: "90-day \u2014 IN PROGRESS (Day 22 of 90)",
    filingDate: "2026-04-10",
    lastUpdated: "2026-04-20",
  },
  {
    id: "case-003",
    claimantName: "Margaret Chen",
    policyNumber: "LTC-776-3341C",
    claimType: "Long-Term Care",
    dateOfBirth: "1948-11-05",
    age: 77,
    diagnosis: "Alzheimer\u2019s Disease (G30.9)",
    status: "in_review",
    assignedTo: "James Redford",
    assignedGroup: "Senior Adjuster",
    complexityScore: 52,
    vectors: { clinical: 45, documentation: 55, discrepancy: 30, behavioral: 40 },
    documents: chenDocuments,
    auditHistory: [
      { timestamp: "2026-04-08T10:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated", user: "System" },
      { timestamp: "2026-04-08T10:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 38/100", scoreChange: { from: 0, to: 38 } },
      { timestamp: "2026-04-09T11:00:00Z", action: "DOC_UPLOADED", detail: "Neuropsych_Evaluation_040926.pdf processed", user: "System" },
      { timestamp: "2026-04-09T11:01:00Z", action: "AI_SCORING", detail: "Score updated after neuropsych evaluation", scoreChange: { from: 38, to: 45 } },
      { timestamp: "2026-04-10T09:00:00Z", action: "DOC_UPLOADED", detail: "Home_Health_Assessment \u2014 medication records incomplete", user: "System" },
      { timestamp: "2026-04-10T09:01:00Z", action: "AI_SCORING", detail: "Score updated: documentation gap detected", scoreChange: { from: 45, to: 52 } },
    ],
    summary: "77-year-old female with moderate Alzheimer\u2019s Disease. MMSE 16/30 indicates significant cognitive decline. 4 ADL deficits documented. Elimination period in progress (Day 45 of 90). Home health assessment reveals missing pharmacy medication reconciliation. Single informal caregiver (husband) providing all ADL assistance.",
    riskIndicators: ["WARNING: Medication management records incomplete \u2014 missing pharmacy reconciliation", "INFO: Elimination period in progress \u2014 Day 45 of 90", "INFO: Single informal caregiver \u2014 caregiver burden risk", "INFO: Home safety hazards documented (loose rugs, no grab bars)"],
    recommendedAction: "HOLD FOR REVIEW. Request pharmacy medication reconciliation. Monitor elimination period progress. Consider caregiver support assessment.",
    eliminationPeriod: "90-day \u2014 IN PROGRESS (Day 45 of 90)",
    filingDate: "2026-04-08",
    lastUpdated: "2026-04-10",
  },
  {
    id: "case-004",
    claimantName: "William Torres",
    policyNumber: "ACC-331-8820D",
    claimType: "Accident & Health",
    dateOfBirth: "1960-06-18",
    age: 65,
    diagnosis: "Cervical Spine Injury (S14.109A)",
    status: "pending",
    assignedTo: "Unassigned",
    assignedGroup: "Queue",
    complexityScore: 41,
    vectors: { clinical: 38, documentation: 42, discrepancy: 15, behavioral: 20 },
    documents: torresDocuments,
    auditHistory: [
      { timestamp: "2026-04-09T15:00:00Z", action: "CLAIM_CREATED", detail: "New A&H claim initiated \u2014 motor vehicle collision", user: "System" },
      { timestamp: "2026-04-09T15:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 30/100", scoreChange: { from: 0, to: 30 } },
      { timestamp: "2026-04-09T15:30:00Z", action: "DOC_UPLOADED", detail: "Police_Report_040526.pdf processed \u2014 fault confirmed other party", user: "System" },
      { timestamp: "2026-04-10T10:00:00Z", action: "DOC_UPLOADED", detail: "Surgical_Notes_040726.pdf processed", user: "System" },
      { timestamp: "2026-04-10T10:01:00Z", action: "AI_SCORING", detail: "Score updated after surgical notes review", scoreChange: { from: 30, to: 41 } },
    ],
    summary: "65-year-old male with cervical spine injury from motor vehicle collision. Post-surgical C5-C6 fusion. Police report confirms other party at fault. Surgical notes consistent with ER records. Standard A&H claim pathway \u2014 awaiting assignment.",
    riskIndicators: ["INFO: Other party at fault \u2014 confirmed by police report", "INFO: Surgical procedure documented and consistent", "INFO: Awaiting adjuster assignment"],
    recommendedAction: "ASSIGN TO ADJUSTER. Standard A&H claim. Verify insurance coordination with auto liability carrier. Initiate disability benefit calculation.",
    filingDate: "2026-04-09",
    lastUpdated: "2026-04-10",
  },
  {
    id: "case-005",
    claimantName: "Dorothy Langston",
    policyNumber: "LTC-558-2219E",
    claimType: "Long-Term Care",
    dateOfBirth: "1940-02-28",
    age: 86,
    diagnosis: "Stroke / CVA (I63.9)",
    status: "in_review",
    assignedTo: "James Redford",
    assignedGroup: "Senior Adjuster",
    complexityScore: 67,
    vectors: { clinical: 70, documentation: 60, discrepancy: 45, behavioral: 35 },
    documents: langstonDocuments,
    auditHistory: [
      { timestamp: "2026-04-07T08:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated \u2014 post-stroke", user: "System" },
      { timestamp: "2026-04-07T08:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 48/100", scoreChange: { from: 0, to: 48 } },
      { timestamp: "2026-04-08T11:00:00Z", action: "DOC_UPLOADED", detail: "Rehab_Progress_Notes processed \u2014 FIM 42/126", user: "System" },
      { timestamp: "2026-04-08T11:01:00Z", action: "AI_SCORING", detail: "Score updated after rehab notes", scoreChange: { from: 48, to: 58 } },
      { timestamp: "2026-04-10T14:00:00Z", action: "DOC_UPLOADED", detail: "Family_Care_Agreement \u2014 pre-existing concern flagged", user: "System" },
      { timestamp: "2026-04-10T14:01:00Z", action: "AI_SCORING", detail: "Score increased: pre-existing condition concern", scoreChange: { from: 58, to: 67 } },
      { timestamp: "2026-04-10T14:02:00Z", action: "DISCREPANCY_DETECTED", detail: "Son reports pre-existing care needs \u2014 prior records pending", user: "AI Engine" },
    ],
    summary: "86-year-old female with CVA resulting in left-side hemiparesis and moderate expressive aphasia. All 6 ADLs affected. FIM score 42/126 indicates severe functional limitation. Son reports pre-existing care needs before stroke \u2014 prior PCP records requested.",
    riskIndicators: ["WARNING: Pre-existing care needs reported by family \u2014 awaiting prior PCP records", "INFO: FIM Score 42/126 \u2014 severe functional limitation", "INFO: All 6 ADLs affected \u2014 maximum impairment level", "INFO: Currently inpatient \u2014 not appropriate for discharge"],
    recommendedAction: "HOLD FOR REVIEW. Request pre-stroke PCP records to establish baseline functional status. Assess pre-existing condition impact on coverage.",
    eliminationPeriod: "90-day \u2014 IN PROGRESS",
    filingDate: "2026-04-07",
    lastUpdated: "2026-04-10",
  },
  {
    id: "case-006",
    claimantName: "Frank Abernathy",
    policyNumber: "LTC-445-9907F",
    claimType: "Long-Term Care",
    dateOfBirth: "1952-09-14",
    age: 73,
    diagnosis: "ALS (G12.21)",
    status: "auto_approved",
    assignedTo: "Sarah Mitchell",
    assignedGroup: "Junior Adjuster",
    complexityScore: 22,
    vectors: { clinical: 30, documentation: 10, discrepancy: 0, behavioral: 10 },
    documents: abernathyDocuments,
    auditHistory: [
      { timestamp: "2026-04-06T09:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated \u2014 ALS diagnosis", user: "System" },
      { timestamp: "2026-04-06T09:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 18/100", scoreChange: { from: 0, to: 18 } },
      { timestamp: "2026-04-07T10:00:00Z", action: "DOC_UPLOADED", detail: "Neurologist_Report processed \u2014 ALS confirmed", user: "System" },
      { timestamp: "2026-04-07T10:01:00Z", action: "AI_SCORING", detail: "Score updated: clear clinical picture", scoreChange: { from: 18, to: 22 } },
      { timestamp: "2026-04-08T08:00:00Z", action: "AUTO_APPROVED", detail: "Claim auto-approved \u2014 progressive terminal diagnosis, complete documentation", user: "AI Engine" },
    ],
    summary: "73-year-old male with ALS (Amyotrophic Lateral Sclerosis). Progressive, life-limiting diagnosis with bulbar and limb onset. FVC 52% predicted indicates respiratory decline. Wheelchair-dependent with PEG tube for nutrition. Palliative care initiated.",
    riskIndicators: ["None Detected. Terminal progressive diagnosis with complete documentation.", "All documents consistent \u2014 no contradictions detected.", "Palliative care already initiated \u2014 clinical trajectory well-documented."],
    recommendedAction: "APPROVE CLAIM. ALS is a progressive, terminal diagnosis. All documentation complete and consistent. Initiate maximum LTC benefit.",
    eliminationPeriod: "90-day \u2014 SATISFIED",
    filingDate: "2026-04-06",
    lastUpdated: "2026-04-08",
  },
  {
    id: "case-007",
    claimantName: "Eleanor Voss",
    policyNumber: "ACC-887-1154G",
    claimType: "Accident & Health",
    dateOfBirth: "1958-12-01",
    age: 67,
    diagnosis: "Traumatic Brain Injury (S06.309A)",
    status: "escalated",
    assignedTo: "SIU Team",
    assignedGroup: "SIU Fraud Unit",
    complexityScore: 91,
    vectors: { clinical: 55, documentation: 80, discrepancy: 90, behavioral: 85 },
    documents: vossDocuments,
    auditHistory: [
      { timestamp: "2026-04-05T10:00:00Z", action: "CLAIM_CREATED", detail: "New A&H claim initiated \u2014 workplace fall", user: "System" },
      { timestamp: "2026-04-05T10:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 42/100", scoreChange: { from: 0, to: 42 } },
      { timestamp: "2026-04-06T14:00:00Z", action: "DOC_UPLOADED", detail: "Employer_Incident_Report \u2014 multiple red flags detected", user: "System" },
      { timestamp: "2026-04-06T14:01:00Z", action: "DISCREPANCY_DETECTED", detail: "No witnesses, unscheduled location, non-operational CCTV", user: "AI Engine" },
      { timestamp: "2026-04-06T14:02:00Z", action: "AI_SCORING", detail: "Score spike: circumstantial red flags", scoreChange: { from: 42, to: 72 } },
      { timestamp: "2026-04-08T09:00:00Z", action: "DOC_UPLOADED", detail: "Medical_Records \u2014 prior head injury pattern detected", user: "System" },
      { timestamp: "2026-04-08T09:01:00Z", action: "AI_SCORING", detail: "Score increased: repeated injury pattern", scoreChange: { from: 72, to: 85 } },
      { timestamp: "2026-04-10T11:00:00Z", action: "DOC_UPLOADED", detail: "Genesys_Transcript \u2014 high deception probability", user: "System" },
      { timestamp: "2026-04-10T11:01:00Z", action: "AI_SCORING", detail: "Final score: 91/100 \u2014 Critical", scoreChange: { from: 85, to: 91 } },
      { timestamp: "2026-04-10T11:02:00Z", action: "ESCALATED", detail: "Auto-escalated to SIU Fraud Unit", user: "AI Engine" },
      { timestamp: "2026-04-10T11:03:00Z", action: "FATAL_OVERRIDE", detail: "Fatal override: Repeated injury pattern + Score > 90 \u2192 SIU", user: "Rules Engine" },
    ],
    summary: "67-year-old female claiming TBI from workplace fall. Multiple significant red flags: no witnesses to fall, employee not scheduled for accident location, CCTV non-operational. Medical records reveal 3 prior ER visits for head injury in 18 months and a previous workers comp claim (2024). Behavioral analysis indicates high deception probability.",
    riskIndicators: ["CRITICAL: No witnesses + unscheduled location + non-operational CCTV", "CRITICAL: 3 prior ER visits for head injury in 18 months", "CRITICAL: Prior workers compensation claim (2024)", "WARNING: High deception probability in behavioral analysis", "WARNING: CT scan negative despite reported LOC"],
    recommendedAction: "ESCALATE TO SIU INVESTIGATION. High probability of fraudulent claim. Request CCTV maintenance records. Interview witnesses in adjacent areas. DO NOT approve pending investigation.",
    filingDate: "2026-04-05",
    lastUpdated: "2026-04-10",
  },
  {
    id: "case-008",
    claimantName: "Harold Kimura",
    policyNumber: "LTC-662-4478H",
    claimType: "Long-Term Care",
    dateOfBirth: "1938-04-10",
    age: 88,
    diagnosis: "Dementia, Unspecified (F03.90)",
    status: "closed",
    assignedTo: "Sarah Mitchell",
    assignedGroup: "Junior Adjuster",
    complexityScore: 18,
    vectors: { clinical: 25, documentation: 8, discrepancy: 0, behavioral: 5 },
    documents: kimuraDocuments,
    auditHistory: [
      { timestamp: "2026-03-20T09:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated \u2014 dementia", user: "System" },
      { timestamp: "2026-03-20T09:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 15/100", scoreChange: { from: 0, to: 15 } },
      { timestamp: "2026-03-25T10:00:00Z", action: "DOC_UPLOADED", detail: "PCP_Records processed \u2014 MMSE 12/30", user: "System" },
      { timestamp: "2026-03-25T10:01:00Z", action: "AI_SCORING", detail: "Score updated after PCP records", scoreChange: { from: 15, to: 18 } },
      { timestamp: "2026-04-01T08:00:00Z", action: "AUTO_APPROVED", detail: "Claim auto-approved \u2014 straightforward dementia case", user: "AI Engine" },
      { timestamp: "2026-04-02T09:00:00Z", action: "CLAIM_CLOSED", detail: "Claim closed \u2014 benefits initiated", user: "Sarah Mitchell" },
    ],
    summary: "88-year-old male with moderate-severe dementia. MMSE 12/30. 3 ADL deficits documented. Behavioral symptoms include sundowning and nighttime wandering. Granddaughter provides in-home care. Long-standing policy (14 years). All documentation complete and consistent.",
    riskIndicators: ["None Detected. Clear dementia diagnosis with consistent documentation.", "All documents complete \u2014 no contradictions.", "Long-standing policy holder \u2014 14 years."],
    recommendedAction: "CLAIM APPROVED AND CLOSED. Benefits initiated. Standard LTC benefits package applied. Home care support coordinated with granddaughter.",
    eliminationPeriod: "90-day \u2014 SATISFIED",
    filingDate: "2026-03-20",
    lastUpdated: "2026-04-02",
  },
];

/* ===== SKILL SETS + FATAL OVERRIDES + DROP-PHASE ===== */

const mockSkillSets: SkillSet[] = [
  { id: "skill-1", name: "Junior Adjuster", description: "Handles low-complexity, auto-approved claims requiring administrative sign-off", minScore: 0, maxScore: 30, userCount: 12, capacityFree: 68, color: "#22C55E" },
  { id: "skill-2", name: "Senior Adjuster", description: "Reviews moderate-complexity claims with minor documentation gaps", minScore: 31, maxScore: 60, userCount: 8, capacityFree: 42, color: "#F59E0B" },
  { id: "skill-3", name: "Tier 2 Clinical Investigator", description: "Investigates high-complexity claims with clinical discrepancies", minScore: 61, maxScore: 90, userCount: 4, capacityFree: 25, color: "#E8792B" },
  { id: "skill-4", name: "SIU Fraud Unit", description: "Handles critical-complexity claims with potential fraud indicators", minScore: 91, maxScore: 100, userCount: 3, capacityFree: 33, color: "#EF4444" },
];

const mockFatalOverrides: FatalOverride[] = [
  {
    id: "override-1",
    condition: "Evidence Discrepancy",
    operator: "==",
    value: "DIRECT_CONTRADICTION",
    andCondition: "Total Score",
    andOperator: ">",
    andValue: "90",
    thenAction: "Route to Tier 2 Clinical",
    isActive: true,
  },
  {
    id: "override-2",
    condition: "Documentation Completeness",
    operator: "==",
    value: "CRITICAL_MISSING_PAGES",
    andCondition: "Clinical Vector",
    andOperator: ">",
    andValue: "60",
    thenAction: "Hold for Manual Review",
    isActive: true,
  },
  {
    id: "override-3",
    condition: "OCR Confidence",
    operator: "<",
    value: "70%",
    andCondition: "Document Type",
    andOperator: "==",
    andValue: "DISCHARGE_SUMMARY",
    thenAction: "Request Re-submission",
    isActive: false,
  },
];

const dropPhaseStates = [
  { score: 35, vectors: { clinical: 40, documentation: 15, discrepancy: 0, behavioral: 0 } },
  { score: 68, vectors: { clinical: 50, documentation: 85, discrepancy: 10, behavioral: 0 } },
  { score: 88, vectors: { clinical: 55, documentation: 90, discrepancy: 90, behavioral: 10 } },
  { score: 98, vectors: { clinical: 65, documentation: 92, discrepancy: 95, behavioral: 78 } },
];

/* ===== ZUSTAND STORE ===== */

export const useClaimsStore = create<ClaimsState>((set, get) => ({
  cases: mockCases,
  selectedCaseId: null,
  vectorWeights: { clinical: 25, documentation: 25, discrepancy: 35, behavioral: 15 },
  skillSets: mockSkillSets,
  fatalOverrides: mockFatalOverrides,
  semanticLog: [],
  dropPhase: 0,
  isProcessing: false,
  activeDocumentId: null,
  highlightedCitation: null,

  selectCase: (id) => set({ selectedCaseId: id }),

  setVectorWeights: (weights) => set({ vectorWeights: weights }),

  addSkillSet: (skillSet) =>
    set((state) => ({ skillSets: [...state.skillSets, skillSet] })),

  updateSkillSet: (id, updates) =>
    set((state) => ({
      skillSets: state.skillSets.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  removeSkillSet: (id) =>
    set((state) => ({ skillSets: state.skillSets.filter((s) => s.id !== id) })),

  addFatalOverride: (override) =>
    set((state) => ({ fatalOverrides: [...state.fatalOverrides, override] })),

  updateFatalOverride: (id, updates) =>
    set((state) => ({
      fatalOverrides: state.fatalOverrides.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),

  removeFatalOverride: (id) =>
    set((state) => ({ fatalOverrides: state.fatalOverrides.filter((o) => o.id !== id) })),

  triggerDocumentDrop: () => {
    const { dropPhase, isProcessing } = get();
    if (isProcessing || dropPhase >= 4) return;

    set({ isProcessing: true });

    const phase = dropPhase;
    const docs = hargroveDocuments;
    const currentDoc = docs[phase];
    const phaseState = dropPhaseStates[phase];

    const newLogs: SemanticLogEntry[] = [];
    const now = new Date().toISOString();

    if (currentDoc) {
      newLogs.push({ timestamp: now, type: "SCAN", message: `${currentDoc.name} analyzed.` });

      if (currentDoc.aiFindings) {
        currentDoc.aiFindings.forEach((finding) => {
          const logType =
            finding.includes("CRITICAL") || finding.includes("FAILED")
              ? "ALERT"
              : finding.includes("CONTRADICTION")
                ? "ALERT"
                : "EXTRACT";
          newLogs.push({ timestamp: now, type: logType, message: finding });
        });
      }

      newLogs.push({
        timestamp: now,
        type: "ENGINE",
        message: `Vector V_${currentDoc.vectorAffected.charAt(0)} updated: ${currentDoc.flagReason || "PROCESSED"}.`,
      });

      newLogs.push({
        timestamp: now,
        type: "RULES",
        message: `Recalculating... New Score: ${phaseState.score}.`,
      });
    }

    setTimeout(() => {
      set((state) => ({
        cases: state.cases.map((c) =>
          c.id === "case-002"
            ? {
                ...c,
                complexityScore: phaseState.score,
                vectors: phaseState.vectors,
                documents: c.documents.map((d, i) =>
                  i <= phase ? { ...d, status: "processed" as const } : d
                ),
              }
            : c
        ),
        semanticLog: [...state.semanticLog, ...newLogs],
        dropPhase: phase + 1,
        isProcessing: false,
        activeDocumentId: currentDoc?.id || null,
      }));
    }, 2000);
  },

  setActiveDocument: (id) => set({ activeDocumentId: id }),

  setHighlightedCitation: (citation) => set({ highlightedCitation: citation }),

  resetDropPhase: () =>
    set({
      dropPhase: 0,
      semanticLog: [],
      isProcessing: false,
      cases: mockCases,
    }),

  addCase: (newCase) =>
    set((state) => ({
      cases: [newCase, ...state.cases],
    })),
}));
