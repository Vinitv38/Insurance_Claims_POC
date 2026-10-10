import { NextRequest, NextResponse } from "next/server";
import { triggerWorkflow, getPollingConfig } from "@/lib/agentic-studio";

export async function POST(request: NextRequest) {
  try {
    const { claimId } = await request.json();
    if (!claimId || typeof claimId !== "string") {
      return NextResponse.json({ error: "claimId is required" }, { status: 400 });
    }
    const executionId = await triggerWorkflow("AGENT_WORKFLOW_LTC_NEW_URL", { claim_id: claimId });
    console.log(`[LTC New] Triggered execution ${executionId} for ${claimId}`);
    return NextResponse.json({ executionId, ...getPollingConfig() });
  } catch (error) {
    console.error("[LTC New] Trigger failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to trigger LTC New workflow" },
      { status: 500 }
    );
  }
}
