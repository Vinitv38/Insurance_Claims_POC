"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface TaxonomyEntry {
  label: string;
  score: number;
  description: string;
}

const VECTOR_TAXONOMY: Record<string, TaxonomyEntry[]> = {
  clinical: [
    { label: "IMPROVING", score: 0.0, description: "Functional capacity is returning; rehabilitation successful." },
    { label: "STABLE", score: 0.1, description: "No change from historical baseline." },
    { label: "MODERATE_DECLINE", score: 0.4, description: "Gradual worsening; requires increased standby assist." },
    { label: "SEVERE_DECLINE", score: 0.8, description: "Sudden, major loss of function (e.g., newly non-ambulatory)." },
    { label: "CRITICAL_ACUITY", score: 0.9, description: "Requires 24/7 skilled nursing or life-sustaining intervention." },
    { label: "TERMINAL_PROGNOSIS", score: 1.0, description: "Hospice transition or less than 6 months life expectancy." },
  ],
  documentation: [
    { label: "COMPLETE", score: 0.0, description: "All pages present, signed, and legible." },
    { label: "MINOR_MISSING_DATA", score: 0.3, description: "Missing non-critical info (e.g., undated cover sheet)." },
    { label: "EXPIRED_RECENCY", score: 0.6, description: "Document violates the 90-day validity rule (e.g., an 18-month-old care plan)." },
    { label: "MISSING_SIGNATURE", score: 0.7, description: "Attending Physician statement lacks electronic or physical signature." },
    { label: "ILLEGIBLE_SUBMISSION", score: 0.8, description: "Fax or handwriting degradation prevents high-confidence OCR." },
    { label: "CRITICAL_MISSING_PAGES", score: 0.9, description: "Essential medical records are truncated." },
  ],
  discrepancy: [
    { label: "NO_CONTRADICTION", score: 0.0, description: "All documents temporally and logically align." },
    { label: "MINOR_DISCREPANCY", score: 0.3, description: "Slight timeline confusion (e.g., dates of service off by 24 hours)." },
    { label: "PROVIDER_MISMATCH", score: 0.6, description: "Treatment claims do not align with the provider's known specialty." },
    { label: "DIRECT_CONTRADICTION", score: 1.0, description: "Documents actively fight each other (e.g., self-attesting wheelchair confinement while a nurse notes independent ambulation)." },
    { label: "SUSPECTED_FRAUD_INDICATOR", score: 1.0, description: "Altered documents, mismatched metadata, or known bad-actor providers." },
  ],
  behavioral: [
    { label: "CALM", score: 0.0, description: "Standard, procedural customer interaction." },
    { label: "INQUIRING", score: 0.2, description: "Customer asking for status updates; standard volume." },
    { label: "VULNERABLE_CUSTOMER", score: 0.6, description: "Indicators of severe cognitive distress, financial hardship, or inability to navigate the process." },
    { label: "ELEVATED_FRUSTRATION", score: 0.7, description: "High urgency, anger, or complaints of operational delays." },
    { label: "LITIGIOUS_THREAT", score: 1.0, description: "Explicit mention of lawyers, department of insurance complaints, or media escalation." },
  ],
};

interface RiskThermometerProps {
  label: string;
  value: number;
  subscript: string;
  color?: string;
}

function getBarColor(value: number): string {
  if (value <= 30) return "bg-green-500";
  if (value <= 60) return "bg-amber-500";
  if (value <= 80) return "bg-acme-orange";
  return "bg-red-500";
}

function getMatchedEntry(entries: TaxonomyEntry[], value: number): string | null {
  const normalizedValue = value / 100;
  let closest: TaxonomyEntry | null = null;
  let minDiff = Infinity;
  for (const entry of entries) {
    const diff = Math.abs(entry.score - normalizedValue);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }
  return closest?.label ?? null;
}

function getScoreColor(score: number): string {
  if (score <= 0.1) return "text-green-600 bg-green-50 border-green-200";
  if (score <= 0.4) return "text-amber-600 bg-amber-50 border-amber-200";
  if (score <= 0.7) return "text-orange-600 bg-orange-50 border-orange-200";
  return "text-red-600 bg-red-50 border-red-200";
}

export default function RiskThermometer({ label, value, subscript }: RiskThermometerProps) {
  const [expanded, setExpanded] = useState(false);
  const taxonomyKey = label.toLowerCase() as keyof typeof VECTOR_TAXONOMY;
  const entries = VECTOR_TAXONOMY[taxonomyKey] || [];
  const matchedLabel = getMatchedEntry(entries, value);

  return (
    <div className="space-y-1.5">
      <div
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 group-hover:text-acme-teal transition-colors">{label}</span>
          <span className="text-[10px] text-gray-500 font-mono">({subscript})</span>
          <ChevronDown className={cn(
            "w-3 h-3 text-gray-400 transition-transform duration-200",
            expanded && "rotate-180"
          )} />
        </div>
        <span className={cn(
          "text-xs font-bold tabular-nums",
          value <= 30 ? "text-green-600" : value <= 60 ? "text-amber-600" : value <= 80 ? "text-acme-orange" : "text-red-600"
        )}>
          {value}%
        </span>
      </div>
      <div className="thermometer-track">
        <motion.div
          className={cn("thermometer-fill", getBarColor(value))}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ boxShadow: value > 60 ? `0 0 10px ${value > 80 ? "rgba(239,68,68,0.4)" : "rgba(232,121,43,0.4)"}` : "none" }}
        />
      </div>
      <AnimatePresence>
        {expanded && entries.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-acme-border bg-gray-50/80 p-2 space-y-1">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-semibold px-1 mb-1">Scoring Parameters</p>
              {entries.map((entry) => {
                const isActive = entry.label === matchedLabel;
                return (
                  <div
                    key={entry.label}
                    className={cn(
                      "flex items-start gap-2 px-2 py-1.5 rounded text-[10px] border transition-colors",
                      isActive
                        ? "bg-acme-orange/10 border-acme-orange/30 ring-1 ring-acme-orange/20"
                        : "border-transparent hover:bg-gray-100"
                    )}
                  >
                    <span className={cn(
                      "font-mono font-bold shrink-0 w-8 text-center py-0.5 rounded border text-[9px]",
                      getScoreColor(entry.score)
                    )}>
                      {entry.score.toFixed(1)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "font-semibold block",
                        isActive ? "text-acme-orange" : "text-gray-700"
                      )}>
                        {entry.label}
                        {isActive && <span className="ml-1 text-[8px] text-acme-orange font-normal">(current)</span>}
                      </span>
                      <span className="text-gray-500 leading-tight block">{entry.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
