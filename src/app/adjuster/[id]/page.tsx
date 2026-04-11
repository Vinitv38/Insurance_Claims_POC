"use client";

import { useParams, useRouter } from "next/navigation";
import { useClaimsStore } from "@/store/claims-store";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  ArrowLeft, Brain, FileText, CheckCircle2,
  Bookmark, Stethoscope, Shield, ClipboardList,
  ThumbsUp, RotateCcw
} from "lucide-react";

// Citation metadata for reference - keys match the highlightedCitation values used in JSX
const _citations = {
  "HW-Note-1": { highlightText: "my hands shake so badly I cannot button my shirts" },
  "HW-Note-2": { highlightText: "My wife Helen helps me bathe because I am afraid of falling" },
  "HW-Note-3": { highlightText: "I used to be a carpenter — now I can barely hold a cup of coffee" },
  "NEURO-1": { highlightText: "Parkinson's Disease, Stage 3 (Hoehn & Yahr)" },
};
void _citations;

export default function AdjusterPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const cases = useClaimsStore((s) => s.cases);
  const highlightedCitation = useClaimsStore((s) => s.highlightedCitation);
  const setHighlightedCitation = useClaimsStore((s) => s.setHighlightedCitation);

  const [activeSourceTab, setActiveSourceTab] = useState<"handwritten" | "neuro">("handwritten");

  const currentCase = cases.find((c) => c.id === caseId);

  if (!currentCase) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-slate-400">Case not found</p>
          <button onClick={() => router.push("/")} className="mt-4 text-acme-orange hover:underline text-sm">Return to Command Center</button>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/case/${caseId}`)} className="p-2 rounded-lg hover:bg-acme-slate transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Adjuster Decision Workspace</h1>
            <p className="text-sm text-acme-muted mt-0.5">{currentCase.claimantName} — {currentCase.policyNumber} — Source vs. AI Summary</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-500 transition-colors">
            <ThumbsUp className="w-3.5 h-3.5" /> Approve Claim
          </button>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-acme-slate border border-acme-border text-xs text-slate-400 hover:text-white transition-colors">
            <RotateCcw className="w-3.5 h-3.5" /> Reinvestigate
          </button>
        </div>
      </div>

      {/* Split Pane */}
      <div className="grid grid-cols-2 gap-6 min-h-[calc(100vh-180px)]">
        {/* Left Pane: AI Decision Summary */}
        <div className="rounded-xl border border-acme-border bg-acme-dark overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
            <Brain className="w-4 h-4 text-acme-orange" />
            <h2 className="text-sm font-semibold text-white">AI Decision Summary</h2>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">AUTO-GENERATED</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Clinical Synopsis */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="w-4 h-4 text-acme-orange" />
                <h3 className="text-xs font-bold text-acme-orange uppercase tracking-wider">Clinical Synopsis</h3>
              </div>
              <div className="bg-acme-navy/50 rounded-lg p-4 border border-acme-border/50">
                <p className="text-sm text-slate-300 leading-relaxed">
                  72-year-old male with recently diagnosed <span className="text-white font-medium">Parkinson&#39;s Disease</span> (Stage 3, Hoehn & Yahr).{" "}
                  <button onClick={() => setHighlightedCitation("NEURO-1")} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all", highlightedCitation === "NEURO-1" ? "bg-acme-orange text-white" : "bg-acme-orange/20 text-acme-orange hover:bg-acme-orange/30")}>
                    <Bookmark className="w-2.5 h-2.5" /> Ref: NEURO-1
                  </button>{" "}
                  Presenting with moderate-to-severe bilateral tremors significantly impacting Activities of Daily Living:{" "}
                  <span className="text-white font-medium">Bathing</span> and <span className="text-white font-medium">Dressing</span>.{" "}
                  <button onClick={() => setHighlightedCitation("HW-Note-1")} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all", highlightedCitation === "HW-Note-1" ? "bg-acme-orange text-white" : "bg-acme-orange/20 text-acme-orange hover:bg-acme-orange/30")}>
                    <Bookmark className="w-2.5 h-2.5" /> Ref: HW-Note-1
                  </button>
                </p>
                <p className="text-sm text-slate-300 leading-relaxed mt-2">
                  Patient reports inability to perform fine motor tasks (buttoning shirts, holding razor) and requires assistance with bathing due to fall risk.{" "}
                  <button onClick={() => setHighlightedCitation("HW-Note-2")} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all", highlightedCitation === "HW-Note-2" ? "bg-acme-orange text-white" : "bg-acme-orange/20 text-acme-orange hover:bg-acme-orange/30")}>
                    <Bookmark className="w-2.5 h-2.5" /> Ref: HW-Note-2
                  </button>{" "}
                  Occupational decline from former carpenter to requiring assistance with basic self-care.{" "}
                  <button onClick={() => setHighlightedCitation("HW-Note-3")} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all", highlightedCitation === "HW-Note-3" ? "bg-acme-orange text-white" : "bg-acme-orange/20 text-acme-orange hover:bg-acme-orange/30")}>
                    <Bookmark className="w-2.5 h-2.5" /> Ref: HW-Note-3
                  </button>
                </p>
              </div>
            </div>

            {/* Risk Indicators */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-green-400" />
                <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider">Risk Indicators / Red Flags</h3>
              </div>
              <div className="bg-green-500/5 rounded-lg p-4 border border-green-500/10">
                {currentCase.riskIndicators?.map((indicator, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-300">{indicator}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Next Steps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Recommended Next Steps</h3>
              </div>
              <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/10">
                <p className="text-sm text-slate-300 leading-relaxed font-medium">{currentCase.recommendedAction}</p>
              </div>
            </div>

            {/* AI Confidence */}
            <div className="bg-acme-navy/50 rounded-lg p-4 border border-acme-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-acme-muted uppercase tracking-wider font-semibold">AI Confidence Level</span>
                <span className="text-sm font-bold text-green-400">96.2%</span>
              </div>
              <div className="h-2 rounded-full bg-acme-slate overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "96.2%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-acme-muted mt-2">Based on 4 source documents analyzed. All claims cross-validated against medical records.</p>
            </div>
          </div>
        </div>

        {/* Right Pane: Source Material Viewer */}
        <div className="rounded-xl border border-acme-border bg-acme-dark overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-acme-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-semibold text-white">Source Material Viewer</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setActiveSourceTab("handwritten"); setHighlightedCitation(null); }}
                className={cn("px-3 py-1 rounded text-[10px] font-medium transition-colors", activeSourceTab === "handwritten" ? "bg-acme-orange/20 text-acme-orange" : "text-slate-400 hover:text-white")}
              >
                Handwritten Note
              </button>
              <button
                onClick={() => { setActiveSourceTab("neuro"); setHighlightedCitation(null); }}
                className={cn("px-3 py-1 rounded text-[10px] font-medium transition-colors", activeSourceTab === "neuro" ? "bg-acme-orange/20 text-acme-orange" : "text-slate-400 hover:text-white")}
              >
                Neurologist Report
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeSourceTab === "handwritten" ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-blue-400">Claimant_Personal_Statement_HW_040426.pdf</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-acme-orange/10 text-acme-orange border border-acme-orange/20">OCR: 87%</span>
                </div>
                {/* Simulated handwritten document */}
                <div className="relative bg-[#FFF8E7] rounded-lg p-6 min-h-[450px] border border-amber-200/30">
                  {/* Lined paper effect */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #E5D5B5 31px, #E5D5B5 32px)",
                    backgroundPosition: "0 20px",
                  }} />
                  {/* Red margin line */}
                  <div className="absolute top-0 bottom-0 left-16 w-px bg-red-300/40" />

                  {/* Handwritten text */}
                  <div className="relative pl-6 space-y-[23px] pt-1" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive", fontSize: "16px", color: "#1a365d", lineHeight: "32px" }}>
                    <p>My name is Arthur Pendelton. I am writing</p>
                    <p>to explain my daily challenges. Since my</p>
                    <p className="relative">
                      Parkinson&#39;s diagnosis, my hands shake so
                      {highlightedCitation === "HW-Note-1" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />
                      )}
                    </p>
                    <p className="relative">
                      badly I cannot button my shirts or hold
                      {highlightedCitation === "HW-Note-1" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />
                      )}
                    </p>
                    <p>a razor to shave. My wife Helen helps me</p>
                    <p className="relative">
                      bathe because I am afraid of falling in
                      {highlightedCitation === "HW-Note-2" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />
                      )}
                    </p>
                    <p className="relative">
                      the tub. I used to be a carpenter — now
                      {highlightedCitation === "HW-Note-2" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />
                      )}
                    </p>
                    <p className="relative">
                      I can barely hold a cup of coffee. I need
                      {highlightedCitation === "HW-Note-3" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />
                      )}
                    </p>
                    <p className="relative">
                      help and I am grateful for this policy.
                      {highlightedCitation === "HW-Note-3" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />
                      )}
                    </p>
                  </div>

                  {/* Signature */}
                  <div className="absolute bottom-6 right-8" style={{ fontFamily: "'Caveat', cursive", fontSize: "20px", color: "#1a365d" }}>
                    — Arthur Pendelton
                  </div>
                </div>
                <p className="text-[10px] text-acme-muted text-center">Click citation badges on the left to highlight source text</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-blue-400">Neurologist_Report_040326.pdf</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Verified</span>
                </div>
                <div className="relative bg-white rounded-lg p-6 min-h-[450px] border border-slate-200/30 text-slate-800 text-sm font-mono leading-relaxed">
                  <div className="border-b border-slate-300 pb-3 mb-4">
                    <p className="font-bold text-lg">NEUROLOGY CONSULTATION REPORT</p>
                    <p className="text-xs text-slate-500 mt-1">Regional Medical Center — Dept. of Neurology</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">PATIENT:</p>
                      <p>Arthur Pendelton — DOB: 03/12/1954</p>
                    </div>
                    <div className="relative">
                      <p className="text-xs text-slate-500 font-semibold">DIAGNOSIS:</p>
                      <p className={cn(highlightedCitation === "NEURO-1" && "bg-orange-100 border border-orange-300 rounded px-1")}>
                        Parkinson&#39;s Disease, Stage 3 (Hoehn & Yahr Scale)
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">TREMOR ASSESSMENT:</p>
                      <p>Bilateral, moderate-to-severe resting tremor</p>
                      <p>Postural instability: Present</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">CURRENT MEDICATION:</p>
                      <p>Carbidopa/Levodopa 25/100 TID</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold">PROGNOSIS:</p>
                      <p>Progressive. Current ADL deficits expected to increase over time. Patient will require increasing levels of assistance with daily activities.</p>
                    </div>
                    <div className="border-t border-slate-300 pt-3 mt-4">
                      <p className="text-xs text-slate-500">Examining Physician: Dr. Elena Vasquez, MD — Board Certified Neurologist</p>
                      <p className="text-xs text-slate-500">Date: 04/03/2026</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
