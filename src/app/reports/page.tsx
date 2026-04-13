"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import MetricCard from "@/components/ui/MetricCard";
import {
  BarChart3, TrendingUp, Users, Clock, Zap,
  AlertTriangle, CheckCircle2, PieChart
} from "lucide-react";

const monthlyData = [
  { month: "Oct", claims: 142, stp: 98, escalated: 12 },
  { month: "Nov", claims: 158, stp: 112, escalated: 15 },
  { month: "Dec", claims: 134, stp: 95, escalated: 8 },
  { month: "Jan", claims: 167, stp: 118, escalated: 18 },
  { month: "Feb", claims: 189, stp: 134, escalated: 22 },
  { month: "Mar", claims: 201, stp: 148, escalated: 19 },
];

const productData = [
  { product: "Long-Term Care", claims: 412, pct: 38, color: "bg-acme-orange" },
  { product: "Accident & Health", claims: 287, pct: 27, color: "bg-blue-500" },
  { product: "Disability Income", claims: 198, pct: 18, color: "bg-purple-500" },
  { product: "Life Insurance", claims: 184, pct: 17, color: "bg-teal-500" },
];

const teamPerformance = [
  { name: "Sarah Chen", role: "Senior Adjuster", cases: 47, avgTime: "2.3 days", satisfaction: 96 },
  { name: "Marcus Williams", role: "Tier 2 Investigator", cases: 31, avgTime: "4.1 days", satisfaction: 94 },
  { name: "Dr. Karen Volkov", role: "Tier 2 Clinical", cases: 28, avgTime: "3.8 days", satisfaction: 97 },
  { name: "James Porter", role: "Junior Adjuster", cases: 62, avgTime: "1.2 days", satisfaction: 91 },
  { name: "Rachel Kim", role: "SIU Fraud Unit", cases: 15, avgTime: "8.5 days", satisfaction: 89 },
];

const rootCauses = [
  { cause: "Missing/Incomplete Documentation", pct: 34, count: 156, color: "bg-amber-500" },
  { cause: "Clinical Evidence Discrepancy", pct: 22, count: 101, color: "bg-red-500" },
  { cause: "Provider Communication Delay", pct: 18, count: 83, color: "bg-blue-500" },
  { cause: "Policy Interpretation Ambiguity", pct: 14, count: 64, color: "bg-purple-500" },
  { cause: "Behavioral / Fraud Indicators", pct: 8, count: 37, color: "bg-acme-orange" },
  { cause: "Other", pct: 4, count: 18, color: "bg-slate-500" },
];

export default function ReportsPage() {
  const maxClaims = Math.max(...monthlyData.map((d) => d.claims));

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-acme-teal">Management Dashboard</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Executive reporting & analytics — Q1 2026 performance overview</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select className="bg-gray-50 border border-acme-border rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-acme-orange/50">
            <option>Q1 2026</option>
            <option>Q4 2025</option>
            <option>Q3 2025</option>
          </select>
          <select className="bg-gray-50 border border-acme-border rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-acme-orange/50">
            <option>All Products</option>
            <option>Long-Term Care</option>
            <option>Accident &amp; Health</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard title="Total Claims (YTD)" value="1,081" icon={BarChart3} color="orange" subtitle="Across all product lines" trend={{ value: "8.4% vs prior year", positive: true }} />
        <MetricCard title="Straight-Through Rate" value="72.4%" icon={Zap} color="green" subtitle="Auto-processed without human review" trend={{ value: "5.1% improvement", positive: true }} />
        <MetricCard title="Avg. Resolution Time" value="3.2 days" icon={Clock} color="blue" subtitle="From filing to decision" trend={{ value: "0.8 days faster", positive: true }} />
        <MetricCard title="Customer Satisfaction" value="94.2%" icon={CheckCircle2} color="purple" subtitle="Post-claim survey score" trend={{ value: "1.3% improvement", positive: true }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Monthly Claims Trend - Bar Chart */}
        <div className="lg:col-span-2 rounded-xl border border-acme-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-acme-orange" />
            <h2 className="text-sm font-semibold text-acme-teal">Monthly Claims Trend</h2>
          </div>
          <div className="p-5">
            <div className="flex items-end gap-3 h-48">
              {monthlyData.map((d, i) => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-1 h-40">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.stp / maxClaims) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="flex-1 bg-green-500/60 rounded-t"
                      title={`STP: ${d.stp}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.escalated / maxClaims) * 100}%` }}
                      transition={{ delay: i * 0.1 + 0.1, duration: 0.5 }}
                      className="flex-1 bg-red-500/60 rounded-t"
                      title={`Escalated: ${d.escalated}`}
                    />
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${((d.claims - d.stp - d.escalated) / maxClaims) * 100}%` }}
                      transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                      className="flex-1 bg-blue-500/60 rounded-t"
                      title={`Other: ${d.claims - d.stp - d.escalated}`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-6 mt-4 pt-3 border-t border-acme-border/50">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-green-500/60" />
                <span className="text-[10px] text-gray-500">Straight-Through</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-red-500/60" />
                <span className="text-[10px] text-gray-500">Escalated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500/60" />
                <span className="text-[10px] text-gray-500">Standard Review</span>
              </div>
            </div>
          </div>
        </div>

        {/* Claims by Product */}
        <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
            <PieChart className="w-4 h-4 text-acme-orange" />
            <h2 className="text-sm font-semibold text-acme-teal">Claims by Product</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Visual pie representation */}
            <div className="flex justify-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
                  {(() => {
                    let offset = 0;
                    return productData.map((p) => {
                      const circumference = 2 * Math.PI * 10;
                      const dash = (p.pct / 100) * circumference;
                      const currentOffset = offset;
                      offset += dash;
                      const colors: Record<string, string> = {
                        "bg-acme-orange": "#E8792B",
                        "bg-blue-500": "#3B82F6",
                        "bg-purple-500": "#A855F7",
                        "bg-teal-500": "#14B8A6",
                      };
                      return (
                        <circle
                          key={p.product}
                          r="10"
                          cx="16"
                          cy="16"
                          fill="none"
                          stroke={colors[p.color] || "#64748B"}
                          strokeWidth="6"
                          strokeDasharray={`${dash} ${circumference - dash}`}
                          strokeDashoffset={-currentOffset}
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold text-acme-teal">1,081</p>
                    <p className="text-[10px] text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
            {productData.map((p) => (
              <div key={p.product} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded", p.color)} />
                    <span className="text-xs text-gray-700">{p.product}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900">{p.claims}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", p.color)}
                    initial={{ width: "0%" }}
                    animate={{ width: `${p.pct}%` }}
                    transition={{ duration: 1, delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Team Performance */}
        <div className="rounded-xl border border-acme-border bg-white overflow-hidden overflow-x-auto">
          <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
            <Users className="w-4 h-4 text-acme-orange" />
            <h2 className="text-sm font-semibold text-acme-teal">Team Performance</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-acme-border bg-[#F0F7F8]">
                <th className="px-5 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Adjuster</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cases</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Avg Time</th>
                <th className="px-5 py-2.5 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Satisfaction</th>
              </tr>
            </thead>
            <tbody>
              {teamPerformance.map((person) => (
                <tr key={person.name} className="border-b border-acme-border/50">
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-gray-900">{person.name}</p>
                    <p className="text-[10px] text-gray-500">{person.role}</p>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-xs font-bold text-acme-orange">{person.cases}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="text-xs text-gray-700">{person.avgTime}</span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={cn(
                      "text-xs font-medium",
                      person.satisfaction >= 95 ? "text-green-600" : person.satisfaction >= 90 ? "text-amber-600" : "text-red-600"
                    )}>
                      {person.satisfaction}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Root Cause Analysis */}
        <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-acme-orange" />
            <h2 className="text-sm font-semibold text-acme-teal">Escalation Root Causes</h2>
          </div>
          <div className="p-5 space-y-4">
            {rootCauses.map((cause, i) => (
              <motion.div
                key={cause.cause}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700">{cause.cause}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">{cause.count} cases</span>
                    <span className="text-xs font-bold text-gray-900">{cause.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <motion.div
                    className={cn("h-full rounded-full", cause.color)}
                    initial={{ width: "0%" }}
                    animate={{ width: `${cause.pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
