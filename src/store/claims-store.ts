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
  isClickable: boolean;
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
}

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
  },
  {
    id: "doc-h2",
    name: "Epic_Discharge_Summary_041526.pdf",
    type: "discharge",
    day: 2,
    status: "flagged",
    vectorAffected: "documentation",
    extractedText: "DISCHARGE SUMMARY — Page 1 of 4\nPatient: Robert Hargrove\nAdmit Date: 03/28/2026\nDx: Left hip fracture, s/p ORIF\nComplications: Post-op delirium\n\n[PAGE 2-4 MISSING]",
    aiFindings: ["CRITICAL: Page count mismatch — Found 1 page, expected 4", "Missing surgical notes (pages 2-3)", "Missing discharge medication list (page 4)", "Document integrity: FAILED"],
    pageInfo: "Page 1 of 4 — INCOMPLETE",
    flagReason: "Missing pages 2-4 of discharge summary",
  },
  {
    id: "doc-h3",
    name: "RightFax_CarePlan_041826.tiff",
    type: "fax",
    day: 4,
    status: "flagged",
    vectorAffected: "documentation",
    extractedText: "[LOW QUALITY FAX — OCR Confidence: 62%]\nHome Care Plan — R. Hargrove\nFrequency: 3x/week PT, 2x/week OT\nGoals: Amb... [illegible] ...with walker 150ft\nDME Ordered: Hos... bed, wheel... [illegible]\nPhysician Sig: Dr. [illegible]",
    aiFindings: ["OCR confidence below threshold (62% < 85%)", "Multiple illegible segments detected", "DME order partially readable — possible wheelchair reference", "Physician signature unverifiable"],
    pageInfo: "Single page fax",
    flagReason: "Low-quality fax with illegible segments",
  },
  {
    id: "doc-h4",
    name: "Archived_CarePlan_2024.pdf",
    type: "care_plan",
    day: 4,
    status: "flagged",
    vectorAffected: "discrepancy",
    extractedText: "ARCHIVED CARE PLAN — Date: 06/15/2024\nPatient: Robert Hargrove\nMobility Status: AMBULATORY — Independent with cane\nDME: Standard cane (no wheelchair)\nLast Assessment: Patient walks 300ft independently\nNo wheelchair authorization on file.",
    aiFindings: [
      "DIRECT CONTRADICTION DETECTED",
      "Current fax references wheelchair/DME order",
      "Archived plan: 'Ambulatory — independent with cane'",
      "Mobility status change not clinically documented",
      "Escalation trigger: Evidence discrepancy",
    ],
    flagReason: "Wheelchair assertion contradicts archived care plan showing independent ambulation",
  },
  {
    id: "doc-h5",
    name: "Genesys_Transcript_042026.txt",
    type: "transcript",
    day: 5,
    status: "flagged",
    vectorAffected: "behavioral",
    extractedText:
      'CALL TRANSCRIPT — Duration: 14:32\nAgent: "Can you describe your daily routine?"\nClaimant: "I can\'t do anything... I need help with everything."\nAgent: "Are you using any mobility devices?"\nClaimant: "Yes, I\'m in a wheelchair full time now."\nAgent: "And before the fall?"\nClaimant: [long pause] "I... I was getting around okay I guess."\n[SENTIMENT SHIFT DETECTED at 08:44]',
    aiFindings: [
      "Sentiment analysis: Significant hesitation at 08:44",
      "Claim: 'wheelchair full time' — conflicts with 2024 care plan",
      "Pre-injury mobility description vague/evasive",
      "Behavioral flag: Inconsistent narrative pattern",
    ],
    flagReason: "Behavioral inconsistencies detected in claimant statements",
  },
];

const pendeltonDocuments: Document[] = [
  {
    id: "doc-p1",
    name: "LTC_Intake_Form_040126.pdf",
    type: "intake",
    day: 1,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "Patient: Arthur Pendelton, 72M. Primary Dx: Parkinson's Disease (G20). ADL Deficits: Bathing, Dressing. Tremor severity: Moderate-to-Severe. Elimination Period: 90-day satisfied. Policy Active Since: 2017.",
    aiFindings: ["ADL deficit count: 2 of 6 — meets minimum threshold", "90-day elimination period: SATISFIED", "Clinical presentation consistent with diagnosis"],
  },
  {
    id: "doc-p2",
    name: "Neurologist_Report_040326.pdf",
    type: "medical",
    day: 2,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "NEUROLOGY CONSULTATION\nPatient: Arthur Pendelton\nDx: Parkinson's Disease, Stage 3 (Hoehn & Yahr)\nTremor: Bilateral, moderate-severe\nPostural instability: Present\nMedication: Carbidopa/Levodopa 25/100 TID\nPrognosis: Progressive. Current ADL deficits expected to increase.",
    aiFindings: ["Diagnosis confirmed by specialist", "Stage 3 PD — bilateral involvement", "Prognosis supports long-term care need", "No contradictions with intake form"],
  },
  {
    id: "doc-p3",
    name: "Claimant_Personal_Statement_HW_040426.pdf",
    type: "statement",
    day: 3,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: '[HANDWRITTEN DOCUMENT — OCR Confidence: 87%]\n"My name is Arthur Pendelton. I am writing to explain\nmy daily challenges. Since my Parkinson\'s diagnosis,\nmy hands shake so badly I cannot button my shirts\nor hold a razor to shave. My wife Helen helps me\nbathe because I am afraid of falling in the tub.\nI used to be a carpenter — now I can barely\nhold a cup of coffee. I need help and I am\ngrateful for this policy."',
    aiFindings: ["Handwriting recognition: 87% confidence", "Statement corroborates ADL deficits (bathing, dressing)", "Emotional tone: Genuine, consistent", "No red flags detected in narrative"],
  },
  {
    id: "doc-p4",
    name: "PCP_Medical_Records_040526.pdf",
    type: "medical",
    day: 4,
    status: "processed",
    vectorAffected: "clinical",
    extractedText: "PRIMARY CARE RECORDS — Arthur Pendelton\nVisit: 03/15/2026\nChief Complaint: Increasing tremor, difficulty with ADLs\nExam: Bilateral resting tremor, cogwheel rigidity\nAssessment: PD progressing. Referral to home health.\nPlan: Continue current meds. OT evaluation ordered.\nAll documentation complete.",
    aiFindings: ["Records consistent with specialist report", "ADL decline trajectory documented", "Home health referral supports claim", "Documentation: COMPLETE"],
  },
];

const mockCases: ClaimCase[] = [
  {
    id: "case-001",
    claimantName: "Arthur Pendelton",
    policyNumber: "LTC-884-9102A",
    claimType: "Long-Term Care",
    dateOfBirth: "1954-03-12",
    age: 72,
    diagnosis: "Parkinson's Disease (G20)",
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
      { timestamp: "2026-04-04T10:00:00Z", action: "DOC_UPLOADED", detail: "Claimant_Personal_Statement_HW_040426.pdf — Handwriting OCR processed at 87% confidence", user: "System" },
      { timestamp: "2026-04-05T11:00:00Z", action: "DOC_UPLOADED", detail: "PCP_Medical_Records_040526.pdf processed — All documentation complete", user: "System" },
      { timestamp: "2026-04-05T11:01:00Z", action: "AI_SCORING", detail: "Final score: 15/100 — Low complexity", scoreChange: { from: 14, to: 15 } },
      { timestamp: "2026-04-05T11:02:00Z", action: "AUTO_APPROVED", detail: "Claim auto-approved via STP engine. Routed to Junior Adjuster for final sign-off.", user: "AI Engine" },
    ],
    summary: "72-year-old male with recently diagnosed Parkinson's Disease (Stage 3, Hoehn & Yahr). Presenting with moderate-to-severe bilateral tremors significantly impacting Activities of Daily Living: Bathing and Dressing. 90-day elimination period has been satisfied. All medical documentation is complete and internally consistent.",
    riskIndicators: ["None Detected. Clinical presentation matches 90-day Elimination Period requirements.", "All documents are complete with no missing pages.", "Handwritten personal statement corroborates clinical findings at 87% OCR confidence.", "No discrepancies found between provider records and claimant statements."],
    recommendedAction: "APPROVE CLAIM. Initiate Home Health Aide scheduling per PCP referral. Medical evidence is complete and defensible. Route to Junior Adjuster (Sarah Mitchell) for administrative sign-off.",
    eliminationPeriod: "90-day — SATISFIED",
    filingDate: "2026-04-01",
    lastUpdated: "2026-04-05",
    isClickable: true,
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
      { timestamp: "2026-04-10T08:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated — high-acuity intake", user: "System" },
      { timestamp: "2026-04-10T08:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 35/100", scoreChange: { from: 0, to: 35 } },
      { timestamp: "2026-04-15T10:00:00Z", action: "DOC_UPLOADED", detail: "Epic_Discharge_Summary — CRITICAL: Missing pages detected", user: "System" },
      { timestamp: "2026-04-15T10:01:00Z", action: "AI_SCORING", detail: "Score spike: Missing discharge pages 2-4", scoreChange: { from: 35, to: 68 } },
      { timestamp: "2026-04-18T14:00:00Z", action: "DOC_UPLOADED", detail: "RightFax_CarePlan — Low OCR confidence (62%)", user: "System" },
      { timestamp: "2026-04-18T14:05:00Z", action: "DISCREPANCY_DETECTED", detail: "Wheelchair reference contradicts archived care plan (independent ambulation)", user: "AI Engine" },
      { timestamp: "2026-04-18T14:06:00Z", action: "AI_SCORING", detail: "Score updated: Discrepancy vector critical", scoreChange: { from: 68, to: 88 } },
      { timestamp: "2026-04-20T09:00:00Z", action: "DOC_UPLOADED", detail: "Genesys_Transcript — Behavioral inconsistency flagged", user: "System" },
      { timestamp: "2026-04-20T09:01:00Z", action: "AI_SCORING", detail: "Final score: 98/100 — Critical complexity", scoreChange: { from: 88, to: 98 } },
      { timestamp: "2026-04-20T09:02:00Z", action: "ESCALATED", detail: "Auto-escalated to Tier 2 Clinical Investigator (Dr. Karen Volkov)", user: "AI Engine" },
      { timestamp: "2026-04-20T09:03:00Z", action: "FATAL_OVERRIDE", detail: "Fatal override triggered: DIRECT_CONTRADICTION + Score > 90 → Tier 2 Clinical", user: "Rules Engine" },
    ],
    summary: "81-year-old male presenting with left hip fracture post-ORIF. Multiple critical documentation gaps and evidence discrepancies detected. Discharge summary incomplete (1 of 4 pages). Faxed care plan partially illegible. Direct contradiction between current wheelchair claim and archived ambulatory status. Behavioral analysis flags inconsistent claimant narrative.",
    riskIndicators: [
      "CRITICAL: Discharge summary missing pages 2-4 (surgical notes, medication list)",
      "CRITICAL: Direct contradiction — wheelchair claim vs. archived ambulatory independence",
      "WARNING: Fax OCR confidence 62% — below 85% threshold",
      "WARNING: Behavioral sentiment shift detected in call transcript at 08:44",
      "INFO: Pre-injury mobility description vague/evasive",
    ],
    recommendedAction: "ESCALATE TO TIER 2 INVESTIGATION. Do NOT approve. Request complete discharge summary from Epic. Order independent medical examination. Flag for potential SIU referral if contradictions are not resolved.",
    eliminationPeriod: "90-day — IN PROGRESS (Day 22 of 90)",
    filingDate: "2026-04-10",
    lastUpdated: "2026-04-20",
    isClickable: true,
  },
  {
    id: "case-003",
    claimantName: "Margaret Chen",
    policyNumber: "LTC-776-3341C",
    claimType: "Long-Term Care",
    dateOfBirth: "1948-11-05",
    age: 77,
    diagnosis: "Alzheimer's Disease (G30.9)",
    status: "in_review",
    assignedTo: "James Redford",
    assignedGroup: "Senior Adjuster",
    complexityScore: 52,
    vectors: { clinical: 45, documentation: 55, discrepancy: 30, behavioral: 40 },
    documents: [],
    auditHistory: [
      { timestamp: "2026-04-08T10:00:00Z", action: "CLAIM_CREATED", detail: "New LTC claim initiated", user: "System" },
      { timestamp: "2026-04-08T10:01:00Z", action: "AI_SCORING", detail: "Initial complexity score: 52/100", scoreChange: { from: 0, to: 52 } },
    ],
    filingDate: "2026-04-08",
    lastUpdated: "2026-04-09",
    isClickable: false,
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
    documents: [],
    auditHistory: [
      { timestamp: "2026-04-09T15:00:00Z", action: "CLAIM_CREATED", detail: "New A&H claim initiated", user: "System" },
    ],
    filingDate: "2026-04-09",
    lastUpdated: "2026-04-09",
    isClickable: false,
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
    documents: [],
    auditHistory: [],
    filingDate: "2026-04-07",
    lastUpdated: "2026-04-10",
    isClickable: false,
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
    documents: [],
    auditHistory: [],
    filingDate: "2026-04-06",
    lastUpdated: "2026-04-08",
    isClickable: false,
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
    documents: [],
    auditHistory: [],
    filingDate: "2026-04-05",
    lastUpdated: "2026-04-10",
    isClickable: false,
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
    documents: [],
    auditHistory: [],
    filingDate: "2026-03-20",
    lastUpdated: "2026-04-02",
    isClickable: false,
  },
];

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

  addSkillSet: (skillSet) => set((state) => ({ skillSets: [...state.skillSets, skillSet] })),

  updateSkillSet: (id, updates) =>
    set((state) => ({
      skillSets: state.skillSets.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),

  removeSkillSet: (id) => set((state) => ({ skillSets: state.skillSets.filter((s) => s.id !== id) })),

  addFatalOverride: (override) => set((state) => ({ fatalOverrides: [...state.fatalOverrides, override] })),

  updateFatalOverride: (id, updates) =>
    set((state) => ({
      fatalOverrides: state.fatalOverrides.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),

  removeFatalOverride: (id) => set((state) => ({ fatalOverrides: state.fatalOverrides.filter((o) => o.id !== id) })),

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
          const type = finding.includes("CRITICAL") || finding.includes("FAILED") ? "ALERT" : finding.includes("CONTRADICTION") ? "ALERT" : "EXTRACT";
          newLogs.push({ timestamp: now, type, message: finding });
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
                documents: c.documents.map((d, i) => (i <= phase ? { ...d, status: "processed" as const } : d)),
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
}));
