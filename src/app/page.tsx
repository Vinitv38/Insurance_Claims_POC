"use client";

import MetricCard from "@/components/ui/MetricCard";
import CasesTable from "@/components/dashboard/CasesTable";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import { useClaimsStore } from "@/store/claims-store";
import { Activity, Zap, AlertTriangle, CheckCircle2, Clock, TrendingUp, FileStack, Users, Plus, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClaimCase } from "@/store/claims-store";

export default function HomePage() {
  const cases = useClaimsStore((s) => s.cases);
  const addCase = useClaimsStore((s) => s.addCase);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [formData, setFormData] = useState({
    claimantName: "",
    policyNumber: "",
    claimType: "Long-Term Care",
    dateOfBirth: "",
    diagnosis: "",
    assignedTo: "",
    assignedGroup: "Queue",
  });

  const activeClaims = cases.filter((c) => c.status !== "closed").length;
  const stpRate = Math.round((cases.filter((c) => c.status === "auto_approved").length / cases.length) * 100);
  const escalatedToday = cases.filter((c) => c.status === "escalated").length;
  const pendingReview = cases.filter((c) => c.status === "in_review" || c.status === "pending").length;

  const handleCreateClaim = () => {
    if (!formData.claimantName || !formData.policyNumber) return;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const age = formData.dateOfBirth
      ? Math.floor((now.getTime() - new Date(formData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 0;

    const newCase: ClaimCase = {
      id: `case-${String(cases.length + 1).padStart(3, "0")}`,
      claimantName: formData.claimantName,
      policyNumber: formData.policyNumber,
      claimType: formData.claimType,
      dateOfBirth: formData.dateOfBirth || "N/A",
      age,
      diagnosis: formData.diagnosis || "Pending Assessment",
      status: "pending",
      assignedTo: formData.assignedTo || "Unassigned",
      assignedGroup: formData.assignedGroup,
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
      summary: "New claim \u2014 pending initial AI assessment and document upload.",
      riskIndicators: ["INFO: Awaiting initial document upload and AI scoring"],
      recommendedAction: "Upload initial documentation to begin AI assessment.",
      filingDate: dateStr,
      lastUpdated: dateStr,
    };

    addCase(newCase);
    setShowNewClaim(false);
    setFormData({
      claimantName: "",
      policyNumber: "",
      claimType: "Long-Term Care",
      dateOfBirth: "",
      diagnosis: "",
      assignedTo: "",
      assignedGroup: "Queue",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-acme-teal">Global Triage Command Center</h1>
          <p className="text-sm text-gray-500 mt-1">AI-powered claims complexity engine \u2014 operational overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewClaim(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-acme-orange text-white text-sm font-medium hover:bg-acme-orange/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Claim
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse-glow" />
            <span className="text-xs font-medium text-green-700">System Online</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-acme-border text-xs text-gray-500">
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
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Diagnosis</label>
                  <input
                    value={formData.diagnosis}
                    onChange={(e) => setFormData((p) => ({ ...p, diagnosis: e.target.value }))}
                    className="w-full bg-gray-50 border border-acme-border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-acme-orange/50"
                    placeholder="Primary diagnosis"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Assigned To</label>
                    <input
                      value={formData.assignedTo}
                      onChange={(e) => setFormData((p) => ({ ...p, assignedTo: e.target.value }))}
                      className="w-full bg-gray-50 border border-acme-border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-acme-orange/50"
                      placeholder="Adjuster name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Group</label>
                    <select
                      value={formData.assignedGroup}
                      onChange={(e) => setFormData((p) => ({ ...p, assignedGroup: e.target.value }))}
                      className="w-full bg-gray-50 border border-acme-border rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-acme-orange/50"
                    >
                      <option>Queue</option>
                      <option>Junior Adjuster</option>
                      <option>Senior Adjuster</option>
                      <option>Tier 2 Clinical Investigator</option>
                      <option>SIU Fraud Unit</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-acme-border flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowNewClaim(false)}
                  className="px-4 py-2 rounded-lg bg-white border border-acme-border text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClaim}
                  disabled={!formData.claimantName || !formData.policyNumber}
                  className="px-4 py-2 rounded-lg bg-acme-orange text-white text-sm font-medium hover:bg-acme-orange/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Claim
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
