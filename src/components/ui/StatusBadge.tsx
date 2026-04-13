"use client";

import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  auto_approved: { label: "Approved", classes: "bg-green-50 text-green-700 border-green-200" },
  in_review: { label: "In Review", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  escalated: { label: "Escalated", classes: "bg-red-50 text-red-700 border-red-200" },
  closed: { label: "Closed", classes: "bg-gray-50 text-gray-600 border-gray-200" },
  pending: { label: "Pending", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  processed: { label: "Processed", classes: "bg-green-50 text-green-700 border-green-200" },
  flagged: { label: "Flagged", classes: "bg-red-50 text-red-700 border-red-200" },
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
