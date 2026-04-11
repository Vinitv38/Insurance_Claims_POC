"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  auto_approved: { label: "Auto-Approved", classes: "bg-green-500/10 text-green-400 border-green-500/20" },
  in_review: { label: "In Review", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  escalated: { label: "Escalated", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  closed: { label: "Closed", classes: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  pending: { label: "Pending", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  processed: { label: "Processed", classes: "bg-green-500/10 text-green-400 border-green-500/20" },
  flagged: { label: "Flagged", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, classes: "bg-slate-500/10 text-slate-400 border-slate-500/20" };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border",
      config.classes,
      className
    )}>
      {config.label}
    </span>
  );
}
