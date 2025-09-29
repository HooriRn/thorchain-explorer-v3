import { NextRequest, NextResponse } from "next/server";
import { getPoolsHistory } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "";

    const poolsHistory = await getPoolsHistory(period);

    return NextResponse.json({
      success: true,
      data: poolsHistory,
    });
  } catch (error) {
    console.error("Error fetching pools history:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pools history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
