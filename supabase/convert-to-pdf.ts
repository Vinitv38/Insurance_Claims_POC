/**
 * Convert JSON/CSV documents to PDF format.
 * Downloads the original files from Supabase Storage, generates PDFs using pdfkit,
 * uploads the PDFs back to Supabase Storage, and updates the DB records.
 *
 * Files to convert:
 * - doc-p8: PBM_Surescripts_Payload_Q1.json  -> PBM_Surescripts_Payload_Q1.pdf
 * - doc-p9: VNA_Field_Data_Export_v2.csv      -> VNA_Field_Data_Export_v2.pdf
 * - doc-h8: PBM_Surescripts_Payload_Q3.csv   -> PBM_Surescripts_Payload_Q3.pdf
 * - doc-h9: Provider_Directory_Export.json     -> Provider_Directory_Export.pdf
 *
 * Run with: npx tsx supabase/convert-to-pdf.ts
 */

import { createClient } from "@supabase/supabase-js";
import PDFDocument from "pdfkit";
import * as fs from "fs";
import * as path from "path";

// Load env from .env.local
const envPath = path.resolve(__dirname, "../.env.local");
const envContent = fs.readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TMP_DIR = "/tmp/pdf_conversions";

interface DocToConvert {
  docId: string;
  claimId: string;
  originalName: string;
  originalStoragePath: string;
  pdfName: string;
  pdfStoragePath: string;
  title: string;
}

const docsToConvert: DocToConvert[] = [
  {
    docId: "doc-p8",
    claimId: "claim-001",
    originalName: "PBM_Surescripts_Payload_Q1.json",
    originalStoragePath: "claim-001/PBM_Surescripts_Payload_Q1.json",
    pdfName: "PBM_Surescripts_Payload_Q1.pdf",
    pdfStoragePath: "claim-001/PBM_Surescripts_Payload_Q1.pdf",
    title: "Surescripts Medication History — Arthur Pendelton",
  },
  {
    docId: "doc-p9",
    claimId: "claim-001",
    originalName: "VNA_Field_Data_Export_v2.csv",
    originalStoragePath: "claim-001/VNA_Field_Data_Export_v2.csv",
    pdfName: "VNA_Field_Data_Export_v2.pdf",
    pdfStoragePath: "claim-001/VNA_Field_Data_Export_v2.pdf",
    title: "VNA Home Health Field Data Export v2 — Arthur Pendelton",
  },
  {
    docId: "doc-h8",
    claimId: "claim-002",
    originalName: "PBM_Surescripts_Payload_Q3.csv",
    originalStoragePath: "claim-002/PBM_Surescripts_Payload_Q3.csv",
    pdfName: "PBM_Surescripts_Payload_Q3.pdf",
    pdfStoragePath: "claim-002/PBM_Surescripts_Payload_Q3.pdf",
    title: "Surescripts Medication History — Robert Hargrove",
  },
  {
    docId: "doc-h9",
    claimId: "claim-002",
    originalName: "Provider_Directory_Export.json",
    originalStoragePath: "claim-002/Provider_Directory_Export.json",
    pdfName: "Provider_Directory_Export.pdf",
    pdfStoragePath: "claim-002/Provider_Directory_Export.pdf",
    title: "In-Network Provider Directory Export — Robert Hargrove",
  },
];

async function downloadFromSupabase(storagePath: string, localPath: string): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from("documents")
    .download(storagePath);

  if (error) {
    console.error(`  [FAIL] Download ${storagePath}: ${error.message}`);
    return false;
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  fs.writeFileSync(localPath, buffer);
  return true;
}

function formatJsonForPdf(content: string): string {
  try {
    const parsed = JSON.parse(content);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
}

function formatCsvForPdf(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.trim().split("\n");
  const headers = lines[0]?.split(",").map((h) => h.trim().replace(/^"|"$/g, "")) || [];
  const rows = lines.slice(1).map((line) =>
    line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""))
  );
  return { headers, rows };
}

async function generatePdf(
  doc: DocToConvert,
  originalContent: string,
  outputPath: string,
  isJson: boolean
): Promise<void> {
  return new Promise((resolve, reject) => {
    const pdfDoc = new PDFDocument({
      size: "A4",
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      bufferPages: true,
    });

    const stream = fs.createWriteStream(outputPath);
    pdfDoc.pipe(stream);

    // Header bar
    pdfDoc
      .rect(0, 0, 595.28, 70)
      .fill("#1a3a4a");

    pdfDoc
      .fontSize(16)
      .fill("#ffffff")
      .text("ACME INSURANCE", 50, 20, { align: "left" });

    pdfDoc
      .fontSize(9)
      .fill("#e8853d")
      .text("EngaigeQ Claims Connected", 50, 42, { align: "left" });

    // Document title
    pdfDoc
      .moveDown(2)
      .fontSize(14)
      .fill("#1a3a4a")
      .text(doc.title, 50, 90);

    // Metadata line
    pdfDoc
      .moveDown(0.5)
      .fontSize(8)
      .fill("#888888")
      .text(`Source: ${doc.originalName}  |  Converted to PDF  |  Claim: ${doc.claimId.toUpperCase()}`, 50);

    // Separator
    const sepY = pdfDoc.y + 10;
    pdfDoc
      .moveTo(50, sepY)
      .lineTo(545, sepY)
      .strokeColor("#e0e0e0")
      .stroke();

    pdfDoc.y = sepY + 15;

    if (isJson) {
      // Render JSON content
      const formatted = formatJsonForPdf(originalContent);
      pdfDoc
        .fontSize(9)
        .fill("#333333")
        .font("Courier")
        .text(formatted, 50, pdfDoc.y, {
          width: 495,
          lineGap: 2,
        });
    } else {
      // Render CSV as a table
      const { headers, rows } = formatCsvForPdf(originalContent);
      const colCount = headers.length;
      const tableWidth = 495;
      const colWidth = Math.min(tableWidth / Math.max(colCount, 1), 160);
      const startX = 50;

      // Table header
      let currentY = pdfDoc.y;
      pdfDoc
        .rect(startX, currentY, Math.min(colWidth * colCount, tableWidth), 20)
        .fill("#1a3a4a");

      headers.forEach((h, i) => {
        pdfDoc
          .fontSize(8)
          .fill("#ffffff")
          .font("Helvetica-Bold")
          .text(h, startX + i * colWidth + 4, currentY + 5, {
            width: colWidth - 8,
            height: 14,
            ellipsis: true,
          });
      });

      currentY += 20;

      // Table rows
      rows.forEach((row, rowIdx) => {
        if (currentY > 750) {
          pdfDoc.addPage();
          currentY = 50;
        }

        const bgColor = rowIdx % 2 === 0 ? "#f8f8f8" : "#ffffff";
        pdfDoc
          .rect(startX, currentY, Math.min(colWidth * colCount, tableWidth), 18)
          .fill(bgColor);

        row.forEach((cell, i) => {
          if (i < colCount) {
            pdfDoc
              .fontSize(7)
              .fill("#333333")
              .font("Courier")
              .text(cell, startX + i * colWidth + 4, currentY + 4, {
                width: colWidth - 8,
                height: 12,
                ellipsis: true,
              });
          }
        });

        currentY += 18;
      });
    }

    // Footer
    const pageCount = pdfDoc.bufferedPageRange();
    for (let i = 0; i < pageCount.count; i++) {
      pdfDoc.switchToPage(i);
      pdfDoc
        .fontSize(7)
        .fill("#aaaaaa")
        .text(
          `Page ${i + 1} of ${pageCount.count}  |  ${doc.pdfName}  |  Generated by EngaigeQ Claims Connected`,
          50,
          780,
          { align: "center", width: 495 }
        );
    }

    pdfDoc.flushPages();
    pdfDoc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

async function uploadPdf(localPath: string, storagePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);

  const { error } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBuffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error(`  [FAIL] Upload ${storagePath}: ${error.message}`);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

async function run() {
  // Create temp directory
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }

  console.log("=== Converting JSON/CSV documents to PDF ===\n");

  let successCount = 0;
  let failCount = 0;

  for (const doc of docsToConvert) {
    console.log(`Processing: ${doc.originalName} (${doc.docId})`);

    // Step 1: Download original file from Supabase
    const localOriginal = path.join(TMP_DIR, doc.originalName);
    const downloaded = await downloadFromSupabase(doc.originalStoragePath, localOriginal);
    if (!downloaded) {
      console.log(`  [SKIP] Could not download — using extracted_text from DB instead`);

      // Fallback: fetch extracted_text from DB and use that
      const { data: dbDoc, error: dbErr } = await supabase
        .from("documents")
        .select("extracted_text")
        .eq("id", doc.docId)
        .single();

      if (dbErr || !dbDoc?.extracted_text) {
        console.error(`  [FAIL] No content available for ${doc.docId}`);
        failCount++;
        continue;
      }

      fs.writeFileSync(localOriginal, dbDoc.extracted_text);
    }

    // Step 2: Read content
    const content = fs.readFileSync(localOriginal, "utf-8");
    const isJson = doc.originalName.endsWith(".json");

    // Step 3: Generate PDF
    const localPdf = path.join(TMP_DIR, doc.pdfName);
    try {
      await generatePdf(doc, content, localPdf, isJson);
      console.log(`  [OK] Generated PDF: ${doc.pdfName}`);
    } catch (err) {
      console.error(`  [FAIL] PDF generation: ${err}`);
      failCount++;
      continue;
    }

    // Step 4: Upload PDF to Supabase Storage
    let pdfUrl: string;
    try {
      pdfUrl = await uploadPdf(localPdf, doc.pdfStoragePath);
      console.log(`  [OK] Uploaded to Supabase: ${doc.pdfStoragePath}`);
    } catch {
      failCount++;
      continue;
    }

    // Step 5: Update DB record with new name and file_path
    const { error: updateErr } = await supabase
      .from("documents")
      .update({
        name: doc.pdfName,
        file_path: pdfUrl,
      })
      .eq("id", doc.docId);

    if (updateErr) {
      console.error(`  [FAIL] DB update: ${updateErr.message}`);
      failCount++;
    } else {
      console.log(`  [OK] Updated DB: name=${doc.pdfName}, file_path set`);
      successCount++;
    }

    console.log("");
  }

  console.log("=== Summary ===");
  console.log(`Converted: ${successCount}, Failed: ${failCount}`);

  // Clean up
  if (fs.existsSync(TMP_DIR)) {
    fs.rmSync(TMP_DIR, { recursive: true });
  }

  console.log("Done!");
}

run().catch(console.error);
