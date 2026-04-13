"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RoutingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/configurator");
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <p className="text-sm text-gray-500">Redirecting to configuration...</p>
    </div>
  );
}
