import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read .env.local manually
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx > 0) {
    envVars[trimmed.substring(0, eqIdx)] = trimmed.substring(eqIdx + 1);
  }
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// For each document, generate a markdown representation from existing extracted_text, ai_findings, and json_schema
interface DocRow {
  id: string;
  name: string;
  claim_id: string;
  type: string;
  status: string;
  extracted_text: string | null;
  ai_findings: string[] | null;
  json_schema: Record<string, unknown> | null;
  flag_reason: string | null;
  page_info: string | null;
  ai_interpreted_md: string | null;
}

function generateMarkdown(doc: DocRow): string {
  const lines: string[] = [];

  // Title
  lines.push(`# ${doc.name}`);
  lines.push("");

  // Metadata table
  lines.push("| Field | Value |");
  lines.push("|-------|-------|");
  lines.push(`| **Document ID** | ${doc.id} |`);
  lines.push(`| **Claim ID** | ${doc.claim_id} |`);
  lines.push(`| **Type** | ${doc.type} |`);
  lines.push(`| **Status** | ${doc.status.toUpperCase()} |`);
  if (doc.page_info) {
    lines.push(`| **Pages** | ${doc.page_info} |`);
  }
  if (doc.flag_reason) {
    lines.push(`| **Flag Reason** | ${doc.flag_reason} |`);
  }
  lines.push("");

  // Extracted Text
  if (doc.extracted_text) {
    lines.push("## Extracted Content");
    lines.push("");
    // Format the extracted text nicely
    const text = doc.extracted_text;
    // Split by newlines and render each section
    const sections = text.split("\n");
    for (const section of sections) {
      const trimmed = section.trim();
      if (!trimmed) continue;
      // If it looks like a heading (ALL CAPS or ends with colon)
      if (/^[A-Z][A-Z\s\-—&\/()]+$/.test(trimmed) || /^[A-Z][A-Z\s\-—&\/()]+:?\s*$/.test(trimmed)) {
        lines.push(`### ${trimmed}`);
        lines.push("");
      } else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        // Metadata annotations like [HANDWRITTEN DOCUMENT — OCR Confidence: 87%]
        lines.push(`> *${trimmed}*`);
        lines.push("");
      } else if (trimmed.includes(":") && trimmed.indexOf(":") < 30) {
        // Key-value pairs
        const colonIdx = trimmed.indexOf(":");
        const key = trimmed.substring(0, colonIdx).trim();
        const val = trimmed.substring(colonIdx + 1).trim();
        lines.push(`- **${key}:** ${val}`);
      } else {
        lines.push(trimmed);
        lines.push("");
      }
    }
    lines.push("");
  }

  // AI Findings
  if (doc.ai_findings && doc.ai_findings.length > 0) {
    lines.push("## AI Analysis Findings");
    lines.push("");
    for (const finding of doc.ai_findings) {
      // Color code based on content
      if (finding.includes("CRITICAL") || finding.includes("CONTRADICTION") || finding.includes("FAILED")) {
        lines.push(`- :warning: **${finding}**`);
      } else if (finding.includes("flag") || finding.includes("red flag") || finding.includes("inconsist") || finding.includes("concern")) {
        lines.push(`- :triangular_flag_on_post: ${finding}`);
      } else {
        lines.push(`- ${finding}`);
      }
    }
    lines.push("");
  }

  // JSON Schema summary — render key fields as a structured section
  if (doc.json_schema) {
    lines.push("## Structured Data Summary");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(doc.json_schema, null, 2));
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

async function backfill() {
  console.log("Fetching all documents from Supabase...");

  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, name, claim_id, type, status, extracted_text, ai_findings, json_schema, flag_reason, page_info, ai_interpreted_md")
    .order("claim_id")
    .order("name");

  if (error) {
    console.error("Failed to fetch documents:", error.message);
    process.exit(1);
  }

  if (!docs || docs.length === 0) {
    console.log("No documents found.");
    return;
  }

  console.log(`Found ${docs.length} documents total.`);

  // Filter to non-PDF docs that don't already have markdown
  const nonPdfDocs = (docs as DocRow[]).filter(
    (d) => !d.name.toLowerCase().endsWith(".pdf")
  );

  console.log(`Found ${nonPdfDocs.length} non-PDF documents to backfill.`);

  let successCount = 0;
  let failCount = 0;

  for (const doc of nonPdfDocs) {
    try {
      const markdown = generateMarkdown(doc);

      const { error: updateError } = await supabase
        .from("documents")
        .update({ ai_interpreted_md: markdown })
        .eq("id", doc.id);

      if (updateError) {
        console.error(`  FAILED ${doc.name}: ${updateError.message}`);
        failCount++;
      } else {
        console.log(`  OK ${doc.name} (${markdown.length} chars)`);
        successCount++;
      }
    } catch (err) {
      console.error(`  ERROR ${doc.name}:`, err);
      failCount++;
    }
  }

  console.log(`\nDone! ${successCount} backfilled, ${failCount} failed.`);
}

backfill();
