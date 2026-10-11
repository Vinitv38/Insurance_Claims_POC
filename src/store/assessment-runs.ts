import { create } from "zustand";
import { useClaimsStore } from "./claims-store";

export type WorkflowMode = "new" | "delta";

// Tracks LTC New runs outside the case page so polling survives navigation, and in
// localStorage so a running execution is resumed after a page refresh.

export type AssessmentRun =
  | { phase: "starting"; mode: WorkflowMode }
  | { phase: "running"; mode: WorkflowMode; executionId: string; startedAt: number }
  | { phase: "done"; mode: WorkflowMode; assessmentId: string; summary: string }
  | { phase: "error"; mode: WorkflowMode; message: string };

interface PendingRun {
  mode?: WorkflowMode;
  executionId: string;
  startedAt: number;
  pollIntervalMs: number;
  maxWaitMs: number;
}

const STORAGE_KEY = "ltc-new-running-assessments";
const activeLoops = new Set<string>();

function readPending(): Record<string, PendingRun> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writePending(claimId: string, run: PendingRun | null) {
  const all = readPending();
  if (run) all[claimId] = run;
  else delete all[claimId];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface AssessmentRunsState {
  runs: Record<string, AssessmentRun>;
  startRun: (claimId: string, mode?: WorkflowMode) => Promise<void>;
  resumeRuns: () => void;
  dismiss: (claimId: string) => void;
}

export const useAssessmentRuns = create<AssessmentRunsState>((set, get) => {
  const setRun = (claimId: string, run: AssessmentRun) =>
    set((state) => ({ runs: { ...state.runs, [claimId]: run } }));

  async function poll(claimId: string, pending: PendingRun) {
    if (activeLoops.has(claimId)) return;
    activeLoops.add(claimId);
    const mode = pending.mode || "new";
    setRun(claimId, { phase: "running", mode, executionId: pending.executionId, startedAt: pending.startedAt });
    try {
      // Check at least once, so a run resumed after the time limit still saves its result.
      for (let first = true; first || Date.now() - pending.startedAt < pending.maxWaitMs; first = false) {
        if (!first || Date.now() - pending.startedAt < pending.maxWaitMs) await sleep(pending.pollIntervalMs);
        const res = await fetch(
          `/api/assessments/status/${encodeURIComponent(pending.executionId)}?claimId=${encodeURIComponent(claimId)}&mode=${mode}`
        );
        const status = await res.json();
        if (!res.ok) throw new Error(status.error || `Status check failed (HTTP ${res.status})`);
        if (status.status === "completed") {
          writePending(claimId, null);
          await useClaimsStore.getState().refreshCase(claimId);
          setRun(claimId, {
            phase: "done",
            mode,
            assessmentId: status.assessmentId,
            summary: `${status.recommendation} — score ${status.complexityScore}, routed to ${status.assignedTo} (${status.assignedGroup})`,
          });
          return;
        }
      }
      throw new Error(
        `Workflow did not finish within ${Math.round(pending.maxWaitMs / 1000)} seconds (execution ${pending.executionId})`
      );
    } catch (err) {
      console.error(`[${mode}] Assessment failed:`, err);
      writePending(claimId, null);
      setRun(claimId, { phase: "error", mode, message: err instanceof Error ? err.message : String(err) });
    } finally {
      activeLoops.delete(claimId);
    }
  }

  return {
    runs: {},

    startRun: async (claimId, mode = "new") => {
      const current = get().runs[claimId];
      if (current?.phase === "starting" || current?.phase === "running" || readPending()[claimId]) return;
      setRun(claimId, { phase: "starting", mode });
      try {
        const res = await fetch("/api/assessments/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimId, mode }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Trigger failed (HTTP ${res.status})`);
        const pending: PendingRun = {
          mode,
          executionId: data.executionId,
          startedAt: Date.now(),
          pollIntervalMs: data.pollIntervalMs,
          maxWaitMs: data.maxWaitMs,
        };
        writePending(claimId, pending);
        void poll(claimId, pending);
      } catch (err) {
        console.error(`[${mode}] Trigger failed:`, err);
        setRun(claimId, { phase: "error", mode, message: err instanceof Error ? err.message : String(err) });
      }
    },

    resumeRuns: () => {
      for (const [claimId, pending] of Object.entries(readPending())) {
        void poll(claimId, pending);
      }
    },

    dismiss: (claimId) =>
      set((state) => {
        const runs = { ...state.runs };
        delete runs[claimId];
        return { runs };
      }),
  };
});
