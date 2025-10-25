import { NextRequest, NextResponse } from "next/server";
import { getSwapsHistory } from "@/lib/api/midgard";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get("interval") || "day";
    const count = parseInt(searchParams.get("count") || "365");
    const pool = searchParams.get("pool");

    console.log("API Request params:", { interval, count, pool });

    const params: any = {
      interval,
      count,
    };

    if (pool) {
      params.pool = pool;
    }

    console.log("Calling getSwapsHistory with params:", params);
    const swapData = await getSwapsHistory(params);
    console.log("API Response:", swapData);

    return NextResponse.json({
      success: true,
      data: swapData,
    });
  } catch (error) {
    console.error("Error fetching swap history:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch swap history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
