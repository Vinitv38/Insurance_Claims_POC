export type ScoreBand = "low" | "moderate" | "high" | "critical";

// Same bands as the LTC New routing thresholds: 0-31 Junior, 32-60 Senior, 61-90 Tier 2, 91-100 SIU.
export function scoreBand(score: number): ScoreBand {
  if (score <= 31) return "low";
  if (score <= 60) return "moderate";
  if (score <= 90) return "high";
  return "critical";
}

export const SCORE_BAND_HEX: Record<ScoreBand, string> = {
  low: "#22C55E",
  moderate: "#F59E0B",
  high: "#DF643D",
  critical: "#EF4444",
};

export const SCORE_BAND_TEXT: Record<ScoreBand, string> = {
  low: "text-green-600",
  moderate: "text-amber-600",
  high: "text-acme-orange",
  critical: "text-red-600",
};

export const SCORE_BAND_BAR: Record<ScoreBand, string> = {
  low: "bg-green-500",
  moderate: "bg-amber-500",
  high: "bg-acme-orange",
  critical: "bg-red-500",
};

export const SCORE_BAND_SOFT: Record<ScoreBand, string> = {
  low: "bg-green-50 text-green-700",
  moderate: "bg-amber-50 text-amber-700",
  high: "bg-acme-orange/10 text-acme-orange",
  critical: "bg-red-50 text-red-700",
};

export const SCORE_BAND_TINT: Record<ScoreBand, string> = {
  low: "bg-green-500/10",
  moderate: "bg-amber-500/10",
  high: "bg-acme-orange/10",
  critical: "bg-red-500/10",
};
