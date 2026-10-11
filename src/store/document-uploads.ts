import { create } from "zustand";
import { useClaimsStore, type Document } from "./claims-store";
import { useAssessmentRuns } from "./assessment-runs";
import { insertDocument, uploadDocumentFile } from "@/lib/supabase-api";

// Uploads run outside the case page so processing and the automatic LTC New start
// continue while the user browses other pages.

export type UploadJob =
  | { phase: "uploading"; total: number }
  | { phase: "processing"; total: number; done: number }
  | { phase: "done"; total: number; autoStarted: "new" | "delta" | null }
  | { phase: "error"; message: string };

interface DocumentUploadsState {
  jobs: Record<string, UploadJob>;
  uploadDocuments: (claimId: string, files: File[]) => Promise<void>;
  dismiss: (claimId: string) => void;
}

async function processOne(documentId: string): Promise<void> {
  const res = await fetch("/api/documents/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
}

export const useDocumentUploads = create<DocumentUploadsState>((set, get) => {
  const setJob = (claimId: string, job: UploadJob) =>
    set((state) => ({ jobs: { ...state.jobs, [claimId]: job } }));

  return {
    jobs: {},

    uploadDocuments: async (claimId, files) => {
      const current = get().jobs[claimId];
      if (current?.phase === "uploading" || current?.phase === "processing") {
        throw new Error("Documents for this claim are still being processed");
      }
      const total = files.length;
      const claims = useClaimsStore.getState();
      // Documents added after an assessment belong to the next review day.
      const day = (claims.cases.find((c) => c.id === claimId)?.assessments.length || 0) + 1;
      try {
        setJob(claimId, { phase: "uploading", total });
        const uploaded: Document[] = [];
        for (const file of files) {
          const filePath = await uploadDocumentFile(file, claimId);
          const doc: Document = {
            id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            name: file.name,
            type: "other",
            day,
            status: "pending",
            vectorAffected: "documentation",
            filePath,
          };
          await insertDocument(claimId, doc);
          uploaded.push(doc);
        }
        await claims.refreshCase(claimId);

        let done = 0;
        setJob(claimId, { phase: "processing", total, done });
        const results = await Promise.allSettled(
          uploaded.map((doc) =>
            processOne(doc.id).finally(() => {
              done += 1;
              setJob(claimId, { phase: "processing", total, done });
            })
          )
        );
        await claims.refreshCase(claimId);

        const failures = results
          .map((r, i) => (r.status === "rejected" ? `${uploaded[i].name}: ${(r.reason as Error).message}` : null))
          .filter(Boolean);
        if (failures.length) {
          throw new Error(
            `${failures.length} of ${total} document(s) could not be processed, so the AI assessment was not started. ${failures.join("; ")}`
          );
        }

        const claim = useClaimsStore.getState().cases.find((c) => c.id === claimId);
        if (!claim) throw new Error(`Claim ${claimId} could not be reloaded after processing`);
        // New claim: LTC New once every document is processed. Assessed claim: Delta review of the new documents.
        const mode =
          claim.assessments.length > 0
            ? ("delta" as const)
            : claim.documents.every((d) => d.status === "processed")
              ? ("new" as const)
              : null;
        if (mode) void useAssessmentRuns.getState().startRun(claimId, mode);
        setJob(claimId, { phase: "done", total, autoStarted: mode });
      } catch (err) {
        console.error("[Documents] Upload failed:", err);
        await claims.refreshCase(claimId).catch(() => undefined);
        setJob(claimId, { phase: "error", message: err instanceof Error ? err.message : String(err) });
      }
    },

    dismiss: (claimId) =>
      set((state) => {
        const jobs = { ...state.jobs };
        delete jobs[claimId];
        return { jobs };
      }),
  };
});
