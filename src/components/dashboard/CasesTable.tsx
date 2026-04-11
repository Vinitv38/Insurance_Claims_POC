"use client";

import { useRouter } from "next/navigation";
import { useClaimsStore } from "@/store/claims-store";
import StatusBadge from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Clock, ExternalLink } from "lucide-react";

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

  return (
    <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-acme-border flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-acme-teal">Active Claims Queue</h3>
          <p className="text-xs text-gray-500 mt-0.5">Real-time triage overview — click highlighted rows for detail</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-gray-50 border border-acme-border rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-acme-orange/50">
            <option>All Types</option>
            <option>Long-Term Care</option>
            <option>Accident &amp; Health</option>
          </select>
          <select className="bg-gray-50 border border-acme-border rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-acme-orange/50">
            <option>All Status</option>
            <option>Auto-Approved</option>
            <option>In Review</option>
            <option>Escalated</option>
            <option>Pending</option>
            <option>Closed</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-acme-border bg-[#F0F7F8]">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Claimant</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Policy</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Score</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Assigned</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Updated</th>
              <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {cases.map((c, i) => (
              <motion.tr
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => c.isClickable ? router.push(`/case/${c.id}`) : null}
                className={cn(
                  "border-b border-acme-border/50 transition-all duration-200",
                  c.isClickable
                    ? "cursor-pointer hover:bg-orange-50/50 hover:border-acme-orange/20"
                    : "opacity-60",
                  c.id === "case-001" && "bg-green-500/[0.03] border-l-2 border-l-green-500/40",
                  c.id === "case-002" && "bg-red-500/[0.03] border-l-2 border-l-red-500/40",
                )}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    {c.status === "escalated" && <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
                    {c.status === "auto_approved" && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                    {(c.status === "in_review" || c.status === "pending") && <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    <span className={cn("text-sm font-medium", c.isClickable ? "text-gray-900" : "text-gray-400")}>{c.claimantName}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs font-mono text-gray-500">{c.policyNumber}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-gray-500">{c.claimType}</span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  <span className={cn("inline-flex items-center justify-center w-12 h-7 rounded-md text-xs font-bold", getScoreColor(c.complexityScore), getScoreBg(c.complexityScore))}>
                    {c.complexityScore}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-5 py-3.5">
                  <div>
                    <p className="text-xs text-gray-700">{c.assignedTo}</p>
                    <p className="text-[10px] text-gray-500">{c.assignedGroup}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-xs text-gray-500">{c.lastUpdated}</span>
                </td>
                <td className="px-5 py-3.5 text-center">
                  {c.isClickable && <ExternalLink className="w-3.5 h-3.5 text-acme-muted hover:text-acme-orange transition-colors" />}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
