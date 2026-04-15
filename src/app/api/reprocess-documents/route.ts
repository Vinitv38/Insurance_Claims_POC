import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import DocumentIntelligence, {
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";

export const maxDuration = 300; // 5 min timeout for processing multiple docs

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const endpoint = process.env.DI_ENDPOINT;
    const apiKey = process.env.DI_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: "Azure DI credentials not configured. Set DI_ENDPOINT and DI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase credentials not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch documents that have a file_path
    // If force=true, reprocess ALL docs with file_path (even if ai_interpreted_md exists)
    // Otherwise, only process docs where ai_interpreted_md is null
    let query = supabase
      .from("documents")
      .select("id, file_path")
      .not("file_path", "is", null);

    if (!force) {
      query = query.is("ai_interpreted_md", null);
    }

    const { data: docs, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch documents: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!docs || docs.length === 0) {
      return NextResponse.json({
        message: "No documents need processing",
        processed: 0,
      });
    }

    const client = DocumentIntelligence(endpoint, { key: apiKey });

    const results: { id: string; status: string; error?: string }[] = [];

    for (const doc of docs) {
      try {
        // Download file from Supabase Storage
        const fileResponse = await fetch(doc.file_path);
        if (!fileResponse.ok) {
          results.push({ id: doc.id, status: "failed", error: `Download failed: ${fileResponse.statusText}` });
          continue;
        }
        const fileBuffer = await fileResponse.arrayBuffer();

        // Analyze with Azure DI
        const initialResponse = await client
          .path("/documentModels/{modelId}:analyze", "prebuilt-layout")
          .post({
            contentType: "application/json",
            body: {
              base64Source: Buffer.from(fileBuffer).toString("base64"),
            },
            queryParameters: {
              outputContentFormat: "markdown",
            },
          });

        if (isUnexpected(initialResponse)) {
          results.push({ id: doc.id, status: "failed", error: "Azure DI rejected the request" });
          continue;
        }

        const operationLocation = initialResponse.headers["operation-location"];
        if (!operationLocation) {
          results.push({ id: doc.id, status: "failed", error: "No operation-location header" });
          continue;
        }

        // Poll until complete
        let analyzeResult = null;
        for (let i = 0; i < 60; i++) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const pollResponse = await fetch(operationLocation, {
            headers: { "Ocp-Apim-Subscription-Key": apiKey },
          });
          const pollResult = await pollResponse.json();

          if (pollResult.status === "succeeded") {
            analyzeResult = pollResult.analyzeResult;
            break;
          } else if (pollResult.status === "failed") {
            results.push({ id: doc.id, status: "failed", error: JSON.stringify(pollResult.error) });
            break;
          }
        }

        if (!analyzeResult) {
          if (!results.find((r) => r.id === doc.id)) {
            results.push({ id: doc.id, status: "failed", error: "Timed out" });
          }
          continue;
        }

        const markdown = analyzeResult.content || "";
        const fullJson = analyzeResult;

        // Update the document in the database
        const { error: updateError } = await supabase
          .from("documents")
          .update({
            ai_interpreted_md: markdown,
            json_schema: fullJson,
          })
          .eq("id", doc.id);

        if (updateError) {
          results.push({ id: doc.id, status: "failed", error: updateError.message });
        } else {
          results.push({ id: doc.id, status: "success" });
        }
      } catch (err) {
        results.push({
          id: doc.id,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    return NextResponse.json({
      message: `Processed ${successCount} documents successfully, ${failedCount} failed`,
      processed: successCount,
      failed: failedCount,
      details: results,
    });
  } catch (error) {
    console.error("Reprocess error:", error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
