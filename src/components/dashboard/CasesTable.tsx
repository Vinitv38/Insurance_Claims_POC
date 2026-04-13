"use client";

import { useRouter } from "next/navigation";
import { useClaimsStore } from "@/store/claims-store";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, ExternalLink, XCircle } from "lucide-react";

function getScoreColor(score: number) {
  if (score <= 30) return "text-green-600";
  if (score <= 60) return "text-amber-600";
  if (score <= 80) return "text-acme-orange";
  return "text-red-600";
}

function getScoreBg(score: number) {
  if (score <= 30) return "bg-green-500/10";
  if (score <= 60) return "bg-amber-500/10";
  if (score <= 80) return "bg-acme-orange/10";
  return "bg-red-500/10";
}

export default function CasesTable() {
  const router = useRouter();
  const cases = useClaimsStore((s) => s.cases);
  const isLoading = useClaimsStore((s) => s.isLoading);
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const statusMap: Record<string, string> = {
    "Auto-Approved": "auto_approved",
    "In Review": "in_review",
    "Escalated": "escalated",
    "Pending": "pending",
    "Closed": "closed",
  };

  const filteredCases = cases.filter((c) => {
    const matchesType = typeFilter === "All Types" || c.claimType === typeFilter;
    const matchesStatus =
      statusFilter === "All Status" || c.status === statusMap[statusFilter];
    return matchesType && matchesStatus;
  });

  return (
    <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
      <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-acme-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-semibold text-acme-teal">Active Claims Queue</h3>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">Real-time triage overview — click any row for detail</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-gray-50 border border-acme-border rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-acme-orange/50"
          >
            <option>All Types</option>
            <option>Long-Term Care</option>
            <option>Accident &amp; Health</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-acme-border rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-acme-orange/50"
          >
            <option>All Status</option>
            <option>Auto-Approved</option>
            <option>In Review</option>
            <option>Escalated</option>
            <option>Pending</option>
            <option>Closed</option>
          </select>
          {(typeFilter !== "All Types" || statusFilter !== "All Status") && (
            <button
              onClick={() => { setTypeFilter("All Types"); setStatusFilter("All Status"); }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-900 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-acme-border bg-[#F0F7F8]">
              <th className="px-3 lg:px-4 xl:px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Claimant</th>
              <th className="px-3 lg:px-4 xl:px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Policy</th>
              <th className="px-3 lg:px-4 xl:px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-3 lg:px-4 xl:px-5 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-3 lg:px-4 xl:px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 lg:px-4 xl:px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
              <th className="px-3 lg:px-4 xl:px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-3 lg:px-4 xl:px-5 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="border-b border-acme-border/50 animate-pulse">
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5 text-center"><div className="h-7 bg-gray-200 rounded w-12 mx-auto" /></td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5"><div className="h-5 bg-gray-200 rounded w-20" /></td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5"><div className="h-4 bg-gray-200 rounded w-4 mx-auto" /></td>
                </tr>
              ))
            ) : filteredCases.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-5 py-8 text-center text-sm text-gray-400">
                  No claims match the selected filters
                </td>
              </tr>
            ) : (
              filteredCases.map((c, i) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => router.push(`/case/${c.id}`)}
                  className={cn(
                    "border-b border-acme-border/50 transition-all duration-200 cursor-pointer hover:bg-orange-50/50 hover:border-acme-orange/20",
                    c.status === "auto_approved" && "border-l-2 border-l-green-500/40",
                    c.status === "escalated" && "border-l-2 border-l-red-500/40",
                    c.status === "in_review" && "border-l-2 border-l-amber-500/40",
                    c.status === "pending" && "border-l-2 border-l-blue-500/40",
                    c.status === "closed" && "border-l-2 border-l-gray-400/40",
                  )}
                >
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      {c.status === "escalated" && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                      {c.status === "auto_approved" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                      {(c.status === "in_review" || c.status === "pending") && <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                      {c.status === "closed" && <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
                      <span className="text-xs lg:text-sm font-medium text-gray-900">{c.claimantName}</span>
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5">
                    <span className="text-[10px] lg:text-xs font-mono text-gray-500">{c.policyNumber}</span>
                  </td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5">
                    <span className="text-[10px] lg:text-xs text-gray-500">{c.claimType}</span>
                  </td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5 text-center">
                    <span className={cn("inline-flex items-center justify-center w-10 h-6 lg:w-12 lg:h-7 rounded-md text-[10px] lg:text-xs font-bold", getScoreColor(c.complexityScore), getScoreBg(c.complexityScore))}>
                      {c.complexityScore}
                    </span>
                  </td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5">
                    <div>
                      <p className="text-[10px] lg:text-xs text-gray-700">{c.assignedTo}</p>
                      <p className="text-[9px] lg:text-[10px] text-gray-500">{c.assignedGroup}</p>
                    </div>
                  </td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5">
                    <span className="text-[10px] lg:text-xs text-gray-500">{c.lastUpdated}</span>
                  </td>
                  <td className="px-3 lg:px-4 xl:px-5 py-2.5 text-center">
                    <ExternalLink className="w-3.5 h-3.5 text-acme-muted hover:text-acme-orange transition-colors" />
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
