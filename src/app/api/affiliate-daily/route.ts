import { NextRequest, NextResponse } from "next/server";
import { getAffiliateDaily } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const affiliateDaily = await getAffiliateDaily();

    return NextResponse.json({
      success: true,
      data: affiliateDaily,
    });
  } catch (error) {
    console.error("🔄 API: Error fetching affiliate daily:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch affiliate daily",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
