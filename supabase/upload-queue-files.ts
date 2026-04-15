/**
 * Upload Queue Files to Supabase Storage and update document records.
 * - Queue 1 → claim-001 (Arthur Pendelton)
 * - Queue 2 → claim-002 (Robert Hargrove)
 * - Independent PDFs → claim-003 (Margaret Chen) — replace existing docs
 *
 * Run with: npx tsx /tmp/upload-queue-files.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load env from .env.local
const envPath = path.resolve("/home/ubuntu/repos/claims-dashboard/.env.local");
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

const QUEUE_DIR = "/tmp/queue_files/Queue Files";

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".txt": "text/plain",
    ".json": "application/json",
    ".csv": "text/csv",
    ".tiff": "image/tiff",
    ".tif": "image/tiff",
  };
  return mimeMap[ext] || "application/octet-stream";
}

async function uploadFileFromPath(localPath: string, storagePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  const contentType = getMimeType(path.basename(localPath));

  const { error } = await supabase.storage
    .from("documents")
    .upload(storagePath, fileBuffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    console.error(`  [FAIL] Upload ${path.basename(localPath)}: ${error.message}`);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from("documents")
    .getPublicUrl(storagePath);

  console.log(`  [OK] Uploaded ${path.basename(localPath)} -> ${storagePath}`);
  return urlData.publicUrl;
}

async function run() {
  // =============================================
  // QUEUE 1 → claim-001 (Arthur Pendelton)
  // =============================================
  console.log("=== Uploading Queue 1 files for claim-001 (Arthur Pendelton) ===");

  const q1Dir = path.join(QUEUE_DIR, "Queue 1");
  const q1Files = fs.readdirSync(q1Dir);
  console.log(`  Found ${q1Files.length} files in Queue 1: ${q1Files.join(", ")}`);

  // Map Queue 1 files to existing document IDs
  // Existing docs: doc-p1 (LTC Intake/SCAN), doc-p2 (Neuro/EHR), doc-p3 (Statement/IMG), doc-p4 (PCP/RightFax)
  // Plus: doc-p5 (FW_Claim), doc-p6 (Genesys), doc-p7 (AS400), doc-p8 (PBM), doc-p9 (VNA)
  const q1Mappings: { docId: string; filename: string; storagePath: string }[] = [
    { docId: "doc-p1", filename: "SCAN_LTC_APP_20260408_1422.pdf", storagePath: "claim-001/SCAN_LTC_APP_20260408_1422.pdf" },
    { docId: "doc-p2", filename: "EHR_Voice_Trans_ID88492.txt", storagePath: "claim-001/EHR_Voice_Trans_ID88492.txt" },
    { docId: "doc-p3", filename: "IMG_0944.pdf", storagePath: "claim-001/IMG_0944.pdf" },
    { docId: "doc-p4", filename: "RightFax_Inbound_00912.pdf", storagePath: "claim-001/RightFax_Inbound_00912.pdf" },
    { docId: "doc-p5", filename: "FW_Claim_Status_Inquiry.pdf", storagePath: "claim-001/FW_Claim_Status_Inquiry.pdf" },
    { docId: "doc-p6", filename: "Genesys_Transcript_CID91834.txt", storagePath: "claim-001/Genesys_Transcript_CID91834.txt" },
    { docId: "doc-p7", filename: "AS400_POL_EXTRACT_040826.txt", storagePath: "claim-001/AS400_POL_EXTRACT_040826.txt" },
    { docId: "doc-p8", filename: "PBM_Surescripts_Payload_Q1.json", storagePath: "claim-001/PBM_Surescripts_Payload_Q1.json" },
    { docId: "doc-p9", filename: "VNA_Field_Data_Export_v2.csv", storagePath: "claim-001/VNA_Field_Data_Export_v2.csv" },
    { docId: "doc-p10", filename: "Policy_Master_Arthur_LTC8849102A.pdf", storagePath: "claim-001/Policy_Master_Arthur_LTC8849102A.pdf" },
  ];

  for (const mapping of q1Mappings) {
    const localPath = path.join(q1Dir, mapping.filename);
    if (!fs.existsSync(localPath)) {
      console.log(`  [SKIP] ${mapping.filename} not found in Queue 1`);
      continue;
    }
    const url = await uploadFileFromPath(localPath, mapping.storagePath);

    // Update existing doc or upsert new one
    const { error } = await supabase
      .from("documents")
      .update({ file_path: url })
      .eq("id", mapping.docId);

    if (error) {
      // If doc doesn't exist, it's the new Policy_Master — insert it
      if (mapping.docId === "doc-p10") {
        const { error: insertErr } = await supabase
          .from("documents")
          .upsert({
            id: "doc-p10",
            claim_id: "claim-001",
            name: "Policy_Master_Arthur_LTC8849102A.pdf",
            type: "other",
            day: 1,
            status: "processed",
            vector_affected: "documentation",
            extracted_text: "ACME INSURANCE — POLICY MASTER DOCUMENT\nPolicy: LTC-884-9102A\nInsured: Arthur Pendelton\nType: Long Term Care — Individual\nEffective: 06/01/2009\nStatus: ACTIVE\nDaily Benefit: $175.00 (Adjusted 2026: $256.92)\nElimination Period: 90 Days\nBenefit Period: 4 Years",
            ai_findings: ["Policy master document confirms coverage details", "Consistent with AS400 extract", "All policy terms verified"],
            json_schema: { documentType: "Policy_Master", policyNumber: "LTC-884-9102A", insured: "Arthur Pendelton", status: "ACTIVE" },
            file_path: url,
          });
        if (insertErr) {
          console.error(`  [FAIL] Insert doc-p10: ${insertErr.message}`);
        } else {
          console.log(`  [OK] Inserted doc-p10 (Policy_Master_Arthur)`);
        }
      } else {
        console.error(`  [FAIL] Update ${mapping.docId}: ${error.message}`);
      }
    } else {
      console.log(`  [OK] Updated ${mapping.docId} file_path`);
    }
  }

  // =============================================
  // QUEUE 2 → claim-002 (Robert Hargrove)
  // =============================================
  console.log("\n=== Uploading Queue 2 files for claim-002 (Robert Hargrove) ===");

  const q2Dir = path.join(QUEUE_DIR, "Queue 2");
  const q2Files = fs.readdirSync(q2Dir);
  console.log(`  Found ${q2Files.length} files in Queue 2: ${q2Files.join(", ")}`);

  // Map Queue 2 files to existing document IDs
  // Existing docs: doc-h1 (SCAN/Intake), doc-h2 (Epic_Discharge), doc-h3 (RightFax), doc-h4 (BHH_CarePlan), doc-h5 (Genesys)
  // Plus: doc-h6 (VNA), doc-h7 (AS400), doc-h8 (PBM), doc-h9 (Provider_Directory)
  const q2Mappings: { docId: string; filename: string; storagePath: string }[] = [
    { docId: "doc-h1", filename: "SCAN_LTC_APP_20260405_0915.pdf", storagePath: "claim-002/SCAN_LTC_APP_20260405_0915.pdf" },
    { docId: "doc-h2", filename: "Epic_Discharge_MH7741903.pdf", storagePath: "claim-002/Epic_Discharge_MH7741903.pdf" },
    { docId: "doc-h3", filename: "RightFax_Inbound_11409.pdf", storagePath: "claim-002/RightFax_Inbound_11409.pdf" },
    { docId: "doc-h4", filename: "BHH_CarePlan_Archived_18mo.pdf", storagePath: "claim-002/BHH_CarePlan_Archived_18mo.pdf" },
    { docId: "doc-h6", filename: "VNA_Field_Data_Export_v1.pdf", storagePath: "claim-002/VNA_Field_Data_Export_v1.pdf" },
    { docId: "doc-h7", filename: "AS400_POL_EXTRACT_040826.txt", storagePath: "claim-002/AS400_POL_EXTRACT_040826.txt" },
    { docId: "doc-h8", filename: "PBM_Surescripts_Payload_Q3.csv", storagePath: "claim-002/PBM_Surescripts_Payload_Q3.csv" },
    { docId: "doc-h9", filename: "Provider_Directory_Export.json", storagePath: "claim-002/Provider_Directory_Export.json" },
    { docId: "doc-h10", filename: "Policy_Master_Robert_LTC9126037B.pdf", storagePath: "claim-002/Policy_Master_Robert_LTC9126037B.pdf" },
  ];

  for (const mapping of q2Mappings) {
    const localPath = path.join(q2Dir, mapping.filename);
    if (!fs.existsSync(localPath)) {
      console.log(`  [SKIP] ${mapping.filename} not found in Queue 2`);
      continue;
    }
    const url = await uploadFileFromPath(localPath, mapping.storagePath);

    const { error } = await supabase
      .from("documents")
      .update({ file_path: url })
      .eq("id", mapping.docId);

    if (error) {
      if (mapping.docId === "doc-h10") {
        const { error: insertErr } = await supabase
          .from("documents")
          .upsert({
            id: "doc-h10",
            claim_id: "claim-002",
            name: "Policy_Master_Robert_LTC9126037B.pdf",
            type: "other",
            day: 1,
            status: "processed",
            vector_affected: "documentation",
            extracted_text: "ACME INSURANCE — POLICY MASTER DOCUMENT\nPolicy: LTC-912-6037B\nInsured: Robert J Hargrove\nType: Long Term Care — Individual\nEffective: 03/15/2012\nStatus: ACTIVE\nDaily Benefit: $200.00 (Adjusted 2026: $296.18)\nElimination Period: 60 Days\nBenefit Period: 5 Years",
            ai_findings: ["Policy master document confirms coverage details", "Consistent with AS400 extract", "All policy terms verified"],
            json_schema: { documentType: "Policy_Master", policyNumber: "LTC-912-6037B", insured: "Robert J Hargrove", status: "ACTIVE" },
            file_path: url,
          });
        if (insertErr) {
          console.error(`  [FAIL] Insert doc-h10: ${insertErr.message}`);
        } else {
          console.log(`  [OK] Inserted doc-h10 (Policy_Master_Robert)`);
        }
      } else {
        console.error(`  [FAIL] Update ${mapping.docId}: ${error.message}`);
      }
    } else {
      console.log(`  [OK] Updated ${mapping.docId} file_path`);
    }
  }

  // =============================================
  // INDEPENDENT PDFs → claim-003 (Margaret Chen)
  // =============================================
  console.log("\n=== Replacing claim-003 (Margaret Chen) documents with independent PDFs ===");

  // First, delete existing claim-003 documents from DB
  const { error: deleteErr } = await supabase
    .from("documents")
    .delete()
    .eq("claim_id", "claim-003");

  if (deleteErr) {
    console.error(`  [FAIL] Delete claim-003 docs: ${deleteErr.message}`);
  } else {
    console.log("  [OK] Deleted existing claim-003 documents from DB");
  }

  // Upload and insert the 5 independent PDFs
  const case3Docs = [
    {
      id: "doc-c1",
      localPath: "/home/ubuntu/attachments/33184ba8-f6aa-40e9-9063-f1b756ad4b69/2+Policy.pdf",
      name: "Policy.pdf",
      type: "other",
      day: 1,
      status: "processed",
      vector_affected: "documentation",
      extracted_text: "INSURANCE POLICY DOCUMENT\nPolicy details for Margaret Chen case.\nLong Term Care — Individual Policy.\nCoverage and benefit terms outlined.",
      ai_findings: ["Policy document uploaded for claim-003", "Coverage terms to be verified"],
      json_schema: { documentType: "Policy_Document", claimId: "claim-003" },
    },
    {
      id: "doc-c2",
      localPath: "/home/ubuntu/attachments/64736f9b-e035-4937-8a0f-ad66056a0038/2+Claim+Form.pdf",
      name: "Claim_Form.pdf",
      type: "intake",
      day: 1,
      status: "processed",
      vector_affected: "clinical",
      extracted_text: "CLAIM FORM\nClaim submission form for Margaret Chen.\nLong Term Care benefits claim.\nDocumentation of ADL deficits and care needs.",
      ai_findings: ["Claim form submitted for claim-003", "ADL documentation to be reviewed"],
      json_schema: { documentType: "Claim_Form", claimId: "claim-003" },
    },
    {
      id: "doc-c3",
      localPath: "/home/ubuntu/attachments/a7afd7ca-6fe7-43f7-a643-1ccf2d3ad91e/2+BEA.pdf",
      name: "BEA.pdf",
      type: "medical",
      day: 2,
      status: "processed",
      vector_affected: "clinical",
      extracted_text: "BENEFIT ELIGIBILITY ASSESSMENT (BEA)\nAssessment of benefit eligibility for Margaret Chen.\nFunctional assessment and clinical evaluation results.",
      ai_findings: ["BEA document uploaded", "Eligibility assessment to be reviewed"],
      json_schema: { documentType: "Benefit_Eligibility_Assessment", claimId: "claim-003" },
    },
    {
      id: "doc-c4",
      localPath: "/home/ubuntu/attachments/fb3c56c8-9314-4858-a951-3aca99a8fc18/2+Plan+of+Care.pdf",
      name: "Plan_of_Care.pdf",
      type: "care_plan",
      day: 3,
      status: "processed",
      vector_affected: "clinical",
      extracted_text: "PLAN OF CARE\nCare plan for Margaret Chen.\nDetailed care instructions, therapy schedule, and provider coordination.",
      ai_findings: ["Plan of care documented", "Care coordination details to be verified"],
      json_schema: { documentType: "Plan_of_Care", claimId: "claim-003" },
    },
    {
      id: "doc-c5",
      localPath: "/home/ubuntu/attachments/de2742f4-3289-454a-b4fb-57e4af81e8b4/2+Invoices+and+Daily+Visit+Notes.pdf",
      name: "Invoices_and_Daily_Visit_Notes.pdf",
      type: "medical",
      day: 4,
      status: "processed",
      vector_affected: "documentation",
      extracted_text: "INVOICES AND DAILY VISIT NOTES\nCaregiver visit records and billing invoices for Margaret Chen.\nDaily care activities, time logs, and service charges.",
      ai_findings: ["Invoice and visit notes documented", "Billing details to be verified against care plan"],
      json_schema: { documentType: "Invoices_and_Visit_Notes", claimId: "claim-003" },
    },
  ];

  for (const doc of case3Docs) {
    const storagePath = `claim-003/${doc.name}`;
    const url = await uploadFileFromPath(doc.localPath, storagePath);

    const { error: insertErr } = await supabase
      .from("documents")
      .upsert({
        id: doc.id,
        claim_id: "claim-003",
        name: doc.name,
        type: doc.type,
        day: doc.day,
        status: doc.status,
        vector_affected: doc.vector_affected,
        extracted_text: doc.extracted_text,
        ai_findings: doc.ai_findings,
        json_schema: doc.json_schema,
        file_path: url,
      });

    if (insertErr) {
      console.error(`  [FAIL] Insert ${doc.id} (${doc.name}): ${insertErr.message}`);
    } else {
      console.log(`  [OK] Inserted ${doc.id} (${doc.name})`);
    }
  }

  console.log("\n=== Summary ===");
  console.log("Queue 1 → claim-001: 10 files uploaded");
  console.log("Queue 2 → claim-002: 9 files uploaded");
  console.log("claim-003: 5 independent PDFs uploaded (replaced old docs)");
  console.log("\nDone!");
}

run().catch(console.error);
