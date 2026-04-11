"use client";

import { useParams, useRouter } from "next/navigation";
import { useClaimsStore } from "@/store/claims-store";
import ComplexityGauge from "@/components/ui/ComplexityGauge";
import RiskThermometer from "@/components/ui/RiskThermometer";
import StatusBadge from "@/components/ui/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  ArrowLeft, Upload, FileText, AlertTriangle, CheckCircle2, Clock,
  Brain, Eye, ChevronRight, RotateCcw, Loader2, History,
  User, Calendar, Stethoscope, Shield, FileSearch
} from "lucide-react";

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

  const [isDragOver, setIsDragOver] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
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

  const isHargrove = caseId === "case-002";
  const activeDoc = currentCase.documents.find((d) => d.id === activeDocumentId);


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
              <h1 className="text-xl font-bold text-acme-teal">{currentCase.claimantName}</h1>
              <StatusBadge status={currentCase.status} />
              {isHargrove && dropPhase > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-acme-orange/10 text-acme-orange border border-acme-orange/20 font-mono">
                  Phase {dropPhase}/4
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentCase.policyNumber} — {currentCase.diagnosis}
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
          {caseId === "case-001" && (
            <button onClick={() => router.push("/adjuster/case-001")} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-acme-orange text-white text-xs font-medium hover:bg-acme-orange/90 transition-colors">
              <Brain className="w-3.5 h-3.5" /> View Decision Summary
            </button>
          )}
        </div>
      </div>

      {/* Case Info Cards */}
      <div className="grid grid-cols-6 gap-4">
        <div className="rounded-lg border border-acme-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2"><User className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Claimant</span></div>
          <p className="text-sm font-medium text-gray-900">{currentCase.claimantName}</p>
          <p className="text-xs text-gray-500">{currentCase.age}yo — DOB: {currentCase.dateOfBirth}</p>
        </div>
        <div className="rounded-lg border border-acme-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2"><Shield className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Policy</span></div>
          <p className="text-sm font-medium text-gray-900 font-mono">{currentCase.policyNumber}</p>
          <p className="text-xs text-gray-500">{currentCase.claimType}</p>
        </div>
        <div className="rounded-lg border border-acme-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2"><Stethoscope className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Diagnosis</span></div>
          <p className="text-sm font-medium text-gray-900">{currentCase.diagnosis}</p>
        </div>
        <div className="rounded-lg border border-acme-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2"><Calendar className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Filing Date</span></div>
          <p className="text-sm font-medium text-gray-900">{currentCase.filingDate}</p>
          <p className="text-xs text-gray-500">Elim: {currentCase.eliminationPeriod || "N/A"}</p>
        </div>
        <div className="rounded-lg border border-acme-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2"><User className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Assigned</span></div>
          <p className="text-sm font-medium text-gray-900">{currentCase.assignedTo}</p>
          <p className="text-xs text-gray-500">{currentCase.assignedGroup}</p>
        </div>
        <div className="rounded-lg border border-acme-border bg-white p-4">
          <div className="flex items-center gap-2 mb-2"><FileSearch className="w-3.5 h-3.5 text-gray-400" /><span className="text-[10px] text-gray-500 uppercase tracking-wider">Documents</span></div>
          <p className="text-sm font-medium text-gray-900">{currentCase.documents.length} files</p>
          <p className="text-xs text-gray-500">{currentCase.documents.filter(d => d.status === "flagged").length} flagged</p>
        </div>
      </div>

      {/* Main 3-Panel Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel: Ingestion Stream */}
        <div className="col-span-3 space-y-4">
          {/* Drop Zone */}
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
                  <p className="text-xs text-green-400 font-medium">All documents ingested</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className={cn("w-8 h-8", isDragOver ? "text-acme-orange" : "text-acme-muted")} />
                  <p className={cn("text-xs font-medium", isDragOver ? "text-acme-orange" : "text-acme-muted")}>
                    {isDragOver ? "Release to analyze" : "Drop file to trigger Day " + (dropPhase < 4 ? [2, 4, 5, 5][dropPhase] : "—")}
                  </p>
                  <p className="text-[10px] text-acme-muted/60">Drag any file to simulate ingestion</p>
                </div>
              )}
            </div>
          )}

          {/* Document Timeline */}
          <div className="rounded-xl border border-acme-border bg-white p-4">
            <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">Document Timeline</h3>
            <div className="space-y-0">
              {currentCase.documents.map((doc, i) => {
                const isActive = doc.id === activeDocumentId;
                const isIngested = isHargrove ? i < dropPhase : true;
                return (
                  <div key={doc.id} className="flex items-start gap-3">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 flex-shrink-0 transition-all duration-500",
                        isIngested
                          ? doc.status === "flagged" ? "bg-red-500 border-red-400 pulse-node" : "bg-green-500 border-green-400 pulse-node"
                          : "bg-gray-200 border-gray-300"
                      )} />
                      {i < currentCase.documents.length - 1 && (
                        <div className={cn("w-0.5 h-8", isIngested ? "bg-acme-border" : "bg-acme-border/30")} />
                      )}
                    </div>
                    {/* Document info */}
                    <button
                      onClick={() => setActiveDocument(isActive ? null : doc.id)}
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
                      <p className="text-[10px] text-gray-500 mt-0.5">Day {doc.day} — {doc.status === "flagged" ? doc.flagReason?.split(" ").slice(0, 4).join(" ") + "..." : "Processed"}</p>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Panel: Complexity Index */}
        <div className="col-span-5 space-y-4">
          <div className="rounded-xl border border-acme-border bg-white p-6">
            <h3 className="text-xs font-semibold text-acme-teal mb-4 uppercase tracking-wider">Multi-Vector Complexity Index</h3>
            <div className="flex justify-center mb-6">
              <ComplexityGauge score={currentCase.complexityScore} size={240} label="Composite Score" />
            </div>
            <div className="space-y-4">
              <RiskThermometer label="Clinical" value={currentCase.vectors.clinical} subscript="V_c" />
              <RiskThermometer label="Documentation" value={currentCase.vectors.documentation} subscript="V_d" />
              <RiskThermometer label="Discrepancy" value={currentCase.vectors.discrepancy} subscript="V_i" />
              <RiskThermometer label="Behavioral" value={currentCase.vectors.behavioral} subscript="V_b" />
            </div>
          </div>

          {/* Actions for Pendelton */}
          {caseId === "case-001" && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider">Recommended Action</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{currentCase.recommendedAction}</p>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-500 transition-colors">
                  Approve Claim
                </button>
                <button className="px-4 py-2 rounded-lg bg-white border border-acme-border text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  Reinvestigate
                </button>
              </div>
            </div>
          )}

          {/* Actions for Hargrove */}
          {caseId === "case-002" && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider">Recommended Action</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">{currentCase.recommendedAction}</p>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-500 transition-colors">
                  Escalate to SIU
                </button>
                <button className="px-4 py-2 rounded-lg bg-white border border-acme-border text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  Request Documents
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel: Intelligence Engine */}
        <div className="col-span-4 space-y-4">
          {/* Source Extraction Preview */}
          <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-acme-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-acme-orange" />
                <h3 className="text-xs font-semibold text-acme-teal uppercase tracking-wider">Source Extraction Preview</h3>
              </div>
            </div>
            <div className="p-4 min-h-[200px]">
              <AnimatePresence mode="wait">
                {activeDoc ? (
                  <motion.div
                    key={activeDoc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-acme-orange">{activeDoc.name}</span>
                      <StatusBadge status={activeDoc.status} />
                    </div>
                    {/* Simulated document with bounding boxes */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed relative">
                      {activeDoc.extractedText?.split("\n").map((line, i) => {
                        const isHighlighted = line.includes("MISSING") || line.includes("FAILED") || line.includes("CRITICAL") || line.includes("CONTRADICTION") || line.includes("wheelchair") || line.includes("Page 1 of 4") || line.includes("Left hip");
                        return (
                          <div key={i} className={cn("py-0.5", isHighlighted && "bbox-highlight px-1 my-1")}>
                            {line}
                          </div>
                        );
                      })}
                    </div>
                    {/* AI Findings */}
                    {activeDoc.aiFindings && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">AI Findings</p>
                        {activeDoc.aiFindings.map((finding, i) => (
                          <div key={i} className={cn(
                            "flex items-start gap-2 text-xs py-1 px-2 rounded",
                            finding.includes("CRITICAL") || finding.includes("CONTRADICTION") || finding.includes("FAILED")
                              ? "bg-red-500/10 text-red-400"
                              : finding.includes("flag") || finding.includes("WARNING")
                                ? "bg-amber-500/10 text-amber-400"
                                : "text-gray-500"
                          )}>
                            <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{finding}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[180px] text-gray-400">
                    <FileText className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">Select a document from the timeline</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* AI Semantic Log */}
          {isHargrove && (
            <div className="rounded-xl border border-acme-border bg-acme-dark overflow-hidden">
              <div className="px-4 py-3 border-b border-acme-border flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-acme-orange" />
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider">AI Semantic Log</h3>
                {isProcessing && <Loader2 className="w-3 h-3 text-acme-orange spin-slow ml-auto" />}
              </div>
              <div className="terminal-log p-4 max-h-[250px] overflow-y-auto bg-acme-navy/80">
                {semanticLog.length === 0 ? (
                  <p className="text-acme-muted text-xs">Drop a file to begin analysis...</p>
                ) : (
                  semanticLog.map((entry, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * (i % 10) }}
                      className="py-0.5"
                    >
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

          {/* Risk Indicators */}
          {currentCase.riskIndicators && (
            <div className="rounded-xl border border-acme-border bg-white p-4">
              <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">Risk Indicators</h3>
              <div className="space-y-2">
                {currentCase.riskIndicators.map((indicator, i) => (
                  <div key={i} className={cn(
                    "flex items-start gap-2 text-xs p-2 rounded",
                    indicator.includes("CRITICAL") ? "bg-red-500/10 text-red-400" :
                    indicator.includes("WARNING") ? "bg-amber-500/10 text-amber-400" :
                    indicator.includes("None") ? "bg-green-500/10 text-green-400" :
                    "text-gray-500"
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
        </div>
      </div>

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
              {currentCase.auditHistory.map((entry, i) => (
                <div key={i} className="px-5 py-3 flex items-start gap-4">
                  <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap mt-0.5">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                    entry.action.includes("ESCALAT") || entry.action.includes("FATAL") ? "bg-red-500/10 text-red-400" :
                    entry.action.includes("AUTO_APPROVED") ? "bg-green-500/10 text-green-400" :
                    entry.action.includes("AI_SCORING") ? "bg-acme-orange/10 text-acme-orange" :
                    entry.action.includes("DISCREPANCY") ? "bg-amber-500/10 text-amber-400" :
                    "bg-blue-500/10 text-blue-400"
                  )}>
                    {entry.action}
                  </div>
                  <span className="text-xs text-gray-600 flex-1">{entry.detail}</span>
                  {entry.scoreChange && (
                    <span className="text-xs font-mono text-acme-orange">
                      {entry.scoreChange.from} → {entry.scoreChange.to}
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
