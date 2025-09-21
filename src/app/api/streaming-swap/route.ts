import { NextRequest, NextResponse } from "next/server";
import { getStreamingSwaps } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const streamingSwaps = await getStreamingSwaps();

    return NextResponse.json({
      success: true,
      data: streamingSwaps,
    });
  } catch (error) {
    console.error("❌ Error fetching streaming swaps:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch streaming swaps",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
