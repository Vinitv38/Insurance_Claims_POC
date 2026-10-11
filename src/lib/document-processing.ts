import DocumentIntelligence, { isUnexpected } from "@azure-rest/ai-document-intelligence";
import { supabase } from "./supabase";
import { PROCESSING_FAILED_PREFIX } from "./document-processing-status";

// Files the agents can read as-is; Azure Document Intelligence rejects these types.
const TEXT_EXTENSIONS = ["txt", "csv", "json", "md"];
// Formats supported by Azure Document Intelligence prebuilt-layout.
const AZURE_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "bmp", "tif", "tiff", "heif", "docx", "xlsx", "pptx", "html"];

const AZURE_POLL_INTERVAL_MS = 2000;
const AZURE_MAX_POLLS = 90;

function extensionOf(name: string): string {
  return name.split(".").pop()?.toLowerCase() || "";
}

async function analyzeWithAzure(file: ArrayBuffer): Promise<{ markdown: string; json: Record<string, unknown> }> {
  const endpoint = process.env.DI_ENDPOINT;
  const apiKey = process.env.DI_API_KEY;
  if (!endpoint || !apiKey) {
    throw new Error("Azure Document Intelligence is not configured. Set DI_ENDPOINT and DI_API_KEY in .env.local");
  }

  const client = DocumentIntelligence(endpoint, { key: apiKey });
  const initial = await client.path("/documentModels/{modelId}:analyze", "prebuilt-layout").post({
    contentType: "application/json",
    body: { base64Source: Buffer.from(file).toString("base64") },
    queryParameters: { outputContentFormat: "markdown" },
  });
  if (isUnexpected(initial)) {
    throw new Error(`Azure Document Intelligence rejected the file: ${initial.body?.error?.message || initial.status}`);
  }

  const operationLocation = initial.headers["operation-location"];
  if (!operationLocation) throw new Error("Azure Document Intelligence returned no operation-location header");

  for (let i = 0; i < AZURE_MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, AZURE_POLL_INTERVAL_MS));
    const res = await fetch(operationLocation, { headers: { "Ocp-Apim-Subscription-Key": apiKey } });
    const body = await res.json();
    if (!res.ok) throw new Error(`Azure status check failed (HTTP ${res.status}): ${body?.error?.message || ""}`);
    if (body.status === "succeeded") {
      return { markdown: body.analyzeResult?.content || "", json: body.analyzeResult || {} };
    }
    if (body.status === "failed") {
      throw new Error(`Azure analysis failed: ${body.error?.message || JSON.stringify(body.error)}`);
    }
  }
  throw new Error(`Azure analysis did not finish within ${(AZURE_POLL_INTERVAL_MS * AZURE_MAX_POLLS) / 1000} seconds`);
}

async function extractText(name: string, file: ArrayBuffer) {
  const ext = extensionOf(name);
  if (TEXT_EXTENSIONS.includes(ext)) {
    return { markdown: new TextDecoder("utf-8").decode(file), json: null, method: "text" as const };
  }
  if (AZURE_EXTENSIONS.includes(ext)) {
    return { ...(await analyzeWithAzure(file)), method: "azure" as const };
  }
  throw new Error(
    `Unsupported file type ".${ext}". Supported: ${[...AZURE_EXTENSIONS, ...TEXT_EXTENSIONS].join(", ")}`
  );
}

/**
 * Reads a stored document, extracts its text (Azure for PDFs/images/Office, direct read for text files),
 * and saves it to `ai_interpreted_md`. Marks the document processed, or flagged with the failure reason.
 */
export async function processDocument(documentId: string): Promise<{ method: "text" | "azure"; characters: number }> {
  const { data: doc, error } = await supabase
    .from("documents")
    .select("id, name, file_path")
    .eq("id", documentId)
    .single();
  if (error || !doc) throw new Error(`Document ${documentId} not found: ${error?.message || "no row"}`);

  try {
    if (!doc.file_path) throw new Error("Document has no stored file");
    const fileRes = await fetch(doc.file_path);
    if (!fileRes.ok) throw new Error(`Could not download the file from Supabase Storage (HTTP ${fileRes.status})`);
    const { markdown, json, method } = await extractText(doc.name, await fileRes.arrayBuffer());
    if (!markdown.trim()) throw new Error("No text could be extracted from the file");

    const { error: updateError } = await supabase
      .from("documents")
      .update({ ai_interpreted_md: markdown, json_schema: json, status: "processed", flag_reason: null })
      .eq("id", documentId);
    if (updateError) throw new Error(`Could not save the extracted text: ${updateError.message}`);
    return { method, characters: markdown.length };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    const { error: flagError } = await supabase
      .from("documents")
      .update({ status: "flagged", flag_reason: `${PROCESSING_FAILED_PREFIX} ${reason}` })
      .eq("id", documentId);
    if (flagError) throw new Error(`${reason} (and the failure could not be recorded: ${flagError.message})`);
    throw new Error(reason);
  }
}
