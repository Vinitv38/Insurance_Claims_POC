const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_MAX_WAIT_MS = 180000;
const DEFAULT_REQUEST_TIMEOUT_MS = 30000;

export type ExecutionStatus = "pending" | "running" | "completed" | "failed";

export interface ExecutionNode {
  name: string;
  response: unknown;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  nodes: ExecutionNode[];
  error?: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured. Set it in .env.local`);
  }
  return value;
}

export function getPollingConfig() {
  return {
    pollIntervalMs: Number(process.env.AGENT_WORKFLOW_POLL_INTERVAL_MS) || DEFAULT_POLL_INTERVAL_MS,
    maxWaitMs: Number(process.env.AGENT_WORKFLOW_MAX_WAIT_MS) || DEFAULT_MAX_WAIT_MS,
  };
}

async function studioFetch(url: string, init: RequestInit): Promise<Record<string, unknown>> {
  const timeoutMs = Number(process.env.AGENT_WORKFLOW_REQUEST_TIMEOUT_MS) || DEFAULT_REQUEST_TIMEOUT_MS;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireEnv("AGENTIC_STUDIO_PAT")}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Agentic Studio returned HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Agentic Studio returned a non-JSON response: ${text.slice(0, 500)}`);
  }
}

export async function triggerWorkflow(workflowUrlEnv: string, message: Record<string, unknown>): Promise<string> {
  const data = await studioFetch(requireEnv(workflowUrlEnv), {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  const executionId = data.execution_id;
  if (typeof executionId !== "string" || !executionId) {
    throw new Error(`Agentic Studio trigger response has no execution_id: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return executionId;
}

export async function getExecution(executionId: string): Promise<ExecutionResult> {
  const template = requireEnv("AGENT_WORKFLOW_STATUS_URL");
  const url = template.includes("{executionId}")
    ? template.replace("{executionId}", encodeURIComponent(executionId))
    : `${template.replace(/\/$/, "")}/${encodeURIComponent(executionId)}`;
  const data = await studioFetch(url, { method: "GET" });

  const rawStatus = String(data.status || "").toLowerCase();
  const status: ExecutionStatus =
    rawStatus === "completed" || rawStatus === "failed" || rawStatus === "running" ? rawStatus : "pending";

  const output = (data.output || {}) as { nodes?: ExecutionNode[] };
  const error = typeof data.error === "string" ? data.error : data.error ? JSON.stringify(data.error) : undefined;
  return { status, nodes: Array.isArray(output.nodes) ? output.nodes : [], error };
}

export function nodeText(response: unknown): string {
  if (response == null) return "";
  if (typeof response === "string") return response;
  if (typeof response === "object") {
    const obj = response as Record<string, unknown>;
    for (const key of ["output", "result", "content", "text", "response", "message"]) {
      if (typeof obj[key] === "string") return obj[key] as string;
    }
    return JSON.stringify(response);
  }
  return String(response);
}
