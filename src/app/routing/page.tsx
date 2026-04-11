"use client";

import { useClaimsStore } from "@/store/claims-store";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Edit3, Save, Plus, ArrowRight, BarChart3 } from "lucide-react";

export default function RoutingPage() {
  const skillSets = useClaimsStore((s) => s.skillSets);
  const updateSkillSet = useClaimsStore((s) => s.updateSkillSet);
  const cases = useClaimsStore((s) => s.cases);
  const [editingId, setEditingId] = useState<string | null>(null);

  const getRoutedCases = (minScore: number, maxScore: number) => {
    return cases.filter((c) => c.complexityScore >= minScore && c.complexityScore <= maxScore);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Skill Routing Manager</h1>
          <p className="text-sm text-acme-muted mt-1">Map complexity scores to human capital — optimize workflow routing</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-acme-orange text-white text-xs font-medium hover:bg-acme-orange/90 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Add Skill Set
        </button>
      </div>

      {/* Score Range Visualization */}
      <div className="rounded-xl border border-acme-border bg-acme-dark p-5">
        <h3 className="text-xs font-semibold text-white mb-4 uppercase tracking-wider">Score-to-Skill Routing Map</h3>
        <div className="relative h-16 rounded-lg overflow-hidden flex">
          {skillSets.map((skill) => {
            const width = skill.maxScore - skill.minScore + 1;
            return (
              <motion.div
                key={skill.id}
                className="relative flex items-center justify-center"
                style={{ width: `${width}%`, backgroundColor: skill.color + "20", borderRight: "1px solid #334155" }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white">{skill.name}</p>
                  <p className="text-[10px] text-slate-400">{skill.minScore}–{skill.maxScore}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: skill.color }} />
              </motion.div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-acme-muted">0 (Low Risk)</span>
          <span className="text-[10px] text-acme-muted">50 (Moderate)</span>
          <span className="text-[10px] text-acme-muted">100 (Critical)</span>
        </div>
      </div>

      {/* Skill Sets Table */}
      <div className="rounded-xl border border-acme-border bg-acme-dark overflow-hidden">
        <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
          <Users className="w-4 h-4 text-acme-orange" />
          <h2 className="text-sm font-semibold text-white">Skill Sets & Capacity</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-acme-border bg-acme-navy/50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-acme-muted uppercase tracking-wider">Skill Set</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold text-acme-muted uppercase tracking-wider">Description</th>
              <th className="px-5 py-3 text-center text-[10px] font-semibold text-acme-muted uppercase tracking-wider">Score Range</th>
              <th className="px-5 py-3 text-center text-[10px] font-semibold text-acme-muted uppercase tracking-wider">Users</th>
              <th className="px-5 py-3 text-center text-[10px] font-semibold text-acme-muted uppercase tracking-wider">Capacity Free</th>
              <th className="px-5 py-3 text-center text-[10px] font-semibold text-acme-muted uppercase tracking-wider">Routed Cases</th>
              <th className="px-5 py-3 text-center text-[10px] font-semibold text-acme-muted uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {skillSets.map((skill) => {
              const routedCases = getRoutedCases(skill.minScore, skill.maxScore);
              const isEditing = editingId === skill.id;

              return (
                <motion.tr
                  key={skill.id}
                  layout
                  className="border-b border-acme-border/50 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-8 rounded" style={{ backgroundColor: skill.color }} />
                      <span className="text-sm font-medium text-white">{skill.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-slate-400">{skill.description}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {isEditing ? (
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={skill.minScore}
                          onChange={(e) => updateSkillSet(skill.id, { minScore: parseInt(e.target.value) || 0 })}
                          className="w-14 bg-acme-slate border border-acme-border rounded px-2 py-1 text-xs text-center text-slate-300 focus:outline-none focus:border-acme-orange/50"
                        />
                        <ArrowRight className="w-3 h-3 text-acme-muted" />
                        <input
                          type="number"
                          value={skill.maxScore}
                          onChange={(e) => updateSkillSet(skill.id, { maxScore: parseInt(e.target.value) || 0 })}
                          className="w-14 bg-acme-slate border border-acme-border rounded px-2 py-1 text-xs text-center text-slate-300 focus:outline-none focus:border-acme-orange/50"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-mono px-2 py-1 rounded bg-acme-slate text-slate-300">
                        {skill.minScore} — {skill.maxScore}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm font-medium text-white">{skill.userCount}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-acme-slate overflow-hidden">
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
                        skill.capacityFree > 50 ? "text-green-400" : skill.capacityFree > 25 ? "text-amber-400" : "text-red-400"
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
                      onClick={() => setEditingId(isEditing ? null : skill.id)}
                      className={cn(
                        "p-1.5 rounded transition-colors",
                        isEditing ? "bg-acme-orange/20 text-acme-orange" : "text-slate-400 hover:text-white hover:bg-acme-slate"
                      )}
                    >
                      {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Routing Logic Summary */}
      <div className="grid grid-cols-4 gap-4">
        {skillSets.map((skill) => {
          const routedCases = getRoutedCases(skill.minScore, skill.maxScore);
          return (
            <motion.div
              key={skill.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-acme-border bg-acme-dark p-4"
              style={{ borderLeftColor: skill.color, borderLeftWidth: "3px" }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-white">{skill.name}</h4>
                <BarChart3 className="w-3.5 h-3.5 text-acme-muted" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[10px] text-acme-muted">Active Cases</span>
                  <span className="text-sm font-bold" style={{ color: skill.color }}>{routedCases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-acme-muted">Team Size</span>
                  <span className="text-xs text-slate-300">{skill.userCount} adjusters</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-acme-muted">Avg Load</span>
                  <span className="text-xs text-slate-300">{routedCases.length > 0 ? (routedCases.length / skill.userCount).toFixed(1) : "0"} cases/adj</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
