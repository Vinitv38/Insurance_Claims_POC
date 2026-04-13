"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RiskThermometerProps {
  label: string;
  value: number;
  subscript: string;
  color?: string;
}

function getBarColor(value: number): string {
  if (value <= 30) return "bg-green-500";
  if (value <= 60) return "bg-amber-500";
  if (value <= 80) return "bg-acme-orange";
  return "bg-red-500";
}

export default function RiskThermometer({ label, value, subscript }: RiskThermometerProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">{label}</span>
          <span className="text-[10px] text-gray-500 font-mono">({subscript})</span>
        </div>
        <span className={cn(
          "text-xs font-bold tabular-nums",
          value <= 30 ? "text-green-600" : value <= 60 ? "text-amber-600" : value <= 80 ? "text-acme-orange" : "text-red-600"
        )}>
          {value}%
        </span>
      </div>
      <div className="thermometer-track">
        <motion.div
          className={cn("thermometer-fill", getBarColor(value))}
          initial={{ width: "0%" }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{ boxShadow: value > 60 ? `0 0 10px ${value > 80 ? "rgba(239,68,68,0.4)" : "rgba(232,121,43,0.4)"}` : "none" }}
        />
      </div>
    </div>
  );
}
