import * as https from "https";
import * as tls from "tls";
import { GODADDY_TLS_ROOT_R1 } from "./studio-ca";

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

const STUDIO_CA = tls.rootCertificates.concat(GODADDY_TLS_ROOT_R1);

interface StudioRequest {
  method: "GET" | "POST";
  body?: string;
}

function studioRequest(url: string, { method, body }: StudioRequest, timeoutMs: number): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string | number> = {
      Authorization: `Bearer ${requireEnv("AGENTIC_STUDIO_PAT")}`,
      "Content-Type": "application/json",
    };
    if (body) headers["Content-Length"] = Buffer.byteLength(body);
    const req = https.request(url, { method, headers, ca: STUDIO_CA }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        clearTimeout(timer);
        resolve({ status: res.statusCode ?? 0, text: Buffer.concat(chunks).toString("utf8") });
      });
      res.on("error", reject);
    });
    const timer = setTimeout(
      () => req.destroy(new Error(`Agentic Studio did not respond within ${timeoutMs} ms`)),
      timeoutMs
    );
    req.on("error", (err: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(new Error(`Could not reach Agentic Studio at ${new URL(url).host}: ${err.code ? `${err.code} ` : ""}${err.message}`));
    });
    if (body) req.write(body);
    req.end();
  });
}

async function studioFetch(url: string, init: StudioRequest): Promise<Record<string, unknown>> {
  const timeoutMs = Number(process.env.AGENT_WORKFLOW_REQUEST_TIMEOUT_MS) || DEFAULT_REQUEST_TIMEOUT_MS;
  const { status, text } = await studioRequest(url, init, timeoutMs);
  if (status < 200 || status >= 300) {
    throw new Error(`Agentic Studio returned HTTP ${status}: ${text.slice(0, 500)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Agentic Studio returned a non-JSON response: ${text.slice(0, 500)}`);
  }
}

// `message` must be a string, so structured input is sent as JSON text. `async_mode` makes Studio return the
// execution_id immediately; without it the call blocks until the workflow finishes and the gateway times out.
export async function triggerWorkflow(workflowUrlEnv: string, message: Record<string, unknown>): Promise<string> {
  const data = await studioFetch(requireEnv(workflowUrlEnv), {
    method: "POST",
    body: JSON.stringify({
      message: JSON.stringify(message),
      async_mode: true,
      timeout: Math.round(getPollingConfig().maxWaitMs / 1000),
    }),
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
  // Studio returns each node as { node, node_id, response }; the guide documents { name, response }.
  const nodes = Array.isArray(output.nodes)
    ? output.nodes.map((n) => {
        const raw = n as unknown as Record<string, unknown>;
        return { name: String(raw.name ?? raw.node ?? raw.node_id ?? ""), response: raw.response };
      })
    : [];
  return { status, nodes, error };
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
