import { create } from "zustand";
import { toast } from "sonner";
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

const docCount = (n: number) => `${n} document${n === 1 ? "" : "s"}`;

// Toasts carry only business-level text; technical details stay in the console.
function notifyUpload(claimId: string, job: UploadJob, failedNames: string[] = []) {
  const id = `upload-${claimId}`;
  const ref = claimId.toUpperCase();
  if (job.phase === "uploading") {
    toast.loading(`Uploading ${docCount(job.total)}`, { id, description: ref });
  } else if (job.phase === "processing") {
    toast.loading(`Reading documents — ${job.done} of ${job.total}`, { id, description: ref });
  } else if (job.phase === "done") {
    const next =
      job.autoStarted === "new"
        ? "AI assessment started."
        : job.autoStarted === "delta"
          ? "AI review of the new documents started."
          : "AI assessment not started: some documents are still pending.";
    toast.success(`${docCount(job.total)} ready`, { id, description: `${ref} · ${next}`, duration: 6000 });
  } else {
    toast.error(
      failedNames.length ? `${docCount(failedNames.length)} could not be read` : "Document upload failed",
      {
        id,
        description: failedNames.length
          ? `${ref} · ${failedNames.join(", ")}. The AI assessment was not started.`
          : `${ref} · Please try again.`,
        duration: 10000,
      }
    );
  }
}

export const useDocumentUploads = create<DocumentUploadsState>((set, get) => {
  const setJob = (claimId: string, job: UploadJob, failedNames?: string[]) => {
    set((state) => ({ jobs: { ...state.jobs, [claimId]: job } }));
    notifyUpload(claimId, job, failedNames);
  };

  return {
    jobs: {},

    uploadDocuments: async (claimId, files) => {
      const current = get().jobs[claimId];
      if (current?.phase === "uploading" || current?.phase === "processing") {
        toast.info("Documents for this claim are still being read", { description: claimId.toUpperCase() });
        return;
      }
      const total = files.length;
      const claims = useClaimsStore.getState();
      // Documents added after an assessment belong to the next review day.
      const day = (claims.cases.find((c) => c.id === claimId)?.assessments.length || 0) + 1;
      let failedNames: string[] = [];
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
        failedNames = results.flatMap((r, i) => (r.status === "rejected" ? [uploaded[i].name] : []));
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
        setJob(claimId, { phase: "error", message: err instanceof Error ? err.message : String(err) }, failedNames);
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
