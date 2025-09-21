import { NextRequest, NextResponse } from "next/server";
import { getEarnings } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const earnings = await getEarnings();

    return NextResponse.json({
      success: true,
      meta: earnings,
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch earnings",
      },
      { status: 500 }
    );
  }
}
