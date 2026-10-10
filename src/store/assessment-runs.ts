import { create } from "zustand";
import { useClaimsStore } from "./claims-store";

// Tracks LTC New runs outside the case page so polling survives navigation, and in
// localStorage so a running execution is resumed after a page refresh.

export type AssessmentRun =
  | { phase: "starting" }
  | { phase: "running"; executionId: string; startedAt: number }
  | { phase: "done"; assessmentId: string; summary: string }
  | { phase: "error"; message: string };

interface PendingRun {
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
  startRun: (claimId: string) => Promise<void>;
  resumeRuns: () => void;
  dismiss: (claimId: string) => void;
}

export const useAssessmentRuns = create<AssessmentRunsState>((set, get) => {
  const setRun = (claimId: string, run: AssessmentRun) =>
    set((state) => ({ runs: { ...state.runs, [claimId]: run } }));

  async function poll(claimId: string, pending: PendingRun) {
    if (activeLoops.has(claimId)) return;
    activeLoops.add(claimId);
    setRun(claimId, { phase: "running", executionId: pending.executionId, startedAt: pending.startedAt });
    try {
      // Check at least once, so a run resumed after the time limit still saves its result.
      for (let first = true; first || Date.now() - pending.startedAt < pending.maxWaitMs; first = false) {
        if (!first || Date.now() - pending.startedAt < pending.maxWaitMs) await sleep(pending.pollIntervalMs);
        const res = await fetch(
          `/api/assessments/status/${encodeURIComponent(pending.executionId)}?claimId=${encodeURIComponent(claimId)}`
        );
        const status = await res.json();
        if (!res.ok) throw new Error(status.error || `Status check failed (HTTP ${res.status})`);
        if (status.status === "completed") {
          writePending(claimId, null);
          await useClaimsStore.getState().refreshCase(claimId);
          setRun(claimId, {
            phase: "done",
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
      console.error("[LTC New] Assessment failed:", err);
      writePending(claimId, null);
      setRun(claimId, { phase: "error", message: err instanceof Error ? err.message : String(err) });
    } finally {
      activeLoops.delete(claimId);
    }
  }

  return {
    runs: {},

    startRun: async (claimId) => {
      const current = get().runs[claimId];
      if (current?.phase === "starting" || current?.phase === "running" || readPending()[claimId]) return;
      setRun(claimId, { phase: "starting" });
      try {
        const res = await fetch("/api/assessments/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ claimId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Trigger failed (HTTP ${res.status})`);
        const pending: PendingRun = {
          executionId: data.executionId,
          startedAt: Date.now(),
          pollIntervalMs: data.pollIntervalMs,
          maxWaitMs: data.maxWaitMs,
        };
        writePending(claimId, pending);
        void poll(claimId, pending);
      } catch (err) {
        console.error("[LTC New] Trigger failed:", err);
        setRun(claimId, { phase: "error", message: err instanceof Error ? err.message : String(err) });
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
