import { NextRequest, NextResponse } from "next/server";
import { getAffiliateSwapsMonthly } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const affiliateSwaps = await getAffiliateSwapsMonthly();

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
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch affiliate swaps by wallet",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
