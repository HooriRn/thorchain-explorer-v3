import { NextRequest, NextResponse } from "next/server";
import { getAffiliateHistory } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const interval = searchParams.get("interval") || "day";
    const count = searchParams.get("count") || "30";

    const params = {
      interval,
      count,
    };

    const affiliateHistory = await getAffiliateHistory(params);

    return NextResponse.json({
      success: true,
      data: affiliateHistory,
    });
  } catch (error) {
    console.error("Error fetching affiliate history:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch affiliate history",
      },
      { status: 500 }
    );
  }
}
