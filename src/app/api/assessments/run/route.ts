import { NextRequest, NextResponse } from "next/server";
import { triggerWorkflow, getPollingConfig } from "@/lib/agentic-studio";
import { documentsSinceLastAssessment, type WorkflowMode } from "@/lib/assessment-store";
import { processingError } from "@/lib/document-processing-status";

export async function POST(request: NextRequest) {
  try {
    const { claimId, mode = "new" } = (await request.json()) as { claimId?: string; mode?: WorkflowMode };
    if (!claimId || typeof claimId !== "string") {
      return NextResponse.json({ error: "claimId is required" }, { status: 400 });
    }
    if (mode !== "new" && mode !== "delta") {
      return NextResponse.json({ error: `Unknown workflow mode "${mode}"` }, { status: 400 });
    }

    if (mode === "new") {
      const executionId = await triggerWorkflow("AGENT_WORKFLOW_LTC_NEW_URL", { claim_id: claimId });
      console.log(`[LTC New] Triggered execution ${executionId} for ${claimId}`);
      return NextResponse.json({ executionId, mode, ...getPollingConfig() });
    }

    const newDocs = await documentsSinceLastAssessment(claimId);
    if (!newDocs.length) {
      return NextResponse.json({ error: "No documents were uploaded since the last assessment" }, { status: 400 });
    }
    const notReady = newDocs.filter((d) => d.status !== "processed" || processingError(d.flag_reason));
    if (notReady.length) {
      return NextResponse.json(
        { error: `These new documents are not processed yet: ${notReady.map((d) => d.name).join(", ")}` },
        { status: 400 }
      );
    }
    const executionId = await triggerWorkflow("AGENT_WORKFLOW_LTC_DELTA_URL", {
      claim_id: claimId,
      new_document_ids: newDocs.map((d) => d.id).join(","),
      new_document_names: newDocs.map((d) => d.name).join(", "),
    });
    console.log(`[Delta] Triggered execution ${executionId} for ${claimId} (${newDocs.length} new document(s))`);
    return NextResponse.json({ executionId, mode, ...getPollingConfig() });
  } catch (error) {
    console.error("[Assessments] Trigger failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger the workflow" },
      { status: 500 }
    );
  }
}
