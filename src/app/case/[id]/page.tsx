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
  Stethoscope, Shield, FileSearch, Code, FileType,
  ClipboardList, Download, ExternalLink, Image as ImageIcon,
  FileSpreadsheet, Activity, ZoomIn, ZoomOut, Plus
} from "lucide-react";
import type { Document } from "@/store/claims-store";
import { uploadDocumentFile, insertDocument, updateDocumentMarkdown } from "@/lib/supabase-api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MainTab = "overview" | "decision";
type DocViewTab = "original" | "schema" | "interpreted";

const LIFECYCLE_STAGES = [
  "Intake",
  "Triage & Classification",
  "Investigation",
  "Assignment & Approval",
  "Action Execution",
  "Closure",
] as const;

function getLifecycleStage(status: string): number {
  switch (status) {
    case "pending": return 0;
    case "in_review": return 2;
    case "escalated": return 3;
    case "auto_approved": return 4;
    case "closed": return 5;
    default: return 1;
  }
}

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;
  const cases = useClaimsStore((s) => s.cases);
  const isLoading = useClaimsStore((s) => s.isLoading);
  const isInitialized = useClaimsStore((s) => s.isInitialized);
  const semanticLog = useClaimsStore((s) => s.semanticLog);
  const dropPhase = useClaimsStore((s) => s.dropPhase);
  const isProcessing = useClaimsStore((s) => s.isProcessing);
  const activeDocumentId = useClaimsStore((s) => s.activeDocumentId);
  const triggerDocumentDrop = useClaimsStore((s) => s.triggerDocumentDrop);
  const resetDropPhase = useClaimsStore((s) => s.resetDropPhase);
  const setActiveDocument = useClaimsStore((s) => s.setActiveDocument);

  const [isDragOver, setIsDragOver] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [docViewTab, setDocViewTab] = useState<DocViewTab>("original");
  const [imageZoom, setImageZoom] = useState(100);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    if (isLoading || !isInitialized) {
      return (
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-acme-teal mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading case data...</p>
          </div>
        </div>
      );
    }
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
  const currentStage = getLifecycleStage(caseData.status);

  /* Helper: determine file extension from name or URL */
  function getFileExtension(doc: Document): string {
    const name = doc.name || "";
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return ext;
  }

  function isImageExtension(ext: string): boolean {
    return ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"].includes(ext);
  }

  function getDocIcon(doc: Document) {
    const ext = getFileExtension(doc);
    if (ext === "pdf") return <FileText className="w-4 h-4 text-red-500" />;
    if (isImageExtension(ext)) return <ImageIcon className="w-4 h-4 text-purple-500" />;
    if (ext === "json") return <Code className="w-4 h-4 text-cyan-500" />;
    if (ext === "csv") return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
    if (ext === "txt") return <FileType className="w-4 h-4 text-blue-500" />;
    return <FileText className="w-4 h-4 text-gray-400" />;
  }

  function getActivityColor(action: string) {
    if (action.includes("AUTO_APPROVED") || action.includes("CLAIM_CLOSED") || action.includes("APPROVED")) {
      return { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500" };
    }
    if (action.includes("ESCALAT") || action.includes("FATAL") || action.includes("REJECT") || action.includes("DENIED")) {
      return { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", dot: "bg-red-500" };
    }
    if (action.includes("DISCREPANCY") || action.includes("FLAG") || action.includes("REUPLOAD") || action.includes("REQUEST")) {
      return { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" };
    }
    if (action.includes("AI_SCORING") || action.includes("VECTOR")) {
      return { bg: "bg-orange-50", border: "border-acme-orange/20", text: "text-acme-orange", dot: "bg-acme-orange" };
    }
    return { bg: "bg-white", border: "border-gray-200", text: "text-gray-600", dot: "bg-gray-400" };
  }

  function renderOriginalContent(doc: Document) {
    const ext = getFileExtension(doc);
    const hasFile = !!doc.filePath;

    if (hasFile) {
      if (isImageExtension(ext)) {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Image Document</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setImageZoom((z) => Math.max(25, z - 25))} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="text-[10px] text-gray-500 font-mono w-8 text-center">{imageZoom}%</span>
                <button onClick={() => setImageZoom((z) => Math.min(200, z + 25))} className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"><ZoomIn className="w-3.5 h-3.5" /></button>
                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-acme-orange hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
                <a href={doc.filePath} download className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700">
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
            <div className="rounded-lg border border-acme-border bg-gray-50 overflow-auto max-h-[500px] flex items-center justify-center p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.filePath}
                alt={doc.name}
                className="rounded transition-transform"
                style={{ width: `${imageZoom}%`, maxWidth: `${imageZoom * 2}%` }}
              />
            </div>
            {doc.extractedText && (
              <details className="mt-2">
                <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-700 uppercase tracking-wider font-semibold">
                  Extracted Text (OCR/AI)
                </summary>
                <div className="bg-gray-50 rounded-lg p-3 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed mt-1">
                  {doc.extractedText.split("\n").map((line, i) => (
                    <div key={i} className="py-0.5">{line}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      }

      if (ext === "pdf") {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">PDF Document</span>
              <div className="flex items-center gap-2">
                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-acme-orange hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
                <a href={doc.filePath} download className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700">
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
            <iframe
              src={doc.filePath}
              className="w-full h-[350px] rounded-lg border border-acme-border bg-white"
              title={doc.name}
            />
            {/* Also show extracted text below the PDF */}
            {doc.extractedText && (
              <details className="mt-2">
                <summary className="text-[10px] text-gray-500 cursor-pointer hover:text-gray-700 uppercase tracking-wider font-semibold">
                  Extracted Text (OCR/AI)
                </summary>
                <div className="bg-gray-50 rounded-lg p-3 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed mt-1">
                  {doc.extractedText.split("\n").map((line, i) => (
                    <div key={i} className="py-0.5">{line}</div>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      }

      if (ext === "txt") {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Text Document</span>
              <div className="flex items-center gap-2">
                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-acme-orange hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
                <a href={doc.filePath} download className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700">
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed max-h-[500px] overflow-y-auto">
              {doc.extractedText?.split("\n").map((line, i) => {
                const isHighlighted = line.includes("MISSING") || line.includes("FAILED") || line.includes("CRITICAL") || line.includes("CONTRADICTION") || line.includes("wheelchair") || line.includes("HANDWRITTEN") || line.includes("OCR") || line.includes("SENTIMENT");
                return (
                  <div key={i} className={cn("py-0.5", isHighlighted && "bbox-highlight px-1 my-1")}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      if (ext === "json") {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">JSON Document</span>
              <div className="flex items-center gap-2">
                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-acme-orange hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
                <a href={doc.filePath} download className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700">
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
            <div className="bg-acme-dark rounded-lg p-4 border border-gray-700 overflow-auto max-h-[500px]">
              <pre className="text-[11px] text-cyan-400 font-mono leading-relaxed whitespace-pre-wrap">
                {doc.extractedText || "Loading JSON content..."}
              </pre>
            </div>
          </div>
        );
      }

      if (ext === "csv") {
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">CSV Data</span>
              <div className="flex items-center gap-2">
                <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-acme-orange hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open
                </a>
                <a href={doc.filePath} download className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700">
                  <Download className="w-3 h-3" /> Download
                </a>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed max-h-[500px] overflow-y-auto">
              {doc.extractedText?.split("\n").map((line, i) => (
                <div key={i} className="py-0.5">{line}</div>
              ))}
            </div>
          </div>
        );
      }

      // Fallback for unknown file types with a file URL
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Document File</span>
            <div className="flex items-center gap-2">
              <a href={doc.filePath} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-acme-orange hover:underline">
                <ExternalLink className="w-3 h-3" /> Open
              </a>
              <a href={doc.filePath} download className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700">
                <Download className="w-3 h-3" /> Download
              </a>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed">
            {doc.extractedText?.split("\n").map((line, i) => (
              <div key={i} className="py-0.5">{line}</div>
            ))}
          </div>
        </div>
      );
    }

    // No file URL — show extracted text only (legacy behavior)
    return (
      <div>
        <div className="bg-gray-50 rounded-lg p-4 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed relative">
          {doc.extractedText?.split("\n").map((line, i) => {
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
      </div>
    );
  }

  /* Helper to render the document viewer with 3 tabs */
  function renderDocumentViewer(doc: Document) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-acme-orange">{doc.name}</span>
            {doc.filePath && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-50 text-green-600 border border-green-200 font-medium">
                FILE LINKED
              </span>
            )}
          </div>
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
              {renderOriginalContent(doc)}
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
              {doc.aiInterpretedMd ? (
                <div className="prose prose-sm max-w-none max-h-[400px] overflow-y-auto rounded-lg border border-acme-border bg-white p-4 prose-headings:text-acme-teal prose-headings:font-semibold prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-800 prose-code:text-acme-orange prose-code:bg-orange-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-900 prose-pre:text-gray-100">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.aiInterpretedMd}</ReactMarkdown>
                </div>
              ) : doc.aiFindings && doc.aiFindings.length > 0 ? (
                <div className="space-y-3">
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
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                  <p className="text-xs text-gray-500">No AI interpretations available for this document.</p>
                </div>
              )}
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

  /* Decision Tab - AI Summary + Document Viewer + Complexity Vectors */
  function renderDecisionTab() {
    return (
      <div className="grid grid-cols-2 gap-6" style={{ minHeight: 'calc(100vh - 200px)' }}>
        {/* Left Pane: AI Decision Summary + Complexity Vectors */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-acme-border bg-white overflow-hidden flex flex-col flex-1">
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

          {/* Complexity Vectors - moved from Tab 1 */}
          <div className="rounded-xl border border-acme-border bg-white p-4">
            <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">Complexity Vectors</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <RiskThermometer label="Clinical" value={caseData.vectors.clinical} subscript="V_c" />
              <RiskThermometer label="Documentation" value={caseData.vectors.documentation} subscript="V_d" />
              <RiskThermometer label="Discrepancy" value={caseData.vectors.discrepancy} subscript="V_i" />
              <RiskThermometer label="Behavioral" value={caseData.vectors.behavioral} subscript="V_b" />
            </div>
          </div>

          {/* AI Semantic Log for Hargrove - moved from Tab 1 */}
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
        </div>

        {/* Right Pane: Document List + Document Viewer */}
        <div className="flex flex-col gap-4">
          {/* Document list for Tab 2 */}
          <div className="rounded-xl border border-acme-border bg-white p-4">
            <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">Documents</h3>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {caseData.documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => { setActiveDocument(doc.id === activeDocumentId ? null : doc.id); setDocViewTab("original"); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-xs",
                    doc.id === activeDocumentId ? "bg-orange-50 border border-acme-orange/20" : "hover:bg-gray-50"
                  )}
                >
                  {getDocIcon(doc)}
                  <span className="flex-1 truncate text-gray-700">{doc.name}</span>
                  <StatusBadge status={doc.status} />
                </button>
              ))}
            </div>
          </div>

          {/* Document Viewer with 3 tabs - expands to fill remaining space */}
          <div className="rounded-xl border border-acme-border bg-white overflow-hidden flex flex-col flex-1">
            <div className="px-4 py-3 border-b border-acme-border flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-acme-orange" />
              <h3 className="text-xs font-semibold text-acme-teal uppercase tracking-wider">Document Viewer</h3>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {activeDoc ? (
                  <motion.div key={activeDoc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                    {renderDocumentViewer(activeDoc)}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[400px] h-full text-gray-400">
                    <FileText className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">Select a document to view</p>
                    <p className="text-[10px] text-gray-400 mt-1">View original, JSON schema, or AI interpretation</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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

            {/* ===== LIFECYCLE PROGRESS BAR ===== */}
            <div className="rounded-xl border border-acme-border bg-white p-4">
              <div className="flex items-center justify-between">
                {LIFECYCLE_STAGES.map((stage, i) => {
                  const isCompleted = i < currentStage;
                  const isCurrent = i === currentStage;
                  return (
                    <div key={stage} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all",
                          isCompleted ? "bg-green-500 border-green-500 text-white" :
                          isCurrent ? "bg-acme-orange border-acme-orange text-white" :
                          "bg-gray-100 border-gray-300 text-gray-400"
                        )}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={cn(
                          "text-[10px] mt-1.5 text-center font-medium leading-tight max-w-[90px]",
                          isCompleted ? "text-green-600" :
                          isCurrent ? "text-acme-orange" :
                          "text-gray-400"
                        )}>{stage}</span>
                      </div>
                      {i < LIFECYCLE_STAGES.length - 1 && (
                        <div className={cn(
                          "h-0.5 flex-1 -mt-4",
                          isCompleted ? "bg-green-500" :
                          isCurrent ? "bg-acme-orange" :
                          "bg-gray-200"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ===== EXPANDED CASE DETAILS GRID ===== */}
            <div className="rounded-xl border border-acme-border bg-white p-5">
              <h3 className="text-xs font-semibold text-acme-teal mb-4 uppercase tracking-wider">Case Details</h3>
              <div className="grid grid-cols-4 gap-x-6 gap-y-4">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Claimant</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.claimantName}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Date of Birth</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.dateOfBirth} ({caseData.age}yo)</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Policy Number</span>
                  <p className="text-sm font-medium text-gray-900 font-mono">{caseData.policyNumber}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Claim Type</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.claimType}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Diagnosis</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.diagnosis}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Filing Date</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.filingDate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Elimination Period</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.eliminationPeriod || "N/A"}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Status</span>
                  <StatusBadge status={caseData.status} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Assigned To</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.assignedTo}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Assigned Group</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.assignedGroup}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Complexity Score</span>
                  <span className={cn("text-sm font-bold px-2 py-0.5 rounded", caseData.complexityScore <= 30 ? "bg-green-50 text-green-700" : caseData.complexityScore <= 60 ? "bg-amber-50 text-amber-700" : caseData.complexityScore <= 80 ? "bg-acme-orange/10 text-acme-orange" : "bg-red-50 text-red-700")}>
                    {caseData.complexityScore}/100
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Last Updated</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.auditHistory.length > 0 ? new Date(caseData.auditHistory[caseData.auditHistory.length - 1].timestamp).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
              {/* Case Description */}
              {caseData.summary && (
                <div className="mt-4 pt-4 border-t border-acme-border/50">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Case Description</span>
                  <p className="text-sm text-gray-600 leading-relaxed">{caseData.summary}</p>
                </div>
              )}
            </div>

            {/* ===== MAIN CONTENT: Documents + Recent Activities ===== */}
            <div className="grid grid-cols-12 gap-6">

              {/* Left: Documents List + Upload Zone */}
              <div className="col-span-5 space-y-4">
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

                {/* Document List */}
                <div className="rounded-xl border border-acme-border bg-white p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-acme-teal uppercase tracking-wider">Documents ({caseData.documents.length})</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400">{caseData.documents.filter(d => d.status === "flagged").length} flagged</span>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          setIsUploading(true);
                          try {
                            for (const file of Array.from(files)) {
                              const publicUrl = await uploadDocumentFile(file, caseId);
                              const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                              const newDoc: Document = {
                                id: docId,
                                name: file.name,
                                type: "other",
                                day: 1,
                                status: "pending",
                                vectorAffected: "documentation",
                                filePath: publicUrl,
                              };
                              await insertDocument(caseId, newDoc);

                              // Trigger Azure Document Intelligence analysis in background
                              fetch("/api/analyze-document", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ fileUrl: publicUrl }),
                              })
                                .then((res) => res.json())
                                .then((data) => {
                                  if (data.markdown) {
                                    updateDocumentMarkdown(docId, data.markdown, data.jsonResult).catch(console.error);
                                  }
                                })
                                .catch(console.error);
                            }
                            window.location.reload();
                          } catch (err) {
                            console.error("Upload failed:", err);
                            alert("Upload failed. Check console for details.");
                          } finally {
                            setIsUploading(false);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-acme-orange text-white text-[10px] font-medium hover:bg-acme-orange/90 transition-colors disabled:opacity-50"
                      >
                        {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        {isUploading ? "Uploading..." : "Upload"}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {caseData.documents.map((doc, i) => {
                      const isIngested = isHargrove ? i < dropPhase : true;
                      return (
                        <div
                          key={doc.id}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                            !isIngested && "opacity-40",
                            "hover:bg-gray-50"
                          )}
                        >
                          {getDocIcon(doc)}
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium text-gray-700 truncate block">{doc.name}</span>
                            <span className="text-[10px] text-gray-400">Day {doc.day}</span>
                          </div>
                          <StatusBadge status={doc.status} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                {renderActionButtons()}
              </div>

              {/* Right: Recent Activities */}
              <div className="col-span-7 space-y-4">
                <div className="rounded-xl border border-acme-border bg-white p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity className="w-4 h-4 text-acme-orange" />
                    <h3 className="text-xs font-semibold text-acme-teal uppercase tracking-wider">Recent Activities</h3>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {caseData.auditHistory.slice().reverse().map((entry, i) => {
                      const colors = getActivityColor(entry.action);
                      return (
                        <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg border transition-colors", colors.bg, colors.border)}>
                          <div className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", colors.dot)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={cn("text-[10px] font-bold uppercase tracking-wider", colors.text)}>{entry.action}</span>
                              {entry.scoreChange && (
                                <span className="text-[10px] font-mono text-acme-orange">
                                  {entry.scoreChange.from} {"\u2192"} {entry.scoreChange.to}
                                </span>
                              )}
                            </div>
                            <p className={cn("text-xs", colors.text === "text-gray-600" ? "text-gray-600" : colors.text)}>{entry.detail}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                              {entry.user && <span className="text-[10px] text-gray-400">{"\u2014"} {entry.user}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="decision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderDecisionTab()}
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
