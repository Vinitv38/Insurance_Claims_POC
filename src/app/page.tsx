"use client";

import MetricCard from "@/components/ui/MetricCard";
import CasesTable from "@/components/dashboard/CasesTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { useClaimsStore } from "@/store/claims-store";
import { Activity, Zap, AlertTriangle, CheckCircle2, Clock, TrendingUp, FileStack, Users } from "lucide-react";

export default function HomePage() {
  const cases = useClaimsStore((s) => s.cases);

  const activeClaims = cases.filter((c) => c.status !== "closed").length;
  const stpRate = Math.round((cases.filter((c) => c.status === "auto_approved").length / cases.length) * 100);
  const escalatedToday = cases.filter((c) => c.status === "escalated").length;
  const pendingReview = cases.filter((c) => c.status === "in_review" || c.status === "pending").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Triage Command Center</h1>
          <p className="text-sm text-acme-muted mt-1">AI-powered claims complexity engine — operational overview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
            <span className="text-xs font-medium text-green-400">System Online</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-acme-slate border border-acme-border text-xs text-acme-muted">
            Last sync: 2 min ago
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Claims in Queue"
          value={activeClaims}
          subtitle="Across all product lines"
          icon={Activity}
          color="orange"
          trend={{ value: "12% vs last week", positive: false }}
        />
        <MetricCard
          title="Straight-Through Processing %"
          value={`${stpRate}%`}
          subtitle="Auto-approved without manual review"
          icon={Zap}
          color="green"
          trend={{ value: "3.2% improvement", positive: true }}
        />
        <MetricCard
          title="Fatal Overrides Today"
          value={escalatedToday}
          subtitle="Auto-escalated by rules engine"
          icon={AlertTriangle}
          color="red"
          trend={{ value: "1 more than yesterday", positive: false }}
        />
        <MetricCard
          title="Pending Review"
          value={pendingReview}
          subtitle="Awaiting adjuster action"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Avg. Complexity Score" value="48.2" icon={TrendingUp} color="teal" subtitle="Across all active claims" />
        <MetricCard title="Documents Processed" value="1,247" icon={FileStack} color="blue" subtitle="This month" trend={{ value: "156 today", positive: true }} />
        <MetricCard title="AI Accuracy Rate" value="94.7%" icon={CheckCircle2} color="purple" subtitle="Validated against adjuster decisions" />
        <MetricCard title="Active Adjusters" value="27" icon={Users} color="orange" subtitle="Across 4 skill tiers" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CasesTable />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
