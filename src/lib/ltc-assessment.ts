import { nodeText, type ExecutionNode } from "./agentic-studio";

export const RECOMMENDATIONS = ["APPROVE CLAIM", "ESCALATE", "REJECT", "PENDING FOR INFORMATION"] as const;
export type Recommendation = (typeof RECOMMENDATIONS)[number];

// Taxonomy values from "Get Complexity Scoring Taxonomy & Weights" (LTC New workflow).
const TAG_VALUES: Record<"clinical" | "documentation" | "discrepancy" | "behavioral", Record<string, number>> = {
  clinical: {
    IMPROVING: 0.0,
    STABLE: 0.1,
    MODERATE_DECLINE: 0.4,
    SEVERE_DECLINE: 0.8,
    CRITICAL_ACUITY: 0.9,
    TERMINAL_PROGNOSIS: 1.0,
  },
  documentation: {
    COMPLETE: 0.0,
    MINOR_MISSING_DATA: 0.3,
    EXPIRED_RECENCY: 0.6,
    MISSING_SIGNATURE: 0.7,
    ILLEGIBLE_SUBMISSION: 0.8,
    CRITICAL_MISSING_PAGES: 0.9,
  },
  discrepancy: {
    NO_CONTRADICTION: 0.0,
    MINOR_DISCREPANCY: 0.3,
    PROVIDER_MISMATCH: 0.6,
    DIRECT_CONTRADICTION: 1.0,
    SUSPECTED_FRAUD_INDICATOR: 1.0,
  },
  behavioral: {
    CALM: 0.0,
    INQUIRING: 0.2,
    VULNERABLE_CUSTOMER: 0.6,
    ELEVATED_FRUSTRATION: 0.7,
    LITIGIOUS_THREAT: 1.0,
  },
};

const VECTOR_LABELS: Record<keyof typeof TAG_VALUES, RegExp> = {
  clinical: /Clinical Volatility/i,
  documentation: /Documentation Integrity/i,
  discrepancy: /Evidence Discrepancy/i,
  behavioral: /Behaviou?ral Escalation/i,
};

// Tier names from "Get Adjuster Routing Thresholds & Live Capacity".
const ROUTING_TIERS = ["Junior Adjuster", "Senior Adjuster", "Tier 2 Clinical Investigator", "SIU Fraud Unit"];

export interface ParsedAssessment {
  recommendation: Recommendation;
  complexityScore: number;
  scoreDriver?: string;
  assignedTo: string;
  assignedGroup: string;
  routingRationale?: string;
  summary?: string;
  contractStatus?: string;
  eliminationPeriod?: string;
  exclusions?: string;
  tags: Record<keyof typeof TAG_VALUES, string>;
  vectors: Record<keyof typeof TAG_VALUES, number>;
  riskIndicators: string[];
  recommendedAction?: string;
  clinicalProfileMd?: string;
  briefingMd: string;
  scoringManifestMd?: string;
}

// Removes "[label](#document-...)" citation links; the full briefing (ai_output_md) keeps them.
function clean(line: string): string {
  return line
    .replace(/\[[^\]]*\]\(#document-[^)]*\)/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*(?:--|-|\*|•)\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function field(lines: string[], label: string): string | undefined {
  const re = new RegExp(`^${label}\\s*:\\s*(.*)$`, "i");
  for (const line of lines) {
    const m = clean(line).match(re);
    if (m && m[1].trim()) return m[1].trim();
  }
  return undefined;
}

const SECTION_HEADERS = [
  "RECOMMENDATION & ROUTING",
  "INVESTIGATION SYNOPSIS",
  "POLICY & COMPLIANCE STATUS",
  "COMPLEXITY VECTORS & TAGS",
  "CRITICAL ALERTS & DISCREPANCIES",
  "CLINICAL & FUNCTIONAL PROFILE",
  "TARGETED NEXT STEPS FOR ADJUSTER",
];

function isHeader(line: string): string | undefined {
  const text = clean(line).replace(/^#+\s*/, "").replace(/:$/, "").toUpperCase();
  return SECTION_HEADERS.find((h) => text === h);
}

function section(lines: string[], header: string): string[] {
  const start = lines.findIndex((l) => isHeader(l) === header);
  if (start === -1) return [];
  const out: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (isHeader(line)) break;
    if (/^\s*-{5,}\s*$/.test(line)) continue;
    if (line.trim()) out.push(line);
  }
  return out;
}

function findTag(text: string, vector: keyof typeof TAG_VALUES): string | undefined {
  const line = text.split("\n").find((l) => VECTOR_LABELS[vector].test(l) && l.includes(":"));
  if (!line) return undefined;
  const value = line.slice(line.indexOf(":") + 1).toUpperCase().replace(/\*\*/g, "");
  const tags = Object.keys(TAG_VALUES[vector]).sort((a, b) => b.length - a.length);
  return tags.find((tag) => new RegExp(`\\b${tag.replace(/_/g, "[_ ]")}\\b`).test(value));
}

// Agents sometimes put several "-- Field: value" items on one line; split them onto their own lines.
function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/[ \t]+--[ \t]+/g, "\n-- ");
}

function findNodeText(nodes: ExecutionNode[], marker: RegExp): string | undefined {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const text = normalize(nodeText(nodes[i].response));
    if (marker.test(text)) return text;
  }
  return undefined;
}

export function parseLtcNewOutput(nodes: ExecutionNode[]): ParsedAssessment {
  const briefingMd = findNodeText(nodes, /EXECUTIVE ADJUDICATION BRIEFING/i);
  if (!briefingMd) {
    throw new Error(
      `Workflow output has no Executive Adjudication Briefing. Nodes received: ${nodes.map((n) => n.name).join(", ") || "none"}`
    );
  }
  const scoringManifestMd = findNodeText(nodes, /SCORING & SEVERITY MANIFEST/i);
  const lines = briefingMd.split("\n");

  const recText = (field(lines, "System Recommendation") || "").toUpperCase();
  const recommendation = RECOMMENDATIONS.find((r) => recText.includes(r));
  if (!recommendation) {
    throw new Error(`Briefing has no valid System Recommendation (got "${recText || "nothing"}")`);
  }

  const scoreText =
    field(lines, "Final Complexity Score") ||
    (scoringManifestMd ? field(scoringManifestMd.split("\n"), "Calculated Complexity Score") : undefined);
  const scoreMatch = scoreText?.match(/\d{1,3}/);
  const complexityScore = scoreMatch ? Number(scoreMatch[0]) : NaN;
  if (!Number.isInteger(complexityScore) || complexityScore < 0 || complexityScore > 100) {
    throw new Error(`Briefing has no valid Final Complexity Score (got "${scoreText || "nothing"}")`);
  }

  const entity = field(lines, "Assigned Entity");
  if (!entity) throw new Error("Briefing has no Assigned Entity");
  const [who, queuePart] = entity.split(/\|\s*Queue\s*:/i);
  const assignedGroup = ROUTING_TIERS.find((t) => entity.toLowerCase().includes(t.toLowerCase())) || (queuePart || "").trim();
  const assignedTo = who
    .replace(/\(.*?\)/g, "")
    .replace(/\bEMP-\d+\b/gi, "")
    .split(/\s+[—–-]\s+/)[0]
    .replace(/^[\s/|,]+|[\s/|,]+$/g, "")
    .trim();
  if (!assignedTo || !assignedGroup) {
    throw new Error(`Could not read assignee and queue from Assigned Entity "${entity}"`);
  }

  const tagSource = section(lines, "COMPLEXITY VECTORS & TAGS").join("\n") + "\n" + (scoringManifestMd || "");
  const tags = {} as ParsedAssessment["tags"];
  const vectors = {} as ParsedAssessment["vectors"];
  for (const vector of Object.keys(TAG_VALUES) as (keyof typeof TAG_VALUES)[]) {
    const tag = findTag(tagSource, vector);
    if (!tag) throw new Error(`Could not read a valid ${vector} tag from the workflow output`);
    tags[vector] = tag;
    vectors[vector] = Math.round(TAG_VALUES[vector][tag] * 100);
  }

  const nextSteps = section(lines, "TARGETED NEXT STEPS FOR ADJUSTER").map(clean).filter(Boolean);
  const clinical = section(lines, "CLINICAL & FUNCTIONAL PROFILE");

  return {
    recommendation,
    complexityScore,
    scoreDriver: field(lines, "Primary Score Driver"),
    assignedTo,
    assignedGroup,
    routingRationale: field(lines, "Routing Rationale"),
    summary: field(lines, "Executive Summary"),
    contractStatus: field(lines, "Contract Status"),
    eliminationPeriod: field(lines, "Elimination Period"),
    exclusions: field(lines, "Exclusions"),
    tags,
    vectors,
    riskIndicators: section(lines, "CRITICAL ALERTS & DISCREPANCIES").map(clean).filter(Boolean),
    recommendedAction: nextSteps.length ? nextSteps.join(" ") : undefined,
    clinicalProfileMd: clinical.length ? clinical.join("\n") : undefined,
    briefingMd,
    scoringManifestMd,
  };
}

export function claimStatusFor(recommendation: Recommendation) {
  switch (recommendation) {
    case "APPROVE CLAIM":
      return "auto_approved" as const;
    case "ESCALATE":
      return "escalated" as const;
    case "PENDING FOR INFORMATION":
      return "pending" as const;
    case "REJECT":
      return "in_review" as const;
  }
}
