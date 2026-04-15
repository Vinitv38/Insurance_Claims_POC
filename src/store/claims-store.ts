import { create } from "zustand";
import {
  fetchAllClaims,
  fetchSkillSets,
  fetchFatalOverrides,
  insertClaim,
  insertSkillSet,
  updateSkillSetInDb,
  deleteSkillSetFromDb,
  insertFatalOverride,
  updateFatalOverrideInDb,
  deleteFatalOverrideFromDb,
} from "@/lib/supabase-api";

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
  filePath?: string;
  aiInterpretedMd?: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  detail: string;
  user?: string;
  scoreChange?: { from: number; to: number };
}

export interface Assessment {
  id: string;
  claimId: string;
  label: string;
  assessmentDate: string;
  trigger: string;
  complexityScore: number;
  vectors: {
    clinical: number;
    documentation: number;
    discrepancy: number;
    behavioral: number;
  };
  vectorLabels?: {
    clinical?: string;
    documentation?: string;
    discrepancy?: string;
    behavioral?: string;
  };
  systemRecommendation?: string;
  scoreDriver?: string;
  routingRationale?: string;
  contractStatus?: string;
  eliminationPeriod?: string;
  exclusions?: string;
  summary?: string;
  riskIndicators?: string[];
  recommendedAction?: string;
  confidencePct: number;
  documentsAnalyzed: number;
  clinicalProfileMd?: string;
  aiOutputMd?: string;
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
  assessments: Assessment[];
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
  isLoading: boolean;
  isInitialized: boolean;

  initializeFromSupabase: () => Promise<void>;
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
    extractedText: "DISCHARGE SUMMARY — Page 1 of 4\nPatient: Robert Hargrove\nAdmit Date: 03/28/2026\nDx: Left hip fracture, s/p ORIF\nComplications: Post-op delirium\n\n[PAGE 2-4 MISSING]",
    aiFindings: ["CRITICAL: Page count mismatch — Found 1 page, expected 4", "Missing surgical notes (pages 2-3)", "Missing discharge medication list (page 4)", "Document integrity: FAILED"],
    pageInfo: "Page 1 of 4 — INCOMPLETE",
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
    extractedText: "[LOW QUALITY FAX — OCR Confidence: 62%]\nHome Care Plan — R. Hargrove\nFrequency: 3x/week PT, 2x/week OT\nGoals: Amb... [illegible] ...with walker 150ft\nDME Ordered: Hos... bed, wheel... [illegible]\nPhysician Sig: Dr. [illegible]",
    aiFindings: ["OCR confidence below threshold (62% < 85%)", "Multiple illegible segments detected", "DME order partially readable — possible wheelchair reference", "Physician signature unverifiable"],
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
    extractedText: "ARCHIVED CARE PLAN — Date: 06/15/2024\nPatient: Robert Hargrove\nMobility Status: AMBULATORY — Independent with cane\nDME: Standard cane (no wheelchair)\nLast Assessment: Patient walks 300ft independently\nNo wheelchair authorization on file.",
    aiFindings: ["DIRECT CONTRADICTION DETECTED", "Current fax references wheelchair/DME order", "Archived plan: 'Ambulatory — independent with cane'", "Mobility status change not clinically documented", "Escalation trigger: Evidence discrepancy"],
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
    extractedText: "CALL TRANSCRIPT — Duration: 14:32\nAgent: \"Can you describe your daily routine?\"\nClaimant: \"I can\'t do anything... I need help with everything.\"\nAgent: \"Are you using any mobility devices?\"\nClaimant: \"Yes, I\'m in a wheelchair full time now.\"\nAgent: \"And before the fall?\"\nClaimant: [long pause] \"I... I was getting around okay I guess.\"\n[SENTIMENT SHIFT DETECTED at 08:44]",
    aiFindings: ["Sentiment analysis: Significant hesitation at 08:44", "Claim: 'wheelchair full time' — conflicts with 2024 care plan", "Pre-injury mobility description vague/evasive", "Behavioral flag: Inconsistent narrative pattern"],
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


const dropPhaseStates = [
  { score: 35, vectors: { clinical: 40, documentation: 15, discrepancy: 0, behavioral: 0 } },
  { score: 68, vectors: { clinical: 50, documentation: 85, discrepancy: 10, behavioral: 0 } },
  { score: 88, vectors: { clinical: 55, documentation: 90, discrepancy: 90, behavioral: 10 } },
  { score: 98, vectors: { clinical: 65, documentation: 92, discrepancy: 95, behavioral: 78 } },
];

/* ===== ZUSTAND STORE ===== */

export const useClaimsStore = create<ClaimsState>((set, get) => ({
  cases: [],
  selectedCaseId: null,
  vectorWeights: { clinical: 25, documentation: 25, discrepancy: 35, behavioral: 15 },
  skillSets: [],
  fatalOverrides: [],
  semanticLog: [],
  dropPhase: 0,
  isProcessing: false,
  activeDocumentId: null,
  highlightedCitation: null,
  isLoading: true,
  isInitialized: false,

  initializeFromSupabase: async () => {
    const { isInitialized } = get();
    if (isInitialized) return;

    set({ isLoading: true });
    const startTime = performance.now();
    console.log("[ClaimsStore] Fetching data from Supabase...");
    try {
      const [claims, skillSets, fatalOverrides] = await Promise.all([
        fetchAllClaims(),
        fetchSkillSets(),
        fetchFatalOverrides(),
      ]);
      const elapsed = Math.round(performance.now() - startTime);

      set({
        cases: claims,
        skillSets,
        fatalOverrides,
        isInitialized: true,
        isLoading: false,
      });
      console.log(`[ClaimsStore] Loaded ${claims.length} claims from Supabase in ${elapsed}ms`);
    } catch (error) {
      const elapsed = Math.round(performance.now() - startTime);
      console.error(`[ClaimsStore] Supabase fetch failed after ${elapsed}ms:`, error);
      set({ isInitialized: true, isLoading: false });
    }
  },

  selectCase: (id) => set({ selectedCaseId: id }),

  setVectorWeights: (weights) => set({ vectorWeights: weights }),

  addSkillSet: (skillSet) => {
    set((state) => ({ skillSets: [...state.skillSets, skillSet] }));
    insertSkillSet(skillSet).catch((err) =>
      console.warn("[ClaimsStore] Failed to sync skill set to Supabase:", err)
    );
  },

  updateSkillSet: (id, updates) => {
    set((state) => ({
      skillSets: state.skillSets.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    }));
    updateSkillSetInDb(id, updates).catch((err) =>
      console.warn("[ClaimsStore] Failed to sync skill set update to Supabase:", err)
    );
  },

  removeSkillSet: (id) => {
    set((state) => ({ skillSets: state.skillSets.filter((s) => s.id !== id) }));
    deleteSkillSetFromDb(id).catch((err) =>
      console.warn("[ClaimsStore] Failed to sync skill set deletion to Supabase:", err)
    );
  },

  addFatalOverride: (override) => {
    set((state) => ({ fatalOverrides: [...state.fatalOverrides, override] }));
    insertFatalOverride(override).catch((err) =>
      console.warn("[ClaimsStore] Failed to sync fatal override to Supabase:", err)
    );
  },

  updateFatalOverride: (id, updates) => {
    set((state) => ({
      fatalOverrides: state.fatalOverrides.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }));
    updateFatalOverrideInDb(id, updates).catch((err) =>
      console.warn("[ClaimsStore] Failed to sync fatal override update to Supabase:", err)
    );
  },

  removeFatalOverride: (id) => {
    set((state) => ({ fatalOverrides: state.fatalOverrides.filter((o) => o.id !== id) }));
    deleteFatalOverrideFromDb(id).catch((err) =>
      console.warn("[ClaimsStore] Failed to sync fatal override deletion to Supabase:", err)
    );
  },

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
          c.id === "claim-002"
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

  resetDropPhase: async () => {
    set({
      dropPhase: 0,
      semanticLog: [],
      isProcessing: false,
      isLoading: true,
      isInitialized: false,
    });
    // Re-fetch from Supabase to reset cases to DB state
    try {
      const claims = await fetchAllClaims();
      set({ cases: claims, isLoading: false, isInitialized: true });
    } catch {
      set({ isLoading: false, isInitialized: true });
    }
  },

  addCase: (newCase) => {
    set((state) => ({
      cases: [newCase, ...state.cases],
    }));
    insertClaim(newCase).catch((err) =>
      console.warn("[ClaimsStore] Failed to sync new claim to Supabase:", err)
    );
  },
}));
