import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSwapsWeekly } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const affiliateSwaps = await getAffiliateSwapsWeekly();

    if (!affiliateSwaps || affiliateSwaps.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    return NextResponse.json({
      success: true,
      data: affiliateSwaps,
    });
  } catch (error) {
    console.error("Error fetching weekly affiliate swaps:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch weekly affiliate swaps",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
