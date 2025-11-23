import { NextRequest, NextResponse } from "next/server";
import { getTradeAssets } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const tradeAssets = await getTradeAssets();

    return NextResponse.json({
      success: true,
      data: tradeAssets,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trade assets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
