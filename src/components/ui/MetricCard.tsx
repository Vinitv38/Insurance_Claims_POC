"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  color?: "orange" | "green" | "red" | "blue" | "amber" | "teal" | "purple";
  className?: string;
}

const colorMap = {
  orange: { bg: "bg-orange-50", border: "border-orange-200", text: "text-acme-orange", icon: "text-acme-orange" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", icon: "text-green-600" },
  red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", icon: "text-red-600" },
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", icon: "text-blue-600" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-600", icon: "text-amber-600" },
  teal: { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", icon: "text-teal-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-600", icon: "text-purple-600" },
};

export default function MetricCard({ title, value, subtitle, icon: Icon, trend, color = "orange", className }: MetricCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white p-3 lg:p-4 xl:p-5",
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[10px] lg:text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
          <p className={cn("text-2xl lg:text-3xl font-bold mt-1", colors.text)}>{value}</p>
          {subtitle && <p className="text-[10px] lg:text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={cn("text-xs font-medium mt-2", trend.positive ? "text-green-600" : "text-red-600")}>
              {trend.positive ? "+" : ""}{trend.value}
            </p>
          )}
        </div>
        <div className={cn("flex items-center justify-center w-8 h-8 lg:w-10 lg:h-10 rounded-lg", colors.bg)}>
          <Icon className={cn("w-4 h-4 lg:w-5 lg:h-5", colors.icon)} />
        </div>
      </div>
      <div className={cn("absolute bottom-0 left-0 right-0 h-0.5", colors.bg)} />
    </motion.div>
  );
}
