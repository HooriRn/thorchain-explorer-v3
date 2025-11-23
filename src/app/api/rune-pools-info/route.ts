import { NextRequest, NextResponse } from "next/server";
import { getRunePoolsInfo } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const runePoolsInfo = await getRunePoolsInfo();

    return NextResponse.json({
      success: true,
      data: runePoolsInfo,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch rune pools info",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
