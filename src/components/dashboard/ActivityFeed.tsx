"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FileUp, Brain, AlertTriangle, CheckCircle2, ArrowUpRight, FilePlus, Shield, type LucideIcon } from "lucide-react";
import { useClaimsStore } from "@/store/claims-store";
import { cn } from "@/lib/utils";

const MAX_EVENTS = 15;

function eventStyle(action: string): { icon: LucideIcon; color: string } {
  const a = action.toUpperCase();
  if (a.includes("AI ASSESSMENT") || a.includes("AI_SCORING")) return { icon: Brain, color: "text-acme-orange" };
  if (a.includes("UPLOAD")) return { icon: FileUp, color: "text-blue-400" };
  if (a.includes("DISCREPANCY") || a.includes("FATAL")) return { icon: AlertTriangle, color: "text-red-400" };
  if (a.includes("APPROVED") || a.includes("CLOSED")) return { icon: CheckCircle2, color: "text-green-400" };
  if (a.includes("ESCALAT") || a.includes("REASSIGN")) return { icon: ArrowUpRight, color: "text-amber-400" };
  if (a.includes("CREATED")) return { icon: FilePlus, color: "text-teal-500" };
  return { icon: Shield, color: "text-gray-400" };
}

function timeAgo(timestamp: string): string {
  const minutes = Math.round((Date.now() - new Date(timestamp).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function actionLabel(action: string): string {
  return action.includes("_") ? action.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : action;
}

export default function ActivityFeed() {
  const router = useRouter();
  const cases = useClaimsStore((s) => s.cases);
  const events = cases
    .flatMap((c) => c.auditHistory.map((entry) => ({ ...entry, claimId: c.id, claimantName: c.claimantName })))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, MAX_EVENTS);

  return (
    <div className="rounded-xl border border-acme-border bg-white overflow-hidden">
      <div className="px-5 py-4 border-b border-acme-border">
        <h3 className="text-sm font-semibold text-acme-teal">Recent Activity</h3>
        <p className="text-xs text-gray-500 mt-0.5">Latest audit events across all claims</p>
      </div>
      <div className="divide-y divide-acme-border/50 max-h-[400px] overflow-y-auto">
        {events.length === 0 && <p className="px-5 py-6 text-xs text-gray-500">No activity recorded yet.</p>}
        {events.map((event, i) => {
          const { icon: Icon, color } = eventStyle(event.action);
          return (
            <motion.button
              key={`${event.claimId}-${event.timestamp}-${i}`}
              type="button"
              onClick={() => router.push(`/case/${event.claimId}`)}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="w-full text-left px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
            >
              <div className={cn("mt-0.5 flex-shrink-0", color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold text-gray-900">{actionLabel(event.action)}</span>
                  <span className="text-gray-400"> · </span>
                  <span className="font-mono text-acme-orange">{event.claimId}</span> {event.claimantName}
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{event.detail}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {timeAgo(event.timestamp)}
                  {event.user && ` · ${event.user}`}
                  {event.scoreChange && ` · score ${event.scoreChange.from} → ${event.scoreChange.to}`}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
