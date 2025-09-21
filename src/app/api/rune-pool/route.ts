import { NextRequest, NextResponse } from "next/server";
import { getRunePool } from "@/lib/api";

export async function GET(request: NextRequest) {
  try {
    const data = await getRunePool();

    return NextResponse.json({
      success: true,
      pol: data.pol || {},
    });
  } catch (error) {
    console.error("Error fetching rune pool data:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch rune pool data",
      },
      { status: 500 }
    );
  }
}
