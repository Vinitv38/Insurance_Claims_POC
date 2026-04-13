import { NextRequest, NextResponse } from "next/server";
import DocumentIntelligence, {
  isUnexpected,
} from "@azure-rest/ai-document-intelligence";

export async function POST(request: NextRequest) {
  try {
    const { fileUrl } = await request.json();

    if (!fileUrl) {
      return NextResponse.json(
        { error: "fileUrl is required" },
        { status: 400 }
      );
    }

    const endpoint = process.env.DI_ENDPOINT;
    const apiKey = process.env.DI_API_KEY;

    if (!endpoint || !apiKey) {
      return NextResponse.json(
        { error: "Azure Document Intelligence credentials not configured. Set DI_ENDPOINT and DI_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    // Download the file from Supabase Storage URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { error: `Failed to download file: ${fileResponse.statusText}` },
        { status: 500 }
      );
    }
    const fileBuffer = await fileResponse.arrayBuffer();

    // Create Azure Document Intelligence client
    const client = DocumentIntelligence(endpoint, {
      key: apiKey,
    });

    // Analyze the document using prebuilt-layout model with markdown output
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
      return NextResponse.json(
        { error: `Azure DI error: ${initialResponse.body?.error?.message || "Unknown error"}` },
        { status: 500 }
      );
    }

    // Poll for the result
    const operationLocation = initialResponse.headers["operation-location"];
    if (!operationLocation) {
      return NextResponse.json(
        { error: "No operation-location header in response" },
        { status: 500 }
      );
    }

    // Poll until complete
    let result;
    for (let i = 0; i < 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pollResponse = await fetch(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      });
      const pollResult = await pollResponse.json();

      if (pollResult.status === "succeeded") {
        result = pollResult;
        break;
      } else if (pollResult.status === "failed") {
        return NextResponse.json(
          { error: `Analysis failed: ${JSON.stringify(pollResult.error)}` },
          { status: 500 }
        );
      }
      // still running, continue polling
    }

    if (!result) {
      return NextResponse.json(
        { error: "Analysis timed out after 2 minutes" },
        { status: 504 }
      );
    }

    const markdownContent = result.analyzeResult?.content || "";
    const fullJson = result.analyzeResult || {};

    return NextResponse.json({ markdown: markdownContent, jsonResult: fullJson });
  } catch (error) {
    console.error("Document analysis error:", error);
    return NextResponse.json(
      { error: `Internal error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
