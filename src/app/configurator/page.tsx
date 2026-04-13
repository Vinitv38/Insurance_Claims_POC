"use client";

import React from "react";
import { useClaimsStore } from "@/store/claims-store";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  SlidersHorizontal, AlertTriangle, Save, Plus, Trash2, Power, PowerOff,
  CheckCircle2, XCircle, ChevronRight, Users, Edit3, ArrowRight, BarChart3, ChevronDown
} from "lucide-react";

type ConfigTab = "weights" | "routing";

export default function ConfiguratorPage() {
  const vectorWeights = useClaimsStore((s) => s.vectorWeights);
  const setVectorWeights = useClaimsStore((s) => s.setVectorWeights);
  const fatalOverrides = useClaimsStore((s) => s.fatalOverrides);
  const updateFatalOverride = useClaimsStore((s) => s.updateFatalOverride);
  const removeFatalOverride = useClaimsStore((s) => s.removeFatalOverride);
  const addFatalOverride = useClaimsStore((s) => s.addFatalOverride);
  const skillSets = useClaimsStore((s) => s.skillSets);
  const updateSkillSet = useClaimsStore((s) => s.updateSkillSet);
  const cases = useClaimsStore((s) => s.cases);

  const [activeTab, setActiveTab] = useState<ConfigTab>("routing");
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [localWeights, setLocalWeights] = useState(vectorWeights);
  const [published, setPublished] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sum = localWeights.clinical + localWeights.documentation + localWeights.discrepancy + localWeights.behavioral;
  const isValid = sum === 100;

  const handleSliderChange = (key: keyof typeof localWeights, value: number) => {
    setLocalWeights((prev) => ({ ...prev, [key]: value }));
    setShowSaveConfirm(false);
  };

  const handleSave = () => {
    if (isValid) {
      setVectorWeights(localWeights);
      setShowSaveConfirm(true);
      setTimeout(() => setShowSaveConfirm(false), 3000);
    }
  };

  const handleAddOverride = () => {
    addFatalOverride({
      id: `override-${Date.now()}`,
      condition: "Select Condition",
      operator: "==",
      value: "",
      thenAction: "Select Action",
      isActive: false,
    });
  };

  const getRoutedCases = (minScore: number, maxScore: number) => {
    return cases.filter((c) => c.complexityScore >= minScore && c.complexityScore <= maxScore);
  };

  // Mock team members for each skill set
  const skillTeamMembers: Record<string, Array<{ name: string; bandwidth: number; activeCases: number }>> = {
    "skill-stp": [
      { name: "James Porter", bandwidth: 85, activeCases: 12 },
      { name: "Amy Richards", bandwidth: 72, activeCases: 18 },
      { name: "David Nguyen", bandwidth: 90, activeCases: 8 },
    ],
    "skill-junior": [
      { name: "Sarah Chen", bandwidth: 60, activeCases: 24 },
      { name: "Michael Torres", bandwidth: 45, activeCases: 31 },
      { name: "Lisa Park", bandwidth: 78, activeCases: 15 },
      { name: "Ryan O'Brien", bandwidth: 55, activeCases: 22 },
    ],
    "skill-senior": [
      { name: "Marcus Williams", bandwidth: 40, activeCases: 28 },
      { name: "Patricia Grant", bandwidth: 65, activeCases: 19 },
      { name: "Thomas Beck", bandwidth: 50, activeCases: 25 },
    ],
    "skill-clinical": [
      { name: "Dr. Karen Volkov", bandwidth: 35, activeCases: 14 },
      { name: "Dr. Henry Marsh", bandwidth: 55, activeCases: 10 },
    ],
    "skill-siu": [
      { name: "Rachel Kim", bandwidth: 70, activeCases: 6 },
      { name: "Derek Frost", bandwidth: 80, activeCases: 4 },
    ],
  };

  const vectors = [
    { key: "clinical" as const, label: "Clinical", subscript: "V_c", color: "bg-blue-500", textColor: "text-blue-400" },
    { key: "documentation" as const, label: "Documentation", subscript: "V_d", color: "bg-amber-500", textColor: "text-amber-400" },
    { key: "discrepancy" as const, label: "Discrepancy", subscript: "V_i", color: "bg-acme-orange", textColor: "text-acme-orange" },
    { key: "behavioral" as const, label: "Behavioral", subscript: "V_b", color: "bg-purple-500", textColor: "text-purple-400" },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-acme-teal">Configuration</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage scoring weights, fatal overrides, and skill routing</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeTab === "weights" && (
            <>
              {showSaveConfirm && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-xs text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Weights saved
                </motion.div>
              )}
              <button
                onClick={handleSave}
                disabled={!isValid}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors",
                  isValid ? "bg-acme-orange text-white hover:bg-acme-orange/90" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                )}
              >
                <Save className="w-3.5 h-3.5" /> Save Configuration
              </button>
            </>
          )}
          {activeTab === "routing" && (
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-acme-orange text-white text-xs font-medium hover:bg-acme-orange/90 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Skill Set
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher — Skill Routing first */}
      <div className="flex items-center gap-1 border-b border-acme-border overflow-x-auto">
        <button
          onClick={() => setActiveTab("routing")}
          className={cn("flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap", activeTab === "routing" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Skill Routing
        </button>
        <button
          onClick={() => setActiveTab("weights")}
          className={cn("flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap", activeTab === "weights" ? "border-acme-orange text-acme-orange" : "border-transparent text-gray-500 hover:text-gray-700")}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Weights & Overrides
        </button>
      </div>

      {/* Weights & Overrides Tab */}
      {activeTab === "weights" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Vector Weight Sliders */}
            <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-acme-orange" />
                <h2 className="text-sm font-semibold text-acme-teal">Risk Vector Weights</h2>
                <span className={cn(
                  "ml-auto text-xs font-bold px-2 py-0.5 rounded",
                  isValid ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-500 border border-red-200"
                )}>
                  Sum: {sum}%
                </span>
              </div>
              <div className="p-5 space-y-6">
                {vectors.map((v) => (
                  <div key={v.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-3 h-3 rounded", v.color)} />
                        <span className="text-sm font-medium text-gray-700">{v.label}</span>
                        <span className="text-[10px] text-gray-500 font-mono">({v.subscript})</span>
                      </div>
                      <span className={cn("text-sm font-bold tabular-nums", v.textColor)}>{localWeights[v.key]}%</span>
                    </div>
                    <div className="relative w-full h-2 rounded-full bg-gray-200">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full transition-all duration-150"
                        style={{
                          width: `${localWeights[v.key]}%`,
                          backgroundColor: v.color.includes("blue") ? "#3B82F6" : v.color.includes("amber") ? "#F59E0B" : v.color.includes("orange") ? "#E8792B" : "#A855F7",
                        }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={localWeights[v.key]}
                        onChange={(e) => handleSliderChange(v.key, parseInt(e.target.value))}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 shadow-sm pointer-events-none transition-all duration-150"
                        style={{
                          left: `calc(${localWeights[v.key]}% - 8px)`,
                          borderColor: v.color.includes("blue") ? "#3B82F6" : v.color.includes("amber") ? "#F59E0B" : v.color.includes("orange") ? "#E8792B" : "#A855F7",
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                ))}

                {!isValid && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
                  >
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs text-red-500">
                      Weights must sum to 100%. Current total: <span className="font-bold">{sum}%</span> ({sum > 100 ? `${sum - 100}% over` : `${100 - sum}% under`})
                    </p>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Distribution Preview</p>
                  <div className="h-4 rounded-full overflow-hidden flex bg-gray-200">
                    {vectors.map((v) => (
                      <motion.div
                        key={v.key}
                        className={cn(v.color)}
                        animate={{ width: `${localWeights[v.key]}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {vectors.map((v) => (
                      <div key={v.key} className="flex items-center gap-1.5">
                        <div className={cn("w-2 h-2 rounded", v.color)} />
                        <span className="text-[10px] text-gray-500">{v.label}: {localWeights[v.key]}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Fatal Override Configurations */}
            <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-acme-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-semibold text-acme-teal">Fatal Override Configurations</h2>
                </div>
                <button onClick={handleAddOverride} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 border border-acme-border text-xs text-gray-500 hover:text-gray-900 transition-colors">
                  <Plus className="w-3 h-3" /> Add Rule
                </button>
              </div>
              <div className="p-5 space-y-4">
                {fatalOverrides.map((override) => (
                  <motion.div
                    key={override.id}
                    layout
                    className={cn(
                      "rounded-lg border p-4 space-y-3 transition-colors",
                      override.isActive ? "border-acme-orange/30 bg-orange-50" : "border-acme-border bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-500 uppercase">IF</span>
                      <select
                        value={override.condition}
                        onChange={(e) => updateFatalOverride(override.id, { condition: e.target.value })}
                        className="bg-gray-50 border border-acme-border rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:border-acme-orange/50"
                      >
                        <option>Evidence Discrepancy</option>
                        <option>Documentation Completeness</option>
                        <option>OCR Confidence</option>
                        <option>Behavioral Score</option>
                        <option>Clinical Vector</option>
                      </select>
                      <select
                        value={override.operator}
                        onChange={(e) => updateFatalOverride(override.id, { operator: e.target.value })}
                        className="bg-gray-50 border border-acme-border rounded px-2 py-1 text-xs text-gray-700 w-14 focus:outline-none focus:border-acme-orange/50"
                      >
                        <option>==</option>
                        <option>&gt;</option>
                        <option>&lt;</option>
                        <option>&gt;=</option>
                        <option>!=</option>
                      </select>
                      <input
                        value={override.value}
                        onChange={(e) => updateFatalOverride(override.id, { value: e.target.value })}
                        className="bg-gray-50 border border-acme-border rounded px-2 py-1 text-xs text-acme-orange font-mono w-40 focus:outline-none focus:border-acme-orange/50"
                        placeholder="Value"
                      />
                    </div>

                    {override.andCondition && (
                      <div className="flex items-center gap-2 flex-wrap pl-4">
                        <span className="text-[10px] font-bold text-amber-500 uppercase">AND</span>
                        <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">{override.andCondition}</span>
                        <span className="text-xs text-gray-600">{override.andOperator}</span>
                        <span className="text-xs text-acme-orange font-mono bg-gray-50 px-2 py-1 rounded">{override.andValue}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pl-4">
                      <span className="text-[10px] font-bold text-green-500 uppercase">THEN</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <select
                        value={override.thenAction}
                        onChange={(e) => updateFatalOverride(override.id, { thenAction: e.target.value })}
                        className="bg-gray-50 border border-acme-border rounded px-2 py-1 text-xs text-green-600 focus:outline-none focus:border-acme-orange/50"
                      >
                        <option>Route to Tier 2 Clinical</option>
                        <option>Hold for Manual Review</option>
                        <option>Request Re-submission</option>
                        <option>Route to SIU</option>
                        <option>Auto-Deny</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-acme-border/50">
                      <button
                        onClick={() => updateFatalOverride(override.id, { isActive: !override.isActive })}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-medium transition-colors",
                          override.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {override.isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                        {override.isActive ? "Active" : "Inactive"}
                      </button>
                      <button
                        onClick={() => removeFatalOverride(override.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-red-400 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Publish Toggle */}
          <div className="rounded-xl border border-acme-border bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-acme-teal">Publish Rules to Logic Apps Engine</h3>
                <p className="text-xs text-gray-500 mt-0.5">Deploy current configuration to production scoring engine</p>
              </div>
              <div className="flex items-center gap-4">
                {published && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Published successfully
                  </motion.span>
                )}
                <button
                  onClick={() => { setPublished(!published); if (!published) setTimeout(() => setPublished(false), 5000); }}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300",
                    published ? "bg-green-500" : "bg-gray-300"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300",
                    published ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Skill Routing Tab */}
      {activeTab === "routing" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Score Range Visualization */}
          <div className="rounded-xl border border-acme-border bg-white p-5">
            <h3 className="text-xs font-semibold text-acme-teal mb-4 uppercase tracking-wider">Score-to-Skill Routing Map</h3>
            <div className="relative h-16 rounded-lg overflow-hidden flex">
              {skillSets.map((skill) => {
                const width = skill.maxScore - skill.minScore + 1;
                return (
                  <motion.div
                    key={skill.id}
                    className="relative flex items-center justify-center"
                    style={{ width: `${width}%`, backgroundColor: skill.color + "20", borderRight: "1px solid #E5E7EB" }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-gray-800">{skill.name}</p>
                      <p className="text-[10px] text-gray-500">{skill.minScore}–{skill.maxScore}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: skill.color }} />
                  </motion.div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] text-gray-500">0 (Low Risk)</span>
              <span className="text-[10px] text-gray-500">50 (Moderate)</span>
              <span className="text-[10px] text-gray-500">100 (Critical)</span>
            </div>
          </div>

          {/* Skill Sets Table */}
          <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
              <Users className="w-4 h-4 text-acme-orange" />
              <h2 className="text-sm font-semibold text-acme-teal">Skill Sets & Capacity</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-acme-border bg-[#F0F7F8]">
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Skill Set</th>
                  <th className="px-5 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Score Range</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Users</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Capacity Free</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Routed Cases</th>
                  <th className="px-5 py-3 text-center text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skillSets.map((skill) => {
                  const routedCases = getRoutedCases(skill.minScore, skill.maxScore);
                  const isEditing = editingId === skill.id;
                  const isExpanded = expandedSkill === skill.id;
                  const teamMembers = skillTeamMembers[skill.id] || [];

                  return (
                    <React.Fragment key={skill.id}>
                      <motion.tr
                        layout
                        className={cn("border-b border-acme-border/50 hover:bg-gray-50 transition-colors cursor-pointer", isExpanded && "bg-orange-50/30")}
                        onClick={() => setExpandedSkill(isExpanded ? null : skill.id)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <ChevronDown className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", isExpanded && "rotate-180")} />
                            <div className="w-3 h-8 rounded" style={{ backgroundColor: skill.color }} />
                            <span className="text-sm font-medium text-gray-900">{skill.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-gray-500">{skill.description}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                value={skill.minScore}
                                onChange={(e) => updateSkillSet(skill.id, { minScore: parseInt(e.target.value) || 0 })}
                                className="w-14 bg-gray-50 border border-acme-border rounded px-2 py-1 text-xs text-center text-gray-700 focus:outline-none focus:border-acme-orange/50"
                              />
                              <ArrowRight className="w-3 h-3 text-gray-400" />
                              <input
                                type="number"
                                value={skill.maxScore}
                                onChange={(e) => updateSkillSet(skill.id, { maxScore: parseInt(e.target.value) || 0 })}
                                className="w-14 bg-gray-50 border border-acme-border rounded px-2 py-1 text-xs text-center text-gray-700 focus:outline-none focus:border-acme-orange/50"
                              />
                            </div>
                          ) : (
                            <span className="text-xs font-mono px-2 py-1 rounded bg-gray-100 text-gray-700">
                              {skill.minScore} — {skill.maxScore}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-medium text-gray-900">{skill.userCount}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${skill.capacityFree}%`,
                                  backgroundColor: skill.capacityFree > 50 ? "#22C55E" : skill.capacityFree > 25 ? "#F59E0B" : "#EF4444",
                                }}
                              />
                            </div>
                            <span className={cn(
                              "text-xs font-medium",
                              skill.capacityFree > 50 ? "text-green-600" : skill.capacityFree > 25 ? "text-amber-600" : "text-red-600"
                            )}>
                              {skill.capacityFree}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs font-bold text-acme-orange">{routedCases.length}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingId(isEditing ? null : skill.id); }}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              isEditing ? "bg-orange-50 text-acme-orange" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"
                            )}
                          >
                            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </motion.tr>
                      {/* Expandable team members dropdown */}
                      {isExpanded && teamMembers.length > 0 && (
                        <tr className="border-b border-acme-border/50">
                          <td colSpan={7} className="px-5 py-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-3 pl-10 space-y-2">
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Team Members & Bandwidth</p>
                                {teamMembers.map((member) => (
                                  <div key={member.name} className="flex items-center gap-4 py-1.5 px-3 rounded-lg bg-gray-50 border border-acme-border/50">
                                    <div className="w-7 h-7 rounded-full bg-acme-teal/10 flex items-center justify-center flex-shrink-0">
                                      <span className="text-[10px] font-bold text-acme-teal">{member.name.split(" ").map(n => n[0]).join("")}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900">{member.name}</p>
                                      <p className="text-[10px] text-gray-500">{member.activeCases} active cases</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span className="text-[10px] text-gray-500">Bandwidth</span>
                                      <div className="w-20 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                        <div
                                          className="h-full rounded-full transition-all duration-500"
                                          style={{
                                            width: `${member.bandwidth}%`,
                                            backgroundColor: member.bandwidth > 60 ? "#22C55E" : member.bandwidth > 30 ? "#F59E0B" : "#EF4444",
                                          }}
                                        />
                                      </div>
                                      <span className={cn(
                                        "text-[10px] font-medium w-8 text-right",
                                        member.bandwidth > 60 ? "text-green-600" : member.bandwidth > 30 ? "text-amber-600" : "text-red-600"
                                      )}>
                                        {member.bandwidth}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Routing Logic Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {skillSets.map((skill) => {
              const routedCases = getRoutedCases(skill.minScore, skill.maxScore);
              return (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-acme-border bg-white p-4"
                  style={{ borderLeftColor: skill.color, borderLeftWidth: "3px" }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-900">{skill.name}</h4>
                    <BarChart3 className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Active Cases</span>
                      <span className="text-sm font-bold" style={{ color: skill.color }}>{routedCases.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Team Size</span>
                      <span className="text-xs text-gray-700">{skill.userCount} adjusters</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-gray-500">Avg Load</span>
                      <span className="text-xs text-gray-700">{routedCases.length > 0 ? (routedCases.length / skill.userCount).toFixed(1) : "0"} cases/adj</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}
