import { NextRequest, NextResponse } from "next/server";
import { getEarningHistory } from "@/lib/api";
import { apiClient } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = searchParams.get("count");

    let earningHistory;
    try {
      earningHistory = await getEarningHistory(count ? parseInt(count) : 30);
    } catch (error) {
      try {
        const response = await apiClient.get(
          `history/earnings?interval=day&count=${count || 30}`
        );
        earningHistory = response.data;
      } catch (fallbackError) {
        throw error; 
      }
    }

    return NextResponse.json({
      success: true,
      data: earningHistory,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch earning history",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
