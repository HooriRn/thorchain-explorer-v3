import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSwapsDaily } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const affiliateSwaps = await getAffiliateSwapsDaily();

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
    console.error("Error fetching daily affiliate swaps:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch daily affiliate swaps",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
