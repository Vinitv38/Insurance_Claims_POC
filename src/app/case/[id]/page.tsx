"use client";

import { useParams, useRouter } from "next/navigation";
import { useClaimsStore } from "@/store/claims-store";
import { useAssessmentRuns } from "@/store/assessment-runs";
import RiskThermometer, { tagBadgeClass, tagWeight } from "@/components/ui/RiskThermometer";
import StatusBadge from "@/components/ui/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRef, useState, useEffect } from "react";
import {
  ArrowLeft, FileText, AlertTriangle, CheckCircle2, Clock,
  Brain, Eye, ChevronRight, Loader2, X,
  Stethoscope, Shield, FileSearch, Code, FileType,
  ClipboardList, Download, ExternalLink, Image as ImageIcon,
  FileSpreadsheet, ZoomIn, ZoomOut, Plus, Play, History
} from "lucide-react";
import type { Document } from "@/store/claims-store";
import { uploadDocumentFile, insertDocument, updateDocumentMarkdown } from "@/lib/supabase-api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CitedText, LabeledLines, NumberedSteps, splitLabel, stripCitations } from "@/components/ui/BriefingText";
import { scoreBand, SCORE_BAND_TEXT, SCORE_BAND_BAR, SCORE_BAND_SOFT } from "@/lib/score-bands";

type MainTab = "overview" | "decision" | "audit";

const ALERT_STYLES = {
  critical: { card: "bg-red-50 border-red-200 border-l-red-500", icon: "text-red-500", title: "text-red-700", badge: "bg-red-100 text-red-700", badgeText: "Critical", fallbackTitle: "Alert" },
  warning: { card: "bg-amber-50 border-amber-200 border-l-amber-500", icon: "text-amber-500", title: "text-amber-700", badge: "bg-amber-100 text-amber-700", badgeText: "Warning", fallbackTitle: "Alert" },
  resolved: { card: "bg-blue-50 border-blue-200 border-l-blue-500", icon: "text-blue-500", title: "text-blue-700", badge: "bg-blue-100 text-blue-700", badgeText: "Resolved", fallbackTitle: "Resolved" },
  reduced: { card: "bg-teal-50 border-teal-200 border-l-teal-500", icon: "text-teal-500", title: "text-teal-700", badge: "bg-teal-100 text-teal-700", badgeText: "Reduced", fallbackTitle: "Reduced" },
  ok: { card: "bg-green-50 border-green-200 border-l-green-500", icon: "text-green-500", title: "text-green-700", badge: "bg-green-100 text-green-700", badgeText: "Clear", fallbackTitle: "No Alerts" },
} as const;

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
  const activeDocumentId = useClaimsStore((s) => s.activeDocumentId);
  const setActiveDocument = useClaimsStore((s) => s.setActiveDocument);

  const [mainTab, setMainTab] = useState<MainTab>("overview");
  const [docViewTab, setDocViewTab] = useState<DocViewTab>("original");
  const [imageZoom, setImageZoom] = useState(100);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docModalTab, setDocModalTab] = useState<DocViewTab>("original");
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(null);
  const [fetchedFileContent, setFetchedFileContent] = useState<Record<string, string>>({});
  const [fetchingFile, setFetchingFile] = useState(false);
  const assessmentRun = useAssessmentRuns((s) => s.runs[caseId]);
  const startRun = useAssessmentRuns((s) => s.startRun);
  const resumeRuns = useAssessmentRuns((s) => s.resumeRuns);
  const dismissRun = useAssessmentRuns((s) => s.dismiss);
  const [, setClockTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentCase = cases.find((c) => c.id === caseId);
  const isAssessing = assessmentRun?.phase === "starting" || assessmentRun?.phase === "running";
  const completedAssessmentId = assessmentRun?.phase === "done" ? assessmentRun.assessmentId : null;

  useEffect(() => {
    resumeRuns();
  }, [resumeRuns]);

  useEffect(() => {
    if (!isAssessing) return;
    const timer = setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isAssessing]);

  useEffect(() => {
    if (!completedAssessmentId) return;
    setActiveAssessmentId(completedAssessmentId);
    setMainTab("decision");
  }, [completedAssessmentId]);

  // Pre-fill all document checkboxes on load
  useEffect(() => {
    if (currentCase) {
      setSelectedDocs(new Set(currentCase.documents.map((d) => d.id)));
    }
  }, [currentCase]);

  // Fetch actual file content for TXT/JSON/CSV when a document is selected
  useEffect(() => {
    const doc = currentCase?.documents.find((d) => d.id === activeDocumentId);
    if (!doc) return;
    const ext = (doc.name || "").split(".").pop()?.toLowerCase() || "";
    if (["txt", "json", "csv"].includes(ext) && doc.filePath && !fetchedFileContent[doc.id]) {
      setFetchingFile(true);
      fetch(doc.filePath)
        .then((res) => res.text())
        .then((text) => {
          setFetchedFileContent((prev) => ({ ...prev, [doc.id]: text }));
          setFetchingFile(false);
        })
        .catch(() => setFetchingFile(false));
    }
  }, [currentCase, activeDocumentId, fetchedFileContent]);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // TypeScript now knows caseData is non-null after the guard above
  const caseData = currentCase;
  const activeDoc = caseData.documents.find((d) => d.id === activeDocumentId);

  const openCitedDocument = (docId: string) => {
    setActiveDocument(docId);
    setDocModalTab("original");
    setDocModalOpen(true);
  };
  const citeProps = { docs: caseData.documents, onOpenDocument: openCitedDocument };

  // Overview fields follow the latest live LTC New assessment once one exists.
  const latestAssessment = caseData.assessments[caseData.assessments.length - 1];
  const liveAssessment = latestAssessment?.id.startsWith("live-") ? latestAssessment : undefined;
  const liveDiagnosisLine = liveAssessment?.clinicalProfileMd?.match(/Verified Primary Diagnoses\s*:\s*(.+)/i)?.[1];
  const diagnosis = liveDiagnosisLine ? stripCitations(liveDiagnosisLine).split(/(?<=\.)\s/)[0].replace(/\.$/, "") : caseData.diagnosis;
  const eliminationPeriod = liveAssessment?.eliminationPeriod
    ? stripCitations(liveAssessment.eliminationPeriod).split(/;|\.\s/)[0].replace(/\.$/, "")
    : caseData.eliminationPeriod;
  const caseSummary = liveAssessment?.summary || caseData.summary;
  const nextSteps = liveAssessment?.recommendedAction || caseData.recommendedAction;
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

  // Seeded findings mark severity with a leading marker; negated lines ("No red flags…") stay neutral.
  function findingLevel(finding: string): "critical" | "warning" | "info" {
    if (/^\s*(CRITICAL|DIRECT CONTRADICTION|FAILED)\b/.test(finding)) return "critical";
    if (/^\s*no\b/i.test(finding)) return "info";
    if (/^\s*(DISCREPANCY|WARNING)\b|\bflag:|\binconsisten|\bconflicts?\b/i.test(finding)) return "warning";
    return "info";
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

  function renderOriginalContent(doc: Document, isModal = false) {
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
            <div className="rounded-lg border border-acme-border bg-gray-50 overflow-auto flex items-center justify-center p-4" style={{ maxHeight: 'calc(100vh - 260px)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.filePath}
                alt={doc.name}
                className="rounded transition-transform"
                style={{ width: `${imageZoom}%`, maxWidth: `${imageZoom * 2}%` }}
              />
            </div>
          </div>
        );
      }

      if (ext === "pdf") {
        return (
          <div className={cn("space-y-2", isModal && "flex flex-col flex-1 min-h-0")}>
            <div className="flex items-center justify-between flex-shrink-0">
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
              src={doc.filePath + "#view=FitH"}
              className={cn("w-full rounded-lg border border-acme-border bg-white", isModal && "flex-1 min-h-0")}
              style={isModal ? undefined : { height: 'calc(100vh - 260px)' }}
              title={doc.name}
            />
          </div>
        );
      }

      if (ext === "txt") {
        const content = fetchedFileContent[doc.id] || null;
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
            {fetchingFile && !content ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-acme-border flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                <Loader2 className="w-5 h-5 animate-spin text-acme-teal" />
                <span className="ml-2 text-xs text-gray-500">Loading file content...</span>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed overflow-y-auto whitespace-pre-wrap" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                {content || doc.extractedText || "No content available."}
              </div>
            )}
          </div>
        );
      }

      if (ext === "json") {
        const content = fetchedFileContent[doc.id] || null;
        let formatted = content;
        if (content) {
          try { formatted = JSON.stringify(JSON.parse(content), null, 2); } catch { formatted = content; }
        }
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
            {fetchingFile && !content ? (
              <div className="bg-acme-dark rounded-lg p-4 border border-gray-700 flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                <span className="ml-2 text-xs text-gray-400">Loading file content...</span>
              </div>
            ) : (
              <div className="bg-acme-dark rounded-lg p-4 border border-gray-700 overflow-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                <pre className="text-[11px] text-cyan-400 font-mono leading-relaxed whitespace-pre-wrap">
                  {formatted || doc.extractedText || "No content available."}
                </pre>
              </div>
            )}
          </div>
        );
      }

      if (ext === "csv") {
        const content = fetchedFileContent[doc.id] || null;
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
            {fetchingFile && !content ? (
              <div className="bg-gray-50 rounded-lg p-4 border border-acme-border flex items-center justify-center" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                <Loader2 className="w-5 h-5 animate-spin text-acme-teal" />
                <span className="ml-2 text-xs text-gray-500">Loading file content...</span>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border border-acme-border font-mono text-[11px] text-gray-600 leading-relaxed overflow-y-auto whitespace-pre-wrap" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                {content || doc.extractedText || "No content available."}
              </div>
            )}
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
            const isHighlighted = /\b(MISSING|FAILED|CRITICAL|CONTRADICTION)\b/.test(line);
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

  /* Helper: parse CSV text into a table */
  function renderCsvTable(csvText: string) {
    const lines = csvText.trim().split("\n").filter((l) => l.trim());
    if (lines.length === 0) return <p className="text-xs text-gray-500">No data to display.</p>;
    const parseRow = (row: string) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === "," && !inQuotes) { cells.push(current.trim()); current = ""; }
        else { current += ch; }
      }
      cells.push(current.trim());
      return cells;
    };
    const headers = parseRow(lines[0]);
    const rows = lines.slice(1).map(parseRow);
    return (
      <div className="overflow-auto rounded-lg border border-acme-border" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-acme-teal text-white sticky top-0">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap border-r border-acme-teal/30 last:border-r-0">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className={cn("border-b border-gray-200", ri % 2 === 0 ? "bg-white" : "bg-gray-50")}>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-1.5 text-gray-600 whitespace-nowrap border-r border-gray-200 last:border-r-0">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  /* Helper: determine which tabs to show based on file extension */
  function getDocTabs(doc: Document): { id: DocViewTab; label: string; icon: React.ReactNode }[] {
    const ext = getFileExtension(doc);
    if (ext === "txt" || ext === "json") {
      return [{ id: "original", label: "Original", icon: <FileType className="w-3 h-3" /> }];
    }
    if (ext === "csv") {
      return [
        { id: "original", label: "Original", icon: <FileType className="w-3 h-3" /> },
        { id: "interpreted", label: "Interpreted", icon: <Brain className="w-3 h-3" /> },
      ];
    }
    // PDF and all others: show all 3 tabs
    return [
      { id: "original", label: "Original", icon: <FileType className="w-3 h-3" /> },
      { id: "schema", label: "JSON Schema", icon: <Code className="w-3 h-3" /> },
      { id: "interpreted", label: "AI Interpreted", icon: <Brain className="w-3 h-3" /> },
    ];
  }

  /* Helper to render the document viewer with conditional tabs */
  function renderDocumentViewer(doc: Document) {
    const tabs = getDocTabs(doc);
    const ext = getFileExtension(doc);
    const activeTabValid = tabs.some((t) => t.id === docViewTab);
    const effectiveTab = activeTabValid ? docViewTab : "original";

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
        {/* Conditional tabs based on file type */}
        {tabs.length > 1 && (
          <div className="flex items-center gap-1 border-b border-acme-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDocViewTab(tab.id)}
                className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px", effectiveTab === tab.id ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {effectiveTab === "original" && (
            <motion.div key="original" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {renderOriginalContent(doc)}
            </motion.div>
          )}

          {effectiveTab === "schema" && (
            <motion.div key="schema" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 overflow-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                <pre className="text-[11px] text-gray-100 font-mono leading-relaxed whitespace-pre-wrap">
                  {doc.jsonSchema ? JSON.stringify(doc.jsonSchema, null, 2) : "No JSON schema available for this document."}
                </pre>
              </div>
            </motion.div>
          )}

          {effectiveTab === "interpreted" && (
            <motion.div key="interpreted" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {ext === "csv" ? (
                // CSV Interpreted: render as table
                fetchedFileContent[doc.id] ? renderCsvTable(fetchedFileContent[doc.id]) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-acme-teal" />
                    <span className="ml-2 text-xs text-gray-500">Loading table data...</span>
                  </div>
                )
              ) : doc.aiInterpretedMd ? (
                <div className="prose prose-sm max-w-none overflow-y-auto rounded-lg border border-acme-border bg-white p-4 prose-headings:text-acme-teal prose-headings:font-semibold prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-800 prose-code:text-acme-orange prose-code:bg-orange-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:border-collapse prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-1.5 prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-1.5 prose-th:bg-gray-50" style={{ maxHeight: 'calc(100vh - 260px)' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {doc.aiInterpretedMd}
                  </ReactMarkdown>
                </div>
              ) : doc.aiFindings && doc.aiFindings.length > 0 ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">AI Findings</p>
                    {doc.aiFindings.map((finding, i) => (
                      <div key={i} className={cn(
                        "flex items-start gap-2 text-xs py-1.5 px-2 rounded",
                        findingLevel(finding) === "critical"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : findingLevel(finding) === "warning"
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

  /* Helper: Recommended Action section (no buttons — routing is handled by complexity score) */
  function renderRecommendedAction() {
    const statusConfig = caseData.status === "auto_approved" || caseData.status === "closed"
      ? { icon: <CheckCircle2 className="w-4 h-4 text-green-500" />, bg: "bg-green-50", border: "border-green-200", text: "text-green-600" }
      : caseData.status === "escalated"
      ? { icon: <AlertTriangle className="w-4 h-4 text-red-500" />, bg: "bg-red-50", border: "border-red-200", text: "text-red-600" }
      : { icon: <Clock className="w-4 h-4 text-amber-500" />, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600" };
    return (
      <div className={cn("rounded-xl border p-4", statusConfig.bg, statusConfig.border)}>
        <div className="flex items-center gap-2 mb-2">
          {statusConfig.icon}
          <h3 className={cn("text-xs font-semibold uppercase tracking-wider", statusConfig.text)}>Next Steps</h3>
        </div>
        {nextSteps && <NumberedSteps text={nextSteps} {...citeProps} />}
      </div>
    );
  }

  /* Decision Tab - AI Summary with Assessment Tabs + Complexity Vectors */
  function renderDecisionTab() {
    const assessments = caseData.assessments;
    const hasAssessments = assessments.length > 0;
    // Default to the latest assessment (last in the list)
    const activeAssessment = hasAssessments
      ? assessments.find((a) => a.id === activeAssessmentId) || assessments[assessments.length - 1]
      : null;

    // Use assessment data if available, otherwise fall back to claim-level data
    const summaryText = activeAssessment?.summary || caseData.summary;
    const riskIndicators = activeAssessment?.riskIndicators || caseData.riskIndicators;
    const recommendedAction = activeAssessment?.recommendedAction || caseData.recommendedAction;
    const vectors = activeAssessment?.vectors || caseData.vectors;
    const vectorLabels = activeAssessment?.vectorLabels;
    // Seeded alerts carry a CRITICAL/WARNING keyword; live workflow alerts are coloured by the tag they relate to.
    const alertLevel = (indicator: string): "critical" | "warning" | "resolved" | "reduced" | "ok" => {
      if (indicator.includes("CRITICAL")) return "critical";
      if (indicator.includes("WARNING")) return "warning";
      if (indicator.includes("RESOLVED")) return "resolved";
      if (indicator.includes("REDUCED")) return "reduced";
      const weight = /^\s*narrative conflict/i.test(indicator) ? tagWeight("discrepancy", vectorLabels?.discrepancy)
        : /^\s*documentation gap/i.test(indicator) ? tagWeight("documentation", vectorLabels?.documentation)
        : null;
      if (weight !== null && weight >= 0.7) return "critical";
      if (weight !== null && weight >= 0.3) return "warning";
      return "ok";
    };
    const assessmentScore = activeAssessment?.complexityScore ?? caseData.complexityScore;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Pane: AI Decision Summary */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
              <Brain className="w-4 h-4 text-acme-orange" />
              <h2 className="text-sm font-semibold text-acme-teal">AI Decision Summary</h2>
              {activeAssessment?.systemRecommendation && (
                <span className={cn("text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                  activeAssessment.systemRecommendation.includes("APPROVE") ? "bg-green-50 text-green-700 border border-green-200" :
                  activeAssessment.systemRecommendation.includes("ESCALATE") || activeAssessment.systemRecommendation.includes("REJECT") ? "bg-red-50 text-red-700 border border-red-200" :
                  "bg-amber-50 text-amber-700 border border-amber-200"
                )}>
                  {activeAssessment.systemRecommendation}
                </span>
              )}
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">AUTO-GENERATED</span>
            </div>

            {/* Assessment Tab Bar */}
            {hasAssessments && (
              <div className="px-5 pt-3 pb-0 border-b border-acme-border/50">
                <div className="flex items-center gap-1 overflow-x-auto pb-0 -mb-px scrollbar-thin">
                  {assessments.map((assessment, idx) => {
                    const isActive = activeAssessment?.id === assessment.id;
                    const dateStr = new Date(assessment.assessmentDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                    return (
                      <button
                        key={assessment.id}
                        onClick={() => setActiveAssessmentId(assessment.id)}
                        className={cn(
                          "flex-shrink-0 flex flex-col items-start px-4 py-2.5 rounded-t-lg border border-b-0 transition-all text-left min-w-[180px]",
                          isActive
                            ? "bg-white border-acme-border text-acme-teal relative z-10"
                            : "bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-semibold", isActive ? "text-acme-teal" : "text-gray-600")}>
                            {assessment.label}
                          </span>
                          {idx === assessments.length - 1 && (
                            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-acme-orange/10 text-acme-orange font-bold uppercase">Latest</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400 mt-0.5">{dateStr}</span>
                        <span className="text-[9px] text-gray-400 mt-0.5 truncate max-w-[200px]">
                          Triggered by: {assessment.trigger}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="p-5 space-y-6">
              {activeAssessment?.scoreDriver && (
                <div className={cn("rounded-lg border-l-4 p-3 bg-white border border-acme-border/60",
                  { low: "border-l-green-500", moderate: "border-l-amber-500", high: "border-l-acme-orange", critical: "border-l-red-500" }[scoreBand(assessmentScore)]
                )}>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Primary Score Driver</span>
                  <CitedText text={activeAssessment.scoreDriver} {...citeProps} className="font-medium text-gray-800" />
                </div>
              )}

              {/* 1. Clinical Synopsis (Executive Summary) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4 text-acme-orange" />
                  <h3 className="text-xs font-bold text-acme-orange uppercase tracking-wider">Clinical Synopsis</h3>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-acme-border/50">
                  {summaryText && <CitedText text={summaryText} {...citeProps} />}
                </div>
              </div>

              {/* 2. Policy & Compliance Status */}
              {activeAssessment && (activeAssessment.contractStatus || activeAssessment.eliminationPeriod || activeAssessment.exclusions) && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-acme-teal" />
                    <h3 className="text-xs font-bold text-acme-teal uppercase tracking-wider">Policy & Compliance Status</h3>
                  </div>
                  <div className="bg-acme-teal/5 rounded-lg p-4 border border-acme-teal/20 space-y-2.5">
                    {activeAssessment.contractStatus && (
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold w-32 flex-shrink-0 pt-0.5">Contract Status</span>
                        <div className="flex-1 flex items-start gap-2">
                          <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border flex-shrink-0",
                            /^\W*active\b/i.test(activeAssessment.contractStatus) ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                          )}>{/^\W*active\b/i.test(activeAssessment.contractStatus) ? "Active" : "Inactive"}</span>
                          <CitedText text={activeAssessment.contractStatus.replace(/^\W*(?:in)?active\b[\s;,:+-]*/i, "")} {...citeProps} className="flex-1" />
                        </div>
                      </div>
                    )}
                    {activeAssessment.eliminationPeriod && (
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold w-32 flex-shrink-0 pt-0.5">Elimination Period</span>
                        <CitedText text={activeAssessment.eliminationPeriod} {...citeProps} className="flex-1" />
                      </div>
                    )}
                    {activeAssessment.exclusions && (
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold w-32 flex-shrink-0 pt-0.5">Exclusions</span>
                        <CitedText text={activeAssessment.exclusions} {...citeProps} className="flex-1" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Critical Alerts & Discrepancies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-xs font-bold text-red-600 uppercase tracking-wider">Critical Alerts & Discrepancies</h3>
                </div>
                <div className="space-y-2.5">
                  {riskIndicators?.map((indicator, i) => {
                    const level = alertLevel(indicator);
                    const style = ALERT_STYLES[level];
                    const { label, body } = splitLabel(indicator.replace(/^\s*(CRITICAL|WARNING|RESOLVED|REDUCED)\s*:\s*/, ""));
                    return (
                      <div key={i} className={cn("rounded-lg border border-l-4 p-3", style.card)}>
                        <div className="flex items-center gap-2 mb-1.5">
                          {level === "critical" || level === "warning" ? <AlertTriangle className={cn("w-3.5 h-3.5", style.icon)} /> : <CheckCircle2 className={cn("w-3.5 h-3.5", style.icon)} />}
                          <span className={cn("text-xs font-bold uppercase tracking-wider", style.title)}>{label || style.fallbackTitle}</span>
                          <span className={cn("ml-auto text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", style.badge)}>{style.badgeText}</span>
                        </div>
                        <CitedText text={body} {...citeProps} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Clinical & Functional Profile */}
              {activeAssessment?.clinicalProfileMd && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileSearch className="w-4 h-4 text-acme-teal" />
                    <h3 className="text-xs font-bold text-acme-teal uppercase tracking-wider">Clinical & Functional Profile</h3>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-acme-border/50 prose prose-sm max-w-none
                    prose-headings:text-xs prose-headings:font-bold prose-headings:uppercase prose-headings:tracking-wider prose-headings:text-acme-teal prose-headings:mt-4 prose-headings:mb-2 first:prose-headings:mt-0
                    prose-li:text-sm prose-li:text-gray-700 prose-li:my-0.5
                    prose-p:text-sm prose-p:text-gray-600 prose-p:leading-relaxed
                    prose-strong:text-gray-800">
                    {/^\s*#/m.test(activeAssessment.clinicalProfileMd) ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {activeAssessment.clinicalProfileMd}
                      </ReactMarkdown>
                    ) : (
                      <div className="not-prose"><LabeledLines text={activeAssessment.clinicalProfileMd} {...citeProps} /></div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Recommended Next Steps (Targeted Next Steps for Adjuster) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList className="w-4 h-4 text-blue-500" />
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Recommended Next Steps</h3>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  {recommendedAction && <NumberedSteps text={recommendedAction} {...citeProps} />}
                </div>
              </div>

              {/* Routing Rationale */}
              {activeAssessment?.routingRationale && (
                <div className="bg-gray-50 rounded-lg p-3 border border-acme-border/50">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold block mb-1">Routing Rationale</span>
                  <CitedText text={activeAssessment.routingRationale} {...citeProps} className="text-xs text-gray-600" />
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Pane: Complexity Vectors + Score */}
        <div className="lg:col-span-1 space-y-4">
          {/* Complexity Score Card */}
          <div className="rounded-xl border border-acme-border bg-white p-4">
            <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">
              Complexity Score
              {activeAssessment && <span className="text-[9px] text-gray-400 font-normal ml-1">({activeAssessment.label})</span>}
            </h3>
            <div className="flex items-center gap-3 mb-2">
              <span className={cn("text-2xl font-bold", SCORE_BAND_TEXT[scoreBand(assessmentScore)])}>
                {assessmentScore}
              </span>
              <span className="text-sm text-gray-400">/100</span>
              {assessments.length > 1 && activeAssessment && assessments.indexOf(activeAssessment) > 0 && (
                <span className="text-xs font-mono text-acme-orange ml-auto">
                  {assessments[assessments.indexOf(activeAssessment) - 1].complexityScore} {"\u2192"} {assessmentScore}
                </span>
              )}
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                className={cn("h-full rounded-full", SCORE_BAND_BAR[scoreBand(assessmentScore)])}
                initial={{ width: "0%" }}
                animate={{ width: `${assessmentScore}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Complexity Vectors */}
          <div className="rounded-xl border border-acme-border bg-white p-4">
            <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">
              Complexity Vectors
            </h3>
            <div className="space-y-3">
              <RiskThermometer label="Clinical" value={vectors.clinical} subscript="V_c" />
              {vectorLabels?.clinical && (
                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-6 -mt-1 inline-block", tagBadgeClass("clinical", vectorLabels.clinical))}>{vectorLabels.clinical}</span>
              )}
              <RiskThermometer label="Documentation" value={vectors.documentation} subscript="V_d" />
              {vectorLabels?.documentation && (
                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-6 -mt-1 inline-block", tagBadgeClass("documentation", vectorLabels.documentation))}>{vectorLabels.documentation}</span>
              )}
              <RiskThermometer label="Discrepancy" value={vectors.discrepancy} subscript="V_i" />
              {vectorLabels?.discrepancy && (
                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-6 -mt-1 inline-block", tagBadgeClass("discrepancy", vectorLabels.discrepancy))}>{vectorLabels.discrepancy}</span>
              )}
              <RiskThermometer label="Behavioral" value={vectors.behavioral} subscript="V_b" />
              {vectorLabels?.behavioral && (
                <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ml-6 -mt-1 inline-block", tagBadgeClass("behavioral", vectorLabels.behavioral))}>{vectorLabels.behavioral}</span>
              )}
            </div>
          </div>

          {/* Document Summary */}
          <div className="rounded-xl border border-acme-border bg-white p-4">
            <h3 className="text-xs font-semibold text-acme-teal mb-3 uppercase tracking-wider">Document Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-500">Total Documents</span>
                <span className="text-sm font-bold text-gray-900">{caseData.documents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-500">Processed</span>
                <span className="text-sm font-bold text-green-600">{caseData.documents.filter(d => d.status === "processed").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-500">Flagged</span>
                <span className="text-sm font-bold text-red-600">{caseData.documents.filter(d => d.status === "flagged").length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-gray-500">Pending</span>
                <span className="text-sm font-bold text-blue-600">{caseData.documents.filter(d => d.status === "pending").length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => router.push("/")} className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className="text-sm sm:text-base font-mono font-bold text-acme-orange uppercase">{caseData.id}</span>
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-acme-teal truncate">{caseData.claimantName}</h1>
              <StatusBadge status={caseData.status} />
              <span className={cn("text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded", SCORE_BAND_SOFT[scoreBand(caseData.complexityScore)])}>
                Score: {caseData.complexityScore}/100
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
              {caseData.policyNumber} — {diagnosis}
            </p>
          </div>
        </div>
        <button
          onClick={() => startRun(caseData.id)}
          disabled={isAssessing}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-acme-orange text-white text-xs sm:text-sm font-medium hover:bg-acme-orange/90 transition-colors flex-shrink-0 disabled:opacity-60"
        >
          {isAssessing ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          {isAssessing ? "AI Assessment Running..." : "Run AI Assessment"}
        </button>
      </div>

      {assessmentRun && (
        <div className={cn("flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
          assessmentRun.phase === "error" ? "bg-red-50 border-red-200 text-red-700" :
          assessmentRun.phase === "done" ? "bg-green-50 border-green-200 text-green-700" :
          "bg-blue-50 border-blue-200 text-blue-700"
        )}>
          {assessmentRun.phase === "error" ? <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
            assessmentRun.phase === "done" ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> :
            <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin" />}
          <div className="flex-1 min-w-0">
            {assessmentRun.phase === "starting" && <p>Starting the LTC New workflow in Agentic Studio for {caseData.id}...</p>}
            {assessmentRun.phase === "running" && (
              <p>AI agents are assessing the claim (intake, clinical, policy &amp; risk, scoring, routing, briefing) — {Math.round((Date.now() - assessmentRun.startedAt) / 1000)}s elapsed. Execution {assessmentRun.executionId}</p>
            )}
            {assessmentRun.phase === "done" && <p>Assessment saved: {assessmentRun.summary}</p>}
            {assessmentRun.phase === "error" && <p className="break-words">AI assessment failed: {assessmentRun.message}</p>}
          </div>
          {(assessmentRun.phase === "done" || assessmentRun.phase === "error") && (
            <button onClick={() => dismissRun(caseData.id)} className="p-0.5 rounded hover:bg-black/5">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-1 border-b border-acme-border overflow-x-auto">
        <button
          onClick={() => setMainTab("overview")}
          className={cn("flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap", mainTab === "overview" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <FileSearch className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Case Overview
        </button>
        <button
          onClick={() => setMainTab("decision")}
          className={cn("flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap", mainTab === "decision" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> AI Decision Summary
        </button>
        <button
          onClick={() => setMainTab("audit")}
          className={cn("flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap", mainTab === "audit" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Audit History
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
            <div className="rounded-xl border border-acme-border bg-white p-3 sm:p-4 lg:p-5">
              <h3 className="text-xs font-semibold text-acme-teal mb-3 sm:mb-4 uppercase tracking-wider">Case Details</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-3 sm:gap-y-4">
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
                  <p className="text-sm font-medium text-gray-900">{diagnosis}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Filing Date</span>
                  <p className="text-sm font-medium text-gray-900">{caseData.filingDate}</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-0.5">Elimination Period</span>
                  <p className="text-sm font-medium text-gray-900">{eliminationPeriod || "N/A"}</p>
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
              {caseSummary && (
                <div className="mt-4 pt-4 border-t border-acme-border/50">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Case Description</span>
                  <CitedText text={caseSummary} {...citeProps} className="text-gray-600" />
                </div>
              )}
            </div>

            {/* ===== RECOMMENDED NEXT STEPS ===== */}
            {renderRecommendedAction()}

            {/* ===== MAIN CONTENT: Documents List (left) + Document Viewer (right) ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">

              {/* Left: Documents List with Checkboxes + Upload */}
              <div className="lg:col-span-4 space-y-4">
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
                            setToastMessage("Upload failed. Check console for details.");
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
                    {caseData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => { setActiveDocument(doc.id === activeDocumentId ? null : doc.id); setDocViewTab("original"); }}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer",
                          doc.id === activeDocumentId ? "bg-orange-50 border border-acme-orange/20" : "hover:bg-gray-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocs.has(doc.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedDocs(prev => {
                              const next = new Set(prev);
                              if (next.has(doc.id)) next.delete(doc.id);
                              else next.add(doc.id);
                              return next;
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-acme-orange focus:ring-acme-orange/50 flex-shrink-0 cursor-pointer"
                        />
                        {getDocIcon(doc)}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-gray-700 truncate block">{doc.name}</span>
                          <span className="text-[10px] text-gray-400">Day {doc.day}</span>
                        </div>
                        <StatusBadge status={doc.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Document Viewer */}
              <div className="lg:col-span-8">
                <div className="rounded-xl border border-acme-border bg-white overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 340px)' }}>
                  <div className="px-4 py-3 border-b border-acme-border flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-acme-orange" />
                    <h3 className="text-xs font-semibold text-acme-teal uppercase tracking-wider">Document Viewer</h3>
                    {activeDoc && (
                      <button
                        onClick={() => { setDocModalTab(docViewTab); setDocModalOpen(true); }}
                        className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-acme-teal/10 text-acme-teal text-[10px] font-medium hover:bg-acme-teal/20 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Expand View
                      </button>
                    )}
                  </div>
                  <div className="p-4 flex-1 overflow-y-auto">
                    <AnimatePresence mode="wait">
                      {activeDoc ? (
                        <motion.div key={activeDoc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                          {renderDocumentViewer(activeDoc)}
                        </motion.div>
                      ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[300px] h-full text-gray-400">
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
          </motion.div>
        ) : mainTab === "decision" ? (
          <motion.div key="decision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {renderDecisionTab()}
          </motion.div>
        ) : (
          <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
            {/* Audit History Tab */}
            <div className="rounded-xl border border-acme-border bg-white p-4 flex flex-col flex-1 min-h-0">
              <div className="flex items-center gap-2 mb-4 flex-shrink-0">
                <History className="w-4 h-4 text-acme-orange" />
                <h3 className="text-xs font-semibold text-acme-teal uppercase tracking-wider">Audit History</h3>
                <span className="ml-auto text-[10px] text-gray-400">{caseData.auditHistory.length} entries</span>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
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
                          {entry.user && <span className="text-[10px] text-gray-400">— {entry.user}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {docModalOpen && activeDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) setDocModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl border border-acme-border w-[95vw] h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-5 py-3 border-b border-acme-border flex items-center gap-3 flex-shrink-0">
                <Eye className="w-4 h-4 text-acme-orange" />
                <h2 className="text-sm font-semibold text-acme-teal">{activeDoc.name}</h2>
                <StatusBadge status={activeDoc.status} />
                <div className="ml-auto flex items-center gap-2">
                  {(() => {
                    const modalTabs = getDocTabs(activeDoc);
                    const modalActiveValid = modalTabs.some((t) => t.id === docModalTab);
                    const modalEffective = modalActiveValid ? docModalTab : "original";
                    return modalTabs.length > 1 ? (
                      <div className="flex items-center gap-1 border border-acme-border rounded-lg overflow-hidden">
                        {modalTabs.map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setDocModalTab(tab.id)}
                            className={cn("px-3 py-1.5 text-xs font-medium transition-colors", modalEffective === tab.id ? "bg-acme-orange text-white" : "text-gray-500 hover:text-gray-700")}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  <button
                    onClick={() => setDocModalOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Modal Body */}
              {(() => {
                const modalTabs = getDocTabs(activeDoc);
                const modalExt = getFileExtension(activeDoc);
                const modalActiveValid = modalTabs.some((t) => t.id === docModalTab);
                const modalEffective = modalActiveValid ? docModalTab : "original";
                return (
                  <div className="flex-1 flex flex-col min-h-0 p-5">
                    {modalEffective === "original" && renderOriginalContent(activeDoc, true)}
                    {modalEffective === "schema" && (
                      <div className="bg-gray-900 rounded-lg p-5 border border-gray-700 overflow-auto flex-1 min-h-0">
                        <pre className="text-xs text-gray-100 font-mono leading-relaxed whitespace-pre-wrap">
                          {activeDoc.jsonSchema ? JSON.stringify(activeDoc.jsonSchema, null, 2) : "No JSON schema available for this document."}
                        </pre>
                      </div>
                    )}
                    {modalEffective === "interpreted" && (
                      modalExt === "csv" ? (
                        fetchedFileContent[activeDoc.id] ? renderCsvTable(fetchedFileContent[activeDoc.id]) : (
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-acme-teal" />
                            <span className="ml-2 text-xs text-gray-500">Loading table data...</span>
                          </div>
                        )
                      ) : activeDoc.aiInterpretedMd ? (
                        <div className="prose prose-sm max-w-none rounded-lg border border-acme-border bg-white p-5 overflow-auto flex-1 min-h-0 prose-headings:text-acme-teal prose-headings:font-semibold prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-800 prose-code:text-acme-orange prose-code:bg-orange-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-table:border-collapse prose-td:border prose-td:border-gray-300 prose-td:px-3 prose-td:py-1.5 prose-th:border prose-th:border-gray-300 prose-th:px-3 prose-th:py-1.5 prose-th:bg-gray-50">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {activeDoc.aiInterpretedMd}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 text-center">
                          <p className="text-sm text-gray-500">No AI interpretations available for this document.</p>
                        </div>
                      )
                    )}
                  </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-app Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl bg-acme-teal text-white shadow-lg max-w-sm"
          >
            <CheckCircle2 className="w-5 h-5 text-green-300 flex-shrink-0" />
            <p className="text-sm font-medium">{toastMessage}</p>
            <button onClick={() => setToastMessage(null)} className="ml-2 p-0.5 rounded hover:bg-white/20 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
