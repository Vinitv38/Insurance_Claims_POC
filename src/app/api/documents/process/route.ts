import { NextRequest, NextResponse } from "next/server";
import { processDocument } from "@/lib/document-processing";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const { documentId } = await request.json();
  if (!documentId || typeof documentId !== "string") {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }
  try {
    const result = await processDocument(documentId);
    console.log(`[Documents] Processed ${documentId} via ${result.method} (${result.characters} chars)`);
    return NextResponse.json({ documentId, status: "processed", ...result });
  } catch (error) {
    console.error(`[Documents] Processing ${documentId} failed:`, error);
    return NextResponse.json(
      { documentId, status: "failed", error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 }
    );
  }
}
