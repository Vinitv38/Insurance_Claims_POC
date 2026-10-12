"use client";

import MetricCard from "@/components/ui/MetricCard";
import CasesTable from "@/components/dashboard/CasesTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { useClaimsStore } from "@/store/claims-store";
import { Activity, Zap, AlertTriangle, CheckCircle2, Clock, TrendingUp, FileStack, Users, Plus, X, Upload, FileText } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { nextClaimId } from "@/lib/supabase-api";
import { useDocumentUploads } from "@/store/document-uploads";
import { motion, AnimatePresence } from "framer-motion";
import type { ClaimCase } from "@/store/claims-store";

export default function HomePage() {
  const cases = useClaimsStore((s) => s.cases);
  const addCase = useClaimsStore((s) => s.addCase);
  const router = useRouter();
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const uploadDocuments = useDocumentUploads((s) => s.uploadDocuments);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newClaimFiles, setNewClaimFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    claimantName: "",
    policyNumber: "",
    claimType: "Long-Term Care",
    dateOfBirth: "",
  });

  const isLoading = useClaimsStore((s) => s.isLoading);
  const activeClaims = cases.filter((c) => c.status !== "closed").length;
  const stpRate = cases.length > 0 ? Math.round((cases.filter((c) => c.status === "auto_approved").length / cases.length) * 100) : 0;
  const escalatedToday = cases.filter((c) => c.status === "escalated").length;
  const pendingReview = cases.filter((c) => c.status === "in_review" || c.status === "pending").length;
  const skillSets = useClaimsStore((s) => s.skillSets);
  const activeCases = cases.filter((c) => c.status !== "closed");
  const avgComplexity = activeCases.length
    ? (activeCases.reduce((sum, c) => sum + c.complexityScore, 0) / activeCases.length).toFixed(1)
    : "—";
  const allDocuments = cases.flatMap((c) => c.documents);
  const documentsProcessed = allDocuments.filter((d) => d.status !== "pending").length;
  const liveAssessments = cases.flatMap((c) => c.assessments).filter((a) => a.id.startsWith("live-")).length;
  const adjusters = skillSets.reduce((sum, s) => sum + s.userCount, 0);

  const handleCreateClaim = async () => {
    if (!formData.claimantName || !formData.policyNumber) return;
    setIsCreating(true);
    setCreateError(null);
    try {

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];
      const age = formData.dateOfBirth
        ? Math.floor((now.getTime() - new Date(formData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 0;

      const newCase: ClaimCase = {
        id: await nextClaimId(),
        claimantName: formData.claimantName,
        policyNumber: formData.policyNumber,
        claimType: formData.claimType,
        dateOfBirth: formData.dateOfBirth || "N/A",
        age,
        diagnosis: "Pending AI assessment",
        status: "pending",
        assignedTo: "Unassigned",
        assignedGroup: "Unassigned",
        complexityScore: 0,
        vectors: { clinical: 0, documentation: 0, discrepancy: 0, behavioral: 0 },
        documents: [],
        auditHistory: [
          {
            timestamp: now.toISOString(),
            action: "CLAIM_CREATED",
            detail: `New ${formData.claimType} claim initiated manually`,
            user: "Current User",
            scoreChange: { from: 0, to: 0 },
          },
        ],
        assessments: [],
        summary: newClaimFiles.length
          ? "New claim — documents uploaded; the AI assessment starts automatically once they are processed."
          : "New claim — pending initial AI assessment and document upload.",
        riskIndicators: ["INFO: Awaiting initial document upload and AI scoring"],
        recommendedAction: newClaimFiles.length
          ? "Wait for document processing and the automatic LTC New assessment."
          : "Upload initial documentation to begin AI assessment.",
        filingDate: dateStr,
        lastUpdated: dateStr,
      };

      await addCase(newCase);
      if (newClaimFiles.length) void uploadDocuments(newCase.id, newClaimFiles);
      setShowNewClaim(false);
      setNewClaimFiles([]);
      setFormData({
        claimantName: "",
        policyNumber: "",
        claimType: "Long-Term Care",
        dateOfBirth: "",
      });
      router.push(`/case/${newCase.id}`);
    } catch (err) {
      console.error("[NewClaim] Could not save the claim:", err);
      setCreateError(err instanceof Error ? err.message : (err as { message?: string })?.message || String(err));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-acme-teal">Global Triage Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={() => setShowNewClaim(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-acme-orange text-white text-xs sm:text-sm font-medium hover:bg-acme-orange/90 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> New Claim
          </button>
          <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-green-50 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
            <span className="text-[10px] sm:text-xs font-medium text-green-700">System Online</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          title="Active Claims in Queue"
          value={isLoading ? "—" : activeClaims}
          subtitle="Across all product lines"
          icon={Activity}
          color="orange"
        />
        <MetricCard
          title="Straight-Through Processing %"
          value={isLoading ? "—" : `${stpRate}%`}
          subtitle="Claims auto reviewed for human based approval"
          icon={Zap}
          color="green"
        />
        <MetricCard
          title="Escalated Claims"
          value={isLoading ? "—" : escalatedToday}
          subtitle="Routed for investigation"
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="Pending Review"
          value={isLoading ? "—" : pendingReview}
          subtitle="Awaiting adjuster action"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard title="Avg. Complexity Score" value={isLoading ? "—" : avgComplexity} icon={TrendingUp} color="teal" subtitle="Across all active claims" />
        <MetricCard title="Documents Processed" value={isLoading ? "—" : documentsProcessed} icon={FileStack} color="blue" subtitle={`Of ${allDocuments.length} uploaded`} />
        <MetricCard title="Live AI Assessments" value={isLoading ? "—" : liveAssessments} icon={CheckCircle2} color="purple" subtitle="LTC New workflow runs saved" />
        <MetricCard title="Active Adjusters" value={isLoading ? "—" : adjusters} icon={Users} color="orange" subtitle={`Across ${skillSets.length} skill tiers`} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2">
          <CasesTable />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* New Claim Modal */}
      <AnimatePresence>
        {showNewClaim && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={(e) => { if (e.target === e.currentTarget) setShowNewClaim(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-xl border border-acme-border w-full max-w-lg mx-4 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-acme-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-acme-teal">Create New Claim</h2>
                <button onClick={() => setShowNewClaim(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Claimant Name *</label>
                    <input
                      value={formData.claimantName}
                      onChange={(e) => setFormData((p) => ({ ...p, claimantName: e.target.value }))}
                      className="w-full bg-gray-50 border border-acme-border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-acme-orange/50"
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Policy Number *</label>
                    <input
                      value={formData.policyNumber}
                      onChange={(e) => setFormData((p) => ({ ...p, policyNumber: e.target.value }))}
                      className="w-full bg-gray-50 border border-acme-border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-acme-orange/50"
                      placeholder="e.g. LTC-XXX-XXXXZ"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Claim Type</label>
                    <select
                      value={formData.claimType}
                      onChange={(e) => setFormData((p) => ({ ...p, claimType: e.target.value }))}
                      className="w-full bg-gray-50 border border-acme-border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-acme-orange/50"
                    >
                      <option>Long-Term Care</option>
                      <option>Accident & Health</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData((p) => ({ ...p, dateOfBirth: e.target.value }))}
                      className="w-full bg-gray-50 border border-acme-border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-acme-orange/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Documents</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const picked = Array.from(e.target.files || []);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      setNewClaimFiles((prev) => [...prev, ...picked.filter((f) => !prev.some((p) => p.name === f.name && p.size === f.size))]);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-acme-border rounded-lg px-3 py-3 text-sm text-gray-500 bg-gray-50 hover:border-acme-orange/50 hover:text-gray-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    {newClaimFiles.length ? "Add more files" : "Attach claim documents"}
                  </button>
                  {newClaimFiles.length > 0 && (
                    <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                      {newClaimFiles.map((f) => (
                        <li key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 border border-acme-border px-2 py-1 text-xs text-gray-700">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{f.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setNewClaimFiles((prev) => prev.filter((p) => p !== f))}
                            className="p-0.5 rounded hover:bg-gray-200"
                            aria-label={`Remove ${f.name}`}
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1.5 text-[11px] text-gray-400">
                    Diagnosis, score, adjuster and queue are set by the AI assessment, which starts automatically once all documents are processed.
                  </p>
                </div>
              </div>
              {createError && (
                <div className="mx-6 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 break-words">
                  Could not create the claim: {createError}
                </div>
              )}
              <div className="px-6 py-4 border-t border-acme-border flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowNewClaim(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-acme-border text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClaim}
                  disabled={!formData.claimantName || !formData.policyNumber || isCreating}
                  className="px-4 py-2 rounded-lg bg-acme-orange text-white text-sm font-medium hover:bg-acme-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? "Creating..." : "Create Claim"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
