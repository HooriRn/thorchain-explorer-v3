import { NextRequest, NextResponse } from "next/server";
import { getRUJIStats } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const rujiStats = await getRUJIStats();

    return NextResponse.json({
      success: true,
      data: rujiStats,
    });
  } catch (error) {
    console.error("🔄 Error fetching RUJI stats:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch RUJI stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
