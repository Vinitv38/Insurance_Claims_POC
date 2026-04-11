"use client";

import { useClaimsStore } from "@/store/claims-store";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  SlidersHorizontal, AlertTriangle, Save, Plus, Trash2, Power, PowerOff,
  CheckCircle2, XCircle, ChevronRight
} from "lucide-react";

export default function ConfiguratorPage() {
  const vectorWeights = useClaimsStore((s) => s.vectorWeights);
  const setVectorWeights = useClaimsStore((s) => s.setVectorWeights);
  const fatalOverrides = useClaimsStore((s) => s.fatalOverrides);
  const updateFatalOverride = useClaimsStore((s) => s.updateFatalOverride);
  const removeFatalOverride = useClaimsStore((s) => s.removeFatalOverride);
  const addFatalOverride = useClaimsStore((s) => s.addFatalOverride);

  const [localWeights, setLocalWeights] = useState(vectorWeights);
  const [published, setPublished] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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

  const vectors = [
    { key: "clinical" as const, label: "Clinical", subscript: "V_c", color: "bg-blue-500", textColor: "text-blue-400" },
    { key: "documentation" as const, label: "Documentation", subscript: "V_d", color: "bg-amber-500", textColor: "text-amber-400" },
    { key: "discrepancy" as const, label: "Discrepancy", subscript: "V_i", color: "bg-acme-orange", textColor: "text-acme-orange" },
    { key: "behavioral" as const, label: "Behavioral", subscript: "V_b", color: "bg-purple-500", textColor: "text-purple-400" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Actuarial Rules Configurator</h1>
          <p className="text-sm text-acme-muted mt-1">Self-serve administration — configure scoring weights, fatal overrides, and routing logic</p>
        </div>
        <div className="flex items-center gap-2">
          {showSaveConfirm && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs text-green-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Weights saved
            </motion.div>
          )}
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors",
              isValid ? "bg-acme-orange text-white hover:bg-acme-orange/90" : "bg-acme-slate text-slate-500 cursor-not-allowed"
            )}
          >
            <Save className="w-3.5 h-3.5" /> Save Configuration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Vector Weight Sliders */}
        <div className="rounded-xl border border-acme-border bg-acme-dark overflow-hidden">
          <div className="px-5 py-4 border-b border-acme-border flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-acme-orange" />
            <h2 className="text-sm font-semibold text-white">Risk Vector Weights</h2>
            <span className={cn(
              "ml-auto text-xs font-bold px-2 py-0.5 rounded",
              isValid ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
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
                    <span className="text-sm font-medium text-slate-300">{v.label}</span>
                    <span className="text-[10px] text-acme-muted font-mono">({v.subscript})</span>
                  </div>
                  <span className={cn("text-sm font-bold tabular-nums", v.textColor)}>{localWeights[v.key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={localWeights[v.key]}
                  onChange={(e) => handleSliderChange(v.key, parseInt(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-acme-slate accent-acme-orange"
                  style={{ accentColor: v.color.includes("blue") ? "#3B82F6" : v.color.includes("amber") ? "#F59E0B" : v.color.includes("orange") ? "#E8792B" : "#A855F7" }}
                />
                <div className="flex justify-between text-[10px] text-acme-muted">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}

            {/* Validation message */}
            {!isValid && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">
                  Weights must sum to 100%. Current total: <span className="font-bold">{sum}%</span> ({sum > 100 ? `${sum - 100}% over` : `${100 - sum}% under`})
                </p>
              </motion.div>
            )}

            {/* Weight distribution visualization */}
            <div className="space-y-2">
              <p className="text-[10px] text-acme-muted uppercase tracking-wider font-semibold">Distribution Preview</p>
              <div className="h-4 rounded-full overflow-hidden flex bg-acme-slate">
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
                    <span className="text-[10px] text-slate-400">{v.label}: {localWeights[v.key]}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fatal Override Configurations */}
        <div className="rounded-xl border border-acme-border bg-acme-dark overflow-hidden">
          <div className="px-5 py-4 border-b border-acme-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-semibold text-white">Fatal Override Configurations</h2>
            </div>
            <button onClick={handleAddOverride} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-acme-slate border border-acme-border text-xs text-slate-400 hover:text-white transition-colors">
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
                  override.isActive ? "border-acme-orange/30 bg-acme-orange/5" : "border-acme-border bg-acme-navy/30"
                )}
              >
                {/* Logic builder visualization */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-acme-muted uppercase">IF</span>
                  <select
                    value={override.condition}
                    onChange={(e) => updateFatalOverride(override.id, { condition: e.target.value })}
                    className="bg-acme-slate border border-acme-border rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-acme-orange/50"
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
                    className="bg-acme-slate border border-acme-border rounded px-2 py-1 text-xs text-slate-300 w-14 focus:outline-none focus:border-acme-orange/50"
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
                    className="bg-acme-slate border border-acme-border rounded px-2 py-1 text-xs text-acme-orange font-mono w-40 focus:outline-none focus:border-acme-orange/50"
                    placeholder="Value"
                  />
                </div>

                {override.andCondition && (
                  <div className="flex items-center gap-2 flex-wrap pl-4">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">AND</span>
                    <span className="text-xs text-slate-400 bg-acme-slate px-2 py-1 rounded">{override.andCondition}</span>
                    <span className="text-xs text-slate-400">{override.andOperator}</span>
                    <span className="text-xs text-acme-orange font-mono bg-acme-slate px-2 py-1 rounded">{override.andValue}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pl-4">
                  <span className="text-[10px] font-bold text-green-400 uppercase">THEN</span>
                  <ChevronRight className="w-3 h-3 text-acme-muted" />
                  <select
                    value={override.thenAction}
                    onChange={(e) => updateFatalOverride(override.id, { thenAction: e.target.value })}
                    className="bg-acme-slate border border-acme-border rounded px-2 py-1 text-xs text-green-400 focus:outline-none focus:border-acme-orange/50"
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
                      override.isActive ? "bg-green-500/10 text-green-400" : "bg-acme-slate text-slate-500"
                    )}
                  >
                    {override.isActive ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                    {override.isActive ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => removeFatalOverride(override.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-red-400 hover:bg-red-500/10 transition-colors"
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
      <div className="rounded-xl border border-acme-border bg-acme-dark p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Publish Rules to Logic Apps Engine</h3>
            <p className="text-xs text-acme-muted mt-0.5">Deploy current configuration to production scoring engine</p>
          </div>
          <div className="flex items-center gap-4">
            {published && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Published successfully
              </motion.span>
            )}
            <button
              onClick={() => { setPublished(!published); if (!published) setTimeout(() => setPublished(false), 5000); }}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300",
                published ? "bg-green-500" : "bg-acme-slate"
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
    </div>
  );
}
