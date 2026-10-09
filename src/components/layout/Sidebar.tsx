"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  SlidersHorizontal,
  BarChart3,
  Shield,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Configuration", href: "/configurator", icon: SlidersHorizontal },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2 rounded-lg bg-[#18434A] text-white shadow-lg hover:bg-[#15393F] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 z-50 h-screen w-64 border-r border-[#15393F] bg-[#18434A] flex flex-col transition-transform duration-300 ease-in-out",
          "lg:left-0 lg:translate-x-0",
          mobileOpen ? "left-0 translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-acme-orange to-amber-400">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">ACME Insurance</h1>
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
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-glow" />
          <span className="text-[10px] text-white/50">AI Engine: Online</span>
        </div>
        <p className="text-[10px] text-white/30 mt-1">v2.4.1 — EngaigeQ Claims Connected</p>
      </div>
      </aside>
    </>
  );
}
