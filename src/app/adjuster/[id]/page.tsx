"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdjusterRedirect() {
  const params = useParams();
  const router = useRouter();
  const caseId = params.id as string;

  useEffect(() => {
    router.replace(`/case/${caseId}`);
  }, [caseId, router]);

  return (
    <div className="p-6 flex items-center justify-center min-h-screen">
      <p className="text-sm text-gray-500">Redirecting to case detail...</p>
    </div>
  );
}
