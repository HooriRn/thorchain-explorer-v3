import { NextRequest, NextResponse } from "next/server";
import { swapHistory } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const swapData = await swapHistory(30);

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
      },
      { status: 500 }
    );
  }
}
