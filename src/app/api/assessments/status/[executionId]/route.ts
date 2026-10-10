import { NextRequest, NextResponse } from "next/server";
import { getExecution } from "@/lib/agentic-studio";
import { parseLtcNewOutput } from "@/lib/ltc-assessment";
import { saveLiveAssessment } from "@/lib/assessment-store";

export async function GET(request: NextRequest, { params }: { params: { executionId: string } }) {
  const { executionId } = params;
  const claimId = request.nextUrl.searchParams.get("claimId");
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required" }, { status: 400 });
  }
  try {
    const execution = await getExecution(executionId);
    if (execution.status === "failed") {
      console.error(`[LTC New] Execution ${executionId} failed:`, execution.error);
      return NextResponse.json(
        { status: "failed", error: execution.error || "Workflow execution failed in Agentic Studio" },
        { status: 502 }
      );
    }
    if (execution.status !== "completed") {
      return NextResponse.json({ status: execution.status });
    }

    const parsed = parseLtcNewOutput(execution.nodes);
    const assessmentId = await saveLiveAssessment(claimId, executionId, parsed);
    console.log(
      `[LTC New] ${claimId} assessed: ${parsed.complexityScore} / ${parsed.assignedGroup} / ${parsed.recommendation}`
    );
    return NextResponse.json({
      status: "completed",
      assessmentId,
      complexityScore: parsed.complexityScore,
      recommendation: parsed.recommendation,
      assignedTo: parsed.assignedTo,
      assignedGroup: parsed.assignedGroup,
    });
  } catch (error) {
    console.error(`[LTC New] Status check for ${executionId} failed:`, error);
    return NextResponse.json(
      { status: "error", error: error instanceof Error ? error.message : "Failed to read workflow result" },
      { status: 500 }
    );
  }
}
