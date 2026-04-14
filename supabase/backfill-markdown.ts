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

interface DocRow {
  id: string;
  name: string;
  extracted_text: string | null;
}

async function backfill() {
  console.log("Fetching all non-PDF documents from Supabase...");

  const { data: docs, error } = await supabase
    .from("documents")
    .select("id, name, extracted_text")
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

  // Filter to non-PDF docs only
  const nonPdfDocs = (docs as DocRow[]).filter(
    (d) => !d.name.toLowerCase().endsWith(".pdf")
  );

  console.log(`Found ${nonPdfDocs.length} non-PDF documents to backfill.`);

  let successCount = 0;
  let failCount = 0;

  for (const doc of nonPdfDocs) {
    try {
      // Just use the extracted_text as-is for the markdown
      const markdown = doc.extracted_text || "";

      if (!markdown) {
        console.log(`  SKIP ${doc.name} (no extracted_text)`);
        continue;
      }

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
