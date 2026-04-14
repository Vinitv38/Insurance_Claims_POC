"use client";

import { motion } from "framer-motion";
import { FileUp, Brain, AlertTriangle, CheckCircle2, ArrowUpRight, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  { id: 1, icon: Brain, color: "text-acme-orange", time: "2 min ago", text: "AI Engine recalculated score for claim-002 — 98/100 (Critical)", type: "score" },
  { id: 2, icon: FileUp, color: "text-blue-400", time: "15 min ago", text: "Genesys_Transcript_042026.txt uploaded for claim-002", type: "upload" },
  { id: 3, icon: AlertTriangle, color: "text-red-400", time: "32 min ago", text: "Fatal Override triggered: DIRECT_CONTRADICTION on claim-002", type: "alert" },
  { id: 4, icon: CheckCircle2, color: "text-green-400", time: "1 hr ago", text: "claim-001 approved — human-based review completed successfully", type: "success" },
  { id: 5, icon: ArrowUpRight, color: "text-amber-400", time: "2 hr ago", text: "claim-002 escalated to Tier 2 Clinical (Dr. Karen Volkov)", type: "escalation" },
  { id: 6, icon: FileUp, color: "text-blue-400", time: "3 hr ago", text: "RightFax_CarePlan_041826.tiff processed for claim-002 — OCR confidence 62%", type: "upload" },
  { id: 7, icon: Shield, color: "text-purple-400", time: "4 hr ago", text: "Rules engine v2.4.1 deployed — 3 fatal overrides active", type: "system" },
  { id: 8, icon: Brain, color: "text-acme-orange", time: "5 hr ago", text: "AI detected missing pages in Epic_Discharge_Summary for claim-002 (1 of 4)", type: "score" },
];

export default function ActivityFeed() {
  return (
    <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-acme-border">
        <h3 className="text-sm font-semibold text-acme-teal">Recent Activity</h3>
        <p className="text-xs text-gray-500 mt-0.5">System-wide event log</p>
      </div>
      <div className="divide-y divide-acme-border/50 max-h-[400px] overflow-y-auto">
        {activities.map((activity, i) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
          >
            <div className={cn("mt-0.5 flex-shrink-0", activity.color)}>
              <activity.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 leading-relaxed">{activity.text}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{activity.time}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
