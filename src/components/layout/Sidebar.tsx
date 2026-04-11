"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileSearch,
  Brain,
  SlidersHorizontal,
  Users,
  BarChart3,
  Shield,
  Activity,
} from "lucide-react";

const navigation = [
  { name: "Command Center", href: "/", icon: LayoutDashboard },
  { name: "Configuration", href: "/configurator", icon: SlidersHorizontal },
  { name: "Skill Routing", href: "/routing", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-[#15393F] bg-[#18434A] flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-acme-orange to-amber-400">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Acme Insurance</h1>
          <p className="text-[10px] text-white/50 font-medium tracking-widest uppercase">Claims AI Engine</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-white/40 tracking-widest uppercase">Navigation</p>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/10 text-acme-orange border border-acme-orange/30"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <item.icon className={cn("w-4 h-4", isActive ? "text-acme-orange" : "")} />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="px-3 mb-2 text-[10px] font-semibold text-white/40 tracking-widest uppercase">Active Cases</p>
          <Link
            href="/case/case-001"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              pathname === "/case/case-001"
                ? "bg-green-500/15 text-green-300 border border-green-400/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <FileSearch className="w-4 h-4" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Pendelton (Happy Path)</p>
              <p className="text-[10px] text-white/40">Score: 15 — Auto-Approved</p>
            </div>
          </Link>
          <Link
            href="/adjuster/case-001"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              pathname === "/adjuster/case-001"
                ? "bg-blue-500/15 text-blue-300 border border-blue-400/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Brain className="w-4 h-4" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Pendelton Decision</p>
              <p className="text-[10px] text-white/40">Source vs. Summary</p>
            </div>
          </Link>
          <Link
            href="/case/case-002"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
              pathname === "/case/case-002"
                ? "bg-red-500/15 text-red-300 border border-red-400/20"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Activity className="w-4 h-4" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">Hargrove (Edge Case)</p>
              <p className="text-[10px] text-white/40">Score: 98 — Escalated</p>
            </div>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
          <span className="text-[10px] text-white/50">AI Engine: Online</span>
        </div>
        <p className="text-[10px] text-white/30 mt-1">v2.4.1 — Logic Apps Connected</p>
      </div>
    </aside>
  );
}
