"use client";

import { useEffect } from "react";
import { useClaimsStore } from "@/store/claims-store";

export function SupabaseInitializer({ children }: { children: React.ReactNode }) {
  const initializeFromSupabase = useClaimsStore((s) => s.initializeFromSupabase);

  useEffect(() => {
    initializeFromSupabase();
  }, [initializeFromSupabase]);

  return <>{children}</>;
}
