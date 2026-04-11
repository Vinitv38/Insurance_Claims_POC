"use client";

import { useParams, useRouter } from "next/navigation";
import { useClaimsStore } from "@/store/claims-store";
import RiskThermometer from "@/components/ui/RiskThermometer";
import StatusBadge from "@/components/ui/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle2, Clock,
  Brain, Eye, ChevronRight, RotateCcw, Loader2, History,
  User, Calendar, Stethoscope, Shield, FileSearch, Code, FileType,
  Bookmark, ClipboardList
} from "lucide-react";
import type { Document } from "@/store/claims-store";

type MainTab = "overview" | "decision";
type DocViewTab = "original" | "schema" | "interpreted";

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const cases = useClaimsStore((s) => s.cases);
  const semanticLog = useClaimsStore((s) => s.semanticLog);
  const dropPhase = useClaimsStore((s) => s.dropPhase);
  const isProcessing = useClaimsStore((s) => s.isProcessing);
  const activeDocumentId = useClaimsStore((s) => s.activeDocumentId);
  const triggerDocumentDrop = useClaimsStore((s) => s.triggerDocumentDrop);
  const resetDropPhase = useClaimsStore((s) => s.resetDropPhase);
  const setActiveDocument = useClaimsStore((s) => s.setActiveDocument);
  const highlightedCitation = useClaimsStore((s) => s.highlightedCitation);
  const setHighlightedCitation = useClaimsStore((s) => s.setHighlightedCitation);

  const [isDragOver, setIsDragOver] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [docViewTab, setDocViewTab] = useState<DocViewTab>("original");
  const [activeSourceTab, setActiveSourceTab] = useState<"handwritten" | "neuro">("handwritten");
  const logEndRef = useRef<HTMLDivElement>(null);

  const currentCase = cases.find((c) => c.id === caseId);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [semanticLog]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (caseId === "case-002") {
      triggerDocumentDrop();
    }
  }, [caseId, triggerDocumentDrop]);

  if (!currentCase) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-gray-500">Case not found</p>
          <button onClick={() => router.push("/")} className="mt-4 text-acme-orange hover:underline text-sm">
            Return to Command Center
          </button>
        </div>
      </div>
    );
  }

  // TypeScript now knows caseData is non-null after the guard above
  const caseData = currentCase;
  const isHargrove = caseId === "case-002";
  const activeDoc = caseData.documents.find((d) => d.id === activeDocumentId);

  /* Helper to render the document viewer with 3 tabs */
  function renderDocumentViewer(doc: Document) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-acme-orange">{doc.name}</span>
          <StatusBadge status={doc.status} />
        </div>
        {/* 3-Tab Document Viewer */}
        <div className="flex items-center gap-1 border-b border-acme-border">
          <button
            onClick={() => setDocViewTab("original")}
            className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px", docViewTab === "original" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
          >
            <FileType className="w-3 h-3" /> Original
          </button>
          <button
            onClick={() => setDocViewTab("schema")}
            className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px", docViewTab === "schema" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
          >
            <Code className="w-3 h-3" /> JSON Schema
          </button>
          <button
            onClick={() => setDocViewTab("interpreted")}
            className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px", docViewTab === "interpreted" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
          >
            <Brain className="w-3 h-3" /> AI Interpreted
          </button>
        </div>

        <AnimatePresence mode="wait">
          {docViewTab === "original" && (
            <motion.div key="original" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-gray-50 rounded-lg p-4 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed relative">
                {doc.extractedText?.split("\\n").map((line, i) => {
                  const isHighlighted = line.includes("MISSING") || line.includes("FAILED") || line.includes("CRITICAL") || line.includes("CONTRADICTION") || line.includes("wheelchair") || line.includes("Page 1 of 4") || line.includes("Left hip") || line.includes("HANDWRITTEN") || line.includes("OCR");
                  return (
                    <div key={i} className={cn("py-0.5", isHighlighted && "bbox-highlight px-1 my-1")}>
                      {line}
                    </div>
                  );
                })}
              </div>
              {doc.pageInfo && (
                <p className={cn("text-[10px] mt-2", doc.pageInfo.includes("INCOMPLETE") ? "text-red-400" : "text-gray-500")}>
                  {doc.pageInfo}
                </p>
              )}
            </motion.div>
          )}

          {docViewTab === "schema" && (
            <motion.div key="schema" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-acme-dark rounded-lg p-4 border border-gray-700 overflow-auto max-h-[400px]">
                <pre className="text-[11px] text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {doc.jsonSchema ? JSON.stringify(doc.jsonSchema, null, 2) : "No JSON schema available for this document."}
                </pre>
              </div>
            </motion.div>
          )}

          {docViewTab === "interpreted" && (
            <motion.div key="interpreted" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-3">
                {doc.aiFindings && doc.aiFindings.length > 0 ? (
                  <>
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">AI Findings</p>
                      {doc.aiFindings.map((finding, i) => (
                        <div key={i} className={cn(
                          "flex items-start gap-2 text-xs py-1.5 px-2 rounded",
                          finding.includes("CRITICAL") || finding.includes("CONTRADICTION") || finding.includes("FAILED") || finding.includes("WARNING")
                            ? "bg-red-50 text-red-600 border border-red-200"
                            : finding.includes("flag") || finding.includes("Inconsisten")
                              ? "bg-amber-50 text-amber-600 border border-amber-200"
                              : "bg-gray-50 text-gray-600 border border-gray-200"
                        )}>
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                    {doc.flagReason && (
                      <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                        <p className="text-[10px] text-red-500 uppercase tracking-wider font-semibold mb-1">Flag Reason</p>
                        <p className="text-xs text-red-600">{doc.flagReason}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                    <p className="text-xs text-gray-500">No AI interpretations available for this document.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* Helper for action buttons based on status */
  function renderActionButtons() {
    if (caseData.status === "auto_approved" || caseData.status === "closed") {
      return (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <h3 className="text-xs font-semibold text-green-600 uppercase tracking-wider">Recommended Action</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">{caseData.recommendedAction}</p>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-500 transition-colors">
              Approve Claim
            </button>
            <button className="px-4 py-2 rounded-lg bg-white border border-acme-border text-xs text-gray-500 hover:text-gray-900 transition-colors">
              Reinvestigate
            </button>
          </div>
        </div>
      );
    }
    if (caseData.status === "escalated") {
      return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider">Recommended Action</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">{caseData.recommendedAction}</p>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors">
              Escalate to SIU
            </button>
            <button className="px-4 py-2 rounded-lg bg-white border border-acme-border text-xs text-gray-500 hover:text-gray-900 transition-colors">
              Request Documents
            </button>
          </div>
        </div>
      );
    }
    // in_review or pending
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Recommended Action</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">{caseData.recommendedAction}</p>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-500 transition-colors">
            Complete Review
          </button>
          <button className="px-4 py-2 rounded-lg bg-white border border-acme-border text-xs text-gray-500 hover:text-gray-900 transition-colors">
            Request Documents
          </button>
        </div>
      </div>
    );
  }

  /* Decision Summary Tab - Pendelton-specific with citations, generic for others */
  function renderDecisionSummary() {
    const isPendelton = caseId === "case-001";

    return (
      <div className="grid grid-cols-2 gap-6 min-h-[calc(100vh-280px)]">
        {/* Left Pane: AI Decision Summary */}
        <div className="rounded-xl border border-acme-border bg-white overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
            <Brain className="w-4 h-4 text-acme-orange" />
            <h2 className="text-sm font-semibold text-acme-teal">AI Decision Summary</h2>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">AUTO-GENERATED</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Clinical Synopsis */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Stethoscope className="w-4 h-4 text-acme-orange" />
                <h3 className="text-xs font-bold text-acme-orange uppercase tracking-wider">Clinical Synopsis</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-acme-border/50">
                <p className="text-sm text-gray-600 leading-relaxed">
                  {caseData.summary}
                  {isPendelton && (
                    <>
                      {" "}
                      <button onClick={() => setHighlightedCitation("NEURO-1")} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all", highlightedCitation === "NEURO-1" ? "bg-acme-orange text-white" : "bg-acme-orange/20 text-acme-orange hover:bg-acme-orange/30")}>
                        <Bookmark className="w-2.5 h-2.5" /> Ref: NEURO-1
                      </button>
                      {" "}
                      <button onClick={() => setHighlightedCitation("HW-Note-1")} className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all", highlightedCitation === "HW-Note-1" ? "bg-acme-orange text-white" : "bg-acme-orange/20 text-acme-orange hover:bg-acme-orange/30")}>
                        <Bookmark className="w-2.5 h-2.5" /> Ref: HW-Note-1
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Risk Indicators */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-green-500" />
                <h3 className="text-xs font-bold text-green-600 uppercase tracking-wider">Risk Indicators / Red Flags</h3>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                {caseData.riskIndicators?.map((indicator, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5">
                    {indicator.includes("CRITICAL") ? <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" /> :
                     indicator.includes("WARNING") ? <Clock className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" /> :
                     <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />}
                    <p className="text-sm text-gray-600">{indicator}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Next Steps */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Recommended Next Steps</h3>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700 leading-relaxed font-medium">{caseData.recommendedAction}</p>
              </div>
            </div>

            {/* AI Confidence */}
            <div className="bg-gray-50 rounded-lg p-4 border border-acme-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">AI Confidence Level</span>
                <span className="text-sm font-bold text-green-600">
                                  {caseData.complexityScore <= 30 ? "96.2%" : caseData.complexityScore <= 60 ? "89.4%" : caseData.complexityScore <= 80 ? "82.1%" : "94.8%"}
                                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: caseData.complexityScore <= 30 ? "96.2%" : caseData.complexityScore <= 60 ? "89.4%" : caseData.complexityScore <= 80 ? "82.1%" : "94.8%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2">Based on {caseData.documents.length} source documents analyzed.</p>
            </div>
          </div>
        </div>

        {/* Right Pane: Source Material Viewer */}
        <div className="rounded-xl border border-acme-border bg-white overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-acme-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-semibold text-acme-teal">Source Material Viewer</h2>
            </div>
            {isPendelton && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setActiveSourceTab("handwritten"); setHighlightedCitation(null); }}
                  className={cn("px-3 py-1 rounded text-[10px] font-medium transition-colors", activeSourceTab === "handwritten" ? "bg-orange-50 text-acme-orange" : "text-gray-500 hover:text-gray-900")}
                >
                  Handwritten Note
                </button>
                <button
                  onClick={() => { setActiveSourceTab("neuro"); setHighlightedCitation(null); }}
                  className={cn("px-3 py-1 rounded text-[10px] font-medium transition-colors", activeSourceTab === "neuro" ? "bg-orange-50 text-acme-orange" : "text-gray-500 hover:text-gray-900")}
                >
                  Neurologist Report
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {isPendelton ? (
              <>
                {activeSourceTab === "handwritten" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-blue-500">Claimant_Personal_Statement_HW_040426.pdf</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-acme-orange/10 text-acme-orange border border-acme-orange/20">OCR: 87%</span>
                    </div>
                    <div className="relative bg-[#FFF8E7] rounded-lg p-6 min-h-[450px] border border-amber-200/30">
                      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 31px, #E5D5B5 31px, #E5D5B5 32px)", backgroundPosition: "0 20px" }} />
                      <div className="absolute top-0 bottom-0 left-16 w-px bg-red-300/40" />
                      <div className="relative pl-6 space-y-[23px] pt-1" style={{ fontFamily: "'Caveat', 'Comic Sans MS', cursive", fontSize: "16px", color: "#1a365d", lineHeight: "32px" }}>
                        <p>My name is Arthur Pendelton. I am writing</p>
                        <p>to explain my daily challenges. Since my</p>
                        <p className="relative">
                          Parkinson&#39;s diagnosis, my hands shake so
                          {highlightedCitation === "HW-Note-1" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />)}
                        </p>
                        <p className="relative">
                          badly I cannot button my shirts or hold
                          {highlightedCitation === "HW-Note-1" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />)}
                        </p>
                        <p>a razor to shave. My wife Helen helps me</p>
                        <p className="relative">
                          bathe because I am afraid of falling in
                          {highlightedCitation === "HW-Note-2" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />)}
                        </p>
                        <p className="relative">
                          the tub. I used to be a carpenter {"\u2014"} now
                          {highlightedCitation === "HW-Note-2" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />)}
                        </p>
                        <p className="relative">
                          I can barely hold a cup of coffee. I need
                          {highlightedCitation === "HW-Note-3" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />)}
                        </p>
                        <p className="relative">
                          help and I am grateful for this policy.
                          {highlightedCitation === "HW-Note-3" && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute -inset-x-2 -inset-y-1 bbox-highlight rounded" />)}
                        </p>
                      </div>
                      <div className="absolute bottom-6 right-8" style={{ fontFamily: "'Caveat', cursive", fontSize: "20px", color: "#1a365d" }}>
                        {"\u2014"} Arthur Pendelton
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-500 text-center">Click citation badges on the left to highlight source text</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-blue-500">Neurologist_Report_040326.pdf</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-600 border border-green-200">Verified</span>
                    </div>
                    <div className="relative bg-white rounded-lg p-6 min-h-[450px] border border-slate-200 text-slate-800 text-sm font-mono leading-relaxed">
                      <div className="border-b border-slate-300 pb-3 mb-4">
                        <p className="font-bold text-lg">NEUROLOGY CONSULTATION REPORT</p>
                        <p className="text-xs text-slate-500 mt-1">Regional Medical Center {"\u2014"} Dept. of Neurology</p>
                      </div>
                      <div className="space-y-3">
                        <div><p className="text-xs text-slate-500 font-semibold">PATIENT:</p><p>Arthur Pendelton {"\u2014"} DOB: 03/12/1954</p></div>
                        <div className="relative">
                          <p className="text-xs text-slate-500 font-semibold">DIAGNOSIS:</p>
                          <p className={cn(highlightedCitation === "NEURO-1" && "bg-orange-100 border border-orange-300 rounded px-1")}>
                            Parkinson&#39;s Disease, Stage 3 (Hoehn & Yahr Scale)
                          </p>
                        </div>
                        <div><p className="text-xs text-slate-500 font-semibold">TREMOR ASSESSMENT:</p><p>Bilateral, moderate-to-severe resting tremor</p><p>Postural instability: Present</p></div>
                        <div><p className="text-xs text-slate-500 font-semibold">CURRENT MEDICATION:</p><p>Carbidopa/Levodopa 25/100 TID</p></div>
                        <div><p className="text-xs text-slate-500 font-semibold">PROGNOSIS:</p><p>Progressive. Current ADL deficits expected to increase.</p></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Generic source material for non-Pendelton cases */
              <div className="space-y-4">
                <p className="text-xs text-gray-500 mb-4">Source documents for this case:</p>
                {caseData.documents.map((doc) => (
                  <div key={doc.id} className="rounded-lg border border-acme-border p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className={cn("w-4 h-4", doc.status === "flagged" ? "text-red-400" : "text-green-400")} />
                        <span className="text-xs font-medium text-gray-700">{doc.name}</span>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                    <p className="text-[11px] text-gray-500 line-clamp-2">{doc.extractedText?.substring(0, 150)}...</p>
                    {doc.flagReason && (
                      <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {doc.flagReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-acme-teal">{caseData.claimantName}</h1>
              <StatusBadge status={caseData.status} />
              <span className={cn("text-xs font-bold px-2 py-0.5 rounded", caseData.complexityScore <= 30 ? "bg-green-50 text-green-700" : caseData.complexityScore <= 60 ? "bg-amber-50 text-amber-700" : caseData.complexityScore <= 80 ? "bg-acme-orange/10 text-acme-orange" : "bg-red-50 text-red-700")}>
                Score: {caseData.complexityScore}/100
              </span>
              {isHargrove && dropPhase > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-acme-orange/10 text-acme-orange border border-acme-orange/20 font-mono">
                  Phase {dropPhase}/4
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {caseData.policyNumber} {"\u2014"} {caseData.diagnosis}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isHargrove && dropPhase > 0 && (
            <button onClick={resetDropPhase} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-acme-border text-xs text-gray-500 hover:text-gray-900 transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Reset Demo
            </button>
          )}
          <button onClick={() => setShowAudit(!showAudit)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors", showAudit ? "bg-orange-50 border-acme-orange/30 text-acme-orange" : "bg-gray-50 border-acme-border text-gray-500 hover:text-gray-900")}>
            <History className="w-3.5 h-3.5" /> Audit Trail
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-1 border-b border-acme-border">
        <button
          onClick={() => setMainTab("overview")}
          className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px", mainTab === "overview" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <FileSearch className="w-4 h-4" /> Case Overview
        </button>
        <button
          onClick={() => setMainTab("decision")}
          className={cn("flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px", mainTab === "decision" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <Brain className="w-4 h-4" /> AI Decision Summary
        </button>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {mainTab === "overview" ? (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* Case Info Cards */}
            <div className="grid grid-cols-6 gap-4">
              <div className="rounded-lg border border-acme-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2"><User className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Claimant</span></div>
                <p className="text-sm font-medium text-gray-900">{caseData.claimantName}</p>
                <p className="text-xs text-gray-500">{caseData.age}yo {"\u2014"} DOB: {caseData.dateOfBirth}</p>
              </div>
              <div className="rounded-lg border border-acme-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2"><Shield className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Policy</span></div>
                <p className="text-sm font-medium text-gray-900 font-mono">{caseData.policyNumber}</p>
                <p className="text-xs text-gray-500">{caseData.claimType}</p>
              </div>
              <div className="rounded-lg border border-acme-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2"><Stethoscope className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Diagnosis</span></div>
                <p className="text-sm font-medium text-gray-900">{caseData.diagnosis}</p>
              </div>
              <div className="rounded-lg border border-acme-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2"><Calendar className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Filing Date</span></div>
                <p className="text-sm font-medium text-gray-900">{caseData.filingDate}</p>
                <p className="text-xs text-gray-500">Elim: {caseData.eliminationPeriod || "N/A"}</p>
              </div>
              <div className="rounded-lg border border-acme-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2"><User className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Assigned</span></div>
                <p className="text-sm font-medium text-gray-900">{caseData.assignedTo}</p>
                <p className="text-xs text-gray-500">{caseData.assignedGroup}</p>
              </div>
              <div className="rounded-lg border border-acme-border bg-white p-4">
                <div className="flex items-center gap-2 mb-2"><FileSearch className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Documents</span></div>
                <p className="text-sm font-medium text-gray-900">{caseData.documents.length} files</p>
                <p className="text-xs text-gray-500">{caseData.documents.filter(d => d.status === "flagged").length} flagged</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Panel: Documents + Upload */}
              <div className="col-span-4 space-y-4">
                {/* Drop Zone for Hargrove demo */}
                {isHargrove && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(
                      "rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300",
                      isDragOver ? "drop-zone-active border-acme-orange bg-acme-orange/5" : "border-acme-border hover:border-acme-muted",
                      isProcessing && "opacity-50 pointer-events-none",
                      dropPhase >= 4 && "opacity-40 pointer-events-none"
                    )}
                  >
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-acme-orange spin-slow" />
                        <p className="text-xs text-acme-orange font-medium">AI Processing...</p>
                      </div>
                    ) : dropPhase >= 4 ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle2 className="w-8 h-8 text-green-400" />
                        <p className="text-xs text-green-600 font-medium">All documents ingested</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className={cn("w-8 h-8", isDragOver ? "text-acme-orange" : "text-gray-400")} />
                        <p className={cn("text-xs font-medium", isDragOver ? "text-acme-orange" : "text-gray-400")}>
                          {isDragOver ? "Release to analyze" : "Drop file to trigger Day " + (dropPhase < 4 ? [2, 4, 5, 5][dropPhase] : "\u2014")}
                        </p>
                        <p className="text-[10px] text-gray-400">Drag any file to simulate ingestion</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Document Timeline */}
                <div className="rounded-xl border border-acme-border bg-white p-4">
                  <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">Document Timeline</h3>
                  <div className="space-y-0">
                    {caseData.documents.map((doc, i) => {
                      const isActive = doc.id === activeDocumentId;
                      const isIngested = isHargrove ? i < dropPhase : true;
                      return (
                        <div key={doc.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn(
                              "w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all duration-500",
                              isIngested
                                ? doc.status === "flagged" ? "bg-red-500 border-red-400 pulse-node" : "bg-green-500 border-green-400 pulse-node"
                                : "bg-gray-200 border-gray-300"
                            )} />
                            {i < caseData.documents.length - 1 && (
                              <div className={cn("w-0.5 h-8", isIngested ? "bg-acme-border" : "bg-acme-border/30")} />
                            )}
                          </div>
                          <button
                            onClick={() => { setActiveDocument(isActive ? null : doc.id); setDocViewTab("original"); }}
                            className={cn(
                              "flex-1 text-left rounded-lg p-2 -mt-1 transition-all duration-200",
                              isActive ? "bg-orange-50 border border-acme-orange/20" : "hover:bg-gray-50",
                              !isIngested && "opacity-40"
                            )}
                          >
                            <div className="flex items-center gap-1.5">
                              <FileText className={cn("w-3 h-3 flex-shrink-0", doc.status === "flagged" ? "text-red-400" : "text-green-400")} />
                              <span className="text-[11px] font-medium text-gray-700 truncate">{doc.name}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">Day {doc.day} {"\u2014"} {doc.status === "flagged" ? doc.flagReason?.split(" ").slice(0, 4).join(" ") + "..." : "Processed"}</p>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary + Risk Indicators */}
                {caseData.summary && (
                  <div className="rounded-xl border border-acme-border bg-white p-4">
                    <h3 className="text-xs font-semibold text-acme-teal mb-2 uppercase tracking-wider">Case Summary</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{caseData.summary}</p>
                  </div>
                )}
              </div>

              {/* Center/Right Panel: Document Viewer + Actions */}
              <div className="col-span-8 space-y-4">
                {/* Document Viewer */}
                <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-acme-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="w-3.5 h-3.5 text-acme-orange" />
                      <h3 className="text-xs font-semibold text-acme-teal uppercase tracking-wider">Document Viewer</h3>
                    </div>
                  </div>
                  <div className="p-4 min-h-[300px]">
                    <AnimatePresence mode="wait">
                      {activeDoc ? (
                        <motion.div
                          key={activeDoc.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          {renderDocumentViewer(activeDoc)}
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[280px] text-gray-400">
                          <FileText className="w-8 h-8 mb-2 opacity-30" />
                          <p className="text-xs">Select a document from the timeline</p>
                          <p className="text-[10px] text-gray-400 mt-1">View original, JSON schema, or AI interpretation</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* AI Semantic Log for Hargrove */}
                {isHargrove && (
                  <div className="rounded-xl border border-acme-border bg-acme-dark overflow-hidden">
                    <div className="px-4 py-3 border-b border-acme-border flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-acme-orange" />
                      <h3 className="text-xs font-semibold text-white uppercase tracking-wider">AI Semantic Log</h3>
                      {isProcessing && <Loader2 className="w-3 h-3 text-acme-orange spin-slow ml-auto" />}
                    </div>
                    <div className="terminal-log p-4 max-h-[200px] overflow-y-auto bg-acme-navy/80">
                      {semanticLog.length === 0 ? (
                        <p className="text-acme-muted text-xs">Drop a file to begin analysis...</p>
                      ) : (
                        semanticLog.map((entry, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * (i % 10) }} className="py-0.5">
                            <span className={cn(
                              "font-bold",
                              entry.type === "SCAN" && "text-blue-400",
                              entry.type === "EXTRACT" && "text-cyan-400",
                              entry.type === "ENGINE" && "text-acme-orange",
                              entry.type === "RULES" && "text-purple-400",
                              entry.type === "ALERT" && "text-red-400",
                              entry.type === "MATCH" && "text-green-400",
                            )}>
                              [{entry.type}]
                            </span>
                            <span className="text-slate-400 ml-1">{entry.message}</span>
                          </motion.div>
                        ))
                      )}
                      <div ref={logEndRef} />
                    </div>
                  </div>
                )}

                {/* Complexity Score Card (small, not center-focus) */}
                <div className="rounded-xl border border-acme-border bg-white p-4">
                  <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">Complexity Vectors</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <RiskThermometer label="Clinical" value={caseData.vectors.clinical} subscript="V_c" />
                    <RiskThermometer label="Documentation" value={caseData.vectors.documentation} subscript="V_d" />
                    <RiskThermometer label="Discrepancy" value={caseData.vectors.discrepancy} subscript="V_i" />
                    <RiskThermometer label="Behavioral" value={caseData.vectors.behavioral} subscript="V_b" />
                  </div>
                </div>

                {/* Risk Indicators */}
                {caseData.riskIndicators && (
                  <div className="rounded-xl border border-acme-border bg-white p-4">
                    <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">Risk Indicators</h3>
                    <div className="space-y-2">
                      {caseData.riskIndicators.map((indicator, i) => (
                        <div key={i} className={cn(
                          "flex items-start gap-2 text-xs p-2 rounded",
                          indicator.includes("CRITICAL") ? "bg-red-50 text-red-600 border border-red-200" :
                          indicator.includes("WARNING") ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          indicator.includes("None") ? "bg-green-50 text-green-600 border border-green-200" :
                          "text-gray-500 bg-gray-50 border border-gray-200"
                        )}>
                          {indicator.includes("CRITICAL") ? <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /> :
                           indicator.includes("WARNING") ? <Clock className="w-3 h-3 mt-0.5 flex-shrink-0" /> :
                           <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />}
                          <span>{indicator}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {renderActionButtons()}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="decision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderDecisionSummary()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audit Trail Panel */}
      <AnimatePresence>
        {showAudit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-acme-border bg-white overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-acme-border">
              <h3 className="text-sm font-semibold text-acme-teal">Audit History</h3>
              <p className="text-xs text-gray-500 mt-0.5">Complete chronological record of case events</p>
            </div>
            <div className="divide-y divide-acme-border/50 max-h-[400px] overflow-y-auto">
              {caseData.auditHistory.map((entry, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-4">
                  <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap mt-0.5">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                    entry.action.includes("ESCALAT") || entry.action.includes("FATAL") ? "bg-red-50 text-red-500 border border-red-200" :
                    entry.action.includes("AUTO_APPROVED") || entry.action.includes("CLAIM_CLOSED") ? "bg-green-50 text-green-500 border border-green-200" :
                    entry.action.includes("AI_SCORING") ? "bg-acme-orange/10 text-acme-orange border border-acme-orange/20" :
                    entry.action.includes("DISCREPANCY") ? "bg-amber-50 text-amber-500 border border-amber-200" :
                    "bg-blue-50 text-blue-500 border border-blue-200"
                  )}>
                    {entry.action}
                  </div>
                  <span className="text-xs text-gray-600 flex-1">{entry.detail}</span>
                  {entry.scoreChange && (
                    <span className="text-xs font-mono text-acme-orange">
                      {entry.scoreChange.from} {"\u2192"} {entry.scoreChange.to}
                    </span>
                  )}
                  {entry.user && <span className="text-[10px] text-gray-500">{entry.user}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
